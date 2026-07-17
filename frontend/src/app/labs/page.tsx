'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  RotateCw, 
  PlayCircle, 
  Clock, 
  Trophy, 
  Link as LinkIcon, 
  Search,
  ChevronDown,
  Check,
  Sparkles,
  BrainCircuit,
  X,
  AlertTriangle
} from 'lucide-react';
import { api, Lab, Vulnerability, LabAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CustomSelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', userSelect: 'none' }}
    >
      <style>{`
        .custom-select-option:hover {
          background: var(--bg-neutral-tertiary) !important;
          color: var(--text-heading) !important;
        }
      `}</style>
      <div 
        onClick={handleToggle}
        style={{
          background: 'var(--bg-neutral-secondary-soft)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '10px 16px',
          color: 'var(--text-heading)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          minWidth: '240px',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isOpen ? '0 0 0 2px rgba(56, 189, 248, 0.2)' : 'none',
          borderColor: isOpen ? 'var(--fg-brand)' : 'var(--border-default)',
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-body-subtle)' 
          }} 
        />
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            background: 'var(--bg-neutral-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
            padding: '6px',
            minWidth: '100%',
            width: 'max-content',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
                className="custom-select-option"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: isSelected ? 'var(--fg-brand)' : 'var(--text-body)',
                  background: isSelected ? 'var(--bg-neutral-tertiary)' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} style={{ color: 'var(--fg-brand)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LabsPage() {
  const { isAuthenticated } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [myAttempts, setMyAttempts] = useState<LabAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterVuln, setFilterVuln] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiVulnSlug, setAiVulnSlug] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('BEGINNER');
  const [aiScenario, setAiScenario] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatusLogs, setAiStatusLogs] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [labsRes, vulnsRes] = await Promise.all([
          api.labs.getLabs(),
          api.vulnerabilities.getAll()
        ]);

        if (labsRes.success) setLabs(labsRes.data);
        if (vulnsRes.success) {
          setVulns(vulnsRes.data);
          if (vulnsRes.data.length > 0) {
            setAiVulnSlug(vulnsRes.data[0].slug);
          }
        }

        if (isAuthenticated) {
          const attemptsRes = await api.labs.getMyAttempts();
          if (attemptsRes.success) setMyAttempts(attemptsRes.data);
        }
      } catch (e) {
        console.error('Failed to load labs list:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  const handleAiGenerate = async () => {
    setAiError('');
    setAiGenerating(true);
    setAiStatusLogs([
      '[*] Khởi tạo Codex 5.6 agent...',
      `[*] Xác nhận lỗ hổng bảo mật: ${aiVulnSlug}`,
      `[*] Thiết lập độ khó: ${aiDifficulty}`
    ]);

    const addLog = (msg: string) => {
      setAiStatusLogs(prev => [...prev, msg]);
    };

    setTimeout(() => addLog('[*] Đang phân tích kịch bản tấn công của người dùng...'), 600);
    setTimeout(() => addLog('[*] Đang kết nối tới mô hình GPT-5.6 Sol thông qua Codex CLI...'), 1200);
    setTimeout(() => addLog('[*] Đang sinh nội dung bài lab (Title, Description, Flags, Hints)...'), 2000);

    try {
      const res = await api.labs.generateWithAi(aiVulnSlug, aiDifficulty, aiScenario, aiApiKey);
      if (res.success && res.data) {
        addLog('[+] Sinh bài lab thành công từ AI!');
        addLog('[+] Đang lưu trữ và cấu hình bài lab vào PostgreSQL database...');
        
        setTimeout(() => {
          setLabs(prev => [res.data, ...prev]);
          setShowAiModal(false);
          setAiGenerating(false);
          setAiScenario('');
          setAiStatusLogs([]);
        }, 1500);
      } else {
        throw new Error(res.message || 'Lỗi không rõ khi sinh bài lab từ AI.');
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || 'Không thể kết nối đến máy chủ hoặc API Key không hợp lệ.');
      setAiGenerating(false);
    }
  };

  const getLabStatus = (labId: string) => {
    const attempts = myAttempts.filter(a => a.labId === labId);
    if (attempts.some(a => a.status === 'COMPLETED')) {
      return 'COMPLETED';
    }
    if (attempts.some(a => a.status === 'RUNNING')) {
      return 'IN_PROGRESS';
    }
    return 'NOT_STARTED';
  };

  const filteredLabs = labs.filter(lab => {
    if (filterVuln !== 'all' && lab.vulnerabilitySlug !== filterVuln) return false;
    if (filterDifficulty !== 'all' && lab.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={28} style={{ color: 'var(--fg-brand)' }} /> Phòng Lab thực hành
          </h1>
          <p className="section-subtitle">
            Chọn bài lab để thực hành khai thác lỗ hổng trên môi trường web thực tế.
            Mỗi lab chạy trong Docker container riêng biệt.
          </p>
        </div>
        {isAuthenticated && (
          <button 
            onClick={() => setShowAiModal(true)}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, var(--fg-brand) 0%, #a855f7 100%)',
              border: 'none',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <Sparkles size={16} /> Tạo Lab bằng Codex 5.6
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <CustomSelect
          value={filterVuln}
          onChange={setFilterVuln}
          options={[
            { value: 'all', label: 'Tất cả lỗ hổng' },
            ...vulns.map(v => ({ value: v.slug, label: v.name }))
          ]}
          placeholder="Tất cả lỗ hổng"
          disabled={loading}
        />

        <CustomSelect
          value={filterDifficulty}
          onChange={setFilterDifficulty}
          options={[
            { value: 'all', label: 'Tất cả độ khó' },
            { value: 'BEGINNER', label: 'Dễ' },
            { value: 'INTERMEDIATE', label: 'Trung bình' },
            { value: 'ADVANCED', label: 'Khó' }
          ]}
          placeholder="Tất cả độ khó"
          disabled={loading}
        />

        <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
          {filteredLabs.length} bài lab
        </div>
      </div>

      {/* Labs Grid */}
      {loading ? (
        <div className="grid-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ height: '180px', background: 'var(--bg-neutral-secondary-medium)', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <div className="grid-3">
          {filteredLabs.map((lab, index) => {
            const diffClass = lab.difficulty === 'BEGINNER' ? 'badge-easy' : 
                              lab.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                              'badge-hard';
            
            const difficultyLabel = lab.difficulty === 'BEGINNER' ? 'Dễ' :
                                    lab.difficulty === 'INTERMEDIATE' ? 'Trung bình' : 'Khó';

            const status = getLabStatus(lab.id);
            const statusContent = status === 'COMPLETED' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-success-strong)' }}>
                <CheckCircle2 size={14} /> Hoàn thành
              </span>
            ) : status === 'IN_PROGRESS' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-brand)' }}>
                <RotateCw size={14} style={{ animation: 'spin 3s linear infinite' }} /> Đang làm
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-body-subtle)' }}>
                <PlayCircle size={14} /> Chưa bắt đầu
              </span>
            );

            return (
              <Link key={lab.id} href={`/labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="card lab-card animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.04}s`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div className="lab-card-header">
                    <span className={`badge ${diffClass}`}>{difficultyLabel}</span>
                    {statusContent}
                  </div>
                  <div className="lab-card-title">{lab.title}</div>
                  <div className="lab-card-desc">{lab.description}</div>
                  <div className="lab-card-meta" style={{ marginTop: 'auto', paddingTop: 'var(--space-2)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {lab.estimatedMinutes}p
                    </span>
                    <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Trophy size={12} /> {lab.points}pt
                    </span>
                    <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <LinkIcon size={12} /> {lab.vulnerabilityName}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredLabs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <Search size={40} style={{ color: 'var(--text-body-subtle)' }} />
          </div>
          <div className="empty-state-title">Không tìm thấy bài lab</div>
          <div className="empty-state-desc">Thử thay đổi bộ lọc để xem các bài lab khác.</div>
        </div>
      )}

      {/* AI Lab Generator Modal */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(9, 15, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-neutral-secondary)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(56, 189, 248, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(56, 189, 248, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BrainCircuit size={22} style={{ color: 'var(--fg-brand)' }} />
                <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-heading)' }}>AI Lab Generator (Codex 5.6)</span>
              </div>
              <button 
                onClick={() => {
                  if (!aiGenerating) setShowAiModal(false);
                }}
                disabled={aiGenerating}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-body-subtle)',
                  cursor: aiGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{aiError}</span>
                </div>
              )}

              {aiGenerating ? (
                // Loading / Log screen
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="spinner" style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(56, 189, 248, 0.2)',
                      borderTopColor: 'var(--fg-brand)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>Đang tạo lab thực hành bảo mật bằng Codex 5.6...</span>
                  </div>
                  <div style={{
                    background: '#090f1e',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.8125rem',
                    color: '#a6adc8',
                    height: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {aiStatusLogs.map((logStr, i) => (
                      <div key={i} style={{ 
                        color: logStr.startsWith('[+]') ? '#a6e3a1' : 
                               logStr.startsWith('[*]') ? '#89b4fa' : '#cdd6f4'
                      }}>
                        {logStr}
                      </div>
                    ))}
                    <div style={{ borderRight: '2px solid var(--fg-brand)', width: '6px', height: '14px', animation: 'blink 1s step-end infinite' }}></div>
                  </div>
                </div>
              ) : (
                // Form screen
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>PHÂN LOẠI LỖ HỔNG</label>
                    <select
                      value={aiVulnSlug}
                      onChange={(e) => setAiVulnSlug(e.target.value)}
                      style={{
                        background: 'var(--bg-neutral-secondary-soft)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--text-heading)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    >
                      {vulns.map(v => (
                        <option key={v.id} value={v.slug}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>ĐỘ KHÓ LAB</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      style={{
                        background: 'var(--bg-neutral-secondary-soft)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--text-heading)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    >
                      <option value="BEGINNER">Dễ (Beginner)</option>
                      <option value="INTERMEDIATE">Trung bình (Intermediate)</option>
                      <option value="ADVANCED">Khó (Advanced)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>KỊCH BẢN THỰC HÀNH (TÙY CHỌN)</label>
                    <textarea
                      value={aiScenario}
                      onChange={(e) => setAiScenario(e.target.value)}
                      placeholder="Mô tả kịch bản bài lab. Ví dụ: 'Trang web thương mại điện tử bị dính Blind SQL Injection dựa trên thời gian (Time-based Blind SQLi) ở ô tìm kiếm sản phẩm...'"
                      rows={4}
                      style={{
                        background: 'var(--bg-neutral-secondary-soft)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--text-heading)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>OPENAI API KEY (TÙY CHỌN)</label>
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="Nhập API Key của bạn (nếu máy chủ chưa cấu hình)"
                      style={{
                        background: 'var(--bg-neutral-secondary-soft)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--text-heading)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)' }}>Để trống nếu server đã cấu hình sẵn biến môi trường `OPENAI_API_KEY`.</span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!aiGenerating && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: 'rgba(56, 189, 248, 0.01)'
              }}>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '6px' }}
                >
                  Hủy
                </button>
                <button 
                  onClick={handleAiGenerate}
                  className="btn btn-primary"
                  style={{ 
                    padding: '8px 20px', 
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--fg-brand) 0%, #a855f7 100%)',
                    border: 'none',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}
                >
                  Bắt đầu tạo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
