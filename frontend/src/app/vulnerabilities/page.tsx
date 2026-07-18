'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { api, Vulnerability } from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';
import VulnIcon from '@/components/VulnIcon';
import PageBackLink from '@/components/PageBackLink';

export default function VulnerabilitiesPage() {
  const { language } = useTranslation();
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.vulnerabilities.getAll();
        if (res.success) {
          setVulns(res.data);
        }
      } catch (e) {
        console.error('Failed to load vulnerabilities list:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div>
      <PageBackLink href="/" label={language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'} />
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={28} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Lỗ hổng bảo mật' : 'Vulnerabilities'}
        </h1>
        <p className="section-subtitle">
          {language === 'vi'
            ? 'Tìm hiểu chi tiết về các lỗ hổng bảo mật web phổ biến nhất, cách khai thác và phòng chống.'
            : 'Learn in detail about the most common web security vulnerabilities, how they are exploited, and how to prevent them.'
          }
        </p>
      </div>

      {loading ? (
        <div className="grid-3" style={{ marginTop: 'var(--space-4)' }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ height: '140px', background: 'var(--bg-neutral-secondary-medium)', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <div className="grid-3" style={{ marginTop: 'var(--space-4)' }}>
          {vulns.map((vuln, index) => {
            const severityClass = vuln.severity === 'CRITICAL' ? 'badge-critical' : 
                                  vuln.severity === 'HIGH' ? 'badge-high' : 
                                  vuln.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';

            const severityLabel = vuln.severity === 'CRITICAL' ? (language === 'vi' ? 'Cực kỳ nghiêm trọng' : 'Critical') :
                                  vuln.severity === 'HIGH' ? (language === 'vi' ? 'Cao' : 'High') :
                                  vuln.severity === 'MEDIUM' ? (language === 'vi' ? 'Trung bình' : 'Medium') : (language === 'vi' ? 'Thấp' : 'Low');

            return (
              <Link
                key={vuln.id}
                href={`/vulnerabilities/${vuln.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card vuln-card animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <div className="vuln-card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <VulnIcon name={vuln.icon} size={24} />
                  </div>
                  <div className="vuln-card-title">{vuln.name}</div>
                  <div className="vuln-card-desc">{vuln.description}</div>
                  <div className="vuln-card-footer" style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                    <span className={`badge ${severityClass}`}>{severityLabel}</span>
                    <span className="vuln-card-labs">{vuln.labCount || 0} {language === 'vi' ? 'phòng lab' : 'labs'} →</span>
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
