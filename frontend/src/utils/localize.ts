export const localizeLessonTitle = (title: string, language: string): string => {
  if (language === 'vi') return title;
  const translations: Record<string, string> = {
    "Giới thiệu về Bảo mật Web": "Introduction to Web Security",
    "HTTP và cách hoạt động của Web": "HTTP and Web Operations",
    "SQL Injection cho người mới bắt đầu": "SQL Injection for Beginners",
    "Cross-Site Scripting (XSS) cơ bản": "Basic Cross-Site Scripting (XSS)",
    "CSRF và bảo vệ form": "CSRF and Form Protection",
    "Kỹ thuật khai thác SQL Injection nâng cao": "Advanced SQL Injection Exploitation",
    "IDOR - Truy cập trái phép dữ liệu": "IDOR - Insecure Direct Object References",
    "SSRF - Tấn công máy chủ gián tiếp": "SSRF - Server-Side Request Forgery",
    "Command Injection - Thực thi lệnh hệ thống": "Command Injection - Operating System Command Execution",
    "File Upload - Tải lên tệp không giới hạn": "File Upload - Unrestricted File Upload",
    "Authentication Bypass - Bỏ qua xác thực": "Authentication Bypass",
    "Bypass WAF và Security Controls": "Bypass WAF and Security Controls",
    "Attack Chains - Chuỗi khai thác lỗ hổng": "Attack Chains - Vulnerability Exploitation Chains",
    "Bug Bounty Methodology - Phương pháp săn lỗi": "Bug Bounty Methodology"
  };
  return translations[title] || title;
};

export const localizeLessonObjective = (title: string, language: string, fallback?: string): string => {
  if (language === 'vi') return fallback || '';
  const translations: Record<string, string> = {
    "Giới thiệu về Bảo mật Web": "Understand the overview of web application security and the top 10 security risks according to OWASP Top 10.",
    "HTTP và cách hoạt động của Web": "Understand the Client-Server model, basic HTTP methods, Headers, and Session management mechanisms.",
    "SQL Injection cho người mới bắt đầu": "Understand basic SQL Injection mechanics and how attackers bypass login pages.",
    "Cross-Site Scripting (XSS) cơ bản": "Differentiate between 3 types of XSS (Reflected, Stored, DOM), their impact, and basic prevention.",
    "CSRF và bảo vệ form": "Understand Cross-Site Request Forgery (CSRF) attacks and token prevention mechanisms.",
    "Kỹ thuật khai thác SQL Injection nâng cao": "Master Blind SQL Injection (Boolean-based, Time-based) and Union-based exploitation techniques.",
    "IDOR - Truy cập trái phép dữ liệu": "Understand Insecure Direct Object Reference (IDOR) vulnerabilities and how to test for them.",
    "SSRF - Tấn công máy chủ gián tiếp": "Explore SSRF (Server-Side Request Forgery) vulnerabilities, filter bypass techniques, and remediation.",
    "Command Injection - Thực thi lệnh hệ thống": "Understand Operating System Command Injection mechanics, blind exploitation techniques, and defense.",
    "File Upload - Tải lên tệp không giới hạn": "Understand the risks of file upload features, extension whitelist bypasses, and secure implementation.",
    "Authentication Bypass - Bỏ qua xác thực": "Explore login bypass techniques, authentication logic flaws, and JWT security.",
    "Bypass WAF và Security Controls": "Learn techniques to bypass Web Application Firewalls (WAF) and common input filtration mechanisms.",
    "Attack Chains - Chuỗi khai thác lỗ hổng": "Learn to combine multiple minor vulnerabilities into exploitation chains (attack chains) to takeover systems.",
    "Bug Bounty Methodology - Phương pháp săn lỗi": "Equip yourself with practical vulnerability hunting methodologies, professional reporting, and bug bounty workflows."
  };
  return translations[title] || fallback || '';
};
