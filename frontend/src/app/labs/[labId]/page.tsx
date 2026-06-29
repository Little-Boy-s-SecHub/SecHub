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
  Globe, 
  Flag, 
  AlertCircle, 
  Target, 
  Lightbulb, 
  Lock, 
  BookOpen,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Gamepad2,
  LayoutGrid
} from 'lucide-react';
import { api, Lab, LabAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LabSimulator from '@/components/LabSimulator';
import LabGameView from '@/components/LabGameView';

// Fallback hints
const defaultHints = [
  'Gợi ý 1: Quan sát kỹ các input fields và URL parameters.',
  'Gợi ý 2: Sử dụng Burp Suite để intercept và modify requests.',
  'Gợi ý 3: Kiểm tra source code HTML để tìm thông tin ẩn.',
];

export default function LabDetailPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [lab, setLab] = useState<Lab | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<LabAttempt | null>(null);
  const [labStatus, setLabStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle');
  const [flagValue, setFlagValue] = useState('');
  const [flagResult, setFlagResult] = useState<'correct' | 'wrong' | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'game'>('standard');

  useEffect(() => {
    async function loadLabData() {
      try {
        const labRes = await api.labs.getById(labId);
        if (labRes.success) {
          setLab(labRes.data);
        } else {
          setApiError(labRes.message || 'Không thể lấy thông tin lab.');
        }

        if (isAuthenticated) {
          const attemptsRes = await api.labs.getLabAttempts(labId);
          if (attemptsRes.success && attemptsRes.data) {
            const running = attemptsRes.data.find(a => a.status === 'RUNNING');
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
      } catch (e: any) {
        setApiError(e.message || 'Lỗi khi tải dữ liệu lab.');
      } finally {
        setLoading(false);
      }
    }

    loadLabData();
  }, [labId, isAuthenticated]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Đang tải thông tin Lab...</div>;
  }

  if (apiError || !lab) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <AlertCircle size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>Lỗi tải dữ liệu</h3>
        <p style={{ margin: 'var(--space-1) auto' }}>{apiError || 'Không tìm thấy bài lab yêu cầu.'}</p>
        <Link href="/labs" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 'var(--space-2)' }}>
          Quay lại phòng Lab
        </Link>
      </div>
    );
  }

  // Parse hints from JSON
  let hints = defaultHints;
  if (lab.hintsJson) {
    try {
      hints = JSON.parse(lab.hintsJson);
    } catch (e) {
      console.error('Failed to parse hints json', e);
    }
  }

  const diffClass = lab.difficulty === 'BEGINNER' ? 'badge-easy' : 
                    lab.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                    'badge-hard';
  
  const difficultyLabel = lab.difficulty === 'BEGINNER' ? 'Dễ' :
                          lab.difficulty === 'INTERMEDIATE' ? 'Trung bình' : 'Khó';

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
        alert(res.message || 'Không thể khởi động lab.');
      }
    } catch (e: any) {
      setLabStatus('idle');
      alert(e.message || 'Lỗi khởi động lab.');
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
      setFlagResult(null);
    } catch (e: any) {
      alert(e.message || 'Không thể dừng lab.');
    }
  };

  const handleSubmitFlag = async () => {
    if (!currentAttempt || !flagValue.trim()) return;
    try {
      const res = await api.labs.submitFlag(currentAttempt.id, flagValue.trim());
      if (res.success && res.data) {
        setFlagResult('correct');
        setLabStatus('completed');
      } else {
        setFlagResult('wrong');
      }
    } catch (e: any) {
      setFlagResult('wrong');
    }
  };

  const handleRevealHint = async () => {
    if (!currentAttempt || revealedHints >= hints.length) return;
    try {
      const res = await api.labs.useHint(currentAttempt.id);
      if (res.success && res.data) {
        setRevealedHints(res.data.hintsUsed);
        setCurrentAttempt(res.data);
      }
    } catch (e: any) {
      alert(e.message || 'Không thể tải gợi ý.');
    }
  };

  const handleSimulatedSuccess = (foundFlag: string) => {
    setFlagValue(foundFlag);
    setFlagResult(null); // Reset alert, let user click submit to verify
  };

  const isSimulated = currentAttempt?.containerId?.startsWith('sim-');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/labs">Phòng Lab</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{lab.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-4)' }}>
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
                <Clock size={13} /> ~{lab.estimatedMinutes} phút
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-body-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Trophy size={13} /> {lab.points} điểm
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
              {lab.title}
            </h1>
            <p style={{ color: 'var(--text-body)', lineHeight: 1.7 }}>{lab.description}</p>
          </div>

          {/* Lab Environment */}
          <div className="animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MonitorPlay size={20} style={{ color: 'var(--fg-brand)' }} /> Môi trường Lab
            </h2>

            {labStatus === 'idle' && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                  <FlaskConical size={48} style={{ color: 'var(--text-body-subtle)' }} />
                </div>
                <h3 style={{ marginBottom: 'var(--space-1)' }}>Sẵn sàng bắt đầu</h3>
                <p style={{ color: 'var(--text-body-subtle)', margin: '0 auto var(--space-3)', maxWidth: '400px' }}>
                  {!isAuthenticated 
                    ? 'Bạn cần đăng nhập để khởi chạy container Docker chứa ứng dụng web có lỗ hổng.'
                    : 'Click nút bên dưới để khởi tạo Docker container chứa ứng dụng web có lỗ hổng.'
                  }
                </p>
                <button className="btn btn-primary btn-lg" onClick={handleStartLab} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                  <Play size={16} /> {!isAuthenticated ? 'Đăng nhập để khởi động' : 'Khởi động Lab'}
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
                  Đang khởi tạo môi trường lab thực tế...
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
                <h3 style={{ marginBottom: '8px' }}>Môi trường đang hoạt động</h3>
                <p style={{ color: 'var(--text-body-subtle)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Môi trường phòng Lab đã sẵn sàng. Cổng kết nối dịch vụ ảo: <code style={{ color: 'var(--fg-brand)', background: 'var(--bg-neutral-secondary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>http://localhost:{currentAttempt?.containerPort}</code>. 
                  Nhấn vào nút bên dưới để mở giao diện làm bài thực hành (chứa Website lỗi và Game 2D chỉ dẫn).
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link 
                    href={`/labs/${labId}/play`} 
                    target="_blank" 
                    className="btn btn-primary btn-lg" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={16} /> Mở phòng thực hành (Mở Tab mới)
                  </Link>
                  <button 
                    className="btn btn-danger btn-lg" 
                    onClick={handleStopLab} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Square size={16} /> Dừng Lab
                  </button>
                </div>
              </div>
            )}

            {labStatus === 'completed' && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', border: '1px solid var(--border-success)', background: 'rgba(0,122,85,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                  <CheckCircle2 size={56} style={{ color: 'var(--fg-success-strong)' }} />
                </div>
                <h2 style={{ color: 'var(--fg-success-strong)', marginBottom: '8px' }}>Tuyệt vời! Bạn đã hoàn thành!</h2>
                <p style={{ color: 'var(--text-body-subtle)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Bạn đã vượt qua thử thách này và ghi nhận +{lab.points} điểm. Bạn có thể mở lại phòng thực hành để nghiên cứu tiếp hoặc làm lại từ đầu.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link 
                    href={`/labs/${labId}/play`} 
                    target="_blank" 
                    className="btn btn-secondary btn-lg" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={16} /> Xem lại phòng thực hành
                  </Link>
                  <button 
                    className="btn btn-primary btn-lg" 
                    onClick={handleStartLab} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RotateCw size={16} /> Tạo lại & Làm lại bài Lab
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
              <Target size={18} style={{ color: 'var(--fg-brand)' }} /> Mục tiêu thực hành
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                Tìm endpoint có lỗ hổng bảo mật
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                Khai thác thành công lỗ hổng {lab.vulnerabilityName}
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                Lấy chuỗi FLAG ẩn trên hệ thống và gửi xác nhận
              </li>
            </ul>
          </div>

          {/* Related vulnerability */}
          <div className="card animate-fade-in-up animate-delay-2">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--fg-brand)' }} /> Tài liệu liên quan
            </h3>
            <Link
              href={`/vulnerabilities/${lab.vulnerabilitySlug}`}
              className="related-link-card"
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)', marginBottom: '4px' }}>
                {lab.vulnerabilityName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>
                Xem chi tiết lỗ hổng, cách khai thác và phòng chống →
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
