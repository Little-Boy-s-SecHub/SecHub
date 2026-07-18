import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Code2, Share2, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { LabAttempt, LabFeedback, parseBackendDate } from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';

export default function LabCompletionFeedback({
  feedback,
  attempt,
  onHarder,
  creatingHarder,
  pathId,
  lessonId
}: {
  feedback: LabFeedback;
  attempt: LabAttempt;
  onHarder: () => void;
  creatingHarder: boolean;
  pathId?: string;
  lessonId?: string;
}) {
  const { language } = useTranslation();
  const elapsed = Math.max(1, Math.round((parseBackendDate(attempt.completedAt ?? attempt.startedAt).getTime() - parseBackendDate(attempt.startedAt).getTime()) / 60000));
  const shareResult = async () => {
    const text = language === 'vi'
      ? `Tôi vừa hoàn thành lab ${attempt.labTitle} trên SecHub: ${attempt.score} XP, ${elapsed} phút, ${attempt.hintsUsed} gợi ý. Kỹ năng: ${feedback.vulnerabilityName}.`
      : `I just completed lab ${attempt.labTitle} on SecHub: ${attempt.score} XP, ${elapsed} mins, ${attempt.hintsUsed} hints. Skill: ${feedback.vulnerabilityName}.`;
    if (navigator.share) await navigator.share({ title: language === 'vi' ? 'Kết quả lab SecHub' : 'SecHub Lab Result', text });
    else await navigator.clipboard.writeText(text);
  };
  return (
    <section className="lab-feedback" aria-labelledby="lab-feedback-title">
      <div className="lab-feedback-hero">
        <div className="lab-feedback-icon"><CheckCircle2 size={24} /></div>
        <div>
          <div className="lab-feedback-kicker">{language === 'vi' ? 'Hoàn thành' : 'Completed'} · +{attempt.score} {language === 'vi' ? 'điểm' : 'pts'}</div>
          <h2 id="lab-feedback-title">{language === 'vi' ? 'Bạn vừa khai thác' : 'You just exploited'} {feedback.vulnerabilityName}</h2>
          <p>{feedback.summary}</p>
        </div>
      </div>

      <div className="lab-feedback-metrics">
        <span><strong>{elapsed} {language === 'vi' ? 'phút' : 'mins'}</strong>{language === 'vi' ? 'Thời gian hoàn thành' : 'Completion Time'}</span>
        <span><strong>{attempt.hintsUsed} {language === 'vi' ? 'gợi ý' : 'hints'}</strong>{language === 'vi' ? 'Số gợi ý đã dùng' : 'Hints Used'}</span>
        <span><strong>{feedback.vulnerabilityName}</strong>{language === 'vi' ? 'Kỹ năng đạt được' : 'Skill Acquired'} (+{attempt.score} XP)</span>
      </div>

      {feedback.nextLabId && (
        <div style={{
          margin: '20px 24px 0 24px',
          background: 'var(--bg-brand-softer)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg-brand)', display: 'block', marginBottom: '2px' }}>
              🎯 {language === 'vi' ? 'Lab tiếp theo phù hợp cho bạn' : 'Next recommended lab for you'}
            </span>
            <strong style={{ fontSize: '15px', color: 'var(--text-heading)' }}>
              {feedback.nextLabTitle}
            </strong>
            {feedback.nextLabDifficulty && (
              <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: 'var(--bg-neutral-tertiary)', borderRadius: '4px', color: 'var(--text-body-subtle)' }}>
                {language === 'vi' ? 'Độ khó' : 'Difficulty'}: {feedback.nextLabDifficulty === 'BEGINNER' ? (language === 'vi' ? 'Cơ bản' : 'Beginner') : feedback.nextLabDifficulty === 'INTERMEDIATE' ? (language === 'vi' ? 'Trung bình' : 'Intermediate') : (language === 'vi' ? 'Nâng cao' : 'Advanced')}
              </span>
            )}
          </div>
          <Link href={`/labs/${feedback.nextLabId}/play${pathId && lessonId ? `?pathId=${pathId}&lessonId=${lessonId}` : ''}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            {language === 'vi' ? 'Bắt đầu ngay' : 'Start Now'} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="lab-feedback-explanation" style={{
        background: 'linear-gradient(135deg, var(--bg-success-soft) 0%, rgba(56,189,248,0.06) 100%)',
        borderLeft: '4px solid var(--fg-success-strong)',
        padding: '24px',
        margin: '20px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 122, 85, 0.05)',
        borderBottom: 'none',
      }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: 0 }}>
          <BookOpen size={18} style={{ color: 'var(--fg-success-strong)' }} /> {language === 'vi' ? 'Vì sao payload hoạt động?' : 'Why did the payload work?'}
        </h3>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-body)', margin: 0 }}>
          {feedback.whyItWorked}
        </p>
      </div>

      <div className="lab-feedback-code-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '24px',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.02)',
          border: '1px solid rgba(239, 68, 68, 0.12)',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '7px', margin: '0 0 12px 0', fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>
            <Code2 size={16} /> {language === 'vi' ? 'Code có lỗ hổng' : 'Vulnerable Code'}
          </h3>
          <pre style={{ margin: 0, background: '#1e1e2e', border: '1px solid #313244' }}><code>{feedback.vulnerableCode}</code></pre>
        </div>
        <div style={{
          background: 'rgba(16, 185, 129, 0.02)',
          border: '1px solid rgba(16, 185, 129, 0.12)',
          borderLeft: '4px solid #10b981',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '7px', margin: '0 0 12px 0', fontSize: '14px', color: '#10b981', fontWeight: 700 }}>
            <ShieldCheck size={16} /> {language === 'vi' ? 'Cách sửa an toàn' : 'Secure Remediation'}
          </h3>
          <pre style={{ margin: 0, background: '#1e1e2e', border: '1px solid #313244' }}><code>{feedback.secureCode}</code></pre>
        </div>
      </div>

      <div className="lab-feedback-bottom">
        <div>
          <h3><Wrench size={16} /> {language === 'vi' ? 'Checklist khắc phục' : 'Remediation Checklist'}</h3>
          <ul>{feedback.remediationSteps.map(step => <li key={step}>{step}</li>)}</ul>
        </div>
        <blockquote>{feedback.lessonTakeaway}</blockquote>
      </div>

      <div className="lab-feedback-actions">
        <button className="btn btn-secondary" onClick={shareResult}><Share2 size={15} /> {language === 'vi' ? 'Chia sẻ kết quả' : 'Share Result'}</button>
        <button className="btn btn-primary" onClick={onHarder} disabled={creatingHarder}><Sparkles size={15} /> {creatingHarder ? (language === 'vi' ? 'Đang tạo...' : 'Generating...') : (language === 'vi' ? 'Tạo bản khó hơn' : 'Generate Harder Version')}</button>
        <Link href="/review" className="btn btn-primary">{language === 'vi' ? 'Ôn lại bằng flashcard' : 'Review with flashcards'} <ArrowRight size={15} /></Link>
        {pathId && lessonId && (
          <Link href={`/learning/${pathId}/lessons/${lessonId}`} className="btn btn-secondary">
            <BookOpen size={15} /> {language === 'vi' ? 'Quay lại bài học' : 'Back to Lesson'}
          </Link>
        )}
        <Link href={pathId ? `/learning/${pathId}` : '/learning'} className="btn btn-secondary">{language === 'vi' ? 'Tiếp tục lộ trình' : 'Continue Path'}</Link>
        <Link href={feedback.nextLabId ? `/labs/${feedback.nextLabId}${pathId && lessonId ? `?pathId=${pathId}&lessonId=${lessonId}` : ''}` : '/labs'} className="btn btn-secondary">
          {feedback.nextLabTitle ? (language === 'vi' ? `Lab tiếp theo: ${feedback.nextLabTitle}` : `Next Lab: ${feedback.nextLabTitle}`) : (language === 'vi' ? 'Chọn lab tiếp theo' : 'Choose next lab')} <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
