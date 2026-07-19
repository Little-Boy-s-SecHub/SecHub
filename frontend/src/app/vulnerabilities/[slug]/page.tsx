'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Unlock, 
  ShieldAlert, 
  FlaskConical, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { api, Vulnerability, Lab } from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';
import VulnIcon from '@/components/VulnIcon';

export default function VulnerabilityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language } = useTranslation();
  
  const [vuln, setVuln] = useState<Vulnerability | null>(null);
  const [relatedLabs, setRelatedLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const vulnRes = await api.vulnerabilities.getBySlug(slug);
        if (vulnRes.success && vulnRes.data) {
          setVuln(vulnRes.data);
          
          // Load related labs
          const labsRes = await api.vulnerabilities.getLabs(vulnRes.data.id);
          if (labsRes.success) {
            setRelatedLabs(labsRes.data);
          }
        } else {
          setError(language === 'vi' ? 'Không tìm thấy thông tin lỗ hổng bảo mật.' : 'Vulnerability information not found.');
        }
      } catch (e: unknown) {
        const err = e as Error;
        setError(err.message || (language === 'vi' ? 'Lỗi khi tải dữ liệu lỗ hổng.' : 'Error loading vulnerability details.'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug, language]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>{language === 'vi' ? 'Đang tải thông tin...' : 'Loading details...'}</div>;
  }

  if (error || !vuln) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <AlertCircle size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>{language === 'vi' ? 'Lỗi dữ liệu' : 'Data Error'}</h3>
        <p style={{ margin: 'var(--space-1) auto' }}>{error || (language === 'vi' ? 'Không tìm thấy thông tin lỗ hổng.' : 'Vulnerability not found.')}</p>
        <Link href="/vulnerabilities" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 'var(--space-2)' }}>
          {language === 'vi' ? 'Quay lại danh sách lỗ hổng' : 'Back to Vulnerabilities'}
        </Link>
      </div>
    );
  }

  const severityClass = vuln.severity === 'CRITICAL' ? 'badge-critical' : 
                        vuln.severity === 'HIGH' ? 'badge-high' : 
                        vuln.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  const severityLabel = vuln.severity === 'CRITICAL' ? (language === 'vi' ? 'Cực kỳ nghiêm trọng' : 'Critical') :
                        vuln.severity === 'HIGH' ? (language === 'vi' ? 'Cao' : 'High') :
                        vuln.severity === 'MEDIUM' ? (language === 'vi' ? 'Trung bình' : 'Medium') : (language === 'vi' ? 'Thấp' : 'Low');

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
        <Link href="/vulnerabilities" style={{ color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'Lỗ hổng bảo mật' : 'Vulnerabilities'}</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-heading)' }}>{vuln.name}</span>
      </div>

      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--fg-brand)' }}>
            <VulnIcon name={vuln.icon} size={40} />
          </span>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{vuln.name}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px' }}>
              <span className={`badge ${severityClass}`}>{severityLabel}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-body-subtle)' }}>
                {relatedLabs.length} {language === 'vi' ? 'bài lab thực hành' : 'practice labs'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
        {/* Main Content */}
        <div>
          {/* Overview */}
          <div className="card animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Tổng quan' : 'Overview'}
            </h3>
            <p style={{ lineHeight: 1.8 }}>{vuln.description}</p>
          </div>

          {/* Exploitation */}
          {vuln.exploitationGuide && (
            <div className="card animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Unlock size={18} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Phương pháp khai thác' : 'Exploitation Methodology'}
              </h3>
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-line', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
                {vuln.exploitationGuide}
              </div>
            </div>
          )}

          {/* Prevention */}
          {vuln.preventionGuide && (
            <div className="card animate-fade-in-up animate-delay-3" style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Phương pháp phòng chống' : 'Remediation & Prevention'}
              </h3>
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-line', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
                {vuln.preventionGuide}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Related Labs */}
          <div className="card animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-3)', position: 'sticky', top: 'calc(var(--header-height) + var(--space-3))' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.125rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={18} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Bài Lab thực hành' : 'Practice Labs'}
            </h3>
            {relatedLabs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {relatedLabs.map((lab) => {
                  const diffClass = lab.difficulty === 'BEGINNER' ? 'badge-easy' : 
                                    lab.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                                    'badge-hard';
                  
                  const difficultyLabel = lab.difficulty === 'BEGINNER' ? (language === 'vi' ? 'Dễ' : 'Easy') :
                                          lab.difficulty === 'INTERMEDIATE' ? (language === 'vi' ? 'Trung bình' : 'Medium') : (language === 'vi' ? 'Khó' : 'Hard');
                  return (
                    <Link key={lab.id} href={`/labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: 'var(--space-2)',
                        background: 'var(--bg-neutral-tertiary)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--border-default)',
                        transition: 'all var(--transition-fast)',
                        cursor: 'pointer',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className={`badge ${diffClass}`} style={{ fontSize: '0.6875rem' }}>{difficultyLabel}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)' }}>{lab.points} pts</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>{lab.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {lab.estimatedMinutes} {language === 'vi' ? 'phút' : 'mins'}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-body-subtle)' }}>
                {language === 'vi' ? 'Chưa có bài lab cho lỗ hổng này.' : 'No labs available for this vulnerability yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
