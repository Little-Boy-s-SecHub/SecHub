'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, CheckCircle2, Code2, FlaskConical, LoaderCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { api, Flashcard, ReviewDashboard } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageBackLink from '@/components/PageBackLink';

type Result = { correct: boolean; correctAnswer: string; explanation: string; nextReviewAt: string };

export default function ReviewPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<ReviewDashboard | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    api.review.getDashboard().then(res => {
      setDashboard(res.data);
      setCards(res.data.cards || []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  const card = cards[index];
  const progress = cards.length ? ((index + (result ? 1 : 0)) / cards.length) * 100 : 0;

  const submit = async (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (!card || !answer || submitting) return;
    setSubmitting(true);
    try {
      const response = await api.review.answer(card.id, answer, rating);
      setResult(response.data);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const next = () => {
    setAnswer(''); setResult(null); setError('');
    setIndex(current => current + 1);
  };

  const openDailyLab = async () => {
    setDailyLoading(true); setError('');
    try {
      const response = await api.review.getDailyLab();
      router.push(`/labs/${response.data.id}`);
    } catch (e: any) { setError(e.message); setDailyLoading(false); }
  };

  if (loading || authLoading) return <div className="review-loading"><LoaderCircle className="spin" /> Đang chuẩn bị bộ ôn tập...</div>;

  return (
    <div>
      <PageBackLink href="/" label="Quay lại Dashboard" />
      <div className="review-header">
        <div>
          <div className="review-kicker">Học lại đúng lúc</div>
          <h1 className="section-title"><BrainCircuit size={28} /> Ôn tập thông minh</h1>
          <p className="section-subtitle">Củng cố code lỗi, payload và tư duy khai thác từ những bài bạn đã hoàn thành.</p>
        </div>
        <button className="btn btn-primary review-daily-button" onClick={openDailyLab} disabled={dailyLoading}>
          {dailyLoading ? <LoaderCircle size={16} className="spin" /> : <FlaskConical size={16} />}
          Daily Lab
        </button>
      </div>

      <div className="review-stats">
        <div><span>Cần ôn hôm nay</span><strong>{dashboard?.dueCount || 0}</strong></div>
        <div><span>Tổng flashcard</span><strong>{dashboard?.totalCards || 0}</strong></div>
        <div><span>Tiến độ phiên</span><strong>{cards.length ? `${Math.min(index + 1, cards.length)}/${cards.length}` : '0/0'}</strong></div>
      </div>

      {error && <div className="lesson-lab-error">{error}</div>}

      {!card ? (
        <div className="review-empty">
          <CheckCircle2 size={44} />
          <h2>{dashboard?.totalCards ? 'Bạn đã ôn xong hôm nay' : 'Chưa có bài để tạo flashcard'}</h2>
          <p>{dashboard?.totalCards ? 'Các thẻ sẽ quay lại theo lịch ghi nhớ của bạn.' : 'Hãy hoàn thành một bài học, sau đó quay lại đây để bắt đầu ôn tập.'}</p>
          <button className="btn btn-primary" onClick={() => router.push('/learning')}>Đi đến lộ trình học</button>
        </div>
      ) : (
        <section className="review-session">
          <div className="review-session-heading">
            <span>Phiên ôn hôm nay</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="review-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="review-card">
            <div className="review-card-meta">
              <span><Code2 size={14} /> {card.type === 'CODE_REVIEW' ? 'Đọc code' : card.type === 'PAYLOAD' ? 'Payload' : 'Kiến thức'}</span>
              <span>{card.lessonTitle}</span>
            </div>
            <h2>{card.question}</h2>
            {card.code && <pre className="review-code"><code>{card.code}</code></pre>}
            <div className="review-choices">
              {card.choices.map((choice, choiceIndex) => (
                <button key={choice} className={`review-choice ${answer === choice ? 'selected' : ''} ${result && choice === result.correctAnswer ? 'correct' : ''} ${result && answer === choice && !result.correct ? 'wrong' : ''}`} onClick={() => !result && setAnswer(choice)} disabled={!!result}>
                  <span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}
                </button>
              ))}
            </div>

            {!result ? (
              <div className="review-ratings">
                <button disabled={!answer || submitting} onClick={() => submit('AGAIN')}><span><RotateCcw size={15} /> Quên</span><small>Ôn lại sau 8 giờ</small></button>
                <button disabled={!answer || submitting} onClick={() => submit('HARD')}><span>Khó</span><small>Ôn lại sau 2 ngày</small></button>
                <button disabled={!answer || submitting} onClick={() => submit('GOOD')}><span>Nhớ</span><small>Ôn lại sau 4 ngày</small></button>
                <button disabled={!answer || submitting} onClick={() => submit('EASY')}><span><Sparkles size={15} /> Dễ</span><small>Ôn lại sau 7 ngày</small></button>
              </div>
            ) : (
              <div className={`review-result ${result.correct ? 'correct' : 'wrong'}`}>
                <div className="review-result-title">{result.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}{result.correct ? 'Chính xác' : `Đáp án: ${result.correctAnswer}`}</div>
                <p>{result.explanation}</p>
                <button className="btn btn-primary" onClick={next}>{index + 1 < cards.length ? 'Thẻ tiếp theo' : 'Hoàn tất phiên ôn'}</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
