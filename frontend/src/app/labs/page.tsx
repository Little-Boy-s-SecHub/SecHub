'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  RotateCw, 
  PlayCircle, 
  Clock, 
  Trophy, 
  Link as LinkIcon, 
  Search,
  ChevronDown,
  Check,
  Sparkles,
  BrainCircuit,
  X,
  AlertTriangle,
  Trash2,
  Zap,
  Keyboard
} from 'lucide-react';
import { api, Lab, Vulnerability, LabAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import PageBackLink from '@/components/PageBackLink';

interface CustomSelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  fullWidth,
  placement = 'bottom'
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  disabled?: boolean;
  fullWidth?: boolean;
  placement?: 'top' | 'bottom';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', userSelect: 'none', width: fullWidth ? '100%' : 'auto' }}
    >
      <style>{`
        .custom-select-option:hover {
          background: var(--bg-neutral-tertiary) !important;
          color: var(--text-heading) !important;
        }
      `}</style>
      <div 
        onClick={handleToggle}
        style={{
          background: 'var(--bg-neutral-secondary-soft)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '10px 16px',
          color: 'var(--text-heading)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          width: '100%',
          minWidth: fullWidth ? 'none' : '240px',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isOpen ? '0 0 0 2px rgba(56, 189, 248, 0.2)' : 'none',
          borderColor: isOpen ? 'var(--fg-brand)' : 'var(--border-default)',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-body-subtle)',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: placement === 'top' ? 'auto' : 'calc(100% + 6px)',
            bottom: placement === 'top' ? 'calc(100% + 6px)' : 'auto',
            left: 0,
            zIndex: 100,
            background: 'var(--bg-neutral-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
            padding: '6px',
            minWidth: '100%',
            width: fullWidth ? '100%' : 'max-content',
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
                className="custom-select-option"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: isSelected ? 'var(--fg-brand)' : 'var(--text-body)',
                  background: isSelected ? 'var(--bg-neutral-tertiary)' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} style={{ color: 'var(--fg-brand)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LabsPage() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useTranslation();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [deletingLabId, setDeletingLabId] = useState<string | null>(null);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [myAttempts, setMyAttempts] = useState<LabAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterVuln, setFilterVuln] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiVulnSlug, setAiVulnSlug] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('BEGINNER');
  const [aiScenario, setAiScenario] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatusLogs, setAiStatusLogs] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');

  // AI Wizard States for beginners
  const [useWizard, setUseWizard] = useState(true);
  const [wizardApp, setWizardApp] = useState('ecommerce');
  const [wizardFeature, setWizardFeature] = useState('');
  const [wizardGoal, setWizardGoal] = useState('');

  const appOptions = [
    { value: 'ecommerce', label: 'Cửa hàng trực tuyến (E-commerce)' },
    { value: 'social', label: 'Mạng xã hội (Social Network)' },
    { value: 'cms', label: 'Hệ thống Quản lý Nội dung (Blog/CMS)' },
    { value: 'hr', label: 'Hệ thống Quản trị Nội bộ (HR/ERP)' },
  ];

  const getWizardOptions = (vulnSlug: string) => {
    switch (vulnSlug) {
      case 'sql-injection':
        return {
          features: [
            { value: 'login', label: 'Trang đăng nhập thành viên (Bypass Auth)' },
            { value: 'search', label: 'Thanh tìm kiếm sản phẩm (Search SQLi)' },
            { value: 'category', label: 'Bộ lọc danh mục hàng hóa (Category Filter)' },
            { value: 'details', label: 'Trang xem chi tiết đơn hàng (ID Parameter)' },
            { value: 'orderby', label: 'Trang báo cáo doanh thu (Order By Injection)' },
          ],
          goals: [
            { value: 'bypass', label: 'Bypass đăng nhập để chiếm quyền Admin' },
            { value: 'dump_users', label: 'Đọc toàn bộ thông tin tài khoản và mật khẩu (Dump users)' },
            { value: 'read_db', label: 'Trích xuất thông tin thẻ tín dụng từ database' },
            { value: 'read_files', label: 'Đọc tệp tin cấu hình nhạy cảm trên máy chủ qua SQLi' },
          ]
        };
      case 'xss':
        return {
          features: [
            { value: 'comment', label: 'Khung viết bình luận dưới bài viết (Stored XSS)' },
            { value: 'search', label: 'Thanh tìm kiếm từ khóa (Reflected XSS)' },
            { value: 'chat', label: 'Trang chat trực tuyến hỗ trợ khách hàng' },
            { value: 'profile', label: 'Trang sửa đổi mô tả tiểu sử cá nhân (Bio)' },
            { value: 'editor', label: 'Trình soạn thảo văn bản của bài viết (Rich Text Editor)' },
          ],
          goals: [
            { value: 'cookie', label: 'Đánh cắp Cookie phiên đăng nhập của quản trị viên' },
            { value: 'redirect', label: 'Chèn mã độc tự động chuyển hướng sang trang giả mạo' },
            { value: 'deface', label: 'Thay đổi giao diện trang web (Deface trang chủ)' },
            { value: 'spam', label: 'Tự động gửi tin nhắn spam hoặc kết bạn hàng loạt' },
          ]
        };
      case 'csrf':
        return {
          features: [
            { value: 'password_change', label: 'Trang đổi mật khẩu tài khoản' },
            { value: 'transfer', label: 'Chức năng chuyển khoản tiền tệ' },
            { value: 'email_update', label: 'Cập nhật email nhận mã khôi phục' },
            { value: 'delete_account', label: 'Trang gửi yêu cầu xóa tài khoản' },
            { value: 'one_click_buy', label: 'Chức năng mua hàng tự động bằng 1-Click' },
          ],
          goals: [
            { value: 'bypass_pass', label: 'Lừa Admin đổi mật khẩu để chiếm đoạt tài khoản' },
            { value: 'force_trans', label: 'Ép nạn nhân thực hiện giao dịch chuyển tiền trái phép' },
            { value: 'hijack_email', label: 'Đổi email liên kết sang email của kẻ tấn công' },
            { value: 'escalate', label: 'Tự động nâng quyền tài khoản nạn nhân lên Moderator' },
          ]
        };
      case 'idor':
        return {
          features: [
            { value: 'invoice', label: 'Tải hóa đơn mua hàng dạng PDF (Invoice ID)' },
            { value: 'profile', label: 'Trang thông tin tài khoản cá nhân (User ID)' },
            { value: 'message', label: 'Hộp thư tin nhắn trò chuyện cá nhân (Chat ID)' },
            { value: 'api', label: 'API cập nhật số điện thoại người dùng' },
            { value: 'cart', label: 'Chi tiết giỏ hàng đang chờ thanh toán' },
          ],
          goals: [
            { value: 'read_others', label: 'Xem thông tin cá nhân của toàn bộ người dùng khác' },
            { value: 'download_invoices', label: 'Tải toàn bộ hóa đơn thanh toán của người khác' },
            { value: 'takeover', label: 'Đổi mật khẩu hoặc số điện thoại để chiếm đoạt tài khoản bất kỳ' },
            { value: 'read_chat', label: 'Xem trộm lịch sử tin nhắn riêng tư của người dùng khác' },
          ]
        };
      case 'ssrf':
        return {
          features: [
            { value: 'preview', label: 'Tải ảnh đại diện từ link URL bên ngoài' },
            { value: 'webhook', label: 'Chức năng cấu hình Webhook URL nhận thông báo' },
            { value: 'import', label: 'Nhập dữ liệu JSON/XML từ đường dẫn bên ngoài' },
            { value: 'link_preview', label: 'Trang xem trước nội dung liên kết (Link Preview)' },
          ],
          goals: [
            { value: 'metadata', label: 'Đọc dữ liệu cấu hình nhạy cảm từ Cloud Metadata (AWS/GCP)' },
            { value: 'portscan', label: 'Quét các cổng dịch vụ đang chạy ngầm trong mạng nội bộ' },
            { value: 'file_read', label: 'Đọc file hệ thống cục bộ (/etc/passwd) thông qua file://' },
            { value: 'internal_post', label: 'Thực hiện tấn công gửi POST request tới API nội bộ' },
          ]
        };
      case 'command-injection':
        return {
          features: [
            { value: 'ping', label: 'Công cụ kiểm tra kết nối mạng (Ping utility)' },
            { value: 'converter', label: 'Trang chuyển đổi định dạng ảnh/video (FFmpeg)' },
            { value: 'compress', label: 'Hệ thống nén tệp tin thành file ZIP để tải xuống' },
            { value: 'backup', label: 'Chức năng sao lưu cơ sở dữ liệu hệ thống' },
          ],
          goals: [
            { value: 'read_etc', label: 'Đọc các file cấu hình hệ thống (/etc/passwd)' },
            { value: 'reverse_shell', label: 'Tạo kết nối ngược (Reverse Shell) về máy kẻ tấn công' },
            { value: 'os_info', label: 'Liệt kê các tiến trình đang chạy và thông tin hệ điều hành' },
            { value: 'modify_code', label: 'Xóa hoặc sửa đổi mã nguồn ứng dụng trên máy chủ' },
          ]
        };
      case 'file-upload':
        return {
          features: [
            { value: 'avatar', label: 'Trang tải lên ảnh đại diện cá nhân (Avatar)' },
            { value: 'document', label: 'Đăng tải tài liệu hướng dẫn định dạng PDF/DOCX' },
            { value: 'zip', label: 'Tải lên tệp tin nén chứa tài nguyên (ZIP)' },
            { value: 'assignment', label: 'Cổng nộp bài tập thực hành của học sinh' },
          ],
          goals: [
            { value: 'webshell', label: 'Tải lên file webshell (PHP/JSP) để thực thi lệnh từ xa' },
            { value: 'stored_xss', label: 'Lưu trữ tệp tin độc hại để thực hiện Stored XSS' },
            { value: 'disk_dos', label: 'Gây cạn kiệt dung lượng đĩa cứng của máy chủ (DoS)' },
            { value: 'bypass_filter', label: 'Bypass bộ lọc đuôi file bằng cách ngụy trang extension' },
          ]
        };
      case 'auth-bypass':
        return {
          features: [
            { value: 'admin_panel', label: 'Trang quản trị dành riêng cho quản trị viên' },
            { value: 'password_reset', label: 'Trang khôi phục mật khẩu qua câu hỏi bảo mật' },
            { value: 'otp_api', label: 'API xác thực OTP đăng nhập' },
            { value: 'payment_gateway', label: 'Cổng thanh toán và xác nhận giao dịch' },
          ],
          goals: [
            { value: 'login_bypass', label: 'Đăng nhập trực tiếp làm Admin mà không cần mật khẩu' },
            { value: 'mfa_bypass', label: 'Bypass xác thực 2 lớp (2FA/OTP) bằng brute force' },
            { value: 'admin_url', label: 'Bypass kiểm tra quyền để truy cập trực tiếp URL Admin' },
            { value: 'session_hijack', label: 'Giả mạo Token/Cookie người dùng khác để mạo danh phiên' },
          ]
        };
      default:
        return {
          features: [
            { value: 'upload', label: 'Chức năng tải lên tập tin đính kèm' },
            { value: 'admin', label: 'Bảng điều khiển quản trị hệ thống' },
            { value: 'reset', label: 'Trang yêu cầu cấp lại mật khẩu tài khoản' },
            { value: 'search_general', label: 'Thanh tìm kiếm dữ liệu chung' },
          ],
          goals: [
            { value: 'read', label: 'Bypass cơ chế kiểm tra quyền hạn để đọc file mật' },
            { value: 'execute', label: 'Tải tệp tin thực thi để chạy lệnh shell từ xa' },
            { value: 'privilege', label: 'Leo thang đặc quyền lên tài khoản cấp cao hơn' },
          ]
        };
    }
  };

  const wizardOpts = getWizardOptions(aiVulnSlug);

  useEffect(() => {
    const opts = getWizardOptions(aiVulnSlug);
    if (opts.features.length > 0) setWizardFeature(opts.features[0].value);
    if (opts.goals.length > 0) setWizardGoal(opts.goals[0].value);
  }, [aiVulnSlug]);

  const getAppLabel = () => appOptions.find(o => o.value === wizardApp)?.label || '';
  const getFeatureLabel = () => wizardOpts.features.find(o => o.value === wizardFeature)?.label || '';
  const getGoalLabel = () => wizardOpts.goals.find(o => o.value === wizardGoal)?.label || '';

  const generatedScenario = language === 'vi'
    ? `Ứng dụng dạng: ${getAppLabel()}. Lỗ hổng nằm ở chức năng: ${getFeatureLabel()}. Mục tiêu tấn công là: ${getGoalLabel()}.`
    : `Application type: ${getAppLabel()}. Vulnerability is in feature: ${getFeatureLabel()}. Target goal: ${getGoalLabel()}.`;

  useEffect(() => {
    async function loadData() {
      try {
        const [labsRes, vulnsRes] = await Promise.all([
          api.labs.getLabs(),
          api.vulnerabilities.getAll()
        ]);

        if (labsRes.success) setLabs(labsRes.data);
        if (vulnsRes.success) {
          setVulns(vulnsRes.data);
          if (vulnsRes.data.length > 0) {
            setAiVulnSlug(vulnsRes.data[0].slug);
          }
        }

        if (isAuthenticated) {
          const attemptsRes = await api.labs.getMyAttempts();
          if (attemptsRes.success) setMyAttempts(attemptsRes.data);
        }
      } catch (e) {
        console.error('Failed to load labs list:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  const handleAiGenerate = async () => {
    setAiError('');
    setAiGenerating(true);
    setAiStatusLogs([
      '[*] Khởi tạo Codex 5.6 agent...',
      `[*] Xác nhận lỗ hổng bảo mật: ${aiVulnSlug}`,
      `[*] Thiết lập độ khó: ${aiDifficulty}`
    ]);

    const addLog = (msg: string) => {
      setAiStatusLogs(prev => [...prev, msg]);
    };

    setTimeout(() => addLog('[*] Đang phân tích kịch bản tấn công của người dùng...'), 600);
    setTimeout(() => addLog('[*] Đang tạo LabSpec có cấu trúc bằng GPT-5.6 Sol...'), 1200);
    setTimeout(() => addLog('[*] Đang sinh source và Docker artifact từ template an toàn...'), 2000);

    try {
      const res = await api.labs.generateWithAi(aiVulnSlug, aiDifficulty, useWizard ? generatedScenario : aiScenario);
      if (res.success && res.data) {
        addLog('[+] Sinh bài lab thành công từ AI!');
        addLog('[+] Đã lưu metadata và source lab; sẵn sàng build khi người học bắt đầu.');
        
        setTimeout(() => {
          setLabs(prev => [res.data, ...prev]);
          setShowAiModal(false);
          setAiGenerating(false);
          setAiScenario('');
          setAiStatusLogs([]);
        }, 1500);
      } else {
        throw new Error(res.message || 'Lỗi không rõ khi sinh bài lab từ AI.');
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || 'Không thể kết nối đến máy chủ hoặc API Key không hợp lệ.');
      setAiGenerating(false);
    }
  };

  const getLabStatus = (labId: string) => {
    const attempts = myAttempts.filter(a => a.labId === labId);
    if (attempts.some(a => a.status === 'COMPLETED')) {
      return 'COMPLETED';
    }
    const active = attempts.find(a => {
      if (a.status !== 'RUNNING' && a.status !== 'STARTED') return false;
      if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
      return true;
    });
    if (active) {
      return 'IN_PROGRESS';
    }
    return 'NOT_STARTED';
  };

  const handleDeleteGeneratedLab = async (lab: Lab) => {
    if (!lab.generated || !window.confirm(`Xoá bài lab AI "${lab.title}"? Các phiên đang chạy của lab này cũng sẽ dừng.`)) return;
    setDeletingLabId(lab.id);
    try {
      await api.labs.deleteGenerated(lab.id);
      setLabs(current => current.filter(item => item.id !== lab.id));
      setMyAttempts(current => current.filter(attempt => attempt.labId !== lab.id));
    } catch (e: any) {
      alert(e.message || 'Không thể xoá bài lab.');
    } finally {
      setDeletingLabId(null);
    }
  };

  const filteredLabs = labs.filter(lab => {
    if (filterVuln !== 'all' && lab.vulnerabilitySlug !== filterVuln) return false;
    if (filterDifficulty !== 'all' && lab.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div>
      <PageBackLink href="/" label={language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'} />
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={28} style={{ color: 'var(--fg-brand)' }} /> {t('labs.title')}
          </h1>
          <p className="section-subtitle">
            {t('labs.subtitle')}
          </p>
        </div>
        {isAuthenticated && (
          <button 
            onClick={() => setShowAiModal(true)}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, var(--fg-brand) 0%, #a855f7 100%)',
              border: 'none',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <Sparkles size={16} /> {language === 'vi' ? 'Tạo Lab bằng Codex 5.6' : 'Generate Lab with Codex 5.6'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <CustomSelect
          value={filterVuln}
          onChange={setFilterVuln}
          options={[
            { value: 'all', label: language === 'vi' ? 'Tất cả lỗ hổng' : 'All Vulnerabilities' },
            ...vulns.map(v => ({ value: v.slug, label: v.name }))
          ]}
          placeholder={language === 'vi' ? 'Tất cả lỗ hổng' : 'All Vulnerabilities'}
          disabled={loading}
        />

        <CustomSelect
          value={filterDifficulty}
          onChange={setFilterDifficulty}
          options={[
            { value: 'all', label: t('labs.filterAllDiffs') },
            { value: 'BEGINNER', label: t('common.beginner') },
            { value: 'INTERMEDIATE', label: t('common.intermediate') },
            { value: 'ADVANCED', label: t('common.advanced') }
          ]}
          placeholder={t('labs.filterAllDiffs')}
          disabled={loading}
        />

        <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-body-subtle)', display: 'flex', alignItems: 'center' }}>
          {filteredLabs.length} {language === 'vi' ? 'bài lab' : 'labs'}
        </div>
      </div>

      {/* Labs Grid */}
      {loading ? (
        <div className="grid-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ height: '180px', background: 'var(--bg-neutral-secondary-medium)', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <div className="grid-3">
          {filteredLabs.map((lab, index) => {
            const diffClass = lab.difficulty === 'BEGINNER' ? 'badge-easy' : 
                              lab.difficulty === 'INTERMEDIATE' ? 'badge-medium-diff' : 
                              'badge-hard';
            
            const difficultyLabel = lab.difficulty === 'BEGINNER' ? t('common.beginner') :
                                    lab.difficulty === 'INTERMEDIATE' ? t('common.intermediate') : t('common.advanced');

            const status = getLabStatus(lab.id);
            const statusContent = status === 'COMPLETED' ? (
              <span className="lab-card-status" style={{ color: 'var(--fg-success-strong)' }}>
                <CheckCircle2 size={14} /> {t('labs.completedBadge')}
              </span>
            ) : status === 'IN_PROGRESS' ? (
              <span className="lab-card-status" style={{ color: 'var(--fg-brand)' }}>
                <RotateCw size={14} style={{ animation: 'spin 3s linear infinite' }} /> {t('common.running')}
              </span>
            ) : (
              <span className="lab-card-status" style={{ color: 'var(--text-body-subtle)' }}>
                <PlayCircle size={14} /> {language === 'vi' ? 'Chưa bắt đầu' : 'Not started'}
              </span>
            );

            return (
              <Link key={lab.id} href={`/labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="card lab-card animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.04}s`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div className="lab-card-header">
                    <span className={`badge ${diffClass}`}>{difficultyLabel}</span>
                    {statusContent}
                  </div>
                  {lab.generated && (
                    <div className="lab-card-generated-row">
                      <span className="lab-generated-label" title="Lab có source và Docker artifact được tạo tự động"><Sparkles size={13} /> AI generated</span>
                        <button
                           type="button"
                           title="Xoá bài lab AI"
                           aria-label={`Xoá ${lab.title}`}
                           disabled={deletingLabId === lab.id}
                           onClick={(event) => {
                             event.preventDefault();
                             event.stopPropagation();
                             handleDeleteGeneratedLab(lab);
                           }}
                           className="lab-delete-button"
                        >
                          {deletingLabId === lab.id ? <RotateCw size={14} className="spin" /> : <Trash2 size={14} />}
                        </button>
                    </div>
                  )}
                  <div className="lab-card-title">{lab.title}</div>
                  <div className="lab-card-desc">{lab.description}</div>
                  <div className="lab-card-meta" style={{ marginTop: 'auto', paddingTop: 'var(--space-2)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {lab.estimatedMinutes}{language === 'vi' ? 'p' : 'm'}
                    </span>
                    <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Trophy size={12} /> {t('labs.pointsAward', { points: lab.points })}
                    </span>
                    <span className="lab-card-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <LinkIcon size={12} /> {lab.vulnerabilityName}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredLabs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <Search size={40} style={{ color: 'var(--text-body-subtle)' }} />
          </div>
          <div className="empty-state-title">{t('labs.noLabsFound')}</div>
          <div className="empty-state-desc">{language === 'vi' ? 'Thử thay đổi bộ lọc để xem các bài lab khác.' : 'Try changing the filters to see other labs.'}</div>
        </div>
      )}

      {/* AI Lab Generator Modal */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(9, 15, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-neutral-secondary)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(56, 189, 248, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(56, 189, 248, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BrainCircuit size={22} style={{ color: 'var(--fg-brand)' }} />
                <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-heading)' }}>AI Lab Generator (Codex 5.6)</span>
              </div>
              <button 
                onClick={() => {
                  if (!aiGenerating) setShowAiModal(false);
                }}
                disabled={aiGenerating}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-body-subtle)',
                  cursor: aiGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              {aiError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{aiError}</span>
                </div>
              )}

              {aiGenerating ? (
                // Loading / Log screen
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="spinner" style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(56, 189, 248, 0.2)',
                      borderTopColor: 'var(--fg-brand)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>{language === 'vi' ? 'Đang tạo lab thực hành bằng GPT-5.6...' : 'Generating practice lab with GPT-5.6...'}</span>
                  </div>
                  <div style={{
                    background: '#090f1e',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.8125rem',
                    color: '#a6adc8',
                    height: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {aiStatusLogs.map((logStr, i) => (
                      <div key={i} style={{ 
                        color: logStr.startsWith('[+]') ? '#a6e3a1' : 
                               logStr.startsWith('[*]') ? '#89b4fa' : '#cdd6f4'
                      }}>
                        {logStr}
                      </div>
                    ))}
                    <div style={{ borderRight: '2px solid var(--fg-brand)', width: '6px', height: '14px', animation: 'blink 1s step-end infinite' }}></div>
                  </div>
                </div>
              ) : (
                // Form screen
                <>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'PHÂN LOẠI LỖ HỔNG' : 'VULNERABILITY CATEGORY'}</label>
                      <CustomSelect
                        value={aiVulnSlug}
                        onChange={setAiVulnSlug}
                        options={vulns.map(v => ({ value: v.slug, label: v.name }))}
                        placeholder={language === 'vi' ? 'Chọn lỗ hổng' : 'Select Vulnerability'}
                        fullWidth
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 120px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>{t('common.difficulty').toUpperCase()}</label>
                      <CustomSelect
                        value={aiDifficulty}
                        onChange={setAiDifficulty}
                        options={[
                          { value: 'BEGINNER', label: language === 'vi' ? 'Dễ (Beginner)' : 'Easy (Beginner)' },
                          { value: 'INTERMEDIATE', label: language === 'vi' ? 'Trung bình (Intermediate)' : 'Medium (Intermediate)' },
                          { value: 'ADVANCED', label: language === 'vi' ? 'Khó (Advanced)' : 'Hard (Advanced)' }
                        ]}
                        placeholder={language === 'vi' ? 'Chọn độ khó' : 'Select Difficulty'}
                        fullWidth
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'PHƯƠNG THỨC XÂY DỰNG KỊCH BẢN' : 'SCENARIO GENERATION METHOD'}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setUseWizard(true)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: useWizard ? '2px solid var(--border-brand)' : '1px solid var(--border-default)',
                          background: useWizard ? 'var(--bg-brand-softer)' : 'var(--bg-neutral-secondary-soft)',
                          color: useWizard ? 'var(--fg-brand-strong)' : 'var(--text-body)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Zap size={14} /> <span>{language === 'vi' ? 'Chọn theo gợi ý' : 'Select Suggestions'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseWizard(false)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: !useWizard ? '2px solid var(--border-brand)' : '1px solid var(--border-default)',
                          background: !useWizard ? 'var(--bg-brand-softer)' : 'var(--bg-neutral-secondary-soft)',
                          color: !useWizard ? 'var(--fg-brand-strong)' : 'var(--text-body)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Keyboard size={14} /> <span>{language === 'vi' ? 'Tự nhập kịch bản' : 'Manual Input'}</span>
                      </button>
                    </div>
                  </div>

                  {useWizard ? (
                    <>
                      {/* App select */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>1. LOẠI HÌNH ỨNG DỤNG GIẢ LẬP</label>
                        <CustomSelect
                          value={wizardApp}
                          onChange={setWizardApp}
                          options={appOptions}
                          placeholder={language === 'vi' ? 'Chọn ứng dụng' : 'Select Application'}
                          fullWidth
                        />
                      </div>

                      {/* Feature select */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>2. {language === 'vi' ? 'CHỨC NĂNG CHỨA LỖ HỔNG' : 'VULNERABLE COMPONENT/FEATURE'}</label>
                        <CustomSelect
                          value={wizardFeature}
                          onChange={setWizardFeature}
                          options={wizardOpts.features}
                          placeholder={language === 'vi' ? 'Chọn chức năng' : 'Select Feature'}
                          fullWidth
                          placement="top"
                        />
                      </div>

                      {/* Goal select */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>3. {language === 'vi' ? 'MỤC TIÊU KHAI THÁC CHÍNH' : 'PRIMARY EXPLOITATION GOAL'}</label>
                        <CustomSelect
                          value={wizardGoal}
                          onChange={setWizardGoal}
                          options={wizardOpts.goals}
                          placeholder={language === 'vi' ? 'Chọn mục tiêu' : 'Select Goal'}
                          fullWidth
                          placement="top"
                        />
                      </div>

                      {/* Preview of the prompt */}
                      <div style={{
                        background: 'linear-gradient(135deg, var(--bg-brand-soft) 0%, rgba(56,189,248,0.02) 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        marginTop: '4px'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--fg-brand)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                          {language === 'vi' ? 'Kịch bản AI sẽ biên dịch:' : 'AI Compiler Scenario:'}
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.5 }}>
                          {generatedScenario}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'KỊCH BẢN THỰC HÀNH' : 'PRACTICE SCENARIO'}</label>
                      <textarea
                        value={aiScenario}
                        onChange={(e) => setAiScenario(e.target.value)}
                        placeholder={language === 'vi' ? "Mô tả kịch bản bài lab. Ví dụ: 'Trang web thương mại điện tử bị dính Blind SQL Injection...'" : "Describe the lab scenario. E.g. 'An e-commerce site vulnerable to Time-based Blind SQL Injection in search query...'"}
                        rows={4}
                        style={{
                          background: 'var(--bg-neutral-secondary-soft)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: 'var(--text-heading)',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  )}

                </>
              )}
            </div>

            {/* Modal Footer */}
            {!aiGenerating && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: 'rgba(56, 189, 248, 0.01)'
              }}>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '6px' }}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleAiGenerate}
                  className="btn btn-primary"
                  style={{ 
                    padding: '8px 20px', 
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--fg-brand) 0%, #a855f7 100%)',
                    border: 'none',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}
                >
                  {language === 'vi' ? 'Bắt đầu tạo' : 'Start Generating'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
