'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Calendar, BookOpen, Flame, Snowflake, Award, History, RotateCw, ExternalLink, Loader2, Play } from 'lucide-react';
import { api, GrowthOverview, LabAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageBackLink from '@/components/PageBackLink';
import ActivityHeatmap from '@/components/ActivityHeatmap';

export default function PersonalProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [growth, setGrowth] = useState<GrowthOverview | null>(null);
  const [attempts, setAttempts] = useState<LabAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingTrack, setUpdatingTrack] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadProfileData() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const gRes = await api.growth.getOverview();
        setGrowth(gRes.data);
        const aRes = await api.labs.getMyAttempts();
        setAttempts(aRes.data);
      } catch (e) {
        console.error('Failed to load personal profile data', e);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [isAuthenticated, authLoading, router]);

  const changeTrack = async (newTrack: string) => {
    if (updatingTrack) return;
    setUpdatingTrack(true);
    try {
      const res = await api.growth.updateRecommendedTrack(newTrack);
      setGrowth(res.data);
      alert('Đã cập nhật Lộ trình khuyến nghị thành công!');
    } catch (e: any) {
      alert(e.message || 'Không thể cập nhật lộ trình.');
    } finally {
      setUpdatingTrack(false);
    }
  };

  const handleResetOnboarding = async () => {
    if (resetting) return;
    if (!confirm('Bạn có chắc chắn muốn làm lại bài đánh giá năng lực đầu vào? Toàn bộ tiến trình đề xuất sẽ được thiết lập lại (XP và huy hiệu hiện tại của bạn vẫn được giữ nguyên).')) {
      return;
    }
    setResetting(true);
    try {
      await api.growth.resetOnboarding();
      alert('Đã thiết lập lại trạng thái đánh giá năng lực. Bạn sẽ được chuyển hướng về trang chủ để thực hiện đánh giá lại!');
      router.push('/');
    } catch (e: any) {
      alert(e.message || 'Không thể thiết lập lại đánh giá.');
    } finally {
      setResetting(false);
    }
  };

  const getBadgeDescription = (badgeName: string) => {
    const name = badgeName.toLowerCase();
    if (name.includes('sqli')) return 'Đã giải quyết xuất sắc 2+ bài thực hành SQL Injection.';
    if (name.includes('idor')) return 'Đã bảo vệ tài nguyên an toàn trong 2+ bài thực hành IDOR.';
    if (name.includes('xss')) return 'Đã lọc sạch mã độc thành công trong 2+ bài thực hành XSS.';
    if (name.includes('access')) return 'Đã cấu trúc phân quyền chuẩn trong 2+ bài thực hành Access Control.';
    if (name.includes('perfect')) return 'Hoàn thành bài thực hành mà không sử dụng gợi ý (0 hints).';
    if (name.includes('zero')) return 'Gợi ý trung bình bằng 0 cho tối thiểu 2 bài thực hành chuyên đề.';
    if (name.includes('first')) return 'Mở khóa khi giải thành công bài thực hành đầu tiên trên SecHub.';
    if (name.includes('explorer')) return 'Khám phá và giải thành công 5+ phòng lab thực hành.';
    if (name.includes('knowledge')) return 'Đã tích lũy kiến thức qua việc hoàn thành đọc 10+ bài lý thuyết.';
    return 'Huy hiệu chuyên đề bảo mật xuất sắc.';
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--fg-brand)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-body-subtle)' }}>Đang tải thông tin cá nhân...</span>
      </div>
    );
  }

  if (!user || !growth) return null;

  return (
    <div style={{ maxWidth: '100%' }}>
      <PageBackLink href="/" label="Quay lại Dashboard" />

      {/* Profile Overview Header Card */}
      <div style={{
        background: 'var(--bg-neutral-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'var(--bg-brand)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 800,
            boxShadow: 'var(--shadow-clay-brand-medium)'
          }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>{user.username}</h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                background: user.role === 'INSTRUCTOR' ? 'rgba(234,179,8,0.1)' : 'rgba(56,189,248,0.1)',
                color: user.role === 'INSTRUCTOR' ? 'var(--fg-yellow-strong)' : 'var(--fg-brand-strong)',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                {user.role === 'USER' ? 'Học viên' : user.role === 'INSTRUCTOR' ? 'Tác giả' : 'Quản trị viên'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {user.email}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Shield size={14} /> Cấp {growth.level} · {growth.levelTitle}</span>
            </p>
          </div>
        </div>

        <div>
          <NextLink href={`/profile/${user.username}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: 700 }}>
            <ExternalLink size={16} /> Xem CV công khai
          </NextLink>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Settings and History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Activity Heatmap */}
          <ActivityHeatmap noWrapper={false} />
          
          {/* Recommended Track Settings */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--fg-brand)' }} /> Lộ trình học & AI thích ứng
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-body-subtle)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Lộ trình này giúp hệ thống xác định các bài học tiếp theo trên Dashboard và tự động điều chỉnh kịch bản kịch tính Docker Sandbox của AI Mentor cho phù hợp với bạn.
            </p>

            <div style={{ background: 'var(--bg-neutral-secondary-light)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-body-subtle)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Lộ trình khuyến nghị hiện tại:
              </div>
              <strong style={{ fontSize: '16px', color: 'var(--fg-brand)' }}>
                {growth.recommendedTrack === 'BEGINNER' ? 'Người mới (Beginner)' : growth.recommendedTrack === 'WEB_DEVELOPER' ? 'Web Developer' : 'Pentester (Chuyên gia)'}
              </strong>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '10px' }}>Thay đổi lộ trình:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'BEGINNER', label: 'Beginner' },
                  { value: 'WEB_DEVELOPER', label: 'Web Developer' },
                  { value: 'PENTESTER', label: 'Pentester' }
                ].map((trackOption) => (
                  <button
                    key={trackOption.value}
                    onClick={() => changeTrack(trackOption.value)}
                    disabled={updatingTrack || growth.recommendedTrack === trackOption.value}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: growth.recommendedTrack === trackOption.value ? '2px solid var(--border-brand)' : '1px solid var(--border-default)',
                      background: growth.recommendedTrack === trackOption.value ? 'var(--bg-brand-softer)' : '#fff',
                      color: growth.recommendedTrack === trackOption.value ? 'var(--fg-brand-strong)' : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: growth.recommendedTrack === trackOption.value ? 'default' : 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {trackOption.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-heading)', display: 'block' }}>Muốn đánh giá lại năng lực?</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>Làm lại 5 câu khảo sát đầu vào để AI tự động phân bổ lại lộ trình.</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetOnboarding}
                disabled={resetting}
                style={{ whiteSpace: 'nowrap' }}
              >
                {resetting ? 'Đang thiết lập...' : 'Làm lại đánh giá'}
              </button>
            </div>
          </section>

          {/* Full Attempts History */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--fg-brand)' }} /> Lịch sử thực hành phòng Lab ({attempts.length})
            </h2>

            {attempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-body-subtle)', fontSize: '13.5px' }}>
                Bạn chưa tham gia thực hành phòng lab nào. Hãy bắt đầu một lab để ghi điểm!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      background: 'var(--bg-neutral-secondary-light)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '10px',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-heading)', display: 'block' }}>
                        {attempt.labTitle || `Sandbox Lab #${attempt.labId}`}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-body-subtle)', display: 'block', marginTop: '2px' }}>
                        Bắt đầu: {new Date(attempt.startedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Status Badge */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: attempt.status === 'COMPLETED' ? 'rgba(0,122,85,0.1)' : 'rgba(249,115,22,0.1)',
                        color: attempt.status === 'COMPLETED' ? 'var(--fg-success-strong)' : 'var(--fg-warning)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {attempt.status === 'COMPLETED' ? 'Thành công' : 'Đang thực hành'}
                      </span>

                      {/* Score */}
                      <span style={{ fontSize: '13.5px', color: 'var(--text-heading)', fontWeight: 700 }}>
                        {attempt.score ? `+${attempt.score} XP` : '0 XP'}
                      </span>

                      {/* Hints Penalty Info */}
                      <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>
                        {attempt.hintsUsed ? `${attempt.hintsUsed} gợi ý` : '0 gợi ý'}
                      </span>

                      {/* Quick Play Redirect */}
                      <NextLink href={`/labs/${attempt.labId}/play`} className="btn btn-icon btn-sm" title="Vào lại phòng thực hành">
                        <Play size={14} />
                      </NextLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Streaks and Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Streak & Tickets Card */}
          <section className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nhịp học tích lũy</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', color: 'var(--bg-warning)', display: 'grid', placeItems: 'center' }}>
                <Flame size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '16px', color: 'var(--text-heading)', display: 'block' }}>{growth.streak} ngày</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>Chuỗi ngày học liên tục</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56,189,248,0.1)', color: 'var(--fg-brand)', display: 'grid', placeItems: 'center' }}>
                <Snowflake size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '16px', color: 'var(--text-heading)', display: 'block' }}>{growth.freezeTickets} vé</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>Vé bảo toàn phòng hờ</span>
              </div>
            </div>
          </section>

          {/* Badges List Card */}
          <section className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: 'var(--fg-brand)' }} /> Huy hiệu của tôi ({growth.badges.length})
            </h3>

            {growth.badges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-body-subtle)', fontSize: '13px' }}>
                Hoàn thành bài học hoặc giải lab đầu tiên để tích lũy huy hiệu danh giá.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {growth.badges.map((badge) => (
                  <div
                    key={badge}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '12px',
                      background: 'var(--bg-neutral-secondary-light)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-brand-soft)',
                      color: 'var(--fg-brand)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <Award size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-heading)', display: 'block' }}>{badge}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-body-subtle)', display: 'block', marginTop: '2px', lineHeight: 1.4 }}>
                        {getBadgeDescription(badge)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
