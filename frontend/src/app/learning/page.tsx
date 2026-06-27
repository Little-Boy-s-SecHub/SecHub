import Link from 'next/link';
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { learningPaths } from '@/lib/data';

export const metadata = {
  title: 'Lộ trình học - SecHub',
  description: 'Học pentest web theo lộ trình từ cơ bản đến nâng cao. Bài học có cấu trúc, thực hành tương tác.',
};

export default function LearningPage() {
  return (
    <div>
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={28} style={{ color: 'var(--fg-brand)' }} /> Lộ trình học
        </h1>
        <p className="section-subtitle">
          Các khóa học được thiết kế theo lộ trình từ người mới bắt đầu đến chuyên gia pentest.
          Mỗi lộ trình bao gồm bài giảng lý thuyết và bài lab thực hành.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        {learningPaths.map((path, index) => {
          const progress = path.lessonCount > 0 ? (path.completedLessons / path.lessonCount) * 100 : 0;
          const diffClass = path.difficulty === 'BEGINNER' ? 'badge-easy' : 
                            path.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                            path.difficulty === 'ADVANCED' ? 'badge-hard' : 'badge-expert';
          const diffLabel = path.difficulty === 'BEGINNER' ? 'Cơ bản' : 
                           path.difficulty === 'INTERMEDIATE' ? 'Trung bình' : 
                           path.difficulty === 'ADVANCED' ? 'Nâng cao' : 'Chuyên gia';

          return (
            <Link key={path.id} href={`/learning/${path.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-4)', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span className="path-card-number">Lộ trình {index + 1}</span>
                      <span className={`badge ${diffClass}`}>{diffLabel}</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                      {path.title}
                    </h2>
                    <p style={{ color: 'var(--text-body-subtle)', marginBottom: 'var(--space-3)' }}>
                      {path.description}
                    </p>

                    <div className="path-card-stats" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span className="path-card-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={14} /> {path.lessonCount} bài học
                      </span>
                      <span className="path-card-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> ~{path.estimatedHours} giờ
                      </span>
                      <span className="path-card-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> {path.completedLessons}/{path.lessonCount} hoàn thành
                      </span>
                    </div>
                  </div>

                  {/* Progress circle */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: `conic-gradient(var(--bg-brand) ${progress * 3.6}deg, var(--bg-neutral-tertiary) 0deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'var(--bg-neutral-primary-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--fg-brand)',
                      }}>
                        {Math.round(progress)}%
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)' }}>Tiến độ</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
