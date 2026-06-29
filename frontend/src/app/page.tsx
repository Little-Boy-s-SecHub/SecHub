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
  Link as LinkIcon 
} from 'lucide-react';
import { api, Vulnerability, LearningPath, Lab, LabAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import VulnIcon from '@/components/VulnIcon';
import ActivityHeatmap from '@/components/ActivityHeatmap';

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
          <span className="vuln-card-labs">{vuln.labCount || 0} labs</span>
        </div>
      </div>
    </NextLink>
  );
}

function PathMiniCard({ path }: { path: LearningPath }) {
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
            <span>{completedLessons}/{lessonCount} bài học</span>
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
  const statusContent = attempt.status === 'COMPLETED' ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-success-strong)' }}>
      <CheckCircle2 size={14} /> Hoàn thành
    </span>
  ) : attempt.status === 'RUNNING' ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--fg-brand)' }}>
      <RotateCw size={14} style={{ animation: 'spin 3s linear infinite' }} /> Đang chạy
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-body-subtle)' }}>
      Chưa hoàn thành
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
        <div className="lab-card-desc">Bắt đầu lúc: {new Date(attempt.startedAt).toLocaleString('vi-VN')}</div>
        <div className="lab-card-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trophy size={12} /> {attempt.score} điểm
          </span>
          <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Gợi ý đã dùng: {attempt.hintsUsed}
          </span>
        </div>
      </div>
    </NextLink>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [attempts, setAttempts] = useState<LabAttempt[]>([]);
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
        const [vulnsRes, pathsRes] = await Promise.all([
          api.vulnerabilities.getAll(),
          api.learningPaths.getAll()
        ]);

        if (vulnsRes.success) setVulns(vulnsRes.data);
        if (pathsRes.success) setPaths(pathsRes.data);

        if (isAuthenticated) {
          const [dashboardRes, attemptsRes] = await Promise.all([
            api.users.getDashboard(),
            api.labs.getMyAttempts()
          ]);

          if (dashboardRes.success && dashboardRes.data) {
            const d = dashboardRes.data;
            setStats({
              totalVulnerabilities: vulnsRes.data?.length || 8,
              totalLabs: d.totalLabs || 14,
              completedLabs: d.completedLabs || 0,
              totalPoints: d.totalScore || 0,
              progressPercentage: Math.round(d.progressPercentage || 0),
            });
          }

          if (attemptsRes.success && attemptsRes.data) {
            setAttempts(attemptsRes.data);
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

  return (
    <div>
      {/* Hero Section */}
      <section className="animate-fade-in-up" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div>
            <div className="badge badge-brand" style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Nền tảng học Pentest Web #1 Việt Nam
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-2)', color: 'var(--text-heading)' }}>
              Học <span className="text-brand">Pentest Web</span> qua{' '}
              <span className="text-brand">Thực hành</span>
            </h1>
            <p style={{ fontSize: '1.0625rem', maxWidth: '50ch', marginBottom: 'var(--space-4)' }}>
              Nắm vững kỹ năng khai thác lỗ hổng bảo mật web từ cơ bản đến nâng cao.
              Tài liệu chi tiết kết hợp bài lab thực hành tương tác trực tiếp với Docker container.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <NextLink href="/labs" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={18} /> Bắt đầu Lab
              </NextLink>
              <NextLink href="/learning" className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Xem lộ trình
              </NextLink>
            </div>
          </div>
          <TerminalHero />
        </div>
      </section>

      {/* Stats */}
      <section className="animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="grid-4">
          <StatCard value={String(stats.totalVulnerabilities)} label="Loại lỗ hổng" color="green" />
          <StatCard value={String(stats.totalLabs)} label="Bài Lab thực hành" color="blue" />
          <StatCard value={isAuthenticated ? `${stats.completedLabs} labs` : 'Yêu cầu đăng nhập'} label="Hoàn thành" color="orange" />
          <StatCard value={isAuthenticated ? `${stats.totalPoints} pts` : 'Yêu cầu đăng nhập'} label="Tổng điểm" color="purple" />
        </div>
      </section>

      {/* Activity Heatmap (GitHub-style calendar) */}
      {isAuthenticated && (
        <section className="animate-fade-in-up" style={{ marginBottom: 'var(--space-6)' }}>
          <ActivityHeatmap />
        </section>
      )}

      {/* Vulnerability Categories */}
      <section className="animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={28} style={{ color: 'var(--fg-brand)' }} /> Lỗ hổng bảo mật
            </h2>
            <p className="section-subtitle">Khám phá và học cách khai thác các lỗ hổng web phổ biến nhất</p>
          </div>
          <NextLink href="/vulnerabilities" className="btn btn-secondary btn-sm">
            Xem tất cả →
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

      {/* Learning Paths */}
      <section className="animate-fade-in-up animate-delay-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={28} style={{ color: 'var(--fg-brand)' }} /> Lộ trình học
            </h2>
            <p className="section-subtitle">Từ người mới bắt đầu đến chuyên gia pentest</p>
          </div>
          <NextLink href="/learning" className="btn btn-secondary btn-sm">
            Xem tất cả →
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

      {/* Recent Lab Attempts */}
      {isAuthenticated && attempts.length > 0 && (
        <section className="animate-fade-in-up animate-delay-4" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={28} style={{ color: 'var(--fg-brand)' }} /> Phiên thực hành của bạn
              </h2>
              <p className="section-subtitle">Lịch sử và tiến độ làm lab gần đây</p>
            </div>
            <NextLink href="/labs" className="btn btn-secondary btn-sm">
              Tất cả labs →
            </NextLink>
          </div>
          <div className="grid-3">
            {attempts.slice(0, 3).map((attempt) => (
              <RecentLabCard key={attempt.id} attempt={attempt} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
