'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { ArrowLeft, Award, Share2, ShieldCheck, Briefcase, Copy, FileText, Check, ExternalLink, Trophy } from 'lucide-react';
import { api, PublicProfile } from '@/lib/api';
import ActivityHeatmap from '@/components/ActivityHeatmap';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [printMode, setPrintMode] = useState<'certificate' | 'cv'>('certificate');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    document.title = language === 'vi' ? `Hồ sơ năng lực SecHub - ${username}` : `SecHub Competency Profile - ${username}`;
    api.growth.getPublicProfile(username)
      .then(r => setProfile(r.data))
      .catch(e => setError(e.message));
  }, [username, isAuthenticated, language]);

  const share = async () => {
    if (!profile) return;
    const data = {
      title: language === 'vi' ? `Hồ sơ năng lực SecHub - ${profile.username}` : `SecHub Competency Profile - ${profile.username}`,
      text: profile.shareText,
      url: window.location.href
    };
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(`${data.text}\nXem chi tiết tại: ${data.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const copyCvLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = (mode: 'certificate' | 'cv') => {
    setPrintMode(mode);
    if (mode === 'cv') {
      document.body.classList.add('print-mode-cv');
    } else {
      document.body.classList.remove('print-mode-cv');
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (authLoading) return <div className="growth-loading" style={{ padding: '80px 20px', textAlign: 'center' }}>{language === 'vi' ? 'Đang xác thực quyền truy cập...' : 'Verifying access rights...'}</div>;
  if (!isAuthenticated) return null;

  if (error) return <div className="growth-error" style={{ padding: '80px 20px', textAlign: 'center' }}>{error}</div>;
  if (!profile) return <div className="growth-loading" style={{ padding: '80px 20px', textAlign: 'center' }}>{language === 'vi' ? 'Đang tải hồ sơ kỹ năng...' : 'Loading skills profile...'}</div>;

  return (
    <main className="growth-page" style={{ maxWidth: '100%', padding: '0 0 80px' }}>
      <style>{`
        .cv-action-card {
          background: linear-gradient(135deg, var(--bg-brand-soft) 0%, rgba(56,189,248,0.04) 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(56, 189, 248, 0.05);
        }
        .cv-action-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 16px;
          color: var(--text-heading);
          margin-bottom: 4px;
        }
        .cv-action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .prof-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .prof-badge-master {
          background: rgba(16, 185, 129, 0.1);
          color: var(--fg-success-strong);
        }
        .prof-badge-learner {
          background: rgba(56, 189, 248, 0.1);
          color: var(--fg-brand);
        }
        @media print {
          .back-link, .cv-action-card, .btn-action-group, .certificate-print, .growth-section-title button {
            display: none !important;
          }
          body.print-mode-cv .profile-certificate {
            border: none !important;
            box-shadow: none !important;
            padding: 10px 0 !important;
            margin: 0 !important;
          }
          body.print-mode-cv .growth-page > header {
            display: block !important;
          }
          body.print-mode-cv .growth-page > .growth-section {
            display: block !important;
          }
        }
      `}</style>

      <Link href="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-body-subtle)', textDecoration: 'none', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
        <ArrowLeft size={16} /> {language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'}
      </Link>

      <div className="cv-action-card">
        <div>
          <div className="cv-action-title">
            <Briefcase size={18} style={{ color: 'var(--fg-brand)' }} />
            <span>{language === 'vi' ? 'Hồ sơ đã sẵn sàng để ứng tuyển CV' : 'Competency Profile Ready for Job Applications'}</span>
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-body)' }}>
            {language === 'vi' ? 'Chia sẻ chứng nhận năng lực bảo mật được xác thực thực tế từ SecHub tới nhà tuyển dụng.' : 'Share verified security credentials from SecHub with employers.'}
          </p>
        </div>
        <div className="cv-action-buttons">
          <button className="btn btn-secondary" onClick={copyCvLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            {copied ? <Check size={14} style={{ color: 'var(--fg-success-strong)' }} /> : <Copy size={14} />}
            {copied ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!') : (language === 'vi' ? 'Sao chép link CV' : 'Copy Profile Link')}
          </button>
          <button className="btn btn-primary" onClick={() => handlePrint('cv')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <FileText size={14} />
            {language === 'vi' ? 'Tải Hồ sơ CV (PDF)' : 'Download Profile CV (PDF)'}
          </button>
        </div>
      </div>

      <header className="growth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-neutral-primary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '30px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div>
          <span className="growth-eyebrow" style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--fg-brand)', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {language === 'vi' ? 'Hồ sơ năng lực an toàn thông tin' : 'Information Security Competency Profile'}
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>{profile.username}</h1>
          <p style={{ margin: 0, color: 'var(--text-body-subtle)', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{language === 'vi' ? 'Cấp' : 'Level'} {profile.level}</span>
            <span>•</span>
            <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{profile.levelTitle}</span>
            <span>•</span>
            <span>{profile.completedLabs} {language === 'vi' ? 'bài thực hành đã giải' : 'solved labs'}</span>
          </p>
        </div>
        <div className="growth-level" style={{ background: 'var(--bg-brand-soft)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '12px', padding: '16px 20px', textAlign: 'center', minWidth: '100px' }}>
          <strong style={{ display: 'block', fontSize: '28px', color: 'var(--fg-brand)', fontWeight: 900, lineHeight: 1.1 }}>{profile.xp}</strong>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-body-subtle)', letterSpacing: '0.05em' }}>{language === 'vi' ? 'Tích lũy XP' : 'Accumulated XP'}</span>
        </div>
      </header>

      <section className="growth-section" style={{ background: 'var(--bg-neutral-primary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '30px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div className="growth-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
            <Trophy size={20} style={{ color: 'var(--fg-brand)' }} />
            <span>{language === 'vi' ? 'Lịch sử hoạt động & Năng suất đóng góp' : 'Activity History & Contributions'}</span>
          </div>
        </div>
        <ActivityHeatmap username={username} noWrapper={true} />
      </section>

      <section className="growth-section" style={{ background: 'var(--bg-neutral-primary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '30px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div className="growth-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
            <ShieldCheck size={20} style={{ color: 'var(--fg-success-strong)' }} />
            <span>{language === 'vi' ? 'Năng lực thực tế được xác thực' : 'Verified Hands-on Skills'}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={share} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Share2 size={14} /> {language === 'vi' ? 'Chia sẻ năng lực' : 'Share profile'}
          </button>
        </div>
        <div className="skill-list" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {profile.skills.map(skill => (
            <div className="skill-row" key={skill.slug} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', alignItems: 'center', gap: '20px' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-heading)', fontSize: '14.5px' }}>{skill.name}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'Cấp' : 'Level'} {skill.level} ({skill.completedLabs} {language === 'vi' ? 'lab' : 'labs'})</span>
                  <span className={`prof-badge ${skill.level >= 3 ? 'prof-badge-master' : 'prof-badge-learner'}`}>
                    {skill.level >= 3 ? (language === 'vi' ? 'Chuyên gia' : 'Expert') : (language === 'vi' ? 'Đang học' : 'Learning')}
                  </span>
                </div>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-neutral-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, skill.xp / 5)}%`, background: 'var(--fg-brand)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
              </div>
              <b style={{ justifySelf: 'end', fontSize: '14.5px', color: 'var(--text-heading)' }}>{skill.xp} XP</b>
            </div>
          ))}
        </div>
      </section>

      <section className="growth-section profile-certificate" style={{ background: 'var(--bg-neutral-primary)', border: '2px solid var(--fg-brand)', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 40px rgba(36, 71, 168, 0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'var(--bg-brand-soft)', opacity: 0.15, borderRadius: '50%' }} />
        
        <div className="growth-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
            <Award size={20} style={{ color: 'var(--fg-brand)' }} />
            <span>{language === 'vi' ? 'Chứng nhận năng lực SecHub' : 'SecHub Competency Certificate'}</span>
          </div>
          <button className="btn btn-secondary btn-sm certificate-print" onClick={() => handlePrint('certificate')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={14} /> {language === 'vi' ? 'In chứng nhận' : 'Print Certificate'}
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '10px 0 20px 0' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-body-subtle)', letterSpacing: '0.1em' }}>{language === 'vi' ? 'Chứng chỉ danh dự được trao cho' : 'Honorary certificate awarded to'}</span>
          <div className="certificate-name" style={{ fontSize: '38px', fontWeight: 900, color: 'var(--fg-brand)', margin: '12px 0', letterSpacing: '-0.02em' }}>{profile.username}</div>
          <p style={{ maxWidth: '600px', margin: '0 auto 24px auto', fontSize: '15px', color: 'var(--text-body)', lineHeight: 1.6 }}>
            {profile.shareText}
          </p>
        </div>

        <div style={{ borderTop: '1px dashed var(--border-default)', borderBottom: '1px dashed var(--border-default)', padding: '20px 0', margin: '0 0 24px 0', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-body-subtle)', letterSpacing: '0.05em', marginBottom: '10px' }}>{language === 'vi' ? 'Huy hiệu danh giá đạt được' : 'Prestigious Badges Earned'}</span>
          <div className="badge-list" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.badges.map(badge => (
              <span key={badge} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-neutral-secondary)', border: '1px solid var(--border-default)', borderRadius: '20px', padding: '4px 14px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-heading)' }}>
                <Award size={14} style={{ color: 'var(--fg-brand)' }} /> {badge}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-body-subtle)' }}>
          <div>
            <span>{language === 'vi' ? 'Đơn vị xác thực:' : 'Authority:'} <strong>SecHub Security Sandbox</strong></span>
          </div>
          <div>
            <span>{language === 'vi' ? 'Mã xác minh:' : 'Verification Code:'} <code style={{ background: 'var(--bg-neutral-secondary)', padding: '2px 6px', borderRadius: '4px', fontStyle: 'normal', color: 'var(--text-heading)', fontWeight: 600 }}>SECHUB-{profile.username.toUpperCase()}-L{profile.level}</code></span>
          </div>
        </div>
      </section>
    </main>
  );
}
