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
  Check
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

  useEffect(() => {
    async function loadData() {
      try {
        const [labsRes, vulnsRes] = await Promise.all([
          api.labs.getLabs(),
          api.vulnerabilities.getAll()
        ]);

        if (labsRes.success) setLabs(labsRes.data);
        if (vulnsRes.success) setVulns(vulnsRes.data);

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
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FlaskConical size={28} style={{ color: 'var(--fg-brand)' }} /> Phòng Lab thực hành
        </h1>
        <p className="section-subtitle">
          Chọn bài lab để thực hành khai thác lỗ hổng trên môi trường web thực tế.
          Mỗi lab chạy trong Docker container riêng biệt.
        </p>
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
    </div>
  );
}
