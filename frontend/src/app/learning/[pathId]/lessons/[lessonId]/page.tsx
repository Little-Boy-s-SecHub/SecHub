'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, Clock, ChevronRight, PlayCircle, ShieldAlert, Sparkles, LoaderCircle, Target } from 'lucide-react';
import { api, Lab, Vulnerability } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { localizeLessonTitle, localizeLessonObjective } from '@/utils/localize';
import { marked } from 'marked';

interface Lesson {
  id: string;
  pathId: string;
  title: string;
  contentMarkdown: string;
  sortOrder: number;
  vulnerabilityId?: string;
  vulnerabilityName?: string;
  vulnerabilitySlug?: string;
  learningObjective?: string;
  estimatedMinutes?: number;
  completed?: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

const LESSON_VULNERABILITY_RULES: Array<{ terms: string[]; slug: string }> = [
  { terms: ['sql injection', 'sqli'], slug: 'sql-injection' },
  { terms: ['cross-site scripting', 'xss'], slug: 'xss' },
  { terms: ['clickjacking', 'cross-site request forgery', 'csrf'], slug: 'csrf' },
  { terms: ['bfla', 'broken function level', 'broken access control', 'directory traversal', 'idor', 'object reference'], slug: 'idor' },
  { terms: ['open redirect', 'server-side request forgery', 'ssrf'], slug: 'ssrf' },
  { terms: ['command injection', 'os command'], slug: 'command-injection' },
  { terms: ['file upload', 'path traversal'], slug: 'file-upload' },
  { terms: ['privilege escalation', 'authentication bypass', 'auth bypass'], slug: 'auth-bypass' },
];

const LESSON_METADATA_FALLBACKS: Record<string, { objective: string; minutes: number }> = {
  "Giới thiệu về Bảo mật Web": {
    objective: "Hiểu tổng quan về bảo mật ứng dụng web và 10 rủi ro bảo mật hàng đầu theo OWASP Top 10.",
    minutes: 10
  },
  "HTTP và cách hoạt động của Web": {
    objective: "Nắm rõ mô hình Client-Server, các phương thức HTTP cơ bản, Headers và cơ chế quản lý Session.",
    minutes: 15
  },
  "SQL Injection cho người mới bắt đầu": {
    objective: "Hiểu cơ chế lỗi SQL Injection cơ bản và cách kẻ tấn công thực hiện bypass trang đăng nhập.",
    minutes: 15
  },
  "Cross-Site Scripting (XSS) cơ bản": {
    objective: "Phân biệt 3 loại XSS (Reflected, Stored, DOM) và hiểu tác hại cùng cách phòng tránh cơ bản.",
    minutes: 15
  },
  "CSRF và bảo vệ form": {
    objective: "Hiểu cách tấn công giả mạo yêu cầu chéo trang (CSRF) và cơ chế phòng chống bằng Token.",
    minutes: 15
  },
  "Kỹ thuật khai thác SQL Injection nâng cao": {
    objective: "Nắm vững kỹ thuật khai thác Blind SQL Injection (Boolean-based, Time-based) và Union-based.",
    minutes: 20
  },
  "IDOR - Truy cập trái phép dữ liệu": {
    objective: "Hiểu lỗ hổng kiểm soát truy cập đối tượng trực tiếp (IDOR) và cách kiểm thử phát hiện lỗi.",
    minutes: 15
  },
  "SSRF - Tấn công máy chủ gián tiếp": {
    objective: "Tìm hiểu lỗ hổng SSRF (Server-Side Request Forgery), các kỹ thuật bypass filter và bảo vệ hệ thống.",
    minutes: 20
  },
  "Command Injection - Thực thi lệnh hệ thống": {
    objective: "Hiểu cơ chế lỗi chèn lệnh hệ điều hành (Command Injection), kỹ thuật khai thác blind và phòng chống.",
    minutes: 20
  },
  "File Upload - Tải lên tệp không giới hạn": {
    objective: "Nắm rõ rủi ro của tính năng tải tệp lên máy chủ, cách bypass whitelist extension và cách triển khai an toàn.",
    minutes: 20
  },
  "Authentication Bypass - Bỏ qua xác thực": {
    objective: "Tìm hiểu các kỹ thuật bypass cơ chế đăng nhập, lỗ hổng logic xác thực và bảo mật JWT.",
    minutes: 25
  },
  "Bypass WAF và Security Controls": {
    objective: "Học các kỹ thuật vượt qua tường lửa ứng dụng web (WAF) và cơ chế lọc đầu vào phổ biến.",
    minutes: 25
  },
  "Attack Chains - Chuỗi khai thác lỗ hổng": {
    objective: "Học cách kết hợp nhiều lỗi bảo mật nhỏ để tạo thành chuỗi tấn công (attack chains) chiếm quyền kiểm soát hệ thống.",
    minutes: 30
  },
  "Bug Bounty Methodology - Phương pháp săn lỗi": {
    objective: "Trang bị phương pháp luận tìm kiếm lỗ hổng thực tế, viết báo cáo chuyên nghiệp và quy trình bug bounty.",
    minutes: 25
  }
};

function resolveLessonVulnerability(lesson: Lesson, vulnerabilities: Vulnerability[]) {
  const linked = vulnerabilities.find(item => item.id === lesson.vulnerabilityId);
  if (linked) return linked;

  const searchable = `${lesson.title} ${lesson.contentMarkdown.slice(0, 1800)}`.toLowerCase();
  const rule = LESSON_VULNERABILITY_RULES.find(item => item.terms.some(term => searchable.includes(term)));
  return vulnerabilities.find(item => item.slug === rule?.slug) || null;
}

export default function LessonDetailPage({ params }: { params: Promise<{ pathId: string; lessonId: string }> }) {
  const { pathId, lessonId } = use(params);
  const { isAuthenticated } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [defaultLab, setDefaultLab] = useState<Lab | null>(null);
  const [practiceVulnerability, setPracticeVulnerability] = useState<Vulnerability | null>(null);
  const [generatingLab, setGeneratingLab] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [lessonRes, pathRes, lessonsRes, vulnerabilitiesRes] = await Promise.all([
          api.lessons.getById(lessonId),
          api.learningPaths.getById(pathId),
          api.learningPaths.getLessons(pathId),
          api.vulnerabilities.getAll()
        ]);

        if (lessonRes.success && lessonRes.data) {
          setLesson(lessonRes.data);
          // Parse markdown to HTML asynchronously
          const parsed = await marked.parse(lessonRes.data.contentMarkdown);
          setHtmlContent(parsed);
          const resolvedVulnerability = resolveLessonVulnerability(
            lessonRes.data,
            vulnerabilitiesRes.success ? vulnerabilitiesRes.data : []
          );
          setPracticeVulnerability(resolvedVulnerability);
          setDefaultLab(null);
          if (resolvedVulnerability) {
            const labsRes = await api.vulnerabilities.getLabs(resolvedVulnerability.id);
            if (labsRes.success) {
              setDefaultLab(labsRes.data.find((lab: Lab) => !lab.generated) || null);
            }
          }
        } else {
          setError(language === 'vi' ? 'Không tìm thấy thông tin bài học.' : 'Lesson information not found.');
          setLoading(false);
          return;
        }

        if (pathRes.success && pathRes.data) {
          setPath(pathRes.data);
        }

        let fetchedLessons = lessonsRes.success ? lessonsRes.data : [];
        if (isAuthenticated) {
          const progressRes = await api.progress.getPathProgress(pathId);
          if (progressRes.success && progressRes.data) {
            const completedMap = new Map(progressRes.data.map(p => [p.lessonId, p.completed]));
            fetchedLessons = fetchedLessons.map((l: any) => ({
              ...l,
              completed: !!completedMap.get(l.id)
            }));
            
            // Mark current lesson completed state based on backend progress
            setLesson(prev => prev ? { ...prev, completed: !!completedMap.get(prev.id) } : null);
          }
        }
        setAllLessons(fetchedLessons);
      } catch (e: any) {
        setError(e.message || (language === 'vi' ? 'Lỗi khi tải dữ liệu bài học.' : 'Error loading lesson data.'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [pathId, lessonId, isAuthenticated, language]);

  useEffect(() => {
    if (!isAuthenticated || !lesson || !htmlContent) return;
    let saveTimer: number | undefined;
    let lastSavedY = -1;
    const savePosition = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollY = Math.round(window.scrollY);
      if (Math.abs(scrollY - lastSavedY) < 40) return;
      lastSavedY = scrollY;
      const progress = Math.round(Math.min(100, (scrollY / maxScroll) * 100));
      api.users.saveLearningState(lesson.id, progress, scrollY).catch(() => undefined);
    };
    const onScroll = () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(savePosition, 1500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const shouldResume = new URLSearchParams(window.location.search).get('resume') === '1';
    if (shouldResume) {
      api.users.getResume(true).then(response => {
        if (response.data?.type === 'LESSON' && response.data.lessonId === lesson.id) {
          window.setTimeout(() => window.scrollTo({ top: response.data?.scrollY || 0, behavior: 'smooth' }), 120);
        }
      }).catch(() => undefined);
    } else {
      savePosition();
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(saveTimer);
      savePosition();
    };
  }, [isAuthenticated, lesson, htmlContent]);

  const handleComplete = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (lesson?.completed) return;

    try {
      const res = await api.progress.completeLesson(lessonId);
      if (res.success) {
        setLesson(prev => prev ? { ...prev, completed: true } : null);
        setAllLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: true } : l));
        setShowCongrats(true);
      }
    } catch (e: any) {
      alert(e.message || (language === 'vi' ? 'Lỗi khi cập nhật tiến độ bài học.' : 'Failed to update lesson progress.'));
    }
  };

  const handleGenerateLessonLab = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!lesson || !practiceVulnerability?.slug || generatingLab) {
      setLabError(language === 'vi' ? 'Chưa xác định được loại lỗ hổng phù hợp cho bài học này.' : 'Vulnerability type not determined for this lesson.');
      return;
    }

    setGeneratingLab(true);
    setLabError(null);
    try {
      const plainContent = lesson.contentMarkdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[#*_>`\[\]()!-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const langMap: Record<string, string> = {
        vi: 'Vietnamese (Tiếng Việt)',
        en: 'English'
      };
      const targetLangName = langMap[language] || 'English';
      const scenario = [
        `LESSON TITLE: ${lesson.title}`,
        `LEARNING PATH: ${path?.title || ''}`,
        `LESSON CONTENT: ${plainContent.slice(0, 700)}`,
        language === 'vi' ? 'REQUIREMENT: Kịch bản, mục tiêu và gợi ý phải bám sát kiến thức trong bài học này.' : 'REQUIREMENT: Scenario, goals, and hints must closely match the knowledge in this lesson.',
        `LANGUAGE REQUIREMENT: Generate all lab text, title, description, tasks, instructions, and hints in ${targetLangName}.`
      ].join('\n');
      const result = await api.labs.generateWithAi(
        practiceVulnerability.slug,
        path?.difficulty || 'BEGINNER',
        scenario
      );
      if (result.success && result.data) {
        router.push(`/labs/${result.data.id}/play?pathId=${pathId}&lessonId=${lessonId}`);
      }
    } catch (e: any) {
      setLabError(e.message || (language === 'vi' ? 'Không thể tạo bài lab từ nội dung bài học.' : 'Failed to generate a lab from this lesson.'));
    } finally {
      setGeneratingLab(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>{language === 'vi' ? 'Đang tải bài học...' : 'Loading lesson...'}</div>;
  }

  if (error || !lesson || !path) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <ShieldAlert size={48} style={{ color: 'var(--fg-danger)', margin: '0 auto var(--space-2)' }} />
        <h3>{language === 'vi' ? 'Lỗi tải bài học' : 'Error Loading Lesson'}</h3>
        <p style={{ margin: 'var(--space-1) auto' }}>{error || (language === 'vi' ? 'Không tìm thấy thông tin.' : 'Information not found.')}</p>
        <Link href={`/learning/${pathId}`} className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 'var(--space-2)' }}>
          {language === 'vi' ? 'Quay lại Lộ trình' : 'Back to Path'}
        </Link>
      </div>
    );
  }

  const currentIdx = allLessons.findIndex(l => l.id === lessonId);
  const nextLesson = currentIdx !== -1 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const resolvedObjective = lesson.learningObjective || LESSON_METADATA_FALLBACKS[lesson.title]?.objective || (language === 'vi' ? `Làm chủ lý thuyết và thực hành về ${lesson.title}` : `Master theory and practice on ${lesson.title}`);
  const resolvedMinutes = lesson.estimatedMinutes || LESSON_METADATA_FALLBACKS[lesson.title]?.minutes || 12;

  return (
    <div style={{ userSelect: 'text', width: '100%' }}>
      <style>{`
        .lesson-prose {
          font-size: 15px;
          line-height: 1.85;
          color: var(--text-body);
        }
        .lesson-prose h1, .lesson-prose h2, .lesson-prose h3, .lesson-prose h4 {
          color: var(--text-heading);
          font-weight: 800;
          margin-top: 28px;
          margin-bottom: 14px;
        }
        .lesson-prose h1 { font-size: 1.8rem; border-bottom: 2px solid var(--border-default); padding-bottom: 8px; margin-top: 0; }
        .lesson-prose h2 { font-size: 1.45rem; border-bottom: 1px solid var(--border-default); padding-bottom: 6px; }
        .lesson-prose h3 { font-size: 1.2rem; }
        .lesson-prose p { margin-bottom: 16px; }
        .lesson-prose strong { color: var(--text-heading); font-weight: 700; }
        .lesson-prose ul, .lesson-prose ol { margin-bottom: 16px; padding-left: 24px; }
        
        /* Reset list item border/styles to prevent browser/extension layout leakage */
        .lesson-prose li {
          margin-bottom: 8px;
          border: none !important;
          border-bottom: none !important;
          text-decoration: none !important;
        }
        
        .lesson-prose blockquote {
          border-left: 4px solid var(--border-brand);
          padding: 10px 18px;
          margin: 18px 0;
          background: var(--bg-neutral-secondary);
          color: var(--text-body-subtle);
          font-style: italic;
          border-radius: 0 6px 6px 0;
          border-top: none !important;
          border-right: none !important;
          border-bottom: none !important;
        }
        
        .lesson-prose pre {
          background: #11111b; /* High-contrast terminal background */
          border: 1px solid #313244 !important;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 13px;
          color: #cdd6f4;
          line-height: 1.6;
          margin: 18px 0;
        }
        
        /* Reset inline code border inheritance inside code blocks */
        .lesson-prose pre code {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          color: inherit !important;
          font-size: inherit !important;
          border: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
          display: block; /* Ensures block-level container without line splits */
        }
        
        /* Clean style for inline code */
        .lesson-prose code {
          background: var(--bg-neutral-secondary);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--fg-brand);
          border: 1px solid var(--border-default) !important;
          box-shadow: none !important;
        }
        
        .lesson-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 14px;
        }
        .lesson-prose th, .lesson-prose td {
          border: 1px solid var(--border-default);
          padding: 10px 14px;
          text-align: left;
        }
        .lesson-prose th {
          background: var(--bg-neutral-secondary);
          font-weight: 700;
          color: var(--text-heading);
        }
      `}</style>

      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
        <Link href="/learning" style={{ color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'Lộ trình học' : 'Learning Paths'}</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <Link href={`/learning/${pathId}`} style={{ color: 'var(--text-body-subtle)' }}>{path.title}</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-heading)' }}>{localizeLessonTitle(lesson.title, language)}</span>
      </div>

      {/* Main Workspace Layout */}
      <div className="lesson-detail-layout">
        
        {/* Left Side: Lesson content doc reader */}
        <div className="card" style={{ padding: '32px', minWidth: 0 }}>
          <div style={{ marginBottom: '24px' }}>
            <Link href={`/learning/${pathId}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--fg-brand)', fontWeight: 600 }}>
              <ArrowLeft size={14} /> {language === 'vi' ? 'Quay lại Lộ trình học' : 'Back to Learning Path'}
            </Link>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '28px', 
            padding: '16px 20px', 
            background: 'var(--bg-neutral-secondary)', 
            border: '1px solid var(--border-default)', 
            borderRadius: '10px',
            color: 'var(--text-body)', 
            fontSize: '13.5px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Target size={18} style={{ color: 'var(--fg-brand)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-heading)', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  {language === 'vi' ? 'Mục tiêu chính' : 'Key Objective'}
                </strong>
                <span>{localizeLessonObjective(lesson.title, language, resolvedObjective)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Clock size={18} style={{ color: 'var(--text-body-subtle)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-heading)', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  {language === 'vi' ? 'Thời lượng ước tính' : 'Estimated Time'}
                </strong>
                <span>{resolvedMinutes} {language === 'vi' ? 'phút đọc & hiểu' : 'minutes reading & comprehension'}</span>
              </div>
            </div>
          </div>

          {/* Rendered HTML */}
          <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          
          {/* Practice section at the end of the lesson content */}
          <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <PlayCircle size={20} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Bài thực hành bám sát lý thuyết' : 'Hands-on Labs'}
            </h3>
            
            {defaultLab ? (
              <div className="card" style={{ background: 'var(--bg-brand-softer)', border: '1px solid rgba(56,189,248,0.2)', padding: '24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center', margin: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-brand" style={{ fontSize: '10px' }}>{language === 'vi' ? 'Hệ thống' : 'System'}</span>
                    <span className={`badge ${defaultLab.difficulty === 'BEGINNER' ? 'badge-easy' : defaultLab.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 'badge-hard'}`} style={{ fontSize: '10px' }}>
                      {defaultLab.difficulty === 'BEGINNER' ? t('common.easy') : defaultLab.difficulty === 'INTERMEDIATE' ? t('common.medium') : t('common.hard')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)', fontWeight: 600 }}>+{defaultLab.points} XP</span>
                  </div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px 0' }}>
                    {defaultLab.title}
                  </h4>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-body-subtle)', lineHeight: 1.6, margin: 0 }}>
                    {defaultLab.description}
                  </p>
                </div>
                <Link 
                  href={`/labs/${defaultLab.id}/play?pathId=${pathId}&lessonId=${lessonId}`}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', whiteSpace: 'nowrap' }}
                >
                  <PlayCircle size={16} /> {language === 'vi' ? 'Bắt đầu thực hành ngay' : 'Start Practice Now'}
                </Link>
              </div>
            ) : (
              <div className="card" style={{ background: 'var(--bg-neutral-secondary)', border: '1px solid var(--border-default)', padding: '24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center', margin: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '10px' }}>AI Generated</span>
                  </div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px 0' }}>
                    {language === 'vi' ? 'Tạo lab thực hành bằng AI' : 'Generate Practice Lab with AI'}
                  </h4>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-body-subtle)', lineHeight: 1.6, margin: 0 }}>
                    {language === 'vi'
                      ? 'Chưa có lab hệ thống mặc định cho bài này. Bấm nút bên phải để AI dựng môi trường sandbox riêng bám sát kịch bản lý thuyết của bài học này.'
                      : 'No default system lab is available for this lesson. Click on the button to have AI spin up a custom sandbox aligned with this lesson theory.'
                    }
                  </p>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={handleGenerateLessonLab}
                  disabled={generatingLab || !practiceVulnerability}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', whiteSpace: 'nowrap' }}
                >
                  {generatingLab ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                  {generatingLab ? (language === 'vi' ? 'Đang khởi tạo...' : 'Initializing...') : (language === 'vi' ? 'Dựng lab bằng AI' : 'Generate Lab with AI')}
                </button>
              </div>
            )}
            {labError && <div className="lesson-lab-error" style={{ marginTop: '12px' }}>{labError}</div>}
          </div>
          
          {/* Footer Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-default)', paddingTop: '24px', marginTop: '32px' }}>
            <div>
              {isAuthenticated && !lesson.completed ? (
                <button
                  className="btn btn-primary"
                  onClick={handleComplete}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle size={16} /> {language === 'vi' ? 'Hoàn thành bài học' : 'Complete Lesson'}
                </button>
              ) : lesson.completed ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--fg-success)', fontSize: '14px', fontWeight: 600 }}>
                  ✓ {language === 'vi' ? 'Đã hoàn thành bài học này' : 'Completed this lesson'}
                </span>
              ) : null}
            </div>

            {nextLesson && (
              <Link href={`/learning/${pathId}/lessons/${nextLesson.id}`} style={{ textDecoration: 'none' }}>
                <div className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {language === 'vi' ? 'Bài tiếp theo:' : 'Next Lesson:'} {localizeLessonTitle(nextLesson.title, language)} <ChevronRight size={14} />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar info & Practical actions */}
        <div className="lesson-detail-sidebar">
          
          {/* Practice Kiosk / Lab integration */}
          <div className="card" style={{ border: '2px solid var(--border-brand)', background: 'var(--bg-brand-softer)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', color: 'var(--fg-brand)' }}>
                <PlayCircle size={18} /> {language === 'vi' ? 'Thực hành thực tế' : 'Hands-on Practice'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                {language === 'vi'
                  ? `Chọn lab có sẵn hoặc tạo một kịch bản mới bám sát bài ${lesson.title}.`
                  : `Choose an available lab or generate a new scenario matching ${localizeLessonTitle(lesson.title, language)}.`
                }
              </p>
              {practiceVulnerability && (
                <div className="lesson-lab-match">
                  {language === 'vi' ? 'Nhóm thực hành:' : 'Practice Category:'} {practiceVulnerability.name}
                </div>
              )}
              <div className="lesson-lab-actions">
                {defaultLab && (
                  <Link href={`/labs/${defaultLab.id}/play?pathId=${pathId}&lessonId=${lessonId}`} className="btn btn-primary lesson-lab-button">
                    <PlayCircle size={16} /> {language === 'vi' ? 'Làm lab mặc định' : 'Solve default lab'}
                  </Link>
                )}
                <button className="btn btn-secondary lesson-lab-button" onClick={handleGenerateLessonLab} disabled={generatingLab || !practiceVulnerability}>
                  {generatingLab ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                  {generatingLab ? (language === 'vi' ? 'Đang tạo kịch bản...' : 'Creating scenario...') : (language === 'vi' ? 'AI tạo lab theo bài học' : 'AI Generate Lab')}
                </button>
              </div>
              {!defaultLab && (
                <p style={{ fontSize: '12px', color: 'var(--text-body-subtle)', margin: '10px 0 0' }}>
                  {language === 'vi'
                    ? 'Chưa có lab hệ thống cho bài này. Bạn vẫn có thể tạo lab thực hành bằng AI.'
                    : 'No system lab available for this lesson. You can still generate one using AI.'
                  }
                </p>
              )}
              {labError && <div className="lesson-lab-error">{labError}</div>}
            </div>

          {/* Table of contents of the Learning Path */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <BookOpen size={16} style={{ color: 'var(--fg-brand)' }} /> {language === 'vi' ? 'Lộ trình học tập' : 'Syllabus'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {allLessons.map((l, index) => {
                const isCurrent = l.id === lessonId;
                return (
                  <Link key={l.id} href={`/learning/${pathId}/lessons/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: isCurrent ? 'var(--bg-brand-softer)' : 'transparent',
                      border: isCurrent ? '1px solid rgba(56,189,248,0.2)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: l.completed ? 'rgba(0, 122, 85, 0.1)' : 'var(--bg-neutral-tertiary)',
                        border: `1.5px solid ${l.completed ? 'var(--border-success)' : 'var(--border-default-medium)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: l.completed ? 'var(--fg-success-strong)' : 'var(--text-body-subtle)',
                        flexShrink: 0
                      }}>
                        {l.completed ? '✓' : index + 1}
                      </div>
                      
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isCurrent ? 600 : 500,
                        color: isCurrent ? 'var(--fg-brand)' : 'var(--text-body)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: l.completed ? 'line-through' : 'none',
                        opacity: l.completed && !isCurrent ? 0.75 : 1
                      }}>
                        {localizeLessonTitle(l.title, language)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {showCongrats && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-neutral-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1)',
            textAlign: 'center',
            animation: 'scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            color: 'var(--text-body)',
          }}>
            <style>{`
              @keyframes scale-up {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '2px solid var(--border-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--fg-brand)',
            }}>
              <Sparkles size={28} />
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
              {language === 'vi' ? 'Chúc mừng bạn!' : 'Congratulations!'}
            </h2>
            
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-body-subtle)', marginBottom: '24px' }}>
              {language === 'vi'
                ? `Bạn đã hoàn thành lý thuyết bài học ${lesson.title}. Hãy thực hành ngay để làm chủ kỹ năng này nhé!`
                : `You have completed the theory for ${lesson.title}. Start practicing to master this skill!`
              }
            </p>

            {defaultLab && (
              <div style={{
                background: 'var(--bg-neutral-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'left',
                marginBottom: '20px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg-brand)', display: 'block', marginBottom: '4px' }}>
                  {language === 'vi' ? 'Bài thực hành mặc định' : 'Default Practice Lab'}
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-heading)', display: 'block', marginBottom: '2px' }}>
                  {defaultLab.title}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-body-subtle)' }}>
                  {language === 'vi' ? 'Phần thưởng:' : 'Reward:'} +{defaultLab.points} XP
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {defaultLab && (
                <Link 
                  href={`/labs/${defaultLab.id}/play?pathId=${pathId}&lessonId=${lessonId}`}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <PlayCircle size={16} /> {language === 'vi' ? 'Làm lab mặc định' : 'Solve default lab'}
                </Link>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={handleGenerateLessonLab} 
                disabled={generatingLab || !practiceVulnerability}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
              >
                {generatingLab ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                {generatingLab ? (language === 'vi' ? 'Đang tạo kịch bản...' : 'Generating...') : (language === 'vi' ? 'AI tạo lab riêng biệt' : 'AI Generate Custom Lab')}
              </button>
              <button 
                className="btn btn-tertiary" 
                onClick={() => setShowCongrats(false)}
                style={{ marginTop: '4px', fontSize: '13px', background: 'transparent', border: 'none', color: 'var(--text-body-subtle)', cursor: 'pointer' }}
              >
                {language === 'vi' ? 'Để sau' : 'Maybe later'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
