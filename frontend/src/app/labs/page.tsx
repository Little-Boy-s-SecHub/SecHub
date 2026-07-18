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
  const [searchQuery, setSearchQuery] = useState('');

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiVulnSlug, setAiVulnSlug] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('BEGINNER');
  const [aiScenario, setAiScenario] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatusLogs, setAiStatusLogs] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');
  const [aiLanguage, setAiLanguage] = useState(language === 'vi' ? 'vi' : 'en');

  useEffect(() => {
    if (showAiModal) {
      setAiLanguage(language === 'vi' ? 'vi' : 'en');
    }
  }, [showAiModal, language]);

  // AI Wizard States for beginners
  const [useWizard, setUseWizard] = useState(true);
  const [wizardApp, setWizardApp] = useState('ecommerce');
  const [wizardFeature, setWizardFeature] = useState('');
  const [wizardGoal, setWizardGoal] = useState('');

  const appOptions = [
    { value: 'ecommerce', label: language === 'vi' ? 'Cửa hàng trực tuyến (E-commerce)' : 'E-commerce Online Store' },
    { value: 'social', label: language === 'vi' ? 'Mạng xã hội (Social Network)' : 'Social Network' },
    { value: 'cms', label: language === 'vi' ? 'Hệ thống Quản lý Nội dung (Blog/CMS)' : 'Content Management System (Blog/CMS)' },
    { value: 'hr', label: language === 'vi' ? 'Hệ thống Quản trị Nội bộ (HR/ERP)' : 'Internal Management System (HR/ERP)' },
  ];

  const getWizardOptions = (vulnSlug: string) => {
    const isVi = language === 'vi';
    switch (vulnSlug) {
      case 'sql-injection':
        return {
          features: [
            { value: 'login', label: isVi ? 'Trang đăng nhập thành viên (Bypass Auth)' : 'User Login Page (Bypass Auth)' },
            { value: 'search', label: isVi ? 'Thanh tìm kiếm sản phẩm (Search SQLi)' : 'Product Search Bar (Search SQLi)' },
            { value: 'category', label: isVi ? 'Bộ lọc danh mục hàng hóa (Category Filter)' : 'Category Filter (Category Filter)' },
            { value: 'details', label: isVi ? 'Trang xem chi tiết đơn hàng (ID Parameter)' : 'Order Details Page (ID Parameter)' },
            { value: 'orderby', label: isVi ? 'Trang báo cáo doanh thu (Order By Injection)' : 'Revenue Report Page (Order By Injection)' },
          ],
          goals: [
            { value: 'bypass', label: isVi ? 'Bypass đăng nhập để chiếm quyền Admin' : 'Bypass authentication to gain Admin rights' },
            { value: 'dump_users', label: isVi ? 'Đọc toàn bộ thông tin tài khoản và mật khẩu (Dump users)' : 'Extract all accounts and credentials (Dump users)' },
            { value: 'read_db', label: isVi ? 'Trích xuất thông tin thẻ tín dụng từ database' : 'Extract credit card information from database' },
            { value: 'read_files', label: isVi ? 'Đọc tệp tin cấu hình nhạy cảm trên máy chủ qua SQLi' : 'Read sensitive configuration files on the server via SQLi' },
          ]
        };
      case 'xss':
        return {
          features: [
            { value: 'comment', label: isVi ? 'Khung viết bình luận dưới bài viết (Stored XSS)' : 'Comment section under posts (Stored XSS)' },
            { value: 'search', label: isVi ? 'Thanh tìm kiếm từ khóa (Reflected XSS)' : 'Keyword search bar (Reflected XSS)' },
            { value: 'chat', label: isVi ? 'Trang chat trực tuyến hỗ trợ khách hàng' : 'Customer support online chat room' },
            { value: 'profile', label: isVi ? 'Trang sửa đổi mô tả tiểu sử cá nhân (Bio)' : 'Bio edit page (Bio)' },
            { value: 'editor', label: isVi ? 'Trình soạn thảo văn bản của bài viết (Rich Text Editor)' : 'Post rich text editor (Rich Text Editor)' },
          ],
          goals: [
            { value: 'cookie', label: isVi ? 'Đánh cắp Cookie phiên đăng nhập của quản trị viên' : 'Steal admin session cookies' },
            { value: 'redirect', label: isVi ? 'Chèn mã độc tự động chuyển hướng sang trang giả mạo' : 'Inject malicious script to redirect to phishing site' },
            { value: 'deface', label: isVi ? 'Thay đổi giao diện trang web (Deface trang chủ)' : 'Deface main website layout (Deface homepage)' },
            { value: 'spam', label: isVi ? 'Tự động gửi tin nhắn spam hoặc kết bạn hàng loạt' : 'Send spam messages or mass friend requests' },
          ]
        };
      case 'csrf':
        return {
          features: [
            { value: 'password_change', label: isVi ? 'Trang đổi mật khẩu tài khoản' : 'Password change page' },
            { value: 'transfer', label: isVi ? 'Chức năng chuyển khoản tiền tệ' : 'Money transfer function' },
            { value: 'email_update', label: isVi ? 'Cập nhật email nhận mã khôi phục' : 'Update recovery email' },
            { value: 'delete_account', label: isVi ? 'Trang gửi yêu cầu xóa tài khoản' : 'Deactivate/Delete account page' },
            { value: 'one_click_buy', label: isVi ? 'Chức năng mua hàng tự động bằng 1-Click' : '1-Click automatic checkout buy button' },
          ],
          goals: [
            { value: 'bypass_pass', label: isVi ? 'Lừa Admin đổi mật khẩu để chiếm đoạt tài khoản' : 'Force Admin to change password to takeover account' },
            { value: 'force_trans', label: isVi ? 'Ép nạn nhân thực hiện giao dịch chuyển tiền trái phép' : 'Force victim to execute unauthorized transaction' },
            { value: 'hijack_email', label: isVi ? 'Đổi email liên kết sang email của kẻ tấn công' : 'Hijack link email to attacker email' },
            { value: 'escalate', label: isVi ? 'Tự động nâng quyền tài khoản nạn nhân lên Moderator' : 'Automatically escalate user privilege to Moderator' },
          ]
        };
      case 'idor':
        return {
          features: [
            { value: 'invoice', label: isVi ? 'Tải hóa đơn mua hàng dạng PDF (Invoice ID)' : 'Download invoice PDF (Invoice ID)' },
            { value: 'profile', label: isVi ? 'Trang thông tin tài khoản cá nhân (User ID)' : 'User profile details page (User ID)' },
            { value: 'message', label: isVi ? 'Hộp thư tin nhắn trò chuyện cá nhân (Chat ID)' : 'Private message inbox (Chat ID)' },
            { value: 'api', label: isVi ? 'API cập nhật số điện thoại người dùng' : 'API endpoint to update user phone' },
            { value: 'cart', label: isVi ? 'Chi tiết giỏ hàng đang chờ thanh toán' : 'Checkout shopping cart details' },
          ],
          goals: [
            { value: 'read_others', label: isVi ? 'Xem thông tin cá nhân của toàn bộ người dùng khác' : 'Read personal data of other users' },
            { value: 'download_invoices', label: isVi ? 'Tải toàn bộ hóa đơn thanh toán của người khác' : 'Download private invoices of other customers' },
            { value: 'takeover', label: isVi ? 'Đổi mật khẩu hoặc số điện thoại để chiếm đoạt tài khoản bất kỳ' : 'Update credentials to takeover arbitrary accounts' },
            { value: 'read_chat', label: isVi ? 'Xem trộm lịch sử tin nhắn riêng tư của người dùng khác' : 'Snoop other users private chat logs' },
          ]
        };
      case 'ssrf':
        return {
          features: [
            { value: 'preview', label: isVi ? 'Tải ảnh đại diện từ link URL bên ngoài' : 'Load user avatar from external URL link' },
            { value: 'webhook', label: isVi ? 'Chức năng cấu hình Webhook URL nhận thông báo' : 'Webhook URL endpoint configuration' },
            { value: 'import', label: isVi ? 'Nhập dữ liệu JSON/XML từ đường dẫn bên ngoài' : 'Import JSON/XML feeds from external resource' },
            { value: 'link_preview', label: isVi ? 'Trang xem trước nội dung liên kết (Link Preview)' : 'Link preview card builder (Link Preview)' },
          ],
          goals: [
            { value: 'metadata', label: isVi ? 'Đọc dữ liệu cấu hình nhạy cảm từ Cloud Metadata (AWS/GCP)' : 'Fetch cloud instance configuration from Metadata API (AWS/GCP)' },
            { value: 'portscan', label: isVi ? 'Quét các cổng dịch vụ đang chạy ngầm trong mạng nội bộ' : 'Scan open ports inside the internal network' },
            { value: 'file_read', label: isVi ? 'Đọc file hệ thống cục bộ (/etc/passwd) thông qua file://' : 'Read local system files (/etc/passwd) via file:// scheme' },
            { value: 'internal_post', label: isVi ? 'Thực hiện tấn công gửi POST request tới API nội bộ' : 'Trigger unauthorized POST requests to internal APIs' },
          ]
        };
      case 'command-injection':
        return {
          features: [
            { value: 'ping', label: isVi ? 'Công cụ kiểm tra kết nối mạng (Ping utility)' : 'Network diagnostic ping tool (Ping utility)' },
            { value: 'converter', label: isVi ? 'Trang chuyển đổi định dạng ảnh/video (FFmpeg)' : 'Media format converter service (FFmpeg)' },
            { value: 'compress', label: isVi ? 'Hệ thống nén tệp tin thành file ZIP để tải xuống' : 'Compress files to download ZIP archive' },
            { value: 'backup', label: isVi ? 'Chức năng sao lưu cơ sở dữ liệu hệ thống' : 'Database backup system scheduler' },
          ],
          goals: [
            { value: 'read_etc', label: isVi ? 'Đọc các file cấu hình hệ thống (/etc/passwd)' : 'Read system files like /etc/passwd' },
            { value: 'reverse_shell', label: isVi ? 'Tạo kết nối ngược (Reverse Shell) về máy kẻ tấn công' : 'Spawn reverse shell connection back to attacker listener' },
            { value: 'os_info', label: isVi ? 'Liệt kê các tiến trình đang chạy và thông tin hệ điều hành' : 'Enumerate running OS processes and host details' },
            { value: 'modify_code', label: isVi ? 'Xóa hoặc sửa đổi mã nguồn ứng dụng trên máy chủ' : 'Deface or inject malicious payloads directly into source code' },
          ]
        };
      case 'file-upload':
        return {
          features: [
            { value: 'avatar', label: isVi ? 'Trang tải lên ảnh đại diện cá nhân (Avatar)' : 'Avatar profile upload page (Avatar)' },
            { value: 'document', label: isVi ? 'Đăng tải tài liệu hướng dẫn định dạng PDF/DOCX' : 'PDF/DOCX instructions guide uploader' },
            { value: 'zip', label: isVi ? 'Tải lên tệp tin nén chứa tài nguyên (ZIP)' : 'Compressed ZIP file archive uploader' },
            { value: 'assignment', label: isVi ? 'Cổng nộp bài tập thực hành của học sinh' : 'Classroom assignment file submission portal' },
          ],
          goals: [
            { value: 'webshell', label: isVi ? 'Tải lên file webshell (PHP/JSP) để thực thi lệnh từ xa' : 'Upload webshell (PHP/JSP) to execute remote commands' },
            { value: 'stored_xss', label: isVi ? 'Lưu trữ tệp tin độc hại để thực hiện Stored XSS' : 'Host HTML page for Stored XSS execution' },
            { value: 'disk_dos', label: isVi ? 'Gây cạn kiệt dung lượng đĩa cứng của máy chủ (DoS)' : 'Trigger Server Disk Exhaustion (DoS)' },
            { value: 'bypass_filter', label: isVi ? 'Bypass bộ lọc đuôi file bằng cách ngụy trang extension' : 'Bypass validation filters using double extension masking' },
          ]
        };
      case 'auth-bypass':
        return {
          features: [
            { value: 'admin_panel', label: isVi ? 'Trang quản trị dành riêng cho quản trị viên' : 'Admin panel reserved for administration staff' },
            { value: 'password_reset', label: isVi ? 'Trang khôi phục mật khẩu qua câu hỏi bảo mật' : 'Password recovery via security questions page' },
            { value: 'otp_api', label: isVi ? 'API xác thực OTP đăng nhập' : 'API endpoint for MFA OTP validation' },
            { value: 'payment_gateway', label: isVi ? 'Cổng thanh toán và xác nhận giao dịch' : 'Payment checkout confirmation webhook' },
          ],
          goals: [
            { value: 'login_bypass', label: isVi ? 'Đăng nhập trực tiếp làm Admin mà không cần mật khẩu' : 'Login directly as Administrator without password' },
            { value: 'mfa_bypass', label: isVi ? 'Bypass xác thực 2 lớp (2FA/OTP) bằng brute force' : 'Brute force MFA/OTP verification codes' },
            { value: 'admin_url', label: isVi ? 'Bypass kiểm tra quyền để truy cập trực tiếp URL Admin' : 'Access secret Admin paths directly bypassing router filters' },
            { value: 'session_hijack', label: isVi ? 'Giả mạo Token/Cookie người dùng khác để mạo danh phiên' : 'Forge session Cookies or JWT tokens to masquerade identity' },
          ]
        };
      default:
        return {
          features: [
            { value: 'upload', label: isVi ? 'Chức năng tải lên tập tin đính kèm' : 'Attachment file uploader component' },
            { value: 'admin', label: isVi ? 'Bảng điều khiển quản trị hệ thống' : 'Admin panel dashboard' },
            { value: 'reset', label: isVi ? 'Trang yêu cầu cấp lại mật khẩu tài khoản' : 'Account password reset page' },
            { value: 'search_general', label: isVi ? 'Thanh tìm kiếm dữ liệu chung' : 'Global search database query' },
          ],
          goals: [
            { value: 'read', label: isVi ? 'Bypass cơ chế kiểm tra quyền hạn để đọc file mật' : 'Bypass access validation to read private file' },
            { value: 'execute', label: isVi ? 'Tải tệp tin thực thi để chạy lệnh shell từ xa' : 'Execute arbitrary terminal commands remotely' },
            { value: 'privilege', label: isVi ? 'Leo thang đặc quyền lên tài khoản cấp cao hơn' : 'Escalate privileges to administrative level' },
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
    const isVi = language === 'vi';
    setAiStatusLogs([
      isVi ? '[*] Khởi tạo Codex 5.6 agent...' : '[*] Initializing Codex 5.6 agent...',
      isVi ? `[*] Xác nhận lỗ hổng bảo mật: ${aiVulnSlug}` : `[*] Confirming vulnerability: ${aiVulnSlug}`,
      isVi ? `[*] Thiết lập độ khó: ${aiDifficulty}` : `[*] Setting difficulty level: ${aiDifficulty}`
    ]);

    const addLog = (msg: string) => {
      setAiStatusLogs(prev => [...prev, msg]);
    };

    setTimeout(() => addLog(isVi ? '[*] Đang phân tích kịch bản tấn công của người dùng...' : '[*] Analyzing user-specified attack scenario...'), 600);
    setTimeout(() => addLog(isVi ? '[*] Đang tạo LabSpec có cấu trúc bằng GPT-5.6 Sol...' : '[*] Drafting structured LabSpec schema via GPT-5.6 Sol...'), 1200);
    setTimeout(() => addLog(isVi ? '[*] Đang sinh source và Docker artifact từ template an toàn...' : '[*] Generating safe source templates and Docker artifacts...'), 2000);

    const baseScenario = useWizard ? generatedScenario : aiScenario;
    const langMap: Record<string, string> = {
      vi: 'Vietnamese (Tiếng Việt)',
      en: 'English',
      ja: 'Japanese (日本語)',
      zh: 'Chinese (中文)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
      ru: 'Russian (Русский)'
    };
    const targetLangName = langMap[aiLanguage] || 'English';
    const scenarioWithLanguage = `${baseScenario}\nLANGUAGE REQUIREMENT: Generate all lab text, title, description, tasks, instructions, and hints in ${targetLangName}.`;

    try {
      const res = await api.labs.generateWithAi(aiVulnSlug, aiDifficulty, scenarioWithLanguage);
      if (res.success && res.data) {
        addLog(isVi ? '[+] Sinh bài lab thành công từ AI!' : '[+] AI Lab generation completed successfully!');
        addLog(isVi ? '[+] Đã lưu metadata và source lab; sẵn sàng build khi người học bắt đầu.' : '[+] Metadata and lab sources saved; ready to spin up Docker container.');
        
        setTimeout(() => {
          setLabs(prev => [res.data, ...prev]);
          setShowAiModal(false);
          setAiGenerating(false);
          setAiScenario('');
          setAiStatusLogs([]);
        }, 1500);
      } else {
        throw new Error(res.message || (isVi ? 'Lỗi không rõ khi sinh bài lab từ AI.' : 'Unknown error occurred during AI lab generation.'));
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || (isVi ? 'Không thể kết nối đến máy chủ hoặc API Key không hợp lệ.' : 'Failed to reach API server or invalid API key configuration.'));
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
    const confirmMsg = language === 'vi'
      ? `Xoá bài lab AI "${lab.title}"? Các phiên đang chạy của lab này cũng sẽ dừng.`
      : `Delete AI lab "${lab.title}"? Active sessions for this lab will also be stopped.`;
    if (!lab.generated || !window.confirm(confirmMsg)) return;
    setDeletingLabId(lab.id);
    try {
      await api.labs.deleteGenerated(lab.id);
      setLabs(current => current.filter(item => item.id !== lab.id));
      setMyAttempts(current => current.filter(attempt => attempt.labId !== lab.id));
    } catch (e: any) {
      alert(e.message || (language === 'vi' ? 'Không thể xoá bài lab.' : 'Failed to delete lab.'));
    } finally {
      setDeletingLabId(null);
    }
  };

  const filteredLabs = labs.filter(lab => {
    if (filterVuln !== 'all' && lab.vulnerabilitySlug !== filterVuln) return false;
    if (filterDifficulty !== 'all' && lab.difficulty !== filterDifficulty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        lab.title.toLowerCase().includes(q) ||
        lab.description.toLowerCase().includes(q) ||
        (lab.vulnerabilityName && lab.vulnerabilityName.toLowerCase().includes(q))
      );
    }
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

      {/* Modern Search & Filter Bar */}
      <div style={{
        background: 'var(--bg-neutral-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        padding: '16px',
        marginTop: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <style>{`
          .filter-search-input::placeholder {
            color: var(--text-body-subtle) !important;
            opacity: 0.8;
          }
          .filter-search-input:focus {
            border-color: var(--fg-brand) !important;
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15) !important;
            background: var(--bg-neutral-primary) !important;
          }
          .diff-tab-btn {
            padding: 8px 16px;
            font-size: 0.8125rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .diff-tab-btn:hover {
            background: var(--bg-neutral-secondary-medium);
            color: var(--text-heading);
          }
          .clear-filters-btn:hover {
            color: var(--fg-danger) !important;
            text-decoration: underline;
          }
        `}</style>
        
        {/* Row 1: Search & Vulnerability selector */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-body-subtle)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className="filter-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm bài lab, lỗ hổng, hoặc mô tả...' : 'Search labs, vulnerabilities, or descriptions...'}
              style={{
                width: '100%',
                background: 'var(--bg-neutral-secondary-soft)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '10px 16px 10px 42px',
                color: 'var(--text-heading)',
                fontSize: '0.875rem',
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-body-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Vulnerability Dropdown */}
          <div style={{ flexShrink: 0 }}>
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
          </div>
        </div>

        {/* Row 2: Difficulty Tabs & Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-default-soft)',
          paddingTop: '12px'
        }}>
          {/* Difficulty Button Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-neutral-secondary-soft)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '4px',
            gap: '2px'
          }}>
            {[
              { value: 'all', label: language === 'vi' ? 'Tất cả độ khó' : 'All Levels' },
              { value: 'BEGINNER', label: t('common.beginner') },
              { value: 'INTERMEDIATE', label: t('common.intermediate') },
              { value: 'ADVANCED', label: t('common.advanced') }
            ].map((tab) => {
              const isSelected = filterDifficulty === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilterDifficulty(tab.value)}
                  className="diff-tab-btn"
                  style={{
                    border: 'none',
                    background: isSelected ? 'var(--bg-brand)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-body)',
                    boxShadow: isSelected ? 'var(--shadow-clay-brand-small)' : 'none',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Action links / Lab counts */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.875rem'
          }}>
            {(searchQuery || filterVuln !== 'all' || filterDifficulty !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterVuln('all');
                  setFilterDifficulty('all');
                }}
                className="clear-filters-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--fg-brand)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  padding: 0
                }}
              >
                <Trash2 size={13} /> {language === 'vi' ? 'Xoá bộ lọc' : 'Clear Filters'}
              </button>
            )}

            <div style={{ color: 'var(--text-body-subtle)', fontWeight: 500 }}>
              {language === 'vi' ? (
                <span>Hiển thị <strong>{filteredLabs.length}</strong> bài lab</span>
              ) : (
                <span>Showing <strong>{filteredLabs.length}</strong> labs</span>
              )}
            </div>
          </div>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 150px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-body-subtle)' }}>{language === 'vi' ? 'NGÔN NGỮ BÀI LAB' : 'LAB LANGUAGE'}</label>
                      <CustomSelect
                        value={aiLanguage}
                        onChange={setAiLanguage}
                        options={[
                          { value: 'en', label: 'English' },
                          { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
                          { value: 'ja', label: '日本語 (Japanese)' },
                          { value: 'zh', label: '中文 (Chinese)' },
                          { value: 'es', label: 'Español (Spanish)' },
                          { value: 'fr', label: 'Français (French)' },
                          { value: 'ru', label: 'Русский (Russian)' },
                        ]}
                        placeholder={language === 'vi' ? 'Chọn ngôn ngữ' : 'Select Language'}
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
