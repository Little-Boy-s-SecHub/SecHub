'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { 
  Lock, 
  FlaskConical, 
  BookOpen, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCw, 
  Clock, 
  Trophy, 
  Link as LinkIcon,
  ArrowRight,
  MonitorPlay,
  Flame,
  Snowflake,
  CalendarDays,
  Bell,
  TrendingUp,
  Sparkles,
  Award,
  ShieldCheck,
  Crown,
  AlertTriangle,
  Target,
  Lightbulb
} from 'lucide-react';
import { api, Vulnerability, LearningPath, Lab, LabAttempt, ResumeLearning, GrowthOverview, LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import VulnIcon from '@/components/VulnIcon';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import NewUserOnboarding from '@/components/NewUserOnboarding';
import { useRouter } from 'next/navigation';

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="card stat-card">
      <div className={`stat-value ${color}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function TerminalHero() {
  return (
    <div className="terminal" style={{ maxWidth: '100%' }}>
      <div className="terminal-header">
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="terminal-dot red"></span>
          <span className="terminal-dot yellow"></span>
          <span className="terminal-dot green"></span>
        </div>
        <span className="terminal-title">sechub@pentest ~ </span>
        <div style={{ width: '50px' }}></div>
      </div>
      <div className="terminal-body">
        <div><span className="terminal-prompt">┌──(sechub㉿kali)-[~]</span></div>
        <div><span className="terminal-prompt">└─$ </span><span className="terminal-command">nmap -sV --script vuln target.sechub.local</span></div>
        <div style={{ marginTop: '8px' }}>
          <span className="terminal-output">Starting Nmap 7.94 ( https://nmap.org )</span>
        </div>
        <div><span className="terminal-output">Scanning target.sechub.local (10.10.10.1)...</span></div>
        <div><span className="terminal-output">PORT     STATE SERVICE  VERSION</span></div>
        <div><span className="terminal-success">80/tcp   open  http     Apache 2.4.41</span></div>
        <div><span className="terminal-success">443/tcp  open  ssl/http nginx 1.18.0</span></div>
        <div><span className="terminal-error">3306/tcp open  mysql    MySQL 5.7.31</span></div>
        <div style={{ marginTop: '8px' }}>
          <span className="terminal-success">[+] Found 3 potential vulnerabilities</span>
        </div>
        <div><span className="terminal-success">[+] SQL Injection detected on /login endpoint</span></div>
        <div>
          <span className="terminal-prompt">└─$ </span>
          <span className="terminal-command" style={{ borderRight: '2px solid var(--fg-brand)', paddingRight: '2px', animation: 'blink 1s step-end infinite' }}>_</span>
        </div>
      </div>
    </div>
  );
}

function VulnMiniCard({ vuln }: { vuln: Vulnerability }) {
  const { language } = useTranslation();
  const severityClass = vuln.severity === 'CRITICAL' ? 'badge-critical' : 
                        vuln.severity === 'HIGH' ? 'badge-high' : 
                        vuln.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';
  return (
    <NextLink href={`/vulnerabilities/${vuln.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card vuln-card">
        <div className="vuln-card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VulnIcon name={vuln.icon} size={24} />
        </div>
        <div className="vuln-card-title">{vuln.name}</div>
        <div className="vuln-card-desc">{vuln.description}</div>
        <div className="vuln-card-footer">
          <span className={`badge ${severityClass}`}>{vuln.severity}</span>
          <span className="vuln-card-labs">{vuln.labCount || 0} {language === 'vi' ? 'phòng lab' : 'labs'}</span>
        </div>
      </div>
    </NextLink>
  );
}

function PathMiniCard({ path }: { path: LearningPath }) {
  const { language } = useTranslation();
  const lessonCount = path.lessonCount || 0;
  const completedLessons = path.completedLessons || 0;
  const progress = lessonCount > 0 ? (completedLessons / lessonCount) * 100 : 0;
  const diffClass = path.difficulty === 'BEGINNER' ? 'badge-easy' : 
                    path.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                    path.difficulty === 'ADVANCED' ? 'badge-hard' : 'badge-expert';
  return (
    <NextLink href={`/learning/${path.id}`} style={{ textDecoration: 'none' }}>
      <div className="card path-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={`badge ${diffClass}`}>{path.difficulty}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-body-subtle)' }}>
            {path.estimatedHours}h
          </span>
        </div>
        <div className="path-card-title">{path.title}</div>
        <div className="path-card-desc">{path.description}</div>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-body-subtle)' }}>
            <span>{completedLessons}/{lessonCount} {language === 'vi' ? 'bài học' : 'lessons'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </NextLink>
  );
}

function RecentLabCard({ attempt }: { attempt: LabAttempt }) {
  const { language } = useTranslation();
  const isExpired = attempt.expiresAt && new Date(attempt.expiresAt) < new Date();
  const statusContent = attempt.status === 'COMPLETED' ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-success-strong)' }}>
      <CheckCircle2 size={14} /> {language === 'vi' ? 'Hoàn thành' : 'Completed'}
    </span>
  ) : (attempt.status === 'RUNNING' || attempt.status === 'STARTED') && !isExpired ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-brand)' }}>
      <RotateCw size={14} style={{ animation: 'spin 3s linear infinite' }} /> {language === 'vi' ? 'Đang chạy' : 'Running'}
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-body-subtle)' }}>
      {language === 'vi' ? 'Chưa hoàn thành' : 'Incomplete'}
    </span>
  );

  return (
    <NextLink href={`/labs/${attempt.labId}`} style={{ textDecoration: 'none' }}>
      <div className="card lab-card">
        <div className="lab-card-header">
          <span className={`badge badge-medium-diff`}>Attempt</span>
          {statusContent}
        </div>
        <div className="lab-card-title">{attempt.labTitle}</div>
        <div className="lab-card-desc">{language === 'vi' ? 'Bắt đầu lúc' : 'Started at'}: {new Date(attempt.startedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</div>
        <div className="lab-card-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trophy size={12} /> {attempt.score} {language === 'vi' ? 'điểm' : 'pts'}
          </span>
          <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {language === 'vi' ? 'Gợi ý đã dùng' : 'Hints used'}: {attempt.hintsUsed}
          </span>
        </div>
      </div>
    </NextLink>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [attempts, setAttempts] = useState<LabAttempt[]>([]);
  const [resume, setResume] = useState<ResumeLearning | null>(null);
  const [lessonResume, setLessonResume] = useState<ResumeLearning | null>(null);
  const [growth, setGrowth] = useState<GrowthOverview | null>(null);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [openingWeekly, setOpeningWeekly] = useState(false);
  const [stats, setStats] = useState({
    totalVulnerabilities: 8,
    totalLabs: 14,
    completedLabs: 0,
    totalPoints: 0,
    progressPercentage: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vulnsRes, pathsRes, labsRes] = await Promise.all([
          api.vulnerabilities.getAll(),
          api.learningPaths.getAll(),
          api.labs.getLabs()
        ]);

        if (vulnsRes.success) setVulns(vulnsRes.data);
        if (pathsRes.success) setPaths(pathsRes.data);

        let totalLabsCount = 14;
        if (labsRes.success && labsRes.data) {
          totalLabsCount = labsRes.data.length;
        }

        setStats(prev => ({
          ...prev,
          totalVulnerabilities: vulnsRes.data?.length || 8,
          totalLabs: totalLabsCount,
        }));

        if (isAuthenticated) {
          const [dashboardRes, attemptsRes, resumeRes, lessonResumeRes, growthRes] = await Promise.all([
            api.users.getDashboard(),
            api.labs.getMyAttempts(),
            api.users.getResume(),
            api.users.getResume(true),
            api.growth.getOverview()
          ]);

          if (dashboardRes.success && dashboardRes.data) {
            const d = dashboardRes.data;
            setStats({
              totalVulnerabilities: vulnsRes.data?.length || 8,
              totalLabs: totalLabsCount,
              completedLabs: d.completedLabs || 0,
              totalPoints: d.totalScore || 0,
              progressPercentage: Math.round(d.progressPercentage || 0),
            });
          }

          if (attemptsRes.success && attemptsRes.data) {
            setAttempts(attemptsRes.data);
          }
          if (resumeRes.success) setResume(resumeRes.data);
          if (lessonResumeRes.success) setLessonResume(lessonResumeRes.data);
          if (growthRes.success) {
            setGrowth(growthRes.data);
            api.growth.getLeaderboard(growthRes.data.recommendedTrack).then(result => setWeeklyLeaders(result.data)).catch(() => undefined);
          }
        }
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  const openWeeklyChallenge = async () => {
    setOpeningWeekly(true);
    try {
      const res = await api.growth.getWeeklyLab();
      router.push(`/labs/${res.data.id}/play`);
    } catch (e: any) {
      alert(e.message || (language === 'vi' ? 'Chưa thể mở thử thách tuần.' : 'Cannot open weekly challenge at this time.'));
      setOpeningWeekly(false);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          {growth?.onboardingRequired && <NewUserOnboarding onComplete={setGrowth} />}
          
          {resume && (
            <section className="continue-learning" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="continue-learning-icon">
                {resume.type === 'LAB' ? <MonitorPlay size={22} /> : <BookOpen size={22} />}
              </div>
              <div className="continue-learning-copy">
                <div className="continue-learning-kicker">{resume.type === 'LAB' ? (language === 'vi' ? 'Phiên thực hành đang mở' : 'Active lab sandbox') : t('dashboard.continueLearning')}</div>
                <h2>{resume.title}</h2>
                <p>{resume.subtitle}{resume.type === 'LESSON' && typeof resume.progress === 'number' ? ` · ${language === 'vi' ? 'Đã đọc' : 'Read'} ${resume.progress}%` : ''}</p>
              </div>
              <NextLink href={resume.url} className="btn btn-primary continue-learning-button">
                {t('dashboard.continueButton')} <ArrowRight size={16} />
              </NextLink>
            </section>
          )}

          {growth && !growth.onboardingRequired && (
            <>
              {/* Bảng xếp hạng tuần - Đưa lên trên cùng */}
              <section className="dashboard-community" aria-label={t('dashboard.weeklyLeaderboard')} style={{ marginBottom: 'var(--space-4)', padding: '16px 20px', border: '1px solid var(--border-default)', borderRadius: '12px', background: 'var(--bg-neutral-primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                <div className="dashboard-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={18} style={{ color: 'var(--fg-brand)' }} />
                    <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                      {t('dashboard.weeklyLeaderboard')}
                    </h2>
                  </div>
                  <NextLink 
                    href="/leaderboard"
                    style={{ 
                      textDecoration: 'none', 
                      color: 'var(--fg-brand)', 
                      fontWeight: 700, 
                      fontSize: '13px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      transition: 'opacity 0.2s' 
                    }}
                  >
                    {language === 'vi' ? 'Xem chi tiết' : 'View Details'} <ArrowRight size={13} />
                  </NextLink>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {weeklyLeaders.slice(0, 3).map((entry, index) => (
                      <div 
                        key={entry.username} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: 'var(--bg-neutral-secondary-light)', 
                          border: '1px solid var(--border-default)', 
                          padding: '6px 12px', 
                          borderRadius: '20px',
                          fontSize: '12.5px',
                        }}
                      >
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 900,
                        }}>
                          {index + 1}
                        </span>
                        <strong style={{ color: 'var(--text-heading)' }}>{entry.username}</strong>
                        <span style={{ color: 'var(--text-body-subtle)', fontSize: '11.5px' }}>({entry.weeklyXp} XP)</span>
                      </div>
                    ))}
                    {weeklyLeaders.length === 0 && (
                      <span style={{ color: 'var(--text-body-subtle)', fontSize: '13px' }}>{t('dashboard.noActivity')}</span>
                    )}
                  </div>
                  <NextLink href="/leaderboard" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', fontSize: '12.5px' }}>
                    {t('dashboard.openLeaderboard')}
                  </NextLink>
                </div>
              </section>

              <section className="dashboard-return-grid" aria-label="Nhịp học của bạn">
                {/* Left Column: Daily Tasks and Continued Learning */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="dashboard-missions" style={{ width: '100%' }}>
                    <div className="dashboard-panel-heading">
                      <div><CalendarDays size={18} /><h2>{t('dashboard.dailyMissionTitle')}</h2></div>
                      <span style={{ fontWeight: 600, color: 'var(--fg-brand)' }}>{language === 'vi' ? '10-15 phút' : '10-15 mins'}</span>
                    </div>
                    
                    <div className="dashboard-mission-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 0' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-heading)', fontSize: '14px' }}>{growth.dailyMission.title}</strong>
                          <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {growth.dailyMission.minutes} {t('common.minutes')}
                          </span>
                          <span className="badge badge-brand" style={{ fontSize: '10px', padding: '2px 6px' }}>+25 XP</span>
                          {growth.dailyMission.completed && (
                            <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} style={{ color: 'var(--fg-success-strong)' }} /> {t('dashboard.congratsDone')}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-body-subtle)' }}>{growth.dailyMission.description}</p>
                      </div>
                      <NextLink href={growth.dailyMission.actionUrl} className={`btn ${growth.dailyMission.completed ? 'btn-secondary' : 'btn-primary'} btn-sm`} style={{ whiteSpace: 'nowrap' }}>
                        {growth.dailyMission.completed ? (language === 'vi' ? 'Xem lại' : 'Review') : t('dashboard.startNow')}
                      </NextLink>
                    </div>

                    <div className="dashboard-mission-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 0', borderTop: '1px solid var(--border-default)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-heading)', fontSize: '14px' }}>{growth.weeklyChallenge.title}</strong>
                          <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {growth.weeklyChallenge.minutes} {t('common.minutes')}
                          </span>
                          <span className="badge badge-brand" style={{ fontSize: '10px', padding: '2px 6px' }}>+50 XP</span>
                          {growth.weeklyChallenge.completed && (
                            <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} style={{ color: 'var(--fg-success-strong)' }} /> {t('dashboard.congratsDone')}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-body-subtle)' }}>{growth.weeklyChallenge.description}</p>
                      </div>
                      <button 
                        className={`btn ${growth.weeklyChallenge.completed ? 'btn-secondary' : 'btn-primary'} btn-sm`} 
                        onClick={openWeeklyChallenge} 
                        disabled={openingWeekly || growth.weeklyChallenge.completed}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {openingWeekly ? (language === 'vi' ? 'Đang tạo...' : 'Creating...') : growth.weeklyChallenge.completed ? (language === 'vi' ? 'Đã hoàn thành' : 'Completed') : t('dashboard.startNow')}
                      </button>
                    </div>
                  </div>

                  {lessonResume && (!resume || resume.url !== lessonResume.url) && (
                    <div style={{
                      background: 'var(--bg-brand-softer)',
                      border: '1px solid rgba(56,189,248,0.15)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      width: '100%',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '6px', 
                          background: 'rgba(56,189,248,0.1)', 
                          color: 'var(--fg-brand)', 
                          display: 'grid', 
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <BookOpen size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg-brand)', display: 'block' }}>
                            {t('dashboard.continueReading')}
                          </span>
                          <strong style={{ fontSize: '13px', color: 'var(--text-heading)', display: 'block', margin: '2px 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lessonResume.title}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-body-subtle)' }}>
                            {t('dashboard.readProgress')}: {lessonResume.progress}%
                          </span>
                        </div>
                      </div>
                      <NextLink href={lessonResume.url} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}>
                        {t('dashboard.readButton')}
                      </NextLink>
                    </div>
                  )}
                </div>

                {/* Right Column: Streak, Freeze Status and Weekly Report */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="dashboard-rhythm" style={{ width: '100%', marginBottom: 0 }}>
                    <div className="dashboard-rhythm-stat"><Flame size={19} /><div><strong>{growth.streak} {t('common.days')}</strong><span>{t('dashboard.streakTitle')}</span></div></div>
                    <div className="dashboard-rhythm-stat"><Snowflake size={19} /><div><strong>{growth.freezeTickets} {language === 'vi' ? 'vé' : 'tickets'}</strong><span>{t('dashboard.freezeTitle')}</span></div></div>
                  </div>
                  
                  <div style={{
                    background: 'var(--bg-neutral-secondary-light)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    color: 'var(--text-body)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div>
                      {growth.freezeTickets > 0 ? (
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <ShieldCheck size={14} style={{ color: 'var(--fg-success-strong)', flexShrink: 0 }} /> 
                          <span style={{ color: 'var(--text-body)', lineHeight: 1.3 }}>
                            <strong style={{ color: 'var(--fg-success-strong)' }}>{t('dashboard.streakProtected')}</strong> {t('dashboard.streakTicketsCount', { count: growth.freezeTickets })}
                          </span>
                        </p>
                      ) : (
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <AlertTriangle size={14} style={{ color: 'var(--fg-warning)', flexShrink: 0 }} /> 
                          <span style={{ color: 'var(--text-body)', lineHeight: 1.3 }}>
                            <strong style={{ color: 'var(--fg-warning)' }}>{t('dashboard.streakNoTickets')}</strong> {t('dashboard.streakMaintainDesc')}
                          </span>
                        </p>
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '6px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                        <span>{t('dashboard.nextTicketProgress')}</span>
                        <strong style={{ color: 'var(--text-heading)' }}>{growth.streak % 7}/7 {t('common.days')}</strong>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'var(--bg-neutral-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${((growth.streak % 7) / 7) * 100}%`, height: '100%', background: 'var(--bg-brand)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-insights" style={{ width: '100%' }}>
                    <div className="dashboard-panel-heading">
                      <div><TrendingUp size={18} /><h2>{t('dashboard.weeklyReportTitle')}</h2></div>
                      <span style={{ fontWeight: 600, color: 'var(--fg-success-strong)' }}>+{growth.weeklyReport.xpGained} XP</span>
                    </div>
                    <div className="dashboard-weekly-numbers" style={{ display: 'flex', gap: '20px', padding: '10px 0', marginBottom: '12px' }}>
                      <span><strong>{growth.weeklyReport.labsCompleted}</strong> {language === 'vi' ? 'lab đã giải' : 'labs completed'}</span>
                      <span><strong>{growth.weeklyReport.lessonsCompleted}</strong> {language === 'vi' ? 'bài học lý thuyết' : 'lessons studied'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={14} style={{ color: 'var(--fg-success-strong)' }} /> 
                        <span><strong style={{ color: 'var(--text-heading)' }}>{t('dashboard.weeklyReportStrength')}:</strong> <span style={{ color: 'var(--fg-success-strong)', fontWeight: 600 }}>{growth.weeklyReport.strongestSkill}</span></span>
                      </p>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={14} style={{ color: 'var(--fg-danger-strong)' }} /> 
                        <span><strong style={{ color: 'var(--text-heading)' }}>{t('dashboard.weeklyReportWeakness')}:</strong> <span style={{ color: 'var(--fg-danger-strong)', fontWeight: 600 }}>{growth.weeklyReport.weakSkill}</span></span>
                      </p>
                      <p style={{ margin: 0, padding: '8px 12px', background: 'var(--bg-neutral-secondary)', borderLeft: '3px solid var(--border-brand)', borderRadius: '0 6px 6px 0' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <Lightbulb size={14} style={{ color: 'var(--fg-brand)' }} /> 
                          <strong style={{ color: 'var(--text-heading)' }}>{t('dashboard.weeklyReportLessonRec')}:</strong>
                        </span>
                        <span style={{ color: 'var(--text-body)', fontSize: '12px' }}>{growth.weeklyReport.recommendation}</span>
                      </p>
                    </div>
                  </div>
                </div>

              </section>

              <section className="dashboard-competency" aria-label={language === 'vi' ? 'Năng lực và thành tích' : 'Skills and Achievements'} style={{ marginBottom: 'var(--space-6)' }}>
                <div className="dashboard-xp-panel">
                  <div className="dashboard-panel-heading"><div><Trophy size={18} /><h2>{t('common.level')} {growth.level} · {growth.levelTitle}</h2></div><strong>{growth.xp} XP</strong></div>
                  <div className="dashboard-xp-track"><span style={{ width: `${((growth.xp % 500) / 500) * 100}%` }} /></div>
                  <small>{500 - (growth.xp % 500)} XP {language === 'vi' ? 'tới cấp tiếp theo' : 'to next level'}</small>
                  <div className="dashboard-badges"><Award size={16} />{growth.badges.length ? growth.badges.slice(0, 4).map(badge => <span key={badge}>{badge}</span>) : <span>{language === 'vi' ? 'Hoàn thành lab đầu tiên để nhận huy hiệu' : 'Complete your first lab to earn badges'}</span>}</div>
                </div>
                <div className="dashboard-skill-panel">
                  <div className="dashboard-panel-heading"><div><ShieldCheck size={18} /><h2>{t('dashboard.competencyMapTitle')}</h2></div><span>{language === 'vi' ? 'Từ kết quả lab' : 'From lab results'}</span></div>
                  {growth.skills.length ? growth.skills.slice(0, 8).map(skill => <div className="dashboard-skill-row" key={skill.slug}><div><strong>{skill.name}</strong><small>{language === 'vi' ? 'Cấp' : 'Level'} {skill.level} · {skill.completedLabs} lab</small></div><div><span style={{ width: `${Math.min(100, skill.xp / 5)}%` }} /></div><b>{skill.xp} XP</b></div>) : <p className="dashboard-skill-empty">{language === 'vi' ? 'SQLi, XSS, Access Control và SSRF sẽ xuất hiện khi bạn hoàn thành lab tương ứng.' : 'SQLi, XSS, Access Control and SSRF will appear when you complete the corresponding lab.'}</p>}
                </div>
              </section>


              {attempts.length > 0 && (
                <section className="animate-fade-in-up animate-delay-4" style={{ marginBottom: 'var(--space-6)' }}>
                  <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FlaskConical size={28} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Phiên thực hành của bạn' : 'Your Lab Sessions'}
                      </h2>
                      <p className="section-subtitle">{language === 'vi' ? 'Lịch sử và tiến độ làm lab gần đây' : 'Recent lab history and progress'}</p>
                    </div>
                    <NextLink href="/labs" className="btn btn-secondary btn-sm">
                      {language === 'vi' ? 'Tất cả labs →' : 'All labs →'}
                    </NextLink>
                  </div>
                  <div className="grid-3">
                    {attempts.slice(0, 3).map((attempt) => (
                      <RecentLabCard key={attempt.id} attempt={attempt} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <section className="animate-fade-in-up" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-2)', color: 'var(--text-heading)' }}>
                  {language === 'vi' ? (
                    <>Học <span className="text-brand">Pentest Web</span> qua <span className="text-brand">Thực hành</span></>
                  ) : (
                    <>Learn <span className="text-brand">Web Pentest</span> through <span className="text-brand">Practice</span></>
                  )}
                </h1>
                <p style={{ fontSize: '1.0625rem', maxWidth: '50ch', marginBottom: 'var(--space-4)' }}>
                  {t('landing.heroDesc')}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <NextLink href="/labs" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <FlaskConical size={18} /> {t('landing.startLab')}
                  </NextLink>
                  <NextLink href="/learning" className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} /> {language === 'vi' ? 'Xem lộ trình' : 'View Paths'}
                  </NextLink>
                </div>
              </div>
              <TerminalHero />
            </div>
          </section>

          <section className="animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="grid-4">
              <StatCard value={String(stats.totalVulnerabilities)} label={t('landing.statsVulns')} color="green" />
              <StatCard value={String(stats.totalLabs)} label={t('landing.statsLabs')} color="blue" />
              <StatCard value={t('landing.requireLogin')} label={t('landing.statsCompleted')} color="orange" />
              <StatCard value={t('landing.requireLogin')} label={t('landing.statsTotalPoints')} color="purple" />
            </div>
          </section>

          <section className="animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={28} style={{ color: 'var(--fg-brand)' }} /> {t('sidebar.vulnerabilities')}
                </h2>
                <p className="section-subtitle">{language === 'vi' ? 'Khám phá và học cách khai thác các lỗ hổng web phổ biến nhất' : 'Explore and learn to exploit the most common web vulnerabilities'}</p>
              </div>
              <NextLink href="/vulnerabilities" className="btn btn-secondary btn-sm">
                {language === 'vi' ? 'Xem tất cả →' : 'See all →'}
              </NextLink>
            </div>
            <div className="grid-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="card" style={{ height: '140px', background: 'var(--bg-neutral-secondary-medium)', opacity: 0.5 }}></div>)
              ) : (
                vulns.slice(0, 4).map((vuln) => (
                  <VulnMiniCard key={vuln.id} vuln={vuln} />
                ))
              )}
            </div>
          </section>

          <section className="animate-fade-in-up animate-delay-3" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={28} style={{ color: 'var(--fg-brand)' }} /> {t('sidebar.learningPaths')}
                </h2>
                <p className="section-subtitle">{language === 'vi' ? 'Từ người mới bắt đầu đến chuyên gia pentest' : 'From absolute beginner to expert pentester'}</p>
              </div>
              <NextLink href="/learning" className="btn btn-secondary btn-sm">
                {language === 'vi' ? 'Xem tất cả →' : 'See all →'}
              </NextLink>
            </div>
            <div className="grid-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="card" style={{ height: '160px', background: 'var(--bg-neutral-secondary-medium)', opacity: 0.5 }}></div>)
              ) : (
                paths.map((path) => (
                  <PathMiniCard key={path.id} path={path} />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
