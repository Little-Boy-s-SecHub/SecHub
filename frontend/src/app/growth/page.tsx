'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Flame, Medal, ShieldCheck, Snowflake, Sparkles, Target, Trophy } from 'lucide-react';
import { api, GrowthOverview, LeaderboardEntry } from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';

export default function GrowthPage() {
  const router = useRouter();
  const { language } = useTranslation();
  const [overview, setOverview] = useState<GrowthOverview | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [leaderTrack, setLeaderTrack] = useState('');
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeQuestions = language === 'vi' ? [
    { text: 'Mã trạng thái nào thường cho biết người dùng không có quyền truy cập?', choices: ['200', '403', '500'] },
    { text: 'Lỗ hổng nào cho phép JavaScript do người dùng kiểm soát chạy trong trình duyệt?', choices: ['SSRF', 'SQL Injection', 'XSS'] },
    { text: 'Kiểm tra quyền sở hữu tài nguyên thuộc nhóm kiểm soát nào?', choices: ['Authorization', 'Encoding', 'Logging'] },
    { text: 'Cách an toàn nhất để đưa dữ liệu vào truy vấn SQL là gì?', choices: ['Nối chuỗi', 'Lọc dấu nháy', 'Parameterized query'] },
    { text: 'Lỗ hổng nào lợi dụng server để truy cập một URL đích?', choices: ['SSRF', 'CSRF', 'Clickjacking'] },
  ] : [
    { text: 'Which status code typically indicates the user does not have access rights?', choices: ['200', '403', '500'] },
    { text: 'Which vulnerability allows user-controlled JavaScript to run in the browser?', choices: ['SSRF', 'SQL Injection', 'XSS'] },
    { text: 'Checking resource ownership belongs to which control group?', choices: ['Authorization', 'Encoding', 'Logging'] },
    { text: 'What is the safest way to insert data into a SQL query?', choices: ['Concatenation', 'Quotes sanitization', 'Parameterized query'] },
    { text: 'Which vulnerability abuses the server to access a destination URL?', choices: ['SSRF', 'CSRF', 'Clickjacking'] },
  ];

  const trackNames: Record<string, string> = language === 'vi' ? {
    BEGINNER: 'Người mới', WEB_DEVELOPER: 'Web Developer', PENTESTER: 'Pentester',
  } : {
    BEGINNER: 'Beginner', WEB_DEVELOPER: 'Web Developer', PENTESTER: 'Pentester',
  };

  useEffect(() => {
    Promise.all([api.growth.getOverview(), api.growth.getLeaderboard()])
      .then(([growth, board]) => { setOverview(growth.data); setLeaders(board.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const submitAssessment = async () => {
    if (answers.some(answer => answer < 0)) {
      return setError(language === 'vi' ? 'Hãy trả lời đủ 5 câu trước khi nhận lộ trình.' : 'Please answer all 5 questions before receiving your recommended track.');
    }
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

  if (loading) return <div className="growth-loading">{language === 'vi' ? 'Đang tổng hợp tiến độ của bạn...' : 'Summarizing your progress...'}</div>;
  if (!overview) return <div className="growth-error">{error || (language === 'vi' ? 'Không thể tải dữ liệu tiến bộ.' : 'Failed to load progress data.')}</div>;

  if (overview.onboardingRequired) return (
    <main className="growth-page assessment-page">
      <header className="growth-header">
        <div>
          <span className="growth-eyebrow">{language === 'vi' ? 'Đánh giá đầu vào · khoảng 5 phút' : 'Entry Assessment · approx 5 mins'}</span>
          <h1>{language === 'vi' ? 'Chọn đúng điểm bắt đầu' : 'Choose the Right Starting Point'}</h1>
          <p>{language === 'vi' ? '5 câu ngắn giúp SecHub đề xuất một lộ trình vừa sức. Kết quả không ảnh hưởng điểm.' : '5 short questions to help SecHub suggest a suitable path. Results do not affect your score.'}</p>
        </div>
        <Target size={34} />
      </header>
      <div className="assessment-list">
        {activeQuestions.map((question, index) => <fieldset key={question.text}>
          <legend><span>{index + 1}</span>{question.text}</legend>
          <div className="assessment-options">{question.choices.map((choice, choiceIndex) => <label key={choice} className={answers[index] === choiceIndex ? 'selected' : ''}>
            <input type="radio" name={`question-${index}`} checked={answers[index] === choiceIndex} onChange={() => setAnswers(old => old.map((value, i) => i === index ? choiceIndex : value))} />
            {choice}
          </label>)}</div>
        </fieldset>)}
      </div>
      {error && <p className="growth-inline-error">{error}</p>}
      <button className="btn btn-primary" onClick={submitAssessment} disabled={submitting}>{language === 'vi' ? 'Nhận lộ trình đề xuất' : 'Get Recommended Track'} <ArrowRight size={16} /></button>
    </main>
  );

  const levelProgress = overview.xp % 500;
  return (
    <main className="growth-page">
      <header className="growth-header">
        <div>
          <span className="growth-eyebrow">{language === 'vi' ? 'Lộ trình' : 'Track'} {trackNames[overview.recommendedTrack]}</span>
          <h1>{language === 'vi' ? 'Tiến bộ của bạn' : 'Your Progress'}</h1>
          <p>{language === 'vi' ? 'Cấp' : 'Level'} {overview.level} · {overview.levelTitle}</p>
        </div>
        <div className="growth-level"><strong>{overview.xp}</strong><span>XP</span></div>
      </header>
      <div className="growth-level-bar">
        <span style={{ width: `${(levelProgress / 500) * 100}%` }} />
        <small>{500 - levelProgress} {language === 'vi' ? 'XP tới cấp tiếp theo' : 'XP to next level'}</small>
      </div>
      {error && <p className="growth-inline-error">{error}</p>}

      <section className="growth-stats" aria-label={language === 'vi' ? 'Tổng quan tiến độ' : 'Progress Overview'}>
        <div><Flame /><strong>{overview.streak} {language === 'vi' ? 'ngày' : 'days'}</strong><span>{language === 'vi' ? 'Chuỗi học' : 'Study Streak'}</span></div>
        <div><Snowflake /><strong>{overview.freezeTickets} {language === 'vi' ? 'vé' : 'tickets'}</strong><span>{language === 'vi' ? 'Bảo toàn chuỗi' : 'Streak Freeze'}</span></div>
        <div><Medal /><strong>{overview.badges.length}</strong><span>{language === 'vi' ? 'Huy hiệu kỹ năng' : 'Skill Badges'}</span></div>
        <div><ShieldCheck /><strong>{overview.skills.length}</strong><span>{language === 'vi' ? 'Kỹ năng đã luyện' : 'Skills Practiced'}</span></div>
      </section>

      <section className="growth-section">
        <div className="growth-section-title">
          <div><Target /><h2>{language === 'vi' ? 'Việc nên làm tiếp' : 'Next Action Items'}</h2></div>
          <span>10–15 {language === 'vi' ? 'phút' : 'mins'}</span>
        </div>
        <div className="mission-row">
          <div><CheckCircle2 className={overview.dailyMission.completed ? 'done' : ''} /><div><strong>{overview.dailyMission.title}</strong><p>{overview.dailyMission.description}</p></div></div>
          <Link className="btn btn-secondary" href={overview.dailyMission.actionUrl}>{overview.dailyMission.completed ? (language === 'vi' ? 'Xem lại' : 'Review') : (language === 'vi' ? 'Bắt đầu' : 'Start')}</Link>
        </div>
        <div className="mission-row">
          <div><Sparkles className={overview.weeklyChallenge.completed ? 'done' : ''} /><div><strong>{overview.weeklyChallenge.title}</strong><p>{overview.weeklyChallenge.description}</p></div></div>
          <button className="btn btn-secondary" onClick={openWeeklyLab} disabled={submitting}>{overview.weeklyChallenge.completed ? (language === 'vi' ? 'Lab biến thể khác' : 'Generate Variant') : (language === 'vi' ? 'Mở thử thách' : 'Start Challenge')}</button>
        </div>
      </section>

      <div className="growth-two-column">
        <section className="growth-section">
          <div className="growth-section-title"><div><ShieldCheck /><h2>{language === 'vi' ? 'Bản đồ kỹ năng' : 'Skills Map'}</h2></div></div>
          {overview.skills.length ? (
            <div className="skill-list">
              {overview.skills.map(skill => (
                <div key={skill.slug} className="skill-row">
                  <div>
                    <strong>{skill.name}</strong>
                    <span>{language === 'vi' ? 'Cấp' : 'Level'} {skill.level} · {skill.completedLabs} {language === 'vi' ? 'lab' : 'labs'} · {language === 'vi' ? 'TB' : 'avg'} {skill.averageHints} {language === 'vi' ? 'gợi ý' : 'hints'}</span>
                  </div>
                  <div><i style={{ width: `${Math.min(100, skill.xp / 5)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="growth-empty">{language === 'vi' ? 'Hoàn thành lab đầu tiên để mở bản đồ kỹ năng.' : 'Complete your first lab to unlock the skills map.'}</p>
          )}
        </section>
        <section className="growth-section">
          <div className="growth-section-title"><div><Trophy /><h2>{language === 'vi' ? 'Báo cáo tuần' : 'Weekly Report'}</h2></div></div>
          <div className="weekly-numbers">
            <span><strong>{overview.weeklyReport.labsCompleted}</strong> {language === 'vi' ? 'lab' : 'labs'}</span>
            <span><strong>{overview.weeklyReport.lessonsCompleted}</strong> {language === 'vi' ? 'bài học' : 'lessons'}</span>
            <span><strong>+{overview.weeklyReport.xpGained}</strong> XP</span>
          </div>
          <p><b>{language === 'vi' ? 'Mạnh nhất:' : 'Strongest:'}</b> {overview.weeklyReport.strongestSkill}</p>
          <p><b>{language === 'vi' ? 'Nên củng cố:' : 'Needs Focus:'}</b> {overview.weeklyReport.weakSkill}</p>
          <p>{overview.weeklyReport.recommendation}</p>
        </section>
      </div>

      <section className="growth-section">
        <div className="growth-section-title"><div><Medal /><h2>{language === 'vi' ? 'Huy hiệu' : 'Badges'}</h2></div></div>
        <div className="badge-list">
          {overview.badges.length ? (
            overview.badges.map(badge => <span key={badge}>{badge}</span>)
          ) : (
            <p className="growth-empty">{language === 'vi' ? 'Huy hiệu đầu tiên đang chờ bạn.' : 'Your first badge is waiting for you.'}</p>
          )}
        </div>
      </section>

      <section className="growth-section">
        <div className="growth-section-title">
          <div><Trophy /><h2>{language === 'vi' ? 'Leaderboard tuần' : 'Weekly Leaderboard'}</h2></div>
          <Link href={`/profile/${api.auth.getCurrentUser()?.username}`}>{language === 'vi' ? 'Hồ sơ công khai' : 'Public Profile'}</Link>
        </div>
        <div className="leaderboard-filters" aria-label={language === 'vi' ? 'Lọc theo trình độ' : 'Filter by track'}>
          {[
            ['', language === 'vi' ? 'Tất cả' : 'All'],
            ['BEGINNER', language === 'vi' ? 'Người mới' : 'Beginner'],
            ['WEB_DEVELOPER', 'Web Developer'],
            ['PENTESTER', 'Pentester']
          ].map(([value, label]) => (
            <button key={value} className={leaderTrack === value ? 'active' : ''} onClick={() => changeLeaderboard(value)}>{label}</button>
          ))}
        </div>
        <div className="leaderboard">
          {leaders.slice(0, 5).map((leader, index) => (
            <div key={leader.username}>
              <span>{index + 1}</span>
              <Link href={`/profile/${leader.username}`}>{leader.username}</Link>
              <small>{trackNames[leader.track]} · {leader.strongestSkill}</small>
              <strong>{leader.weeklyXp} XP</strong>
            </div>
          ))}
          {leaders.length === 0 && <p className="growth-empty">{language === 'vi' ? 'Chưa có điểm trong nhóm này tuần này.' : 'No scores in this group this week.'}</p>}
        </div>
      </section>
    </main>
  );
}
