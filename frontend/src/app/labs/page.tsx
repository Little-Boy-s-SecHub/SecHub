'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  RotateCw, 
  PlayCircle, 
  Clock, 
  Trophy, 
  Link as LinkIcon, 
  Search 
} from 'lucide-react';
import { labs, vulnerabilities } from '@/lib/data';

export default function LabsPage() {
  const [filterVuln, setFilterVuln] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

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
      }}>
        <select
          value={filterVuln}
          onChange={(e) => setFilterVuln(e.target.value)}
          style={{
            background: 'var(--bg-neutral-secondary-medium)',
            border: '1px solid var(--border-default-medium)',
            borderRadius: 'var(--radius-default)',
            padding: '8px 16px',
            color: 'var(--text-heading)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">Tất cả lỗ hổng</option>
          {vulnerabilities.map(v => (
            <option key={v.slug} value={v.slug}>{v.name}</option>
          ))}
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          style={{
            background: 'var(--bg-neutral-secondary-medium)',
            border: '1px solid var(--border-default-medium)',
            borderRadius: 'var(--radius-default)',
            padding: '8px 16px',
            color: 'var(--text-heading)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">Tất cả độ khó</option>
          <option value="EASY">Dễ</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HARD">Khó</option>
          <option value="EXPERT">Chuyên gia</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
          {filteredLabs.length} bài lab
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid-3">
        {filteredLabs.map((lab, index) => {
          const diffClass = lab.difficulty === 'EASY' ? 'badge-easy' : 
                            lab.difficulty === 'MEDIUM' ? 'badge-medium-diff' : 
                            lab.difficulty === 'HARD' ? 'badge-hard' : 'badge-expert';
          const statusContent = lab.status === 'COMPLETED' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-success-strong)' }}>
              <CheckCircle2 size={14} /> Hoàn thành
            </span>
          ) : lab.status === 'IN_PROGRESS' ? (
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
                  animationDelay: `${index * 0.06}s`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="lab-card-header">
                  <span className={`badge ${diffClass}`}>{lab.difficulty}</span>
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

      {filteredLabs.length === 0 && (
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
