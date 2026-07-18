'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { api, LearningPath } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageBackLink from '@/components/PageBackLink';

export default function LearningPage() {
  const { isAuthenticated } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedTrack, setRecommendedTrack] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaths() {
      try {
        const res = await api.learningPaths.getAll();
        if (res.success) {
          setPaths(res.data);
        }
        if (isAuthenticated) {
          const overviewRes = await api.growth.getOverview();
          if (overviewRes.success && overviewRes.data) {
            setRecommendedTrack(overviewRes.data.recommendedTrack);
          }
        }
      } catch (e) {
        console.error('Failed to load learning paths:', e);
      } finally {
        setLoading(false);
      }
    }

    loadPaths();
  }, [isAuthenticated]);

  return (
    <div>
      <PageBackLink href="/" label="Quay lại Dashboard" />
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={28} style={{ color: 'var(--fg-brand)' }} /> Lộ trình học
        </h1>
        <p className="section-subtitle">
          Các khóa học được thiết kế theo lộ trình từ người mới bắt đầu đến chuyên gia pentest.
          Mỗi lộ trình bao gồm bài giảng lý thuyết và bài lab thực hành.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ height: '140px', background: 'var(--bg-neutral-secondary-medium)', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {paths.map((path, index) => {
            const lessonCount = path.lessonCount || 8; // Default fallback if not populated
            const completedLessons = path.completedLessons || 0;
            const progress = lessonCount > 0 ? (completedLessons / lessonCount) * 100 : 0;
            
            const diffClass = path.difficulty === 'BEGINNER' ? 'badge-easy' : 
                              path.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                              'badge-hard';
            
            const diffLabel = path.difficulty === 'BEGINNER' ? 'Cơ bản' : 
                             path.difficulty === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao';

            const isRecommended = (recommendedTrack === 'BEGINNER' && path.difficulty === 'BEGINNER') ||
                                  (recommendedTrack === 'WEB_DEVELOPER' && path.difficulty === 'INTERMEDIATE') ||
                                  (recommendedTrack === 'PENTESTER' && path.difficulty === 'ADVANCED');

            return (
              <Link key={path.id} href={`/learning/${path.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="card animate-fade-in-up"
                  style={{ 
                    animationDelay: `${index * 0.08}s`, 
                    cursor: 'pointer',
                    border: isRecommended ? '1px solid var(--border-brand)' : '1px solid var(--border-default)',
                    boxShadow: isRecommended ? '0 4px 20px rgba(56, 189, 248, 0.08)' : 'var(--shadow-sm)',
                    background: isRecommended ? 'rgba(56, 189, 248, 0.02)' : 'var(--bg-neutral-primary)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-4)', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <span className="path-card-number">Lộ trình {index + 1}</span>
                        <span className={`badge ${diffClass}`}>{diffLabel}</span>
                        {isRecommended && (
                          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, background: 'var(--bg-brand-softer)', color: 'var(--fg-brand-strong)', border: '1px solid var(--border-brand-subtle)' }}>
                            <Sparkles size={11} /> Khuyên dùng cho bạn
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                        {path.title}
                      </h2>
                      <p style={{ color: 'var(--text-body-subtle)', marginBottom: 'var(--space-3)' }}>
                        {path.description}
                      </p>

                      <div className="path-card-stats" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span className="path-card-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <BookOpen size={14} /> {lessonCount} bài học
                        </span>
                        <span className="path-card-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> ~{path.estimatedHours} giờ
                        </span>
                        {isAuthenticated && (
                          <span className="path-card-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> {completedLessons}/{lessonCount} hoàn thành
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress circle */}
                    {isAuthenticated && (
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
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
