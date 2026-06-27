// Mock data cho SecHub - sẽ được thay bằng API calls sau
export interface Vulnerability {
  id: string;
  slug: string;
  name: string;
  icon: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  labCount: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  estimatedHours: number;
  lessonCount: number;
  completedLessons: number;
}

export interface Lab {
  id: string;
  vulnerabilitySlug: string;
  vulnerabilityName: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedMinutes: number;
  points: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export const vulnerabilities: Vulnerability[] = [
  {
    id: '1',
    slug: 'sql-injection',
    name: 'SQL Injection',
    icon: 'database',
    severity: 'CRITICAL',
    description: 'Tấn công chèn mã SQL độc hại vào truy vấn cơ sở dữ liệu để truy cập, sửa đổi hoặc xóa dữ liệu trái phép.',
    labCount: 3,
  },
  {
    id: '2',
    slug: 'xss',
    name: 'Cross-Site Scripting (XSS)',
    icon: 'code',
    severity: 'HIGH',
    description: 'Chèn mã JavaScript độc hại vào trang web để đánh cắp cookie, session token hoặc thông tin người dùng.',
    labCount: 3,
  },
  {
    id: '3',
    slug: 'csrf',
    name: 'Cross-Site Request Forgery',
    icon: 'shuffle',
    severity: 'MEDIUM',
    description: 'Lừa người dùng thực hiện hành động không mong muốn trên ứng dụng web mà họ đã xác thực.',
    labCount: 2,
  },
  {
    id: '4',
    slug: 'idor',
    name: 'Insecure Direct Object Reference',
    icon: 'key',
    severity: 'HIGH',
    description: 'Truy cập trái phép vào tài nguyên bằng cách thay đổi tham số tham chiếu đối tượng trong URL hoặc API.',
    labCount: 2,
  },
  {
    id: '5',
    slug: 'ssrf',
    name: 'Server-Side Request Forgery',
    icon: 'server',
    severity: 'HIGH',
    description: 'Khai thác server để thực hiện request đến tài nguyên nội bộ hoặc dịch vụ bên ngoài trái phép.',
    labCount: 2,
  },
  {
    id: '6',
    slug: 'command-injection',
    name: 'Command Injection',
    icon: 'terminal',
    severity: 'CRITICAL',
    description: 'Chèn và thực thi lệnh hệ điều hành trên server thông qua ứng dụng web có lỗ hổng bảo mật.',
    labCount: 2,
  },
  {
    id: '7',
    slug: 'file-upload',
    name: 'File Upload Vulnerabilities',
    icon: 'upload',
    severity: 'HIGH',
    description: 'Tải lên file độc hại (web shell, malware) do thiếu kiểm tra định dạng và nội dung file phía server.',
    labCount: 2,
  },
  {
    id: '8',
    slug: 'auth-bypass',
    name: 'Authentication Bypass',
    icon: 'unlock',
    severity: 'CRITICAL',
    description: 'Bỏ qua cơ chế xác thực để truy cập hệ thống mà không cần thông tin đăng nhập hợp lệ.',
    labCount: 3,
  },
];

export const learningPaths: LearningPath[] = [
  {
    id: '1',
    title: 'Web Pentest Cơ Bản',
    description: 'Khóa học nhập môn dành cho người mới bắt đầu. Tìm hiểu các khái niệm cơ bản về bảo mật web, HTTP protocol, và các lỗ hổng phổ biến nhất.',
    difficulty: 'BEGINNER',
    estimatedHours: 12,
    lessonCount: 8,
    completedLessons: 3,
  },
  {
    id: '2',
    title: 'Khai Thác Lỗ Hổng Nâng Cao',
    description: 'Đi sâu vào các kỹ thuật khai thác phức tạp: Blind SQL Injection, DOM-based XSS, chained attacks, và bypass WAF.',
    difficulty: 'INTERMEDIATE',
    estimatedHours: 20,
    lessonCount: 12,
    completedLessons: 0,
  },
  {
    id: '3',
    title: 'Red Team & Bug Bounty',
    description: 'Kỹ năng chuyên sâu cho pentester chuyên nghiệp: methodology, reconnaissance, chaining vulnerabilities, và viết report.',
    difficulty: 'ADVANCED',
    estimatedHours: 30,
    lessonCount: 15,
    completedLessons: 0,
  },
];

export const labs: Lab[] = [
  {
    id: '1',
    vulnerabilitySlug: 'sql-injection',
    vulnerabilityName: 'SQL Injection',
    title: 'Login Bypass với SQL Injection',
    description: 'Sử dụng SQL Injection để bypass form đăng nhập và truy cập tài khoản admin mà không cần mật khẩu.',
    difficulty: 'EASY',
    estimatedMinutes: 15,
    points: 100,
    status: 'COMPLETED',
  },
  {
    id: '2',
    vulnerabilitySlug: 'sql-injection',
    vulnerabilityName: 'SQL Injection',
    title: 'UNION-based Data Extraction',
    description: 'Sử dụng UNION SELECT để trích xuất dữ liệu từ các bảng khác trong database thông qua trang tìm kiếm sản phẩm.',
    difficulty: 'MEDIUM',
    estimatedMinutes: 25,
    points: 200,
    status: 'IN_PROGRESS',
  },
  {
    id: '3',
    vulnerabilitySlug: 'sql-injection',
    vulnerabilityName: 'SQL Injection',
    title: 'Blind SQL Injection',
    description: 'Khai thác Blind SQLi khi ứng dụng không hiển thị kết quả truy vấn trực tiếp. Sử dụng kỹ thuật Boolean-based và Time-based.',
    difficulty: 'HARD',
    estimatedMinutes: 40,
    points: 300,
    status: 'NOT_STARTED',
  },
  {
    id: '4',
    vulnerabilitySlug: 'xss',
    vulnerabilityName: 'XSS',
    title: 'Reflected XSS trong Search',
    description: 'Phát hiện và khai thác lỗ hổng Reflected XSS trong chức năng tìm kiếm để đánh cắp cookie người dùng.',
    difficulty: 'EASY',
    estimatedMinutes: 15,
    points: 100,
    status: 'COMPLETED',
  },
  {
    id: '5',
    vulnerabilitySlug: 'xss',
    vulnerabilityName: 'XSS',
    title: 'Stored XSS qua Comment System',
    description: 'Chèn mã XSS vào hệ thống bình luận để tấn công tất cả người dùng truy cập trang chứa bình luận độc hại.',
    difficulty: 'MEDIUM',
    estimatedMinutes: 20,
    points: 200,
    status: 'NOT_STARTED',
  },
  {
    id: '6',
    vulnerabilitySlug: 'csrf',
    vulnerabilityName: 'CSRF',
    title: 'CSRF - Thay đổi Email Admin',
    description: 'Tạo trang web giả mạo chứa form ẩn để thay đổi email của admin khi họ truy cập trang của bạn.',
    difficulty: 'EASY',
    estimatedMinutes: 20,
    points: 100,
    status: 'NOT_STARTED',
  },
  {
    id: '7',
    vulnerabilitySlug: 'idor',
    vulnerabilityName: 'IDOR',
    title: 'IDOR - Truy cập Profile người khác',
    description: 'Thay đổi ID trong URL để xem thông tin cá nhân của người dùng khác mà không cần quyền truy cập.',
    difficulty: 'EASY',
    estimatedMinutes: 10,
    points: 100,
    status: 'NOT_STARTED',
  },
  {
    id: '8',
    vulnerabilitySlug: 'command-injection',
    vulnerabilityName: 'Command Injection',
    title: 'OS Command Injection qua Ping',
    description: 'Khai thác chức năng ping trên trang diagnostic tool để thực thi lệnh hệ điều hành trên server.',
    difficulty: 'MEDIUM',
    estimatedMinutes: 20,
    points: 200,
    status: 'NOT_STARTED',
  },
  {
    id: '9',
    vulnerabilitySlug: 'file-upload',
    vulnerabilityName: 'File Upload',
    title: 'Upload Web Shell',
    description: 'Upload file PHP/JSP web shell bằng cách bypass kiểm tra file extension và content-type validation.',
    difficulty: 'MEDIUM',
    estimatedMinutes: 25,
    points: 200,
    status: 'NOT_STARTED',
  },
  {
    id: '10',
    vulnerabilitySlug: 'auth-bypass',
    vulnerabilityName: 'Auth Bypass',
    title: 'JWT Token Manipulation',
    description: 'Khai thác lỗ hổng trong xác thực JWT: thay đổi algorithm, sửa payload, hoặc brute-force secret key.',
    difficulty: 'HARD',
    estimatedMinutes: 35,
    points: 300,
    status: 'NOT_STARTED',
  },
];

export const dashboardStats = {
  totalVulnerabilities: 8,
  totalLabs: 19,
  completedLabs: 2,
  totalPoints: 200,
  streakDays: 5,
};
