'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, Clock, ChevronRight, PlayCircle, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { marked } from 'marked';

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

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

export default function LessonDetailPage({ params }: { params: Promise<{ pathId: string; lessonId: string }> }) {
  const { pathId, lessonId } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const [lessonRes, pathRes, lessonsRes] = await Promise.all([
          api.lessons.getById(lessonId),
          api.learningPaths.getById(pathId),
          api.learningPaths.getLessons(pathId)
        ]);

        if (lessonRes.success && lessonRes.data) {
          setLesson(lessonRes.data);
          // Parse markdown to HTML asynchronously
          const parsed = await marked.parse(lessonRes.data.contentMarkdown);
          setHtmlContent(parsed);
        } else {
          setError('Không tìm thấy thông tin bài học.');
          setLoading(false);
          return;
        }

        if (pathRes.success && pathRes.data) {
          setPath(pathRes.data);
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
            
            // Mark current lesson completed state based on backend progress
            setLesson(prev => prev ? { ...prev, completed: !!completedMap.get(prev.id) } : null);
          }
        }
        setAllLessons(fetchedLessons);
      } catch (e: any) {
        setError(e.message || 'Lỗi khi tải dữ liệu bài học.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [pathId, lessonId, isAuthenticated]);

  const handleComplete = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (lesson?.completed) return;

    try {
      const res = await api.progress.completeLesson(lessonId);
      if (res.success) {
        setLesson(prev => prev ? { ...prev, completed: true } : null);
        setAllLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: true } : l));
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi cập nhật tiến độ bài học.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Đang tải bài học...</div>;
  }

  if (error || !lesson || !path) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <ShieldAlert size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>Lỗi tải bài học</h3>
        <p style={{ margin: 'var(--space-1) auto' }}>{error || 'Không tìm thấy thông tin.'}</p>
        <Link href={`/learning/${pathId}`} className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 'var(--space-2)' }}>
          Quay lại Lộ trình
        </Link>
      </div>
    );
  }

  const currentIdx = allLessons.findIndex(l => l.id === lessonId);
  const nextLesson = currentIdx !== -1 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <div style={{ userSelect: 'text', width: '100%' }}>
      <style>{`
        .lesson-prose {
          font-size: 15px;
          line-height: 1.85;
          color: var(--text-body);
        }
        .lesson-prose h1, .lesson-prose h2, .lesson-prose h3, .lesson-prose h4 {
          color: var(--text-heading);
          font-weight: 800;
          margin-top: 28px;
          margin-bottom: 14px;
        }
        .lesson-prose h1 { font-size: 1.8rem; border-bottom: 2px solid var(--border-default); padding-bottom: 8px; margin-top: 0; }
        .lesson-prose h2 { font-size: 1.45rem; border-bottom: 1px solid var(--border-default); padding-bottom: 6px; }
        .lesson-prose h3 { font-size: 1.2rem; }
        .lesson-prose p { margin-bottom: 16px; }
        .lesson-prose strong { color: var(--text-heading); font-weight: 700; }
        .lesson-prose ul, .lesson-prose ol { margin-bottom: 16px; padding-left: 24px; }
        
        /* Reset list item border/styles to prevent browser/extension layout leakage */
        .lesson-prose li {
          margin-bottom: 8px;
          border: none !important;
          border-bottom: none !important;
          text-decoration: none !important;
        }
        
        .lesson-prose blockquote {
          border-left: 4px solid var(--border-brand);
          padding: 10px 18px;
          margin: 18px 0;
          background: var(--bg-neutral-secondary);
          color: var(--text-body-subtle);
          font-style: italic;
          border-radius: 0 6px 6px 0;
          border-top: none !important;
          border-right: none !important;
          border-bottom: none !important;
        }
        
        .lesson-prose pre {
          background: #11111b; /* High-contrast terminal background */
          border: 1px solid #313244 !important;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 13px;
          color: #cdd6f4;
          line-height: 1.6;
          margin: 18px 0;
        }
        
        /* Reset inline code border inheritance inside code blocks */
        .lesson-prose pre code {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          color: inherit !important;
          font-size: inherit !important;
          border: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
          display: block; /* Ensures block-level container without line splits */
        }
        
        /* Clean style for inline code */
        .lesson-prose code {
          background: var(--bg-neutral-secondary);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--fg-brand);
          border: 1px solid var(--border-default) !important;
          box-shadow: none !important;
        }
        
        .lesson-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 14px;
        }
        .lesson-prose th, .lesson-prose td {
          border: 1px solid var(--border-default);
          padding: 10px 14px;
          text-align: left;
        }
        .lesson-prose th {
          background: var(--bg-neutral-secondary);
          font-weight: 700;
          color: var(--text-heading);
        }
      `}</style>

      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
        <Link href="/learning" style={{ color: 'var(--text-body-subtle)' }}>Lộ trình học</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <Link href={`/learning/${pathId}`} style={{ color: 'var(--text-body-subtle)' }}>{path.title}</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-heading)' }}>{lesson.title}</span>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
        
        {/* Left Side: Lesson content doc reader */}
        <div className="card" style={{ padding: '32px', minWidth: 0 }}>
          <div style={{ marginBottom: '24px' }}>
            <Link href={`/learning/${pathId}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--fg-brand)', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Quay lại Lộ trình học
            </Link>
          </div>

          {/* Rendered HTML */}
          <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          
          {/* Footer Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-default)', paddingTop: '24px', marginTop: '32px' }}>
            <div>
              {isAuthenticated && !lesson.completed ? (
                <button
                  className="btn btn-primary"
                  onClick={handleComplete}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle size={16} /> Hoàn thành bài học
                </button>
              ) : lesson.completed ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--fg-success)', fontSize: '14px', fontWeight: 600 }}>
                  ✓ Đã hoàn thành bài học này
                </span>
              ) : null}
            </div>

            {nextLesson && (
              <Link href={`/learning/${pathId}/lessons/${nextLesson.id}`} style={{ textDecoration: 'none' }}>
                <div className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Bài tiếp theo: {nextLesson.title} <ChevronRight size={14} />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar info & Practical actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
          
          {/* Practice Kiosk / Lab integration */}
          {lesson.vulnerabilityId && (
            <div className="card" style={{ border: '2px solid var(--border-brand)', background: 'var(--bg-brand-softer)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', color: 'var(--fg-brand)' }}>
                <PlayCircle size={18} /> Thực hành thực tế
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                Bài học này liên kết với bài thực hành về lỗ hổng <strong>{lesson.vulnerabilityName}</strong>. Hãy chạy máy ảo để áp dụng kiến thức vừa học!
              </p>
              <Link href={`/labs/${lesson.vulnerabilityId}`} style={{ textDecoration: 'none' }}>
                <div className="btn btn-primary" style={{ width: '100%', textAlign: 'center', background: 'var(--bg-brand)', border: 'none', color: '#fff' }}>
                  Chạy bài Lab thực hành
                </div>
              </Link>
            </div>
          )}

          {/* Table of contents of the Learning Path */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <BookOpen size={16} style={{ color: 'var(--fg-brand)' }} /> Lộ trình học tập
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {allLessons.map((l, index) => {
                const isCurrent = l.id === lessonId;
                return (
                  <Link key={l.id} href={`/learning/${pathId}/lessons/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: isCurrent ? 'var(--bg-brand-softer)' : 'transparent',
                      border: isCurrent ? '1px solid rgba(56,189,248,0.2)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: l.completed ? 'rgba(0, 122, 85, 0.1)' : 'var(--bg-neutral-tertiary)',
                        border: `1.5px solid ${l.completed ? 'var(--border-success)' : 'var(--border-default-medium)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: l.completed ? 'var(--fg-success-strong)' : 'var(--text-body-subtle)',
                        flexShrink: 0
                      }}>
                        {l.completed ? '✓' : index + 1}
                      </div>
                      
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isCurrent ? 600 : 500,
                        color: isCurrent ? 'var(--fg-brand)' : 'var(--text-body)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: l.completed ? 'line-through' : 'none',
                        opacity: l.completed && !isCurrent ? 0.75 : 1
                      }}>
                        {l.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
