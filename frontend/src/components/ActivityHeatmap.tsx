'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Flame, Calendar, Award } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface Activity {
  date: string; // YYYY-MM-DD
  count: number;
}

export default function ActivityHeatmap({ username, noWrapper }: { username?: string; noWrapper?: boolean }) {
  const { language } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContributions: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  function calculateStreaks(data: Activity[]) {
    if (!data || data.length === 0) return;

    // Filter active days (count > 0) and sort chronologically
    const activeDates = data
      .filter(a => a.count > 0)
      .map(a => a.date)
      .sort();

    if (activeDates.length === 0) return;

    // Total contributions
    const total = data.reduce((acc, curr) => acc + curr.count, 0);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    const activeSet = new Set(activeDates);

    // Calculate current streak
    let current = 0;
    let checkDate: Date | null = new Date(); // Start checking from today

    // If no activity today, check if yesterday was active to continue the streak
    if (!activeSet.has(todayStr)) {
      if (activeSet.has(yesterdayStr)) {
        checkDate = yesterday;
      } else {
        checkDate = null; // No streak
      }
    }

    if (checkDate) {
      while (true) {
        const dateStr = formatDate(checkDate);
        if (activeSet.has(dateStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1); // Go back 1 day
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longest = 0;
    let tempStreak = 0;
    
    // We need to loop day-by-day chronologically from the earliest active date
    const start = new Date(activeDates[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const currentCheck = new Date(start);

    while (currentCheck <= end) {
      const dateStr = formatDate(currentCheck);
      if (activeSet.has(dateStr)) {
        tempStreak++;
        if (tempStreak > longest) {
          longest = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      currentCheck.setDate(currentCheck.getDate() + 1);
    }

    setStats({
      totalContributions: total,
      currentStreak: current,
      longestStreak: Math.max(longest, current)
    });
  }

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = username 
          ? await api.growth.getPublicActivities(username)
          : await api.users.getActivities();
        if (res.success && res.data) {
          const data: Activity[] = res.data;
          setActivities(data);
          calculateStreaks(data);
        }
      } catch (e) {
        console.error('Failed to fetch user activities:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [username]);



  // Generate 365 days grid starting 364 days ago aligned to Sunday
  const generateGrid = () => {
    const dates: Date[] = [];
    const today = new Date();
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    
    const startDay = startDate.getDay();
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(startDate.getDate() - startDay);
    
    const currentDate = new Date(alignedStartDate);
    while (currentDate <= today) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const getRankName = (contributions: number) => {
    if (contributions === 0) return language === 'vi' ? 'Newbie (Người mới)' : 'Newbie';
    if (contributions < 5) return language === 'vi' ? 'Script Kiddie (Lính mới)' : 'Script Kiddie';
    if (contributions < 15) return language === 'vi' ? 'Junior Pentester (Thực tập sinh)' : 'Junior Pentester';
    if (contributions < 30) return language === 'vi' ? 'Security Specialist (Chuyên gia)' : 'Security Specialist';
    return language === 'vi' ? 'Elite Hacker (Hacker tinh nhuệ)' : 'Elite Hacker';
  };

  const getRankDescription = (contributions: number) => {
    if (contributions === 0) return language === 'vi' ? 'Hãy hoàn thành bài học đầu tiên để kích hoạt xếp hạng!' : 'Complete your first lesson to activate ranking!';
    if (contributions < 5) return language === 'vi' ? 'Đang tìm hiểu về các lỗ hổng bảo mật cơ bản.' : 'Learning basic security vulnerabilities.';
    if (contributions < 15) return language === 'vi' ? 'Đã quen với việc vận hành các bài lab pentest thực tế.' : 'Familiar with running hands-on pentest labs.';
    if (contributions < 30) return language === 'vi' ? 'Nắm vững kiến thức chuyên sâu và giải quyết các lab khó.' : 'Mastering deep concepts and solving harder labs.';
    return language === 'vi' ? 'Bậc thầy bảo mật! Bạn đã làm chủ hầu hết thử thách trên SecHub.' : 'Security master! You have conquered most challenges on SecHub.';
  };

  const getNextRankLimit = (contributions: number) => {
    if (contributions < 5) return 5;
    if (contributions < 15) return 15;
    if (contributions < 30) return 30;
    return 100;
  };

  const getProgressPercent = (contributions: number) => {
    const limit = getNextRankLimit(contributions);
    const prevLimit = contributions < 5 ? 0 : contributions < 15 ? 5 : contributions < 30 ? 15 : 30;
    const range = limit - prevLimit;
    const currentProgress = contributions - prevLimit;
    return Math.min(100, Math.max(0, (currentProgress / range) * 100));
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-body-subtle)' }}>
        {language === 'vi' ? 'Đang tải lịch hoạt động...' : 'Loading activity history...'}
      </div>
    );
  }

  const gridDates = generateGrid();
  const activityMap = new Map(activities.map(a => [a.date, a.count]));

  // Month labels helper
  const months = language === 'vi'
    ? ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels: { label: string; index: number }[] = [];
  
  gridDates.forEach((date, idx) => {
    if (date.getDate() === 1 && idx % 7 === 0) {
      monthLabels.push({
        label: months[date.getMonth()],
        index: Math.floor(idx / 7)
      });
    }
  });

  return (
    <div className={noWrapper ? "" : "card"} style={noWrapper ? {} : { padding: '24px', marginBottom: '24px' }}>
      <style>{`
        .heatmap-container {
          overflow-x: auto;
          padding-top: 32px;
          padding-bottom: 12px;
          margin-top: -20px;
        }
        .heatmap-grid {
          display: grid;
          grid-template-rows: repeat(7, 10px);
          grid-auto-flow: column;
          gap: 3px;
          width: max-content;
        }
        .heatmap-day {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          position: relative;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .heatmap-day:hover {
          transform: scale(1.3);
          z-index: 5;
        }
        .heatmap-tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: #f8fafc;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          z-index: 999;
          pointer-events: none;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .heatmap-day:hover .heatmap-tooltip {
          visibility: visible;
          opacity: 1;
        }
        .heatmap-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #0f172a transparent transparent transparent;
        }
      `}</style>

      {/* Streak Dashboard stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        
        {/* Total contributions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-neutral-secondary-soft)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
          <div style={{ padding: '8px', background: 'rgba(56,189,248,0.1)', color: 'var(--fg-brand)', borderRadius: '8px' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-body-subtle)', fontWeight: 500 }}>
              {language === 'vi' ? 'TỔNG HOẠT ĐỘNG' : 'TOTAL CONTRIBUTIONS'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>{stats.totalContributions}</div>
          </div>
        </div>

        {/* Current streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-neutral-secondary-soft)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
          <div style={{ padding: '8px', background: stats.currentStreak > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(156,163,175,0.1)', color: stats.currentStreak > 0 ? 'var(--bg-warning)' : 'var(--text-body-subtle)', borderRadius: '8px', animation: stats.currentStreak > 0 ? 'pulse 2s infinite' : 'none' }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-body-subtle)', fontWeight: 500 }}>
              {language === 'vi' ? 'CHUỖI HIỆN TẠI' : 'CURRENT STREAK'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              {stats.currentStreak} {language === 'vi' ? 'ngày' : stats.currentStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* Longest streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-neutral-secondary-soft)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
          <div style={{ padding: '8px', background: 'rgba(234,179,8,0.1)', color: 'var(--fg-yellow)', borderRadius: '8px' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-body-subtle)', fontWeight: 500 }}>
              {language === 'vi' ? 'CHUỖI DÀI NHẤT' : 'LONGEST STREAK'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              {stats.longestStreak} {language === 'vi' ? 'ngày' : stats.longestStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

      </div>

      {/* Heatmap Grid title */}
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
        {language === 'vi' ? 'Lịch sử năng suất đóng góp học tập' : 'Learning activity and contribution history'}
      </h3>

      {/* Heatmap Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'end' }}>
        
        {/* Left Column: Heatmap Grid */}
        <div className="heatmap-container">
          
          {/* Month headers */}
          <div style={{ position: 'relative', height: '18px', marginBottom: '4px', fontSize: '10px', color: 'var(--text-body-subtle)', fontWeight: 600 }}>
            {monthLabels.map((m, idx) => (
              <span key={idx} style={{ position: 'absolute', left: `${m.index * 13}px` }}>
                {m.label}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            
            {/* Day of week labels */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 10px)', gap: '3px', fontSize: '9px', color: 'var(--text-body-subtle)', fontWeight: 600, justifyItems: 'end', paddingRight: '2px' }}>
              <span></span>
              <span>{language === 'vi' ? 'T2' : 'Mon'}</span>
              <span></span>
              <span>{language === 'vi' ? 'T4' : 'Wed'}</span>
              <span></span>
              <span>{language === 'vi' ? 'T6' : 'Fri'}</span>
              <span></span>
            </div>

            {/* Grid of days */}
            <div className="heatmap-grid">
              {gridDates.map((date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const count = activityMap.get(dateStr) || 0;

                // Color grading based on activity count
                let bgColor = 'var(--bg-neutral-tertiary)'; // 0 contributions
                if (count === 1 || count === 2) {
                  bgColor = 'rgba(0, 122, 85, 0.25)'; // Light green
                } else if (count === 3 || count === 4) {
                  bgColor = 'rgba(0, 122, 85, 0.5)';  // Medium green
                } else if (count === 5 || count === 6) {
                  bgColor = 'rgba(0, 122, 85, 0.75)'; // Strong green
                } else if (count >= 7) {
                  bgColor = 'var(--bg-success)';       // Deepest green
                }

                const dateDisplay = language === 'vi'
                  ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

                const tooltipText = language === 'vi'
                  ? `${count} hoạt động vào ${dateDisplay}`
                  : `${count} ${count === 1 ? 'activity' : 'activities'} on ${dateDisplay}`;

                return (
                  <div
                    key={dateStr}
                    className="heatmap-day"
                    style={{ background: bgColor }}
                  >
                    <div className="heatmap-tooltip">
                      {tooltipText}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-body-subtle)', marginTop: '12px' }}>
            <span>{language === 'vi' ? 'Ít' : 'Less'}</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--bg-neutral-tertiary)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 122, 85, 0.25)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 122, 85, 0.5)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 122, 85, 0.75)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--bg-success)' }} />
            <span>{language === 'vi' ? 'Nhiều' : 'More'}</span>
          </div>

        </div>

        {/* Right Column: Hacker Rank Progress Card */}
        <div style={{ 
          background: 'var(--bg-neutral-secondary-soft)', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          border: '1px solid var(--border-default)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          justifyContent: 'center',
          minHeight: '143px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🥷</span>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-body-subtle)', fontWeight: 700, letterSpacing: '0.05em' }}>
                {language === 'vi' ? 'DANH HIỆU HACKER' : 'HACKER TITLE'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fg-brand)' }}>
                {getRankName(stats.totalContributions)}
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: '11px', color: 'var(--text-body-subtle)', lineHeight: '1.4' }}>
            {getRankDescription(stats.totalContributions)}
          </div>
          
          {/* Level Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-body-subtle)', fontWeight: 600, marginBottom: '4px' }}>
              <span>{language === 'vi' ? 'Cấp độ tiếp theo' : 'Next level'}</span>
              <span>{stats.totalContributions} / {getNextRankLimit(stats.totalContributions)} {language === 'vi' ? 'Hoạt động' : 'Activities'}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-neutral-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${getProgressPercent(stats.totalContributions)}%`, background: 'var(--fg-brand)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
