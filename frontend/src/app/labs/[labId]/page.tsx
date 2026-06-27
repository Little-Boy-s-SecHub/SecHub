'use client';

import { useState, use } from 'react';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';
import { labs } from '@/lib/data';
import { notFound } from 'next/navigation';

const labHints: Record<string, string[]> = {
  '1': [
    'Gợi ý 1: Thử nhập ký tự đặc biệt vào trường username để xem phản hồi của server.',
    "Gợi ý 2: SQL comment trong MySQL là '--'. Nếu bạn kết thúc username bằng comment, phần kiểm tra password sẽ bị bỏ qua.",
    "Gợi ý 3: Thử payload: admin' -- trong trường username và để trống password.",
  ],
  '2': [
    'Gợi ý 1: Tìm số cột trong query gốc bằng ORDER BY.',
    "Gợi ý 2: Sử dụng UNION SELECT NULL,NULL,... để xác định số cột chính xác.",
    "Gợi ý 3: Sau khi biết số cột, thử: ' UNION SELECT username,password FROM users --",
  ],
  '3': [
    'Gợi ý 1: Ứng dụng không hiển thị kết quả trực tiếp. Quan sát sự thay đổi trong response.',
    "Gợi ý 2: Thử payload Boolean-based: ' AND 1=1 -- (true) vs ' AND 1=2 -- (false)",
    "Gợi ý 3: Sử dụng SUBSTRING() để trích xuất từng ký tự: ' AND SUBSTRING(password,1,1)='a' --",
  ],
};

// Fallback hints
const defaultHints = [
  'Gợi ý 1: Quan sát kỹ các input fields và URL parameters.',
  'Gợi ý 2: Sử dụng Burp Suite để intercept và modify requests.',
  'Gợi ý 3: Kiểm tra source code HTML để tìm thông tin ẩn.',
];

export default function LabDetailPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = use(params);
  const lab = labs.find(l => l.id === labId);

  if (!lab) {
    notFound();
  }

  const [labStatus, setLabStatus] = useState<'idle' | 'starting' | 'running' | 'completed'>('idle');
  const [flagValue, setFlagValue] = useState('');
  const [flagResult, setFlagResult] = useState<'correct' | 'wrong' | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const hints = labHints[labId] || defaultHints;

  const diffClass = lab.difficulty === 'EASY' ? 'badge-easy' : 
                    lab.difficulty === 'MEDIUM' ? 'badge-medium-diff' : 
                    lab.difficulty === 'HARD' ? 'badge-hard' : 'badge-expert';

  const handleStartLab = () => {
    setLabStatus('starting');
    // Simulate container startup
    setTimeout(() => {
      setLabStatus('running');
    }, 2000);
  };

  const handleStopLab = () => {
    setLabStatus('idle');
    setElapsedTime(0);
  };

  const handleSubmitFlag = () => {
    if (!flagValue.trim()) return;
    // Mock flag check
    const isCorrect = flagValue.toLowerCase().includes('flag{') || flagValue === 'admin';
    setFlagResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setLabStatus('completed');
    }
  };

  const handleRevealHint = () => {
    if (revealedHints < hints.length) {
      setRevealedHints(revealedHints + 1);
    }
  };

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
              <span className={`badge ${diffClass}`}>{lab.difficulty}</span>
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
                  Click nút bên dưới để khởi tạo Docker container chứa ứng dụng web có lỗ hổng.
                </p>
                <button className="btn btn-primary btn-lg" onClick={handleStartLab} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                  <Play size={16} /> Khởi động Lab
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
                    <div><span className="terminal-output">Pulling image sechub/lab-sqli:latest...</span></div>
                    <div><span className="terminal-output">Creating container...</span></div>
                    <div><span className="terminal-success">Starting vulnerable web app...</span></div>
                    <div>
                      <span className="terminal-success" style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-body-subtle)', fontSize: '14px' }}>
                  Đang khởi tạo môi trường lab...
                </p>
              </div>
            )}

            {(labStatus === 'running' || labStatus === 'completed') && (
              <div>
                {/* Status bar */}
                <div className={`lab-status-bar ${labStatus === 'completed' ? 'completed' : 'running'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '13px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: labStatus === 'completed' ? 'var(--fg-success-strong)' : '#27c93f',
                      animation: labStatus === 'completed' ? 'none' : 'pulse-glow 2s ease-in-out infinite',
                    }}></span>
                    <span style={{ color: 'var(--text-heading)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {labStatus === 'completed' ? (
                        <>
                          <CheckCircle2 size={14} style={{ color: 'var(--fg-success-strong)' }} /> Lab đã hoàn thành!
                        </>
                      ) : (
                        'Lab đang chạy'
                      )}
                    </span>
                    <span style={{ color: 'var(--text-body-subtle)' }}>|</span>
                    <span style={{ color: 'var(--fg-brand)', fontFamily: 'var(--font-mono)' }}>
                      http://localhost:8081
                    </span>
                  </div>
                  {labStatus === 'running' && (
                    <button className="btn btn-danger btn-sm" onClick={handleStopLab} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Square size={12} /> Dừng Lab
                    </button>
                  )}
                </div>

                {/* Iframe placeholder */}
                <div className="lab-iframe-placeholder">
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                    <Globe size={48} style={{ color: 'var(--text-body-subtle)' }} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-heading)' }}>Vulnerable Web App</div>
                  <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
                    Ứng dụng web có lỗ hổng sẽ được hiển thị ở đây trong iframe.
                    Khi backend được kết nối, container Docker sẽ cung cấp web app thực tế.
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    background: 'var(--bg-neutral-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--text-body)',
                  }}>
                    http://localhost:8081
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flag submission */}
          {(labStatus === 'running' || labStatus === 'completed') && (
            <div className="card animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flag size={18} style={{ color: 'var(--fg-brand)' }} /> Submit Flag
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-body-subtle)', marginBottom: 'var(--space-2)' }}>
                Sau khi khai thác thành công lỗ hổng, nhập flag bạn tìm được vào đây.
              </p>
              <div className="flag-input-group">
                <input
                  type="text"
                  className="flag-input"
                  placeholder="Nhập flag (VD: flag{...})"
                  value={flagValue}
                  onChange={(e) => {
                    setFlagValue(e.target.value);
                    setFlagResult(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitFlag()}
                  disabled={labStatus === 'completed'}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitFlag}
                  disabled={labStatus === 'completed' || !flagValue.trim()}
                >
                  Submit
                </button>
              </div>
              {flagResult === 'correct' && (
                <div className="flag-result-correct" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> Chính xác! Bạn đã hoàn thành lab này! +{lab.points} điểm
                </div>
              )}
              {flagResult === 'wrong' && (
                <div className="flag-result-wrong" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> Sai flag. Hãy thử lại hoặc xem gợi ý bên phải.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          {/* Objectives */}
          <div className="card animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: 'var(--fg-brand)' }} /> Mục tiêu
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                Tìm endpoint có lỗ hổng
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                Khai thác lỗ hổng {lab.vulnerabilityName}
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--fg-brand)', flexShrink: 0 }}>○</span>
                Lấy flag và submit
              </li>
            </ul>
          </div>

          {/* Hints */}
          <div className="card animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={18} style={{ color: 'var(--fg-brand)' }} /> Gợi ý
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>
                {revealedHints}/{hints.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
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
                      pointerEvents: i <= revealedHints ? 'auto' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {i < revealedHints ? (
                        <>
                          <Lightbulb size={14} style={{ color: 'var(--fg-brand)' }} /> Gợi ý {i + 1}
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Gợi ý {i + 1}
                        </>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {i < revealedHints ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  {i < revealedHints && (
                    <div className="hint-content" style={{ maxHeight: '200px', padding: '12px 16px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                        {hint}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {revealedHints < hints.length && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRevealHint}
                style={{ marginTop: 'var(--space-2)', width: '100%' }}
              >
                Mở gợi ý tiếp theo (-10 điểm)
              </button>
            )}
          </div>

          {/* Related vulnerability */}
          <div className="card animate-fade-in-up animate-delay-3">
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
