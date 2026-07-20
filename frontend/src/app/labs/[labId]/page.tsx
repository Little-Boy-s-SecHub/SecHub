'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Link as LinkIcon, 
  Clock, 
  Trophy, 
  MonitorPlay, 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  Square, 
  AlertCircle, 
  Target, 
  BookOpen,
  RotateCw
} from 'lucide-react';
import { api, Lab, LabAttempt, parseBackendDate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { localizeLabTitle, localizeLabDescription } from '@/utils/localize';

export default function LabDetailPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = use(params);
  const { isAuthenticated } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  const [lab, setLab] = useState<Lab | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<LabAttempt | null>(null);
  const [labStatus, setLabStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle');
  const [, setFlagValue] = useState('');
  const [, setRevealedHints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const labNotFound = apiError?.includes('Không tìm thấy Lab') || apiError?.includes('not found') || apiError?.includes('404');

  useEffect(() => {
    async function loadLabData() {
      try {
        const labRes = await api.labs.getById(labId);
        if (labRes.success) {
          setLab(labRes.data);
        } else {
          setApiError(labRes.message || (language === 'vi' ? 'Không thể lấy thông tin lab.' : 'Failed to retrieve lab details.'));
        }

        if (isAuthenticated) {
          const attemptsRes = await api.labs.getLabAttempts(labId);
          if (attemptsRes.success && attemptsRes.data) {
            const running = attemptsRes.data.find(a => {
              if (a.status !== 'RUNNING' && a.status !== 'STARTED') return false;
              if (a.expiresAt && parseBackendDate(a.expiresAt) < new Date()) return false;
              return true;
            });
            const completed = attemptsRes.data.find(a => a.status === 'COMPLETED');
            
            if (running) {
              setCurrentAttempt(running);
              setLabStatus('running');
              setRevealedHints(running.hintsUsed);
            } else if (completed) {
              setLabStatus('completed');
            }
          }
        }
      } catch (e: unknown) {
        setApiError(e instanceof Error ? e.message : (language === 'vi' ? 'Lỗi khi tải dữ liệu lab.' : 'Error loading lab data.'));
      } finally {
        setLoading(false);
      }
    }

    loadLabData();
  }, [labId, isAuthenticated, language]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>{t('common.loading')}</div>;
  }

  if (apiError || !lab) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <AlertCircle size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>{labNotFound ? (language === 'vi' ? 'Bài lab không còn tồn tại' : 'Lab Challenge Not Found') : t('common.error')}</h3>
        <p style={{ margin: 'var(--space-1) auto', maxWidth: '520px' }}>
          {labNotFound
            ? (language === 'vi' ? 'Lab AI này có thể đã được xoá. Phiên và container liên quan cũng đã được dọn dẹp nên liên kết cũ không thể mở lại.' : 'This AI lab may have been deleted. Related sessions and containers were cleaned up so the old link cannot be reopened.')
            : apiError || (language === 'vi' ? 'Không tìm thấy bài lab yêu cầu.' : 'The requested lab challenge was not found.')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          <Link href="/labs" className="btn btn-primary">{language === 'vi' ? 'Chọn bài lab khác' : 'Choose another lab'}</Link>
          <Link href="/learning" className="btn btn-secondary">{t('lesson.backToSyllabus')}</Link>
        </div>
      </div>
    );
  }

  // Parse hints from JSON
  if (lab.hintsJson) {
    try {
      JSON.parse(lab.hintsJson);
    } catch (e) {
      console.error('Failed to parse hints json', e);
    }
  }

  const diffClass = lab.difficulty === 'BEGINNER' ? 'badge-easy' : 
                    lab.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                    'badge-hard';
  
  const difficultyLabel = lab.difficulty === 'BEGINNER' ? t('common.beginner') :
                          lab.difficulty === 'INTERMEDIATE' ? t('common.intermediate') : t('common.advanced');

  const handleStartLab = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLabStatus('starting');
    try {
      const res = await api.labs.startLab(labId);
      if (res.success && res.data) {
        // Add a small delay for terminal experience
        setTimeout(() => {
          setCurrentAttempt(res.data);
          setLabStatus('running');
          setRevealedHints(res.data.hintsUsed);
        }, 1500);
      } else {
        setLabStatus('idle');
        alert(res.message || (language === 'vi' ? 'Không thể khởi động lab.' : 'Could not start lab.'));
      }
    } catch (e: unknown) {
      setLabStatus('idle');
      alert(e instanceof Error ? e.message : (language === 'vi' ? 'Lỗi khởi động lab.' : 'Error starting lab.'));
    }
  };

  const handleStopLab = async () => {
    if (!currentAttempt) return;
    try {
      await api.labs.stopLab(currentAttempt.id);
      setLabStatus('idle');
      setCurrentAttempt(null);
      setRevealedHints(0);
      setFlagValue('');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : (language === 'vi' ? 'Không thể dừng lab.' : 'Could not stop lab.'));
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/labs">{language === 'vi' ? 'Phòng Lab' : 'Labs'}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{localizeLabTitle(lab.title, language)}</span>
      </div>

      <div className="lab-detail-layout">
        {/* Main content */}
        <div>
          {/* Lab header */}
          <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className={`badge ${diffClass}`}>{difficultyLabel}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-body-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <LinkIcon size={13} /> {lab.vulnerabilityName}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-body-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> ~{lab.estimatedMinutes} {t('common.minutes')}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-body-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Trophy size={13} /> {t('labs.pointsAward', { points: lab.points })}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
              {localizeLabTitle(lab.title, language)}
            </h1>
            <p style={{ color: 'var(--text-body)', lineHeight: 1.7 }}>{localizeLabDescription(lab.description, lab.title, language)}</p>
          </div>

          {/* Lab Environment */}
          <div className="animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MonitorPlay size={20} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Môi trường Lab' : 'Lab Environment'}
            </h2>

            {labStatus === 'idle' && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                  <FlaskConical size={48} style={{ color: 'var(--text-body-subtle)' }} />
                </div>
                <h3 style={{ marginBottom: 'var(--space-1)' }}>{language === 'vi' ? 'Sẵn sàng bắt đầu' : 'Ready to Start'}</h3>
                <p style={{ color: 'var(--text-body-subtle)', margin: '0 auto var(--space-3)', maxWidth: '400px' }}>
                  {!isAuthenticated 
                    ? (language === 'vi' ? 'Bạn cần đăng nhập để khởi chạy container Docker chứa ứng dụng web có lỗ hổng.' : 'You need to log in to launch the Docker container containing the vulnerable web application.')
                    : (language === 'vi' ? 'Click nút bên dưới để khởi tạo Docker container chứa ứng dụng web có lỗ hổng.' : 'Click the button below to initialize the Docker container containing the vulnerable web application.')
                  }
                </p>
                <button className="btn btn-primary btn-lg" onClick={handleStartLab} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                  <Play size={16} /> {!isAuthenticated ? (language === 'vi' ? 'Đăng nhập để khởi động' : 'Login to Start') : t('labs.startLabButton')}
                </button>
              </div>
            )}

            {labStatus === 'starting' && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div className="terminal" style={{ maxWidth: '500px', margin: '0 auto', marginBottom: 'var(--space-3)' }}>
                  <div className="terminal-header">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="terminal-dot red"></span>
                      <span className="terminal-dot yellow"></span>
                      <span className="terminal-dot green"></span>
                    </div>
                    <span className="terminal-title">Docker</span>
                    <div></div>
                  </div>
                  <div className="terminal-body">
                    <div><span className="terminal-output">Checking docker availability...</span></div>
                    <div><span className="terminal-output">Pulling vulnerable image: {lab.dockerImage}...</span></div>
                    <div><span className="terminal-output">Spawning container: sechub-attempt-...</span></div>
                    <div><span className="terminal-success">Starting internal web server on port {lab.dockerPort}...</span></div>
                    <div>
                      <span className="terminal-success" style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-body-subtle)', fontSize: '14px' }}>
                  {t('labDetail.startingSandbox')}
                </p>
              </div>
            )}

            {labStatus === 'running' && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ position: 'relative', display: 'flex', height: '48px', width: '48px' }}>
                    <span style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: 'var(--bg-brand)', opacity: 0.75 }}></span>
                    <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '48px', width: '48px', background: 'var(--bg-brand)', alignItems: 'center', justifyContent: 'center' }}>
                      <MonitorPlay size={24} style={{ color: '#fff' }} />
                    </span>
                  </span>
                </div>
                <h3 style={{ marginBottom: '8px' }}>{language === 'vi' ? 'Môi trường đang hoạt động' : 'Environment Active'}</h3>
                <p style={{ color: 'var(--text-body-subtle)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  {language === 'vi' 
                    ? 'Môi trường phòng Lab đã sẵn sàng qua đường dẫn phiên được SecHub bảo vệ. Nhấn vào nút bên dưới để mở giao diện làm bài thực hành (chứa Website lỗi và Game 2D chỉ dẫn).'
                    : 'The lab environment is ready via the SecHub protected session link. Click the button below to open the practice workspace (containing the vulnerable site and 2D Game guide).'
                  }
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link 
                    href={`/labs/${labId}/play`} 
                    target="_blank" 
                    className="btn btn-primary btn-lg" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={16} /> {language === 'vi' ? 'Mở phòng thực hành (Mở Tab mới)' : 'Open Lab Workspace (New Tab)'}
                  </Link>
                  <button 
                    className="btn btn-danger btn-lg" 
                    onClick={handleStopLab} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Square size={16} /> {t('labDetail.stopSandbox')}
                  </button>
                </div>
              </div>
            )}

            {labStatus === 'completed' && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', border: '1px solid var(--border-success)', background: 'rgba(0,122,85,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                  <CheckCircle2 size={56} style={{ color: 'var(--fg-success-strong)' }} />
                </div>
                <h2 style={{ color: 'var(--fg-success-strong)', marginBottom: '8px' }}>{t('labDetail.labCompletedCongrats')}</h2>
                <p style={{ color: 'var(--text-body-subtle)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  {language === 'vi'
                    ? `Bạn đã vượt qua thử thách này và ghi nhận +${lab.points} điểm. Bạn có thể mở lại phòng thực hành để nghiên cứu tiếp hoặc làm lại từ đầu.`
                    : `You solved this challenge and earned +${lab.points} XP. You can reopen the practice workspace to study further or restart.`
                  }
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link 
                    href={`/labs/${labId}/play`} 
                    target="_blank" 
                    className="btn btn-secondary btn-lg" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={16} /> {language === 'vi' ? 'Xem lại phòng thực hành' : 'Re-open Lab Workspace'}
                  </Link>
                  <button 
                    className="btn btn-primary btn-lg" 
                    onClick={handleStartLab} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RotateCw size={16} /> {language === 'vi' ? 'Tạo lại & Làm lại bài Lab' : 'Restart Lab Challenge'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Objectives */}
          <div className="card animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: 'var(--fg-brand)' }} /> {t('labDetail.learningObjectives')}
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                {language === 'vi' ? 'Tìm endpoint có lỗ hổng bảo mật' : 'Find the vulnerable web endpoint'}
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                {language === 'vi' ? `Khai thác thành công lỗ hổng ${lab.vulnerabilityName}` : `Successfully exploit the ${lab.vulnerabilityName} vulnerability`}
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                {language === 'vi' ? 'Lấy chuỗi FLAG ẩn trên hệ thống và gửi xác nhận' : 'Find the hidden FLAG value on the target and submit it'}
              </li>
            </ul>
          </div>

          {/* Related vulnerability */}
          <div className="card animate-fade-in-up animate-delay-2">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Tài liệu liên quan' : 'Related Documents'}
            </h3>
            <Link
              href={`/vulnerabilities/${lab.vulnerabilitySlug}`}
              className="related-link-card"
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)', marginBottom: '4px' }}>
                {lab.vulnerabilityName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>
                {language === 'vi' ? 'Xem chi tiết lỗ hổng, cách khai thác và phòng chống →' : 'View vulnerability details, exploitation and remediation →'}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
