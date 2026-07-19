'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { api, LearningPath } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { localizeLessonTitle } from '@/utils/localize';

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
  const { t, language } = useTranslation();
  const router = useRouter();

  const [path, setPath] = useState<LearningPath | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeLessonId, setResumeLessonId] = useState<string | null>(null);

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
          setError(pathRes.message || (language === 'vi' ? 'Không thể tải lộ trình học.' : 'Failed to load learning path.'));
          setLoading(false);
          return;
        }

        let fetchedLessons = lessonsRes.success ? lessonsRes.data : [];

        if (isAuthenticated) {
          const [progressRes, resumeRes] = await Promise.all([
            api.progress.getPathProgress(pathId),
            api.users.getResume(true)
          ]);
          if (progressRes.success && progressRes.data) {
            const completedMap = new Map(progressRes.data.map(p => [p.lessonId, p.completed]));
            fetchedLessons = fetchedLessons.map((l: Lesson) => ({
              ...l,
              completed: !!completedMap.get(l.id)
            }));
          }
          if (resumeRes.success && resumeRes.data?.type === 'LESSON') {
            setResumeLessonId(resumeRes.data.lessonId || null);
          }
        }

        setLessons(fetchedLessons);
      } catch (e: unknown) {
        const err = e as Error;
        setError(err.message || (language === 'vi' ? 'Lỗi khi tải dữ liệu lộ trình học.' : 'Error loading learning path data.'));
      } finally {
        setLoading(false);
      }
    }

    loadPathData();
  }, [pathId, isAuthenticated, language]);


  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>{language === 'vi' ? 'Đang tải lộ trình học...' : 'Loading learning path...'}</div>;
  }

  if (error || !path) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <AlertCircle size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>{language === 'vi' ? 'Lỗi dữ liệu' : 'Data Error'}</h3>
        <p style={{ margin: 'var(--space-1) auto' }}>{error || (language === 'vi' ? 'Không tìm thấy lộ trình học.' : 'Learning path not found.')}</p>
        <Link href="/learning" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 'var(--space-2)' }}>
          {language === 'vi' ? 'Quay lại danh sách lộ trình' : 'Back to learning paths'}
        </Link>
      </div>
    );
  }

  const completedCount = lessons.filter(l => l.completed).length;
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  
  const diffClass = path.difficulty === 'BEGINNER' ? 'badge-easy' : 
                    path.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                    'badge-hard';

  const diffLabel = path.difficulty === 'BEGINNER' ? t('common.beginner') : 
                   path.difficulty === 'INTERMEDIATE' ? t('common.intermediate') : t('common.advanced');

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
        <Link href="/learning" style={{ color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'Lộ trình học' : 'Learning Paths'}</Link>
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
                <Clock size={14} /> ~{path.estimatedHours} {language === 'vi' ? 'giờ' : 'hours'}
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
              <span>{completedCount}/{lessons.length} {language === 'vi' ? 'bài học đã hoàn thành' : 'lessons completed'}</span>
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
        <BookOpen size={20} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Danh sách bài học' : 'Lessons List'}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {lessons.map((lesson, index) => {
          const isCurrent = lesson.id === resumeLessonId;
          return (
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
                opacity: lesson.completed && !isCurrent ? 0.75 : 1,
                border: isCurrent ? '1px solid var(--border-brand)' : '1px solid var(--border-default)',
                background: isCurrent ? 'rgba(56, 189, 248, 0.02)' : 'var(--bg-neutral-primary)',
              }}
              onClick={() => router.push(`/learning/${pathId}/lessons/${lesson.id}${isCurrent ? '?resume=1' : ''}`)}
            >
              {/* Lesson number / check */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: lesson.completed ? 'rgba(0, 122, 85, 0.1)' : isCurrent ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-neutral-tertiary)',
                border: `2px solid ${lesson.completed ? 'var(--border-success)' : isCurrent ? 'var(--border-brand)' : 'var(--border-default-medium)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: lesson.completed ? 'var(--fg-success-strong)' : isCurrent ? 'var(--fg-brand-strong)' : 'var(--text-body-subtle)',
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
                  textDecoration: lesson.completed && !isCurrent ? 'line-through' : 'none',
                }}>
                  {localizeLessonTitle(lesson.title, language)}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-body-subtle)' }}>
                  {lesson.vulnerabilityName ? `${language === 'vi' ? 'Liên quan đến' : 'Related to'}: ${lesson.vulnerabilityName}` : (language === 'vi' ? 'Bài giảng lý thuyết nhập môn' : 'Introductory theory lecture')}
                </div>
              </div>
  
              {/* Complete status or actions */}
              {isCurrent ? (
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-brand-softer)', color: 'var(--fg-brand-strong)', borderRadius: 'var(--radius-sm)', fontWeight: 800, border: '1px solid var(--border-brand-subtle)' }}>
                  {language === 'vi' ? 'Đang học dở' : 'Resume'}
                </span>
              ) : !lesson.completed && isAuthenticated ? (
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-brand-softer)', color: 'var(--fg-brand)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  {language === 'vi' ? 'Đọc bài học' : 'Read lesson'}
                </span>
              ) : null}

            {/* Arrow */}
            <span style={{ color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
