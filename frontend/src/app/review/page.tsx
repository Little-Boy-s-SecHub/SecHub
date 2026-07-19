'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, CheckCircle2, Code2, FlaskConical, LoaderCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { api, Flashcard, ReviewDashboard } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import PageBackLink from '@/components/PageBackLink';

type Result = { correct: boolean; correctAnswer: string; explanation: string; nextReviewAt: string };

export default function ReviewPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useTranslation();
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
    } catch (e: Error | unknown) { setError((e as Error).message); }
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
    } catch (e: Error | unknown) { setError((e as Error).message); setDailyLoading(false); }
  };

  if (loading || authLoading) return <div className="review-loading"><LoaderCircle className="spin" /> {language === 'vi' ? 'Đang chuẩn bị bộ ôn tập...' : 'Preparing review cards...'}</div>;

  return (
    <div>
      <PageBackLink href="/" label={language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'} />
      <div className="review-header">
        <div>
          <div className="review-kicker">{language === 'vi' ? 'Học lại đúng lúc' : 'Learn at the right time'}</div>
          <h1 className="section-title"><BrainCircuit size={28} /> {language === 'vi' ? 'Ôn tập thông minh' : 'Smart Review'}</h1>
          <p className="section-subtitle">{language === 'vi' ? 'Củng cố code lỗi, payload và tư duy khai thác từ những bài bạn đã hoàn thành.' : 'Reinforce vulnerability detection, payloads, and hacking mindsets from completed lessons.'}</p>
        </div>
        <button className="btn btn-primary review-daily-button" onClick={openDailyLab} disabled={dailyLoading}>
          {dailyLoading ? <LoaderCircle size={16} className="spin" /> : <FlaskConical size={16} />}
          Daily Lab
        </button>
      </div>

      <div className="review-stats">
        <div><span>{language === 'vi' ? 'Cần ôn hôm nay' : 'Due Today'}</span><strong>{dashboard?.dueCount || 0}</strong></div>
        <div><span>{language === 'vi' ? 'Tổng flashcard' : 'Total Flashcards'}</span><strong>{dashboard?.totalCards || 0}</strong></div>
        <div><span>{language === 'vi' ? 'Tiến độ phiên' : 'Session Progress'}</span><strong>{cards.length ? `${Math.min(index + 1, cards.length)}/${cards.length}` : '0/0'}</strong></div>
      </div>

      {error && <div className="lesson-lab-error">{error}</div>}

      {!card ? (
        <div className="review-empty">
          <CheckCircle2 size={44} />
          <h2>{dashboard?.totalCards ? (language === 'vi' ? 'Bạn đã ôn xong hôm nay' : 'You completed today\'s review!') : (language === 'vi' ? 'Chưa có bài để tạo flashcard' : 'No lessons to build flashcards yet')}</h2>
          <p>{dashboard?.totalCards ? (language === 'vi' ? 'Các thẻ sẽ quay lại theo lịch ghi nhớ của bạn.' : 'Cards will reappear according to your spaced repetition schedule.') : (language === 'vi' ? 'Hãy hoàn thành một bài học, sau đó quay lại đây để bắt đầu ôn tập.' : 'Complete a lesson first, then return here to start reviewing.')}</p>
          <button className="btn btn-primary" onClick={() => router.push('/learning')}>{language === 'vi' ? 'Đi đến lộ trình học' : 'Go to Learning Paths'}</button>
        </div>
      ) : (
        <section className="review-session">
          <div className="review-session-heading">
            <span>{language === 'vi' ? 'Phiên ôn hôm nay' : 'Today\'s Review Session'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="review-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="review-card">
            <div className="review-card-meta">
              <span><Code2 size={14} /> {card.type === 'CODE_REVIEW' ? (language === 'vi' ? 'Đọc code' : 'Code Review') : card.type === 'PAYLOAD' ? 'Payload' : (language === 'vi' ? 'Kiến thức' : 'General')}</span>
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
                <button disabled={!answer || submitting} onClick={() => submit('AGAIN')}><span><RotateCcw size={15} /> {language === 'vi' ? 'Quên' : 'Again'}</span><small>{language === 'vi' ? 'Ôn lại sau 8 giờ' : 'Review in 8 hrs'}</small></button>
                <button disabled={!answer || submitting} onClick={() => submit('HARD')}><span>{language === 'vi' ? 'Khó' : 'Hard'}</span><small>{language === 'vi' ? 'Ôn lại sau 2 ngày' : 'Review in 2 days'}</small></button>
                <button disabled={!answer || submitting} onClick={() => submit('GOOD')}><span>{language === 'vi' ? 'Nhớ' : 'Good'}</span><small>{language === 'vi' ? 'Ôn lại sau 4 ngày' : 'Review in 4 days'}</small></button>
                <button disabled={!answer || submitting} onClick={() => submit('EASY')}><span><Sparkles size={15} /> {language === 'vi' ? 'Dễ' : 'Easy'}</span><small>{language === 'vi' ? 'Ôn lại sau 7 ngày' : 'Review in 7 days'}</small></button>
              </div>
            ) : (
              <div className={`review-result ${result.correct ? 'correct' : 'wrong'}`}>
                <div className="review-result-title">{result.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}{result.correct ? (language === 'vi' ? 'Chính xác' : 'Correct!') : (language === 'vi' ? `Đáp án: ${result.correctAnswer}` : `Answer: ${result.correctAnswer}`)}</div>
                <p>{result.explanation}</p>
                <button className="btn btn-primary" onClick={next}>{index + 1 < cards.length ? (language === 'vi' ? 'Thẻ tiếp theo' : 'Next Card') : (language === 'vi' ? 'Hoàn tất phiên ôn' : 'Finish Session')}</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
