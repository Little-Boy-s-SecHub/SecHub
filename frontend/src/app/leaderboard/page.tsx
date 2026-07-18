'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Trophy, Crown, ArrowLeft, ArrowRight, Award, Shield, User, Loader2, Sparkles } from 'lucide-react';
import { api, LeaderboardEntry, GrowthOverview } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import PageBackLink from '@/components/PageBackLink';

export default function LeaderboardPage() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useTranslation();
  const [track, setTrack] = useState<string>(''); // empty means ALL
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [growth, setGrowth] = useState<GrowthOverview | null>(null);
  const currentUser = api.auth.getCurrentUser();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.growth.getLeaderboard(track || undefined);
        setLeaders(res.data);
        if (isAuthenticated) {
          const gRes = await api.growth.getOverview();
          setGrowth(gRes.data);
        }
      } catch (e) {
        console.error('Lỗi khi tải bảng xếp hạng', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [track, isAuthenticated]);

  // Separate top 3 for podium
  const top1 = leaders[0] || null;
  const top2 = leaders[1] || null;
  const top3 = leaders[2] || null;

  const tracks = [
    { value: '', label: t('leaderboard.allTracks') },
    { value: 'BEGINNER', label: t('common.beginner') },
    { value: 'WEB_DEVELOPER', label: 'Web Developer' },
    { value: 'PENTESTER', label: 'Pentester' },
  ];

  return (
    <div>
      <PageBackLink href="/" label={language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'} />

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-brand-softer) 0%, rgba(56, 189, 248, 0.05) 100%)',
        border: '1px solid var(--border-brand-subtle)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-20px',
          opacity: 0.05,
          color: 'var(--fg-brand)'
        }}>
          <Trophy size={160} />
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: 'var(--bg-brand)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'var(--shadow-clay-brand-medium)'
        }}>
          <Trophy size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px 0' }}>{t('leaderboard.title')}</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-body-subtle)', lineHeight: 1.5, maxWidth: '600px' }}>
            {t('leaderboard.subtitle')}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--border-default)'
      }}>
        {tracks.map((t) => (
          <button
            key={t.value}
            onClick={() => setTrack(t.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: track === t.value ? '1px solid var(--border-brand)' : '1px solid var(--border-default)',
              background: track === t.value ? 'var(--bg-brand)' : 'var(--bg-neutral-primary)',
              color: track === t.value ? '#fff' : 'var(--text-body)',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: track === t.value ? 'var(--shadow-clay-brand-small)' : 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--fg-brand)' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-body-subtle)' }}>{t('common.loading')}</span>
        </div>
      ) : (
        <>
          {leaders.length === 0 ? (
            <div style={{
              background: 'var(--bg-neutral-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-body-subtle)',
              fontSize: '14.5px'
            }}>
              <Trophy size={48} style={{ color: 'var(--border-default-medium)', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>{t('leaderboard.noData')}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{language === 'vi' ? 'Hãy hoàn thành một bài lab để là người dẫn đầu đầu tiên!' : 'Complete a lab to be the first leader!'}</p>
            </div>
          ) : (
            <>
              {/* Podium Section for top 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '16px',
                margin: '32px 0 40px 0',
                padding: '0 8px',
                flexWrap: 'wrap'
              }}>
                {/* Rank 2 */}
                {top2 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '180px',
                    order: 1
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--bg-neutral-tertiary)',
                      border: '3px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#475569',
                      marginBottom: '12px',
                      position: 'relative',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                      {top2.username.charAt(0).toUpperCase()}
                      <span style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '-6px',
                        background: '#cbd5e1',
                        color: '#334155',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff'
                      }}>2</span>
                    </div>
                    <NextLink href={`/profile/${top2.username}`} style={{ textDecoration: 'none', color: 'var(--text-heading)', fontWeight: 700, fontSize: '15px', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top2.username}
                    </NextLink>
                    <span style={{ color: 'var(--fg-brand)', fontWeight: 800, fontSize: '14px', marginTop: '2px' }}>{top2.weeklyXp} XP</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-body-subtle)', background: 'var(--bg-neutral-secondary)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top2.strongestSkill}
                    </span>
                    {/* Podium Pillar */}
                    <div style={{
                      width: '100%',
                      height: '90px',
                      background: 'linear-gradient(180deg, var(--bg-neutral-secondary-medium) 0%, var(--bg-neutral-tertiary) 100%)',
                      border: '1px solid var(--border-default)',
                      borderBottom: 'none',
                      borderRadius: '8px 8px 0 0',
                      marginTop: '16px',
                      textAlign: 'center',
                      lineHeight: '90px',
                      fontWeight: 800,
                      fontSize: '32px',
                      color: 'var(--text-body-subtle)',
                    }}>
                      II
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '180px',
                    order: 1,
                    opacity: 0.4
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--bg-neutral-secondary-medium)',
                      border: '3px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--text-body-subtle)',
                      marginBottom: '12px',
                      position: 'relative'
                    }}>
                      ?
                      <span style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '-6px',
                        background: 'var(--bg-neutral-tertiary)',
                        color: 'var(--text-body-subtle)',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-neutral-primary)'
                      }}>2</span>
                    </div>
                    <span style={{ color: 'var(--text-body-subtle)', fontWeight: 600, fontSize: '15px' }}>
                      {language === 'vi' ? 'Trống' : 'Empty'}
                    </span>
                    <span style={{ color: 'var(--text-body-subtle)', fontWeight: 500, fontSize: '13px', marginTop: '2px' }}>0 XP</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-body-subtle)', background: 'var(--bg-neutral-secondary-soft)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', minHeight: '21px' }}>
                      —
                    </span>
                    {/* Podium Pillar */}
                    <div style={{
                      width: '100%',
                      height: '90px',
                      background: 'linear-gradient(180deg, var(--bg-neutral-secondary-medium) 0%, var(--bg-neutral-tertiary) 100%)',
                      border: '1px solid var(--border-default)',
                      borderBottom: 'none',
                      borderRadius: '8px 8px 0 0',
                      marginTop: '16px',
                      textAlign: 'center',
                      lineHeight: '90px',
                      fontWeight: 800,
                      fontSize: '32px',
                      color: 'var(--text-body-subtle)',
                    }}>
                      II
                    </div>
                  </div>
                )}

                {/* Rank 1 */}
                {top1 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '200px',
                    order: 2,
                    transform: 'translateY(-12px)'
                  }}>
                    <div style={{ marginBottom: '4px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Crown size={28} style={{ filter: 'drop-shadow(0 2px 4px rgba(251,191,36,0.2))' }} />
                    </div>
                    <div style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--bg-brand-softer) 0%, rgba(56, 189, 248, 0.15) 100%)',
                      border: '4px solid #fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--fg-brand-strong)',
                      marginBottom: '12px',
                      position: 'relative',
                      boxShadow: '0 8px 24px rgba(251,191,36,0.15)'
                    }}>
                      {top1.username.charAt(0).toUpperCase()}
                      <span style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        background: '#fbbf24',
                        color: '#fff',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff'
                      }}>1</span>
                    </div>
                    <NextLink href={`/profile/${top1.username}`} style={{ textDecoration: 'none', color: 'var(--text-heading)', fontWeight: 800, fontSize: '17px', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top1.username}
                    </NextLink>
                    <span style={{ color: 'var(--fg-brand)', fontWeight: 900, fontSize: '16px', marginTop: '2px' }}>{top1.weeklyXp} XP</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-body-subtle)', background: 'var(--bg-brand-softer)', border: '1px solid var(--border-brand-subtle)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top1.strongestSkill}
                    </span>
                    {/* Podium Pillar */}
                    <div style={{
                      width: '100%',
                      height: '130px',
                      background: 'linear-gradient(180deg, var(--bg-brand-softer) 0%, rgba(56, 189, 248, 0.08) 100%)',
                      border: '1px solid var(--border-brand-subtle)',
                      borderBottom: 'none',
                      borderRadius: '8px 8px 0 0',
                      marginTop: '16px',
                      textAlign: 'center',
                      lineHeight: '130px',
                      fontWeight: 800,
                      fontSize: '36px',
                      color: 'var(--fg-brand)',
                    }}>
                      I
                    </div>
                  </div>
                )}

                {/* Rank 3 */}
                {top3 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '180px',
                    order: 3
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--bg-neutral-tertiary)',
                      border: '3px solid #d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#7c2d12',
                      marginBottom: '12px',
                      position: 'relative',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                      {top3.username.charAt(0).toUpperCase()}
                      <span style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '-6px',
                        background: '#d97706',
                        color: '#fff',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff'
                      }}>3</span>
                    </div>
                    <NextLink href={`/profile/${top3.username}`} style={{ textDecoration: 'none', color: 'var(--text-heading)', fontWeight: 700, fontSize: '15px', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top3.username}
                    </NextLink>
                    <span style={{ color: 'var(--fg-brand)', fontWeight: 800, fontSize: '14px', marginTop: '2px' }}>{top3.weeklyXp} XP</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-body-subtle)', background: 'var(--bg-neutral-secondary)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top3.strongestSkill}
                    </span>
                    {/* Podium Pillar */}
                    <div style={{
                      width: '100%',
                      height: '70px',
                      background: 'linear-gradient(180deg, var(--bg-neutral-secondary-medium) 0%, var(--bg-neutral-tertiary) 100%)',
                      border: '1px solid var(--border-default)',
                      borderBottom: 'none',
                      borderRadius: '8px 8px 0 0',
                      marginTop: '16px',
                      textAlign: 'center',
                      lineHeight: '70px',
                      fontWeight: 800,
                      fontSize: '32px',
                      color: 'var(--text-body-subtle)',
                    }}>
                      III
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '180px',
                    order: 3,
                    opacity: 0.4
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--bg-neutral-secondary-medium)',
                      border: '3px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--text-body-subtle)',
                      marginBottom: '12px',
                      position: 'relative'
                    }}>
                      ?
                      <span style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '-6px',
                        background: 'var(--bg-neutral-tertiary)',
                        color: 'var(--text-body-subtle)',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        fontSize: '11px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-neutral-primary)'
                      }}>3</span>
                    </div>
                    <span style={{ color: 'var(--text-body-subtle)', fontWeight: 600, fontSize: '15px' }}>
                      {language === 'vi' ? 'Trống' : 'Empty'}
                    </span>
                    <span style={{ color: 'var(--text-body-subtle)', fontWeight: 500, fontSize: '13px', marginTop: '2px' }}>0 XP</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-body-subtle)', background: 'var(--bg-neutral-secondary-soft)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', minHeight: '21px' }}>
                      —
                    </span>
                    {/* Podium Pillar */}
                    <div style={{
                      width: '100%',
                      height: '70px',
                      background: 'linear-gradient(180deg, var(--bg-neutral-secondary-medium) 0%, var(--bg-neutral-tertiary) 100%)',
                      border: '1px solid var(--border-default)',
                      borderBottom: 'none',
                      borderRadius: '8px 8px 0 0',
                      marginTop: '16px',
                      textAlign: 'center',
                      lineHeight: '70px',
                      fontWeight: 800,
                      fontSize: '32px',
                      color: 'var(--text-body-subtle)',
                    }}>
                      III
                    </div>
                  </div>
                )}
              </div>

              {/* Ranks List */}
              <div style={{
                background: 'var(--bg-neutral-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
              }}>
                <style>{`
                  .leaderboard-row-highlight:hover {
                    background-color: var(--bg-neutral-secondary-medium) !important;
                  }
                  .leaderboard-link-user:hover {
                    color: var(--fg-brand) !important;
                  }
                `}</style>
                {leaders.map((entry, index) => {
                  const isCurrentUser = currentUser?.username === entry.username;
                  return (
                    <div
                      key={entry.username}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: isCurrentUser ? 'var(--bg-brand-softer)' : 'transparent',
                        borderBottom: index === leaders.length - 1 ? 'none' : '1px solid var(--border-default)',
                        borderLeft: isCurrentUser ? '4px solid var(--fg-brand)' : 'none',
                        borderRadius: isCurrentUser ? '8px' : '0',
                        margin: isCurrentUser ? '4px 0' : '0',
                        transition: 'background-color 0.2s',
                      }}
                      className="leaderboard-row-highlight"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : index === 2 ? '#d97706' : 'var(--bg-neutral-tertiary)',
                          color: index === 0 || index === 2 ? '#fff' : 'var(--text-heading)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11.5px',
                          fontWeight: 800,
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {index === 0 && <Crown size={14} style={{ color: '#fbbf24' }} />}
                          <NextLink
                            href={`/profile/${entry.username}`}
                            style={{
                              textDecoration: 'none',
                              color: 'var(--text-heading)',
                              fontWeight: isCurrentUser ? 800 : 700,
                              fontSize: '14px',
                            }}
                            className="leaderboard-link-user"
                          >
                            {entry.username} {isCurrentUser && ` (${t('common.you')})`}
                          </NextLink>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '12px',
                        color: 'var(--text-body-subtle)',
                        background: isCurrentUser ? 'var(--bg-neutral-primary)' : 'var(--bg-neutral-secondary-light)',
                        border: '1px solid var(--border-default)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 500,
                      }}>
                        {t('leaderboard.strongestSkill')}: {entry.strongestSkill}
                      </span>

                      <strong style={{ color: 'var(--fg-brand)', fontWeight: 800, fontSize: '14.5px', minWidth: '60px', textAlign: 'right' }}>
                        {entry.weeklyXp} XP
                      </strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
