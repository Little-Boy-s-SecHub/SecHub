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
  ,Clock3
  ,TimerReset
  ,RotateCcw
  ,Sparkles
} from 'lucide-react';
import { api, Lab, LabAttempt, LabFeedback, MentorGuidance, resolveApiUrl, parseBackendDate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import LabSimulator from '@/components/LabSimulator';
import LabGameView from '@/components/LabGameView';
import LabCompletionFeedback from '@/components/LabCompletionFeedback';

export default function LabPlayPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = use(params);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  const [lab, setLab] = useState<Lab | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<LabAttempt | null>(null);
  const [labStatus, setLabStatus] = useState<'idle' | 'starting' | 'running' | 'completed' | 'expired'>('idle');
  const [flagValue, setFlagValue] = useState('');
  const [flagResult, setFlagResult] = useState<'correct' | 'wrong' | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'game'>('standard');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [extending, setExtending] = useState(false);
  const [creatingSimilar, setCreatingSimilar] = useState(false);
  const [openHintIndexes, setOpenHintIndexes] = useState<Set<number>>(new Set());
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [runtimeCheck, setRuntimeCheck] = useState(0);
  const [completionFeedback, setCompletionFeedback] = useState<LabFeedback | null>(null);
  const [mentor, setMentor] = useState<MentorGuidance | null>(null);
  const [askingMentor, setAskingMentor] = useState(false);
  const [creatingHarder, setCreatingHarder] = useState(false);
  const [pathId, setPathId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const labNotFound = apiError?.includes('Không tìm thấy Lab') || apiError?.includes('404');

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
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setPathId(searchParams.get('pathId'));
      setLessonId(searchParams.get('lessonId'));
    }
  }, []);

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
              const indexes = new Set<number>();
              for (let i = 0; i < running.hintsUsed; i++) indexes.add(i);
              setOpenHintIndexes(indexes);
            } else if (completed) {
              setLabStatus('completed');
              setCurrentAttempt(completed);
              setRevealedHints(completed.hintsUsed);
              const indexes = new Set<number>();
              for (let i = 0; i < completed.hintsUsed; i++) indexes.add(i);
              setOpenHintIndexes(indexes);
              api.labs.getFeedback(completed.id).then(result => setCompletionFeedback(result.data)).catch(() => undefined);
            } else if (attemptsRes.data.some(a => a.status === 'EXPIRED')) {
              setCurrentAttempt(attemptsRes.data.find(a => a.status === 'EXPIRED') || null);
              setLabStatus('expired');
            } else {
              setLabStatus('starting');
              const res = await api.labs.startLab(labId);
              if (res.success && res.data) {
                setTimeout(() => {
                  setCurrentAttempt(res.data);
                  setLabStatus('running');
                  setRevealedHints(res.data.hintsUsed);
                }, 1500);
              } else {
                setLabStatus('idle');
                setApiError(res.message || (language === 'vi' ? 'Không thể tự động khởi động lab.' : 'Failed to auto-start lab.'));
              }
            }
          }
        }
      } catch (e: any) {
        setApiError(e.message || (language === 'vi' ? 'Đã xảy ra lỗi khi kết nối máy chủ.' : 'An error occurred while connecting to the server.'));
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadLabData();
    }
  }, [labId, isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (labStatus !== 'running' || !currentAttempt?.expiresAt) return;
    const updateRemaining = () => {
      const seconds = Math.max(0, Math.ceil((parseBackendDate(currentAttempt.expiresAt!).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) setLabStatus('expired');
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [currentAttempt?.expiresAt, labStatus]);

  useEffect(() => {
    if (labStatus !== 'running' || !currentAttempt) return;
    const poll = window.setInterval(async () => {
      try {
        const res = await api.labs.getLabAttempts(labId);
        const latest = res.data.find(attempt => attempt.id === currentAttempt.id);
        if (latest?.status === 'EXPIRED' || latest?.status === 'FAILED') {
          setCurrentAttempt(latest);
          setLabStatus('expired');
        }
      } catch {
        // Keep the current workspace during transient API failures.
      }
    }, 10000);
    return () => window.clearInterval(poll);
  }, [currentAttempt?.id, labId, labStatus]);

  useEffect(() => {
    if (labStatus !== 'running' || !lab?.generated || !currentAttempt?.runtimeUrl) return;
    let failures = 0;
    const checkRuntime = async () => {
      try {
        const response = await fetch(`${resolveApiUrl(currentAttempt.runtimeUrl!)}health`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        failures = 0;
        setRuntimeError(null);
      } catch {
        failures += 1;
        if (failures >= 2) setRuntimeError(language === 'vi' ? 'Ứng dụng lab tạm thời không phản hồi.' : 'The lab application is temporarily unresponsive.');
      }
    };
    checkRuntime();
    const timer = window.setInterval(checkRuntime, 5000);
    return () => window.clearInterval(timer);
  }, [currentAttempt?.runtimeUrl, lab?.generated, labStatus, runtimeCheck]);

  const handleExtendTime = async () => {
    if (!currentAttempt) return;
    setExtending(true);
    try {
      const res = await api.labs.extendTime(currentAttempt.id);
      if (res.success) setCurrentAttempt(res.data);
    } catch (e: any) {
      alert(e.message || (language === 'vi' ? 'Không thể gia hạn phiên lab.' : 'Failed to extend lab session.'));
    } finally {
      setExtending(false);
    }
  };

  const handleRestartLab = async () => {
    setLabStatus('starting');
    try {
      const res = await api.labs.startLab(labId);
      setCurrentAttempt(res.data);
      setRevealedHints(0);
      setFlagValue('');
      setFlagResult(null);
      setCompletionFeedback(null);
      setLabStatus('running');
    } catch (e: any) {
      setLabStatus('expired');
      alert(e.message || (language === 'vi' ? 'Không thể khởi động lại lab.' : 'Failed to restart lab.'));
    }
  };

  const handleCreateSimilar = async () => {
    if (!lab) return;
    setCreatingSimilar(true);
    try {
      const res = await api.labs.generateWithAi(
        lab.vulnerabilitySlug,
        lab.difficulty,
        language === 'vi'
          ? `Tạo một biến thể mới tương tự lab "${lab.title}", nhưng đổi bối cảnh và đường khai thác.`
          : `Create a new variant similar to lab "${lab.title}", but change the context and exploitation path.`,
        language
      );
      router.push(`/labs/${res.data.id}/play${pathId && lessonId ? `?pathId=${pathId}&lessonId=${lessonId}` : ''}`);
    } catch (e: any) {
      alert(e.message || (language === 'vi' ? 'Không thể tạo lab tương tự.' : 'Failed to generate a similar lab.'));
    } finally {
      setCreatingSimilar(false);
    }
  };

  const handleRevealHint = async () => {
    if (!currentAttempt) return;
    try {
      const res = await api.labs.useHint(currentAttempt.id);
      if (res.success) {
        setRevealedHints(res.data.hintsUsed);
        setCurrentAttempt(res.data);
        setOpenHintIndexes(prev => new Set(prev).add(res.data.hintsUsed - 1));
      }
    } catch (e: any) {
      setApiError(e.message || (language === 'vi' ? 'Không thể tải gợi ý.' : 'Failed to load hints.'));
    }
  };

  const handleAskMentor = async () => {
    if (!currentAttempt) return;
    setAskingMentor(true);
    try {
      const guidance = (await api.labs.getMentor(currentAttempt.id)).data;
      setMentor(guidance);
    }
    catch (e: any) { setApiError(e.message || (language === 'vi' ? 'Mentor chưa thể phản hồi.' : 'Mentor cannot respond right now.')); }
    finally { setAskingMentor(false); }
  };

  const handleCreateHarder = async () => {
    if (!currentAttempt) return;
    setCreatingHarder(true);
    try {
      const res = await api.growth.createHarderVariant(currentAttempt.id);
      router.push(`/labs/${res.data.id}/play${pathId && lessonId ? `?pathId=${pathId}&lessonId=${lessonId}` : ''}`);
    }
    catch (e: any) { setApiError(e.message || (language === 'vi' ? 'Không thể tạo bản khó hơn.' : 'Failed to generate a harder version.')); setCreatingHarder(false); }
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
        setCurrentAttempt(res.data);
        try {
          const feedbackResult = await api.labs.getFeedback(res.data.id);
          setCompletionFeedback(feedbackResult.data);
        } catch (feedbackError) {
          console.error('Failed to load completion feedback:', feedbackError);
        }
        setViewMode('standard');
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
        <div className="lab-loading-grid">
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
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
            {labNotFound ? (language === 'vi' ? 'Bài lab không còn tồn tại' : 'Lab Challenge Not Found') : t('common.error')}
          </h3>
          <p style={{ color: 'var(--text-body-subtle)', marginBottom: '24px' }}>
            {labNotFound
              ? (language === 'vi' ? 'Lab AI này đã bị xoá hoặc liên kết bạn mở đã cũ. Container cũ không còn được sử dụng.' : 'This AI lab has been deleted or the link you opened is old. Old container is no longer used.')
              : apiError || (language === 'vi' ? 'Không tìm thấy thông tin phòng Lab.' : 'Lab workspace information not found.')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/labs" className="btn btn-primary">{language === 'vi' ? 'Chọn bài lab khác' : 'Choose another lab'}</Link>
            <Link href="/learning" className="btn btn-secondary">{t('lesson.backToSyllabus')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (labStatus === 'idle') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-neutral-primary)', padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <FlaskConical size={56} style={{ color: 'var(--fg-brand)', margin: '0 auto 20px' }} />
          <h2 style={{ marginBottom: '12px' }}>{language === 'vi' ? 'Môi trường Lab chưa được khởi chạy' : 'Lab Environment Not Launched'}</h2>
          <p style={{ color: 'var(--text-body-subtle)', marginBottom: '30px', lineHeight: 1.6 }}>
            {language === 'vi' ? 'Phòng thực hành ảo chứa ứng dụng lỗi chưa được dựng lên cho bạn. Vui lòng quay lại trang thông tin chi tiết và nhấn nút "Khởi động Lab".' : 'The virtual lab environment containing the vulnerable app has not been spawned. Please go back to the details page and click "Start Lab".'}
          </p>
          <Link href={`/labs/${labId}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> {language === 'vi' ? 'Quay lại trang chi tiết Lab' : 'Back to Lab Details'}
          </Link>
        </div>
      </div>
    );
  }

  if (labStatus === 'expired') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg-neutral-primary)', padding: '24px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '620px', padding: '40px', textAlign: 'center' }}>
          <Clock3 size={52} style={{ color: 'var(--fg-danger)', margin: '0 auto 18px' }} />
          <h2 style={{ marginBottom: '10px' }}>{language === 'vi' ? `Phiên lab đã hết ${lab.estimatedMinutes || 30} phút` : `Lab Session Expired (${lab.estimatedMinutes || 30} mins)`}</h2>
          <p style={{ color: 'var(--text-body-subtle)', lineHeight: 1.65, marginBottom: '26px' }}>
            {language === 'vi' ? 'Container đã được dừng tự động. Bạn có thể làm lại đúng bài này hoặc tạo một biến thể có cùng loại lỗ hổng.' : 'The container has been stopped automatically. You can restart this lab or generate a similar variant with the same vulnerability.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleRestartLab} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <RotateCcw size={16} /> {language === 'vi' ? 'Làm lại bài này' : 'Restart This Lab'}
            </button>
            <button className="btn btn-secondary" onClick={handleCreateSimilar} disabled={creatingSimilar} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <Sparkles size={16} /> {creatingSimilar ? (language === 'vi' ? 'Đang tạo...' : 'Generating...') : (language === 'vi' ? 'Tạo lab tương tự' : 'Generate Similar Lab')}
            </button>
            <Link href="/labs" className="btn btn-secondary">{language === 'vi' ? 'Về danh sách' : 'Back to List'}</Link>
          </div>
        </div>
      </div>
    );
  }

  const isSimulated = currentAttempt?.containerId?.startsWith('sim-');
  const useLegacySimulator = isSimulated && !lab.generated;
  const activeRuntimeUrl = currentAttempt?.runtimeUrl ? resolveApiUrl(currentAttempt.runtimeUrl) : undefined;

  if (viewMode === 'game') {
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100dvh',
        boxSizing: 'border-box',
        background: 'radial-gradient(circle, #0f172a 0%, #030712 100%)', 
        display: 'flex', 
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(10px, 2vw, 20px)',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}>
        {/* Neon Marquee Keyframes & Button styles */}
        <style>{`
          @keyframes neon-glow {
            from { text-shadow: 0 0 5px #00f2fe, 0 0 10px #00f2fe; }
            to { text-shadow: 0 0 15px #00f2fe, 0 0 25px #00f2fe, 0 0 35px #00f2fe; }
          }
          @keyframes blue-pulse {
            from { box-shadow: 0 0 8px rgba(96, 165, 250, 0.4), 0 4px 0 #1e3a8a, inset 0 2px 4px rgba(255,255,255,0.3); }
            to { box-shadow: 0 0 20px rgba(96, 165, 250, 0.85), 0 4px 0 #1e3a8a, inset 0 2px 4px rgba(255,255,255,0.3); }
          }
          @keyframes yellow-pulse {
            from { box-shadow: 0 0 8px rgba(251, 191, 36, 0.4), 0 4px 0 #78350f, inset 0 2px 4px rgba(255,255,255,0.3); }
            to { box-shadow: 0 0 20px rgba(251, 191, 36, 0.85), 0 4px 0 #78350f, inset 0 2px 4px rgba(255,255,255,0.3); }
          }
          @keyframes red-pulse {
            from { box-shadow: 0 0 8px rgba(248, 113, 113, 0.4), 0 4px 0 #991b1b, inset 0 2px 4px rgba(255,255,255,0.3); }
            to { box-shadow: 0 0 20px rgba(248, 113, 113, 0.85), 0 4px 0 #991b1b, inset 0 2px 4px rgba(255,255,255,0.3); }
          }
          .marquee-glowing {
            animation: neon-glow 1.5s ease-in-out infinite alternate;
          }
          .arcade-btn {
            border: none;
            cursor: pointer;
            transition: all 0.1s ease;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            text-transform: uppercase;
            font-family: var(--font-sans);
            text-shadow: 0 1px 2px rgba(0,0,0,0.6);
            box-sizing: border-box;
          }
          .btn-blue {
            animation: blue-pulse 1.2s ease-in-out infinite alternate;
          }
          .btn-yellow {
            animation: yellow-pulse 1.2s ease-in-out infinite alternate;
          }
          .btn-red {
            animation: red-pulse 1.2s ease-in-out infinite alternate;
          }
          .arcade-btn:active {
            transform: translateY(3px) !important;
            box-shadow: 0 1px 0 rgba(0,0,0,0.6) !important;
          }
          @media (max-width: 560px) {
            .arcade-control-deck {
              align-items: stretch !important;
              flex-direction: column !important;
              gap: 14px !important;
              padding: 14px 16px !important;
            }
            .arcade-joystick-row {
              justify-content: center !important;
            }
            .arcade-push-buttons {
              flex-wrap: wrap !important;
              gap: 12px !important;
              justify-content: center !important;
              width: 100% !important;
            }
            .arcade-push-buttons .arcade-btn {
              width: 54px !important;
              height: 40px !important;
              font-size: 8px !important;
              letter-spacing: 0 !important;
            }
          }
        `}</style>

        {/* 3D Retro Arcade Cabinet Frame */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          background: '#111827',
          borderRadius: '24px',
          border: '10px solid #1f2937',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px rgba(56,189,248,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          flex: '0 0 auto'
        }}>
          {/* Cabinet Marquee Header (Glowing neon style) */}
          <div style={{
            background: '#030712',
            padding: '16px 24px',
            borderBottom: '6px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            boxShadow: 'inset 0 0 25px rgba(0,242,254,0.15)'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></span>
            </div>
            
            <h2 className="marquee-glowing" style={{
              color: '#00f2fe',
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(12px, 1.8vw, 15px)',
              fontWeight: 'bold',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              textAlign: 'center',
              flex: '1 1 220px'
            }}>
              SEC-GATE 3000 RETRO CONSOLE
            </h2>
            
            <div style={{
              background: '#1e293b',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.2)'
            }}>
              SCORE: {lab.points}
            </div>

            {/* Digital Warning Display */}
            <div style={{
              background: '#0c0c0c',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '9px',
              fontFamily: '"Courier New", Courier, monospace',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              textShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
            }}>
              ĐÃ PHÁT HIỆN 1 LỖI
            </div>
          </div>

          {/* CRT Screen Frame wrapper */}
          <div style={{
            background: '#090d16',
            padding: '16px',
            position: 'relative'
          }}>
            <LabGameView 
              hints={hints} 
              revealedHints={revealedHints} 
              onRevealHint={handleRevealHint} 
              points={lab.points} 
              labStatus={labStatus}
              onSubmitFlag={handleSubmitFlag}
              flagResult={flagResult}
              vulnerabilityName={lab.vulnerabilityName}
              isSimulated={useLegacySimulator}
              dockerPort={lab.dockerPort}
              runtimeUrl={activeRuntimeUrl}
              apiError={apiError}
              onSimulatedSuccess={handleSimulatedSuccess}
            />
          </div>

          {/* Slanted 3D Control Deck Dashboard */}
          <div style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            borderTop: '6px solid #1f2937',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1)'
          }} className="arcade-control-deck">
            {/* Visual Joystick assembly */}
            <div className="arcade-joystick-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                position: 'relative',
                width: '60px',
                height: '60px',
                background: '#030712',
                borderRadius: '50%',
                border: '3px solid #334155',
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.8)'
              }}>
                {/* Shaft */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '26px',
                  width: '6px',
                  height: '24px',
                  background: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)',
                  transform: 'rotate(-15deg)',
                  transformOrigin: 'bottom center',
                  borderRadius: '3px'
                }}></div>
                {/* Red ball knob */}
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '18px',
                  width: '20px',
                  height: '20px',
                  background: 'radial-gradient(circle, #f87171 0%, #ef4444 60%, #b91c1c 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)'
                }}></div>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                WASD TO MOVE
              </span>
            </div>

            {/* Glowing Retro Push Buttons */}
            <div className="arcade-push-buttons" style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <button
                  className="arcade-btn btn-blue"
                  onClick={() => alert('HƯỚNG DẪN:\n\n- Đi chuyển bằng WASD hoặc phím Mũi tên.\n- Đi lại gần các thiết bị trên bản đồ.\n- Nhấn phím E để tương tác.\n- Nhấn phím ESC để đóng bảng.')}
                  style={{
                    background: 'radial-gradient(circle, #60a5fa 0%, #1d4ed8 100%)',
                    width: '56px',
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    letterSpacing: '0.5px',
                  }}
                >
                  HỖ TRỢ
                </button>
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 'bold' }}>HELP</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <button
                  className="arcade-btn btn-yellow"
                  onClick={handleRevealHint}
                  style={{
                    background: 'radial-gradient(circle, #fbbf24 0%, #b45309 100%)',
                    width: '56px',
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    letterSpacing: '0.5px',
                  }}
                >
                  GỢI Ý
                </button>
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 'bold' }}>HINT</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <button
                  className="arcade-btn btn-red"
                  onClick={() => setViewMode('standard')}
                  style={{
                    background: 'radial-gradient(circle, #f87171 0%, #dc2626 100%)',
                    width: '56px',
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    letterSpacing: '0.5px',
                  }}
                >
                  THOÁT
                </button>
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 'bold' }}>EXIT</span>
              </div>
            </div>
          </div>
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
      <div style={headerStyle} className="lab-workspace-header">
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
            <ArrowLeft size={14} /> {t('common.back')}
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lab.title}
            </h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,122,85,0.08)', border: '1px solid rgba(0,122,85,0.15)', color: 'var(--fg-success-strong)', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
              <span style={activeDotStyle}></span> {language === 'vi' ? 'Đang mở' : 'Active'}
            </span>
          </div>
        </div>

        {/* Right Info & Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontVariantNumeric: 'tabular-nums', color: remainingSeconds <= 600 ? 'var(--fg-danger)' : 'var(--text-heading)', fontSize: '13px', fontWeight: 700 }}>
            <Clock3 size={15} />
            {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}
            {remainingSeconds > 0 && remainingSeconds <= 600 && (currentAttempt?.extensionCount || 0) < 1 && (
              <button className="btn btn-secondary btn-sm" onClick={handleExtendTime} disabled={extending} title={language === 'vi' ? "Gia hạn thêm 30 phút" : "Extend by 30 mins"}>
                <TimerReset size={14} /> {extending ? (language === 'vi' ? 'Đang xin...' : 'Requesting...') : (language === 'vi' ? '+30 phút' : '+30 mins')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg-brand)', fontSize: '13px', fontWeight: 600 }}>
            <Trophy size={14} /> {t('labs.pointsAward', { points: lab.points })}
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
              <LayoutGrid size={13} /> {language === 'vi' ? 'Giao diện Chuẩn' : 'Standard UI'}
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
              <Gamepad2 size={13} /> {language === 'vi' ? 'Chế độ Game 2D' : '2D Game Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="lab-workspace-body">
        {completionFeedback && currentAttempt && (
          <LabCompletionFeedback
            feedback={completionFeedback}
            attempt={currentAttempt}
            onHarder={handleCreateHarder}
            creatingHarder={creatingHarder}
            pathId={pathId || undefined}
            lessonId={lessonId || undefined}
          />
        )}
        <div className="lab-workspace-grid">
          
          {/* Left Side: Vulnerable Application (Playground) - Hero component */}
          <div>
            {runtimeError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', marginBottom: '8px', border: '1px solid rgba(190,55,55,.25)', borderRadius: '6px', background: 'rgba(190,55,55,.06)', color: 'var(--fg-danger)', fontSize: '12px' }}>
                <AlertCircle size={15} />
                <span style={{ flex: 1 }}>{runtimeError}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setRuntimeCheck(value => value + 1)}>{language === 'vi' ? 'Thử lại' : 'Retry'}</button>
                <Link className="btn btn-secondary btn-sm" href={`/labs/${labId}`}>{language === 'vi' ? 'Quay về lab' : 'Back to Lab'}</Link>
              </div>
            )}
            {labStatus === 'starting' ? (
              <div className="card animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '560px', padding: '32px', border: '1px solid var(--border-default)', background: 'var(--bg-neutral-primary)' }}>
                <div className="terminal" style={{ width: '100%', maxWidth: '500px', marginBottom: '16px' }}>
                  <div className="terminal-header">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="terminal-dot red"></span>
                      <span className="terminal-dot yellow"></span>
                      <span className="terminal-dot green"></span>
                    </div>
                    <span className="terminal-title">Docker</span>
                    <div></div>
                  </div>
                  <div className="terminal-body" style={{ textAlign: 'left' }}>
                    <div><span className="terminal-output">Checking docker availability...</span></div>
                    <div><span className="terminal-output">Pulling vulnerable image: {lab.dockerImage}...</span></div>
                    <div><span className="terminal-output">Spawning container: sechub-attempt-...</span></div>
                    <div><span className="terminal-success">Starting internal web server on port {lab.dockerPort}...</span></div>
                    <div>
                      <span className="terminal-success" style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-body-subtle)', fontSize: '13px', margin: 0 }}>
                  {t('labDetail.startingSandbox')}
                </p>
              </div>
            ) : useLegacySimulator ? (
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
                    {activeRuntimeUrl || (language === 'vi' ? 'Runtime chưa sẵn sàng' : 'Runtime not ready')}
                  </div>
                </div>
                <iframe 
                  src={activeRuntimeUrl}
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
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '8px' }}>{language === 'vi' ? 'Thông tin bài lab' : 'Lab Challenge Information'}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-body-subtle)', lineHeight: 1.65, margin: 0 }}>{lab.description}</p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Nhiệm vụ bài thực hành' : 'Practice Challenge Objectives'}
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--fg-brand)', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                  {language === 'vi' ? 'Phân tích giao diện web bên trái để tìm kiếm lỗ hổng.' : 'Analyze the web interface on the left to locate vulnerability entry points.'}
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--fg-brand)', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                  {language === 'vi' ? `Khai thác lỗ hổng ${lab.vulnerabilityName} bằng payload tương ứng.` : `Exploit the ${lab.vulnerabilityName} vulnerability using suitable payloads.`}
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--fg-brand)', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                  {language === 'vi' ? 'Tìm chuỗi cờ bí mật (FLAG) nộp ở khung phía dưới.' : 'Find the secret flag value (FLAG) and submit it below.'}
                </li>
              </ul>
            </div>

            {/* Hints List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Lightbulb size={16} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Danh sách Gợi ý' : 'Hints List'}
                </h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-neutral-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-body-subtle)' }}>
                  {revealedHints}/{hints.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {hints.map((hint, i) => (
                  <div key={i} className={`hint-item ${openHintIndexes.has(i) ? 'open' : ''}`}>
                    <button
                      className="hint-trigger"
                      onClick={() => {
                        if (i < revealedHints) {
                          setOpenHintIndexes(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            return next;
                          });
                          return;
                        }
                        if (i === revealedHints) handleRevealHint();
                      }}
                      style={{
                        opacity: i <= revealedHints ? 1 : 0.4,
                        pointerEvents: (i < revealedHints || (i === revealedHints && labStatus === 'running')) ? 'auto' : 'none',
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
                        {language === 'vi' ? 'Gợi ý' : 'Hint'} {i + 1}
                      </span>
                      <span>
                        {i < revealedHints && openHintIndexes.has(i) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </span>
                    </button>
                    {i < revealedHints && openHintIndexes.has(i) && (
                      <div style={{ background: 'var(--bg-neutral-secondary-light)', border: '1px solid var(--border-default)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '12px 14px' }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>{hint}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {labStatus === 'running' && <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-default)' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleAskMentor} disabled={askingMentor} style={{ width: '100%' }}>
                  <Sparkles size={14} /> {askingMentor ? (language === 'vi' ? 'Mentor đang suy nghĩ...' : 'Mentor thinking...') : (language === 'vi' ? 'Hỏi AI mentor (không trừ điểm)' : 'Ask AI Mentor (no penalty)')}
                </button>
                {mentor && <div style={{ marginTop: '9px', padding: '11px 12px', borderLeft: '3px solid var(--border-brand)', background: 'var(--bg-brand-softer)', fontSize: '12.5px', lineHeight: 1.6 }}><strong>{language === 'vi' ? 'Câu hỏi dẫn dắt:' : 'Guiding question:'}</strong> {mentor.question}</div>}
              </div>}

              {revealedHints < hints.length && labStatus === 'running' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRevealHint}
                  style={{ marginTop: '10px', width: '100%', padding: '8px' }}
                >
                  {language === 'vi' ? `Mở gợi ý tiếp theo (-${lab.points / 10} điểm)` : `Unlock next hint (-${lab.points / 10} pts)`}
                </button>
              )}
            </div>

            {/* Flag Submission */}
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flag size={16} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Nộp kết quả (FLAG)' : 'Submit Result (FLAG)'}
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
                  {language === 'vi' ? 'Gửi Flag' : 'Submit Flag'}
                </button>
              </div>
              {flagResult === 'correct' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-success-strong)', fontSize: '13px', marginTop: '12px' }}>
                  <CheckCircle2 size={14} /> {language === 'vi' ? `Chúc mừng! Bạn đã hoàn thành xuất sắc bài lab này! +${lab.points} điểm.` : `Congratulations! You successfully completed this lab! +${lab.points} points.`}
                </div>
              )}
              {flagResult === 'wrong' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-danger)', fontSize: '13px', marginTop: '12px' }}>
                  <AlertCircle size={14} /> {language === 'vi' ? 'Flag không chính xác. Hãy tiếp tục thử sức nhé!' : 'Incorrect flag. Please try again!'}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
