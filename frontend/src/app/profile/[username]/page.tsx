'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Share2, ShieldCheck } from 'lucide-react';
import { api, PublicProfile } from '@/lib/api';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.growth.getPublicProfile(username).then(r => setProfile(r.data)).catch(e => setError(e.message)); }, [username]);
  const share = async () => {
    if (!profile) return;
    const data = { title: `Hồ sơ SecHub của ${profile.username}`, text: profile.shareText, url: window.location.href };
    if (navigator.share) await navigator.share(data); else await navigator.clipboard.writeText(`${data.text} ${data.url}`);
  };
  if (error) return <div className="growth-error">{error}</div>;
  if (!profile) return <div className="growth-loading">Đang tải hồ sơ kỹ năng...</div>;
  return <main className="growth-page">
    <Link href="/" className="back-link"><ArrowLeft size={15} /> Quay lại Dashboard</Link>
    <header className="growth-header"><div><span className="growth-eyebrow">Hồ sơ kỹ năng công khai</span><h1>{profile.username}</h1><p>Cấp {profile.level} · {profile.levelTitle} · {profile.completedLabs} lab hoàn thành</p></div><div className="growth-level"><strong>{profile.xp}</strong><span>XP</span></div></header>
    <section className="growth-section"><div className="growth-section-title"><div><ShieldCheck /><h2>Năng lực đã xác thực</h2></div><button className="btn btn-secondary" onClick={share}><Share2 size={15} /> Chia sẻ</button></div>
      <div className="skill-list">{profile.skills.map(skill => <div className="skill-row" key={skill.slug}><div><strong>{skill.name}</strong><span>Cấp {skill.level} · {skill.completedLabs} lab</span></div><div><i style={{ width: `${Math.min(100, skill.xp / 5)}%` }} /></div></div>)}</div>
    </section>
    <section className="growth-section profile-certificate"><div className="growth-section-title"><div><Award /><h2>Chứng nhận năng lực SecHub</h2></div><button className="btn btn-secondary certificate-print" onClick={() => window.print()}>In chứng nhận</button></div><div className="certificate-name">{profile.username}</div><p>{profile.shareText}</p><div className="badge-list">{profile.badges.map(badge => <span key={badge}>{badge}</span>)}</div><small>Mã xác minh: SECHUB-{profile.username.toUpperCase()}-L{profile.level}</small></section>
  </main>;
}
