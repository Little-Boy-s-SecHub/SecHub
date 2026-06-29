'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, BookOpen, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { api, LearningPath } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Lesson {
  id: string;
  pathId: string;
  title: string;
  contentMarkdown: string;
  sortOrder: number;
  vulnerabilityId?: string;
  vulnerabilityName?: string;
  completed?: boolean;
}

export default function LearningPathDetailPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [path, setPath] = useState<LearningPath | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPathData() {
      try {
        const [pathRes, lessonsRes] = await Promise.all([
          api.learningPaths.getById(pathId),
          api.learningPaths.getLessons(pathId)
        ]);

        if (pathRes.success && pathRes.data) {
          setPath(pathRes.data);
        } else {
          setError(pathRes.message || 'Không thể tải lộ trình học.');
          setLoading(false);
          return;
        }

        let fetchedLessons = lessonsRes.success ? lessonsRes.data : [];

        if (isAuthenticated) {
          const progressRes = await api.progress.getPathProgress(pathId);
          if (progressRes.success && progressRes.data) {
            const completedMap = new Map(progressRes.data.map(p => [p.lessonId, p.completed]));
            fetchedLessons = fetchedLessons.map((l: any) => ({
              ...l,
              completed: !!completedMap.get(l.id)
            }));
          }
        }

        setLessons(fetchedLessons);
      } catch (e: any) {
        setError(e.message || 'Lỗi khi tải dữ liệu lộ trình học.');
      } finally {
        setLoading(false);
      }
    }

    loadPathData();
  }, [pathId, isAuthenticated]);

  const handleToggleComplete = async (lessonId: string, currentCompleted: boolean) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only allow marking complete (toggle off is not supported in endpoint, but let's call complete endpoint)
    if (currentCompleted) return;

    try {
      const res = await api.progress.completeLesson(lessonId);
      if (res.success) {
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: true } : l));
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi cập nhật tiến độ bài học.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Đang tải lộ trình học...</div>;
  }

  if (error || !path) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <AlertCircle size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>Lỗi dữ liệu</h3>
        <p style={{ margin: 'var(--space-1) auto' }}>{error || 'Không tìm thấy lộ trình học.'}</p>
        <Link href="/learning" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 'var(--space-2)' }}>
          Quay lại danh sách lộ trình
        </Link>
      </div>
    );
  }

  const completedCount = lessons.filter(l => l.completed).length;
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  
  const diffClass = path.difficulty === 'BEGINNER' ? 'badge-easy' : 
                    path.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                    'badge-hard';

  const diffLabel = path.difficulty === 'BEGINNER' ? 'Cơ bản' : 
                   path.difficulty === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
        <Link href="/learning" style={{ color: 'var(--text-body-subtle)' }}>Lộ trình học</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-heading)' }}>{path.title}</span>
      </div>

      {/* Header */}
      <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className={`badge ${diffClass}`}>{diffLabel}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-body-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> ~{path.estimatedHours} giờ
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
              {path.title}
            </h1>
            <p style={{ color: 'var(--text-body-subtle)' }}>{path.description}</p>
          </div>
          
          {isAuthenticated && (
            <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 'var(--space-4)' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `conic-gradient(var(--bg-brand) ${progress * 3.6}deg, var(--bg-neutral-tertiary) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--bg-neutral-primary-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--fg-brand)',
                }}>
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isAuthenticated && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-body-subtle)' }}>
              <span>{completedCount}/{lessons.length} bài học đã hoàn thành</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Lessons list */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={20} style={{ color: 'var(--fg-brand)' }} /> Danh sách bài học
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            className="card animate-fade-in-up"
            style={{
              animationDelay: `${index * 0.04}s`,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              cursor: 'pointer',
              opacity: lesson.completed ? 0.75 : 1,
            }}
            onClick={() => handleToggleComplete(lesson.id, !!lesson.completed)}
          >
            {/* Lesson number / check */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: lesson.completed ? 'rgba(0, 122, 85, 0.1)' : 'var(--bg-neutral-tertiary)',
              border: `2px solid ${lesson.completed ? 'var(--border-success)' : 'var(--border-default-medium)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: lesson.completed ? 'var(--fg-success-strong)' : 'var(--text-body-subtle)',
              flexShrink: 0,
            }}>
              {lesson.completed ? '✓' : index + 1}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--text-heading)',
                marginBottom: '2px',
                textDecoration: lesson.completed ? 'line-through' : 'none',
              }}>
                {lesson.title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-body-subtle)' }}>
                {lesson.vulnerabilityName ? `Liên quan đến: ${lesson.vulnerabilityName}` : 'Bài giảng lý thuyết nhập môn'}
              </div>
            </div>

            {/* Complete status or actions */}
            {!lesson.completed && isAuthenticated && (
              <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-brand-softer)', color: 'var(--fg-brand)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                Đánh dấu hoàn thành
              </span>
            )}

            {/* Arrow */}
            <span style={{ color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
