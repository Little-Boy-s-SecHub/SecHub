import Link from 'next/link';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';
import { learningPaths } from '@/lib/data';
import { notFound } from 'next/navigation';

// Mock lessons data
const pathLessons: Record<string, Array<{
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
}>> = {
  '1': [
    { id: '1-1', title: 'HTTP Protocol cơ bản', description: 'Tìm hiểu về HTTP methods, headers, status codes và cách trình duyệt giao tiếp với web server.', duration: '45 phút', completed: true },
    { id: '1-2', title: 'Công cụ Pentest cần thiết', description: 'Cài đặt và sử dụng Burp Suite, OWASP ZAP, và các công cụ command-line phổ biến.', duration: '60 phút', completed: true },
    { id: '1-3', title: 'OWASP Top 10 Overview', description: 'Tổng quan về 10 lỗ hổng bảo mật web phổ biến nhất theo OWASP.', duration: '45 phút', completed: true },
    { id: '1-4', title: 'SQL Injection cơ bản', description: 'Hiểu nguyên lý SQL Injection, cách phát hiện và khai thác lỗ hổng SQLi đơn giản.', duration: '90 phút', completed: false },
    { id: '1-5', title: 'Cross-Site Scripting (XSS)', description: 'Phân biệt Reflected, Stored và DOM-based XSS. Thực hành khai thác XSS cơ bản.', duration: '90 phút', completed: false },
    { id: '1-6', title: 'Kiểm tra xác thực (Authentication)', description: 'Tìm lỗ hổng trong form đăng nhập, brute force, và session management.', duration: '75 phút', completed: false },
    { id: '1-7', title: 'Kiểm tra phân quyền (Authorization)', description: 'IDOR, privilege escalation, và kiểm tra phân quyền trên ứng dụng web.', duration: '60 phút', completed: false },
    { id: '1-8', title: 'Viết báo cáo Pentest', description: 'Cách viết báo cáo pentest chuyên nghiệp với findings, severity, và khuyến nghị.', duration: '45 phút', completed: false },
  ],
  '2': [
    { id: '2-1', title: 'Blind SQL Injection nâng cao', description: 'Boolean-based, Time-based Blind SQLi và kỹ thuật data extraction.', duration: '120 phút', completed: false },
    { id: '2-2', title: 'Second-Order SQL Injection', description: 'Khai thác SQLi khi payload được lưu và xử lý ở vị trí khác.', duration: '90 phút', completed: false },
    { id: '2-3', title: 'DOM-based XSS chuyên sâu', description: 'Phân tích JavaScript sources & sinks, khai thác DOM XSS phức tạp.', duration: '90 phút', completed: false },
    { id: '2-4', title: 'Bypass WAF/Filters', description: 'Kỹ thuật bypass Web Application Firewall và input filters.', duration: '120 phút', completed: false },
    { id: '2-5', title: 'Server-Side Request Forgery (SSRF)', description: 'Khai thác SSRF để truy cập internal services, cloud metadata.', duration: '90 phút', completed: false },
    { id: '2-6', title: 'XML External Entity (XXE)', description: 'Tấn công XXE để đọc file, SSRF, và denial of service.', duration: '75 phút', completed: false },
  ],
  '3': [
    { id: '3-1', title: 'Methodology & Reconnaissance', description: 'Xây dựng phương pháp pentest chuyên nghiệp và kỹ thuật thu thập thông tin.', duration: '120 phút', completed: false },
    { id: '3-2', title: 'Chaining Vulnerabilities', description: 'Kết hợp nhiều lỗ hổng nhỏ thành chain tấn công có impact lớn.', duration: '150 phút', completed: false },
    { id: '3-3', title: 'API Security Testing', description: 'Pentest REST API, GraphQL, và các API endpoint phổ biến.', duration: '120 phút', completed: false },
    { id: '3-4', title: 'Bug Bounty Hunting', description: 'Kỹ năng, tư duy và quy trình tham gia chương trình Bug Bounty.', duration: '90 phút', completed: false },
    { id: '3-5', title: 'Advanced Report Writing', description: 'Viết report chuyên nghiệp, PoC, và executive summary cho lãnh đạo.', duration: '90 phút', completed: false },
  ],
};

export default async function LearningPathDetailPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  const path = learningPaths.find(p => p.id === pathId);

  if (!path) {
    notFound();
  }

  const lessons = pathLessons[pathId] || [];
  const completedCount = lessons.filter(l => l.completed).length;
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const diffClass = path.difficulty === 'BEGINNER' ? 'badge-easy' : 
                    path.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                    path.difficulty === 'ADVANCED' ? 'badge-hard' : 'badge-expert';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
        <Link href="/learning" style={{ color: 'var(--text-body-subtle)' }}>Lộ trình học</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-heading)' }}>{path.title}</span>
      </div>

      {/* Header */}
      <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className={`badge ${diffClass}`}>{path.difficulty}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-body-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> ~{path.estimatedHours} giờ
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
              {path.title}
            </h1>
            <p style={{ color: 'var(--text-body-subtle)' }}>{path.description}</p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 'var(--space-4)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `conic-gradient(var(--bg-brand) ${progress * 3.6}deg, var(--bg-neutral-tertiary) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--bg-neutral-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'var(--fg-brand)',
              }}>
                {Math.round(progress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-body-subtle)' }}>
            <span>{completedCount}/{lessons.length} bài học đã hoàn thành</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar" style={{ height: '8px' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={20} style={{ color: 'var(--fg-brand)' }} /> Danh sách bài học
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            className="card animate-fade-in-up"
            style={{
              animationDelay: `${index * 0.05}s`,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              cursor: 'pointer',
              opacity: lesson.completed ? 0.7 : 1,
            }}
          >
            {/* Lesson number / check */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: lesson.completed ? 'color-mix(in srgb, var(--bg-brand) 20%, transparent)' : 'var(--bg-neutral-tertiary)',
              border: `2px solid ${lesson.completed ? 'var(--fg-brand)' : 'var(--border-default-medium)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: lesson.completed ? 'var(--fg-brand)' : 'var(--text-body-subtle)',
              flexShrink: 0,
            }}>
              {lesson.completed ? '✓' : index + 1}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--text-heading)',
                marginBottom: '2px',
                textDecoration: lesson.completed ? 'line-through' : 'none',
              }}>
                {lesson.title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-body-subtle)' }}>
                {lesson.description}
              </div>
            </div>

            {/* Duration */}
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-body-subtle)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {lesson.duration}
            </div>

            {/* Arrow */}
            <span style={{ color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
