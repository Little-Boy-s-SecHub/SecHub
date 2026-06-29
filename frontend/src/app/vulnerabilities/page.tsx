'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { api, Vulnerability } from '@/lib/api';
import VulnIcon from '@/components/VulnIcon';

export default function VulnerabilitiesPage() {
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
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={28} style={{ color: 'var(--fg-brand)' }} /> Lỗ hổng bảo mật
        </h1>
        <p className="section-subtitle">
          Tìm hiểu chi tiết về các lỗ hổng bảo mật web phổ biến nhất, cách khai thác và phòng chống.
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

            const severityLabel = vuln.severity === 'CRITICAL' ? 'Cực kỳ nghiêm trọng' :
                                  vuln.severity === 'HIGH' ? 'Cao' :
                                  vuln.severity === 'MEDIUM' ? 'Trung bình' : 'Thấp';

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
                    <span className="vuln-card-labs">{vuln.labCount || 0} labs →</span>
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
