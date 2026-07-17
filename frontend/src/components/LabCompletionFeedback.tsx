import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Code2, Share2, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { LabAttempt, LabFeedback } from '@/lib/api';

export default function LabCompletionFeedback({ feedback, attempt, onHarder, creatingHarder }: { feedback: LabFeedback; attempt: LabAttempt; onHarder: () => void; creatingHarder: boolean }) {
  const elapsed = Math.max(1, Math.round((new Date(attempt.completedAt || Date.now()).getTime() - new Date(attempt.startedAt).getTime()) / 60000));
  const shareResult = async () => {
    const text = `Tôi vừa hoàn thành lab ${attempt.labTitle} trên SecHub: ${attempt.score} XP, ${elapsed} phút, ${attempt.hintsUsed} gợi ý. Kỹ năng: ${feedback.vulnerabilityName}.`;
    if (navigator.share) await navigator.share({ title: 'Kết quả lab SecHub', text });
    else await navigator.clipboard.writeText(text);
  };
  return (
    <section className="lab-feedback" aria-labelledby="lab-feedback-title">
      <div className="lab-feedback-hero">
        <div className="lab-feedback-icon"><CheckCircle2 size={24} /></div>
        <div>
          <div className="lab-feedback-kicker">Hoàn thành · +{attempt.score} điểm</div>
          <h2 id="lab-feedback-title">Bạn vừa khai thác {feedback.vulnerabilityName}</h2>
          <p>{feedback.summary}</p>
        </div>
      </div>

      <div className="lab-feedback-metrics">
        <span><strong>{elapsed} phút</strong>Thời gian</span><span><strong>{attempt.hintsUsed}</strong>Gợi ý đã dùng</span><span><strong>{attempt.score} XP</strong>Kỹ năng {feedback.vulnerabilityName}</span>
      </div>

      <div className="lab-feedback-explanation">
        <h3><BookOpen size={17} /> Vì sao payload hoạt động?</h3>
        <p>{feedback.whyItWorked}</p>
      </div>

      <div className="lab-feedback-code-grid">
        <div>
          <h3><Code2 size={16} /> Code có lỗ hổng</h3>
          <pre><code>{feedback.vulnerableCode}</code></pre>
        </div>
        <div>
          <h3><ShieldCheck size={16} /> Cách sửa an toàn</h3>
          <pre><code>{feedback.secureCode}</code></pre>
        </div>
      </div>

      <div className="lab-feedback-bottom">
        <div>
          <h3><Wrench size={16} /> Checklist khắc phục</h3>
          <ul>{feedback.remediationSteps.map(step => <li key={step}>{step}</li>)}</ul>
        </div>
        <blockquote>{feedback.lessonTakeaway}</blockquote>
      </div>

      <div className="lab-feedback-actions">
        <button className="btn btn-secondary" onClick={shareResult}><Share2 size={15} /> Chia sẻ kết quả</button>
        <button className="btn btn-primary" onClick={onHarder} disabled={creatingHarder}><Sparkles size={15} /> {creatingHarder ? 'Đang tạo...' : 'Tạo bản khó hơn'}</button>
        <Link href="/review" className="btn btn-primary">Ôn lại bằng flashcard <ArrowRight size={15} /></Link>
        <Link href="/learning" className="btn btn-secondary">Tiếp tục lộ trình</Link>
        <Link href={feedback.nextLabId ? `/labs/${feedback.nextLabId}` : '/labs'} className="btn btn-secondary">
          {feedback.nextLabTitle ? `Lab tiếp theo: ${feedback.nextLabTitle}` : 'Chọn lab tiếp theo'} <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
