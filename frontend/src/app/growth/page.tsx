'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Bell, CheckCircle2, Flame, Medal, ShieldCheck, Snowflake, Sparkles, Target, Trophy } from 'lucide-react';
import { api, GrowthOverview, LeaderboardEntry } from '@/lib/api';

const questions = [
  { text: 'Mã trạng thái nào thường cho biết người dùng không có quyền truy cập?', choices: ['200', '403', '500'] },
  { text: 'Lỗ hổng nào cho phép JavaScript do người dùng kiểm soát chạy trong trình duyệt?', choices: ['SSRF', 'SQL Injection', 'XSS'] },
  { text: 'Kiểm tra quyền sở hữu tài nguyên thuộc nhóm kiểm soát nào?', choices: ['Authorization', 'Encoding', 'Logging'] },
  { text: 'Cách an toàn nhất để đưa dữ liệu vào truy vấn SQL là gì?', choices: ['Nối chuỗi', 'Lọc dấu nháy', 'Parameterized query'] },
  { text: 'Lỗ hổng nào lợi dụng server để truy cập một URL đích?', choices: ['SSRF', 'CSRF', 'Clickjacking'] },
];

const trackNames: Record<string, string> = {
  BEGINNER: 'Người mới', WEB_DEVELOPER: 'Web Developer', PENTESTER: 'Pentester',
};

export default function GrowthPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<GrowthOverview | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [leaderTrack, setLeaderTrack] = useState('');
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.growth.getOverview(), api.growth.getLeaderboard()])
      .then(([growth, board]) => { setOverview(growth.data); setLeaders(board.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const submitAssessment = async () => {
    if (answers.some(answer => answer < 0)) return setError('Hãy trả lời đủ 5 câu trước khi nhận lộ trình.');
    setSubmitting(true); setError(null);
    try { setOverview((await api.growth.submitAssessment(answers)).data); }
    catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const openWeeklyLab = async () => {
    setSubmitting(true); setError(null);
    try { router.push(`/labs/${(await api.growth.getWeeklyLab()).data.id}`); }
    catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const changeLeaderboard = async (track: string) => {
    setLeaderTrack(track);
    try { setLeaders((await api.growth.getLeaderboard(track || undefined)).data); } catch { setLeaders([]); }
  };

  if (loading) return <div className="growth-loading">Đang tổng hợp tiến độ của bạn...</div>;
  if (!overview) return <div className="growth-error">{error || 'Không thể tải dữ liệu tiến bộ.'}</div>;

  if (overview.onboardingRequired) return (
    <main className="growth-page assessment-page">
      <header className="growth-header">
        <div><span className="growth-eyebrow">Đánh giá đầu vào · khoảng 5 phút</span><h1>Chọn đúng điểm bắt đầu</h1><p>5 câu ngắn giúp SecHub đề xuất một lộ trình vừa sức. Kết quả không ảnh hưởng điểm.</p></div>
        <Target size={34} />
      </header>
      <div className="assessment-list">
        {questions.map((question, index) => <fieldset key={question.text}>
          <legend><span>{index + 1}</span>{question.text}</legend>
          <div className="assessment-options">{question.choices.map((choice, choiceIndex) => <label key={choice} className={answers[index] === choiceIndex ? 'selected' : ''}>
            <input type="radio" name={`question-${index}`} checked={answers[index] === choiceIndex} onChange={() => setAnswers(old => old.map((value, i) => i === index ? choiceIndex : value))} />
            {choice}
          </label>)}</div>
        </fieldset>)}
      </div>
      {error && <p className="growth-inline-error">{error}</p>}
      <button className="btn btn-primary" onClick={submitAssessment} disabled={submitting}>Nhận lộ trình đề xuất <ArrowRight size={16} /></button>
    </main>
  );

  const levelProgress = overview.xp % 500;
  return <main className="growth-page">
    <header className="growth-header">
      <div><span className="growth-eyebrow">Lộ trình {trackNames[overview.recommendedTrack]}</span><h1>Tiến bộ của bạn</h1><p>Cấp {overview.level} · {overview.levelTitle}</p></div>
      <div className="growth-level"><strong>{overview.xp}</strong><span>XP</span></div>
    </header>
    <div className="growth-level-bar"><span style={{ width: `${(levelProgress / 500) * 100}%` }} /><small>{500 - levelProgress} XP tới cấp tiếp theo</small></div>
    {error && <p className="growth-inline-error">{error}</p>}

    <section className="growth-stats" aria-label="Tổng quan tiến độ">
      <div><Flame /><strong>{overview.streak} ngày</strong><span>Chuỗi học</span></div>
      <div><Snowflake /><strong>{overview.freezeTickets} vé</strong><span>Bảo toàn chuỗi</span></div>
      <div><Medal /><strong>{overview.badges.length}</strong><span>Huy hiệu kỹ năng</span></div>
      <div><ShieldCheck /><strong>{overview.skills.length}</strong><span>Kỹ năng đã luyện</span></div>
    </section>

    <section className="growth-section"><div className="growth-section-title"><div><Target /><h2>Việc nên làm tiếp</h2></div><span>10–15 phút</span></div>
      <div className="mission-row">
        <div><CheckCircle2 className={overview.dailyMission.completed ? 'done' : ''} /><div><strong>{overview.dailyMission.title}</strong><p>{overview.dailyMission.description}</p></div></div>
        <Link className="btn btn-secondary" href={overview.dailyMission.actionUrl}>{overview.dailyMission.completed ? 'Xem lại' : 'Bắt đầu'}</Link>
      </div>
      <div className="mission-row">
        <div><Sparkles className={overview.weeklyChallenge.completed ? 'done' : ''} /><div><strong>{overview.weeklyChallenge.title}</strong><p>{overview.weeklyChallenge.description}</p></div></div>
        <button className="btn btn-secondary" onClick={openWeeklyLab} disabled={submitting}>{overview.weeklyChallenge.completed ? 'Lab biến thể khác' : 'Mở thử thách'}</button>
      </div>
    </section>

    <div className="growth-two-column">
      <section className="growth-section"><div className="growth-section-title"><div><ShieldCheck /><h2>Bản đồ kỹ năng</h2></div></div>
        {overview.skills.length ? <div className="skill-list">{overview.skills.map(skill => <div key={skill.slug} className="skill-row"><div><strong>{skill.name}</strong><span>Cấp {skill.level} · {skill.completedLabs} lab · TB {skill.averageHints} gợi ý</span></div><div><i style={{ width: `${Math.min(100, skill.xp / 5)}%` }} /></div></div>)}</div> : <p className="growth-empty">Hoàn thành lab đầu tiên để mở bản đồ kỹ năng.</p>}
      </section>
      <section className="growth-section"><div className="growth-section-title"><div><Trophy /><h2>Báo cáo tuần</h2></div></div>
        <div className="weekly-numbers"><span><strong>{overview.weeklyReport.labsCompleted}</strong> lab</span><span><strong>{overview.weeklyReport.lessonsCompleted}</strong> bài học</span><span><strong>+{overview.weeklyReport.xpGained}</strong> XP</span></div>
        <p><b>Mạnh nhất:</b> {overview.weeklyReport.strongestSkill}</p><p><b>Nên củng cố:</b> {overview.weeklyReport.weakSkill}</p><p>{overview.weeklyReport.recommendation}</p>
      </section>
    </div>

    <div className="growth-two-column">
      <section className="growth-section"><div className="growth-section-title"><div><Medal /><h2>Huy hiệu</h2></div></div><div className="badge-list">{overview.badges.length ? overview.badges.map(badge => <span key={badge}>{badge}</span>) : <p className="growth-empty">Huy hiệu đầu tiên đang chờ bạn.</p>}</div></section>
      <section className="growth-section"><div className="growth-section-title"><div><Bell /><h2>Cập nhật phù hợp</h2></div></div><ul className="notification-list">{overview.notifications.map(item => <li key={item}>{item}</li>)}</ul></section>
    </div>

    <section className="growth-section"><div className="growth-section-title"><div><Trophy /><h2>Leaderboard tuần</h2></div><Link href={`/profile/${api.auth.getCurrentUser()?.username}`}>Hồ sơ công khai</Link></div>
      <div className="leaderboard-filters" aria-label="Lọc theo trình độ">{[['','Tất cả'],['BEGINNER','Người mới'],['WEB_DEVELOPER','Web Developer'],['PENTESTER','Pentester']].map(([value,label]) => <button key={value} className={leaderTrack === value ? 'active' : ''} onClick={() => changeLeaderboard(value)}>{label}</button>)}</div>
      <div className="leaderboard">{leaders.slice(0, 5).map((leader, index) => <div key={leader.username}><span>{index + 1}</span><Link href={`/profile/${leader.username}`}>{leader.username}</Link><small>{trackNames[leader.track]} · {leader.strongestSkill}</small><strong>{leader.weeklyXp} XP</strong></div>)}{leaders.length === 0 && <p className="growth-empty">Chưa có điểm trong nhóm này tuần này.</p>}</div>
    </section>
  </main>;
}
