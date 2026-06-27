import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { vulnerabilities } from '@/lib/data';
import VulnIcon from '@/components/VulnIcon';

export const metadata = {
  title: 'Lỗ hổng bảo mật - SecHub',
  description: 'Danh sách các lỗ hổng bảo mật web phổ biến: SQL Injection, XSS, CSRF, IDOR, SSRF, và nhiều hơn nữa.',
};

export default function VulnerabilitiesPage() {
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

      <div className="grid-3" style={{ marginTop: 'var(--space-4)' }}>
        {vulnerabilities.map((vuln, index) => {
          const severityClass = vuln.severity === 'CRITICAL' ? 'badge-critical' : 
                                vuln.severity === 'HIGH' ? 'badge-high' : 
                                vuln.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';

          return (
            <Link
              key={vuln.id}
              href={`/vulnerabilities/${vuln.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card vuln-card animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.08}s`,
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
                  <span className={`badge ${severityClass}`}>{vuln.severity}</span>
                  <span className="vuln-card-labs">{vuln.labCount} labs →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
