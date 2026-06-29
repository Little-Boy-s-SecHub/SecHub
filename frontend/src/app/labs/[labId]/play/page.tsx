'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  MonitorPlay, 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  Flag, 
  AlertCircle, 
  Target, 
  Lightbulb, 
  Lock, 
  ChevronDown,
  ChevronRight,
  Gamepad2,
  LayoutGrid,
  ArrowLeft
} from 'lucide-react';
import { api, Lab, LabAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LabSimulator from '@/components/LabSimulator';
import LabGameView from '@/components/LabGameView';

export default function LabPlayPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = use(params);
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  const defaultHints = [
    'Gợi ý 1: Quan sát kỹ các input fields và URL parameters.',
    'Gợi ý 2: Sử dụng Burp Suite để intercept và modify requests.',
    'Gợi ý 3: Kiểm tra source code HTML để tìm thông tin ẩn.',
  ];

  let hints: string[] = defaultHints;
  if (lab?.hintsJson) {
    try {
      hints = JSON.parse(lab.hintsJson);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

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
              setCurrentAttempt(completed);
              setRevealedHints(completed.hintsUsed);
            } else {
              setLabStatus('idle');
            }
          }
        }
      } catch (e: any) {
        setApiError(e.message || 'Đã xảy ra lỗi khi kết nối máy chủ.');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadLabData();
    }
  }, [labId, isAuthenticated, authLoading, router]);

  const handleRevealHint = async () => {
    if (!currentAttempt) return;
    try {
      const res = await api.labs.useHint(currentAttempt.id);
      if (res.success) {
        setRevealedHints(res.data.hintsUsed);
        setCurrentAttempt(res.data);
      }
    } catch (e: any) {
      alert(e.message || 'Không thể tải gợi ý.');
    }
  };

  const handleSimulatedSuccess = (foundFlag: string) => {
    setFlagValue(foundFlag);
    setFlagResult(null);
  };

  const handleSubmitFlag = async (customFlag?: string) => {
    const valueToSubmit = typeof customFlag === 'string' ? customFlag : flagValue;
    if (!currentAttempt || !valueToSubmit.trim()) return;
    try {
      const res = await api.labs.submitFlag(currentAttempt.id, valueToSubmit);
      if (res.success && res.data.status === 'COMPLETED') {
        setFlagResult('correct');
        setLabStatus('completed');
        if (typeof customFlag === 'string') {
          setFlagValue(customFlag);
        }
      } else {
        setFlagResult('wrong');
      }
    } catch (e: any) {
      setFlagResult('wrong');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px', minHeight: '100vh', background: 'var(--bg-neutral-primary)' }}>
        <div style={{ height: '40px', background: 'var(--bg-neutral-secondary)', borderRadius: '8px', width: '30%' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ height: '500px', background: 'var(--bg-neutral-secondary)', borderRadius: '12px' }}></div>
          <div style={{ height: '500px', background: 'var(--bg-neutral-secondary)', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  if (apiError || !lab) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-neutral-primary)', padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <AlertCircle size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Lỗi tải trang</h3>
          <p style={{ color: 'var(--text-body-subtle)', marginBottom: '24px' }}>{apiError || 'Không tìm thấy thông tin phòng Lab.'}</p>
          <Link href="/labs" className="btn btn-secondary">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  if (labStatus === 'idle') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-neutral-primary)', padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <FlaskConical size={56} style={{ color: 'var(--fg-brand)', margin: '0 auto 20px' }} />
          <h2 style={{ marginBottom: '12px' }}>Môi trường Lab chưa được khởi chạy</h2>
          <p style={{ color: 'var(--text-body-subtle)', marginBottom: '30px', lineHeight: 1.6 }}>
            Phòng thực hành ảo chứa ứng dụng lỗi chưa được dựng lên cho bạn. Vui lòng quay lại trang thông tin chi tiết và nhấn nút "Khởi động Lab".
          </p>
          <Link href={`/labs/${labId}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Quay lại trang chi tiết Lab
          </Link>
        </div>
      </div>
    );
  }

  const isSimulated = currentAttempt?.containerId?.startsWith('sim-');

  if (viewMode === 'game') {
    return (
      <div style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh', 
        background: '#090d16', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '24px'
      }}>
        {/* Floating Exit Button */}
        <button
          onClick={() => setViewMode('standard')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ff2d55',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255,45,85,0.4)',
            zIndex: 9999,
          }}
        >
          <ArrowLeft size={14} /> Quay lại thực hành (Thoát Game)
        </button>

        {/* Full-screen arcade game cabinet */}
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '16px', fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.5px' }}>
          CHẾ ĐỘ GAME 2D - ĐIỀU TRA GỢI Ý VÀ NỘP FLAG
          </h2>
          <LabGameView 
            hints={hints} 
            revealedHints={revealedHints} 
            onRevealHint={handleRevealHint} 
            points={lab.points} 
            labStatus={labStatus}
            onSubmitFlag={handleSubmitFlag}
            flagResult={flagResult}
            vulnerabilityName={lab.vulnerabilityName}
            isSimulated={isSimulated}
            dockerPort={lab.dockerPort}
            containerPort={currentAttempt?.containerPort}
            apiError={apiError}
            onSimulatedSuccess={handleSimulatedSuccess}
          />
        </div>
      </div>
    );
  }

  // Unified Standard Light Styles
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff',
    borderBottom: '1px solid var(--border-default)',
    padding: '12px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 999,
  };

  const activeDotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--fg-success-strong)',
    boxShadow: '0 0 8px var(--fg-success-strong)',
    display: 'inline-block',
    animation: 'pulse-glow 2s ease-in-out infinite'
  };

  return (
    <div style={{ color: 'var(--text-body)', minHeight: '100vh', background: 'var(--bg-neutral-primary)', fontFamily: 'var(--font-sans), sans-serif' }}>
      
      {/* Workspace Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link 
            href={`/labs/${labId}`} 
            style={{ 
              color: 'var(--text-body)', 
              fontSize: '13px', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              textDecoration: 'none',
              background: 'var(--bg-neutral-secondary)',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={14} /> Quay lại
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lab.title}
            </h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,122,85,0.08)', border: '1px solid rgba(0,122,85,0.15)', color: 'var(--fg-success-strong)', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
              <span style={activeDotStyle}></span> Đang mở
            </span>
          </div>
        </div>

        {/* Right Info & Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg-brand)', fontSize: '13px', fontWeight: 600 }}>
            <Trophy size={14} /> {lab.points} điểm
          </div>

          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-neutral-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            padding: '2px',
          }}>
            <button
              onClick={() => setViewMode('standard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: '#ffffff',
                color: 'var(--text-heading)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
              }}
            >
              <LayoutGrid size={13} /> Giao diện Chuẩn
            </button>
            <button
              onClick={() => setViewMode('game')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-body-subtle)',
                boxShadow: 'none',
                transition: 'all 0.2s',
              }}
            >
              <Gamepad2 size={13} /> Chế độ Game 2D
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ padding: '0 24px 24px 24px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 380px', 
          gap: '20px',
        }}>
          
          {/* Left Side: Vulnerable Application (Playground) - Hero component */}
          <div>
            {isSimulated ? (
              <LabSimulator 
                dockerPort={lab.dockerPort} 
                flag={apiError || 'FLAG{sechub_simulated_success}'}
                onSuccess={handleSimulatedSuccess}
              />
            ) : (
              <div style={{
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {/* Simulated browser window bar for real docker app */}
                <div style={{ background: 'var(--bg-neutral-tertiary)', borderBottom: '1px solid var(--border-default)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
                  </div>
                  <div style={{ background: 'var(--bg-neutral-secondary-medium)', border: '1px solid var(--border-default-medium)', borderRadius: '4px', padding: '2px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-body-subtle)', flex: 1, textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                    http://localhost:{currentAttempt?.containerPort}
                  </div>
                </div>
                <iframe 
                  src={`http://localhost:${currentAttempt?.containerPort}`} 
                  style={{ width: '100%', height: '560px', border: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Right Side: Hints/Game & Flag Submission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Sidebar main view */}
            {/* Objectives */}
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} style={{ color: 'var(--fg-brand)' }} /> Nhiệm vụ bài thực hành
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--fg-brand)', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                  Phân tích giao diện web bên trái để tìm kiếm lỗ hổng.
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--fg-brand)', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                  Khai thác lỗ hổng {lab.vulnerabilityName} bằng payload tương ứng.
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--fg-brand)', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                  Tìm chuỗi cờ bí mật (FLAG) nộp ở khung phía dưới.
                </li>
              </ul>
            </div>

            {/* Hints List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Lightbulb size={16} style={{ color: 'var(--fg-brand)' }} /> Danh sách Gợi ý
                </h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-neutral-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-body-subtle)' }}>
                  {revealedHints}/{hints.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {hints.map((hint, i) => (
                  <div key={i} className={`hint-item ${i < revealedHints ? 'open' : ''}`}>
                    <button
                      className="hint-trigger"
                      onClick={() => {
                        if (i < revealedHints) return;
                        if (i === revealedHints) handleRevealHint();
                      }}
                      style={{
                        opacity: i <= revealedHints ? 1 : 0.4,
                        pointerEvents: (i === revealedHints && labStatus === 'running') ? 'auto' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        background: 'var(--bg-neutral-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        color: i <= revealedHints ? 'var(--text-heading)' : 'var(--text-body-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                        {i < revealedHints ? (
                          <Lightbulb size={13} style={{ color: 'var(--fg-brand)' }} />
                        ) : (
                          <Lock size={13} />
                        )}
                        Gợi ý {i + 1}
                      </span>
                      <span>
                        {i < revealedHints ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </span>
                    </button>
                    {i < revealedHints && (
                      <div style={{ background: 'var(--bg-neutral-secondary-light)', border: '1px solid var(--border-default)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '12px 14px' }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>{hint}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {revealedHints < hints.length && labStatus === 'running' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRevealHint}
                  style={{ marginTop: '10px', width: '100%', padding: '8px' }}
                >
                  Mở gợi ý tiếp theo (-{lab.points / 10} điểm)
                </button>
              )}
            </div>

            {/* Flag Submission */}
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flag size={16} style={{ color: 'var(--fg-brand)' }} /> Nộp kết quả (FLAG)
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={flagValue}
                  onChange={(e) => {
                    setFlagValue(e.target.value);
                    setFlagResult(null);
                  }}
                  placeholder="FLAG{chuoi_cờ_bí_mật}"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitFlag()}
                  disabled={labStatus === 'completed'}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text-heading)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmitFlag()}
                  disabled={labStatus === 'completed' || !flagValue.trim()}
                  style={{ fontWeight: 600, padding: '0 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Gửi Flag
                </button>
              </div>
              {flagResult === 'correct' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-success-strong)', fontSize: '13px', marginTop: '12px' }}>
                  <CheckCircle2 size={14} /> Chúc mừng! Bạn đã hoàn thành xuất sắc bài lab này! +{lab.points} điểm.
                </div>
              )}
              {flagResult === 'wrong' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-danger)', fontSize: '13px', marginTop: '12px' }}>
                  <AlertCircle size={14} /> Flag không chính xác. Hãy tiếp tục thử sức nhé!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
