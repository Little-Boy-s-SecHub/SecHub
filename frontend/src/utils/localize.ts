import { englishPaths, englishVulnerabilities, englishLessons, englishLabs } from './englishData';

export const localizePathTitle = (title: string, language: string): string => {
  if (language === 'vi') return title;
  return englishPaths[title]?.title || title;
};

export const localizePathDescription = (description: string, language: string): string => {
  if (language === 'vi') return description;
  // Match path by title search from englishPaths keys
  const entry = Object.entries(englishPaths).find(([key]) => key === description || englishPaths[key].description === description || key.includes(description.slice(0, 10)));
  return entry ? entry[1].description : description;
};

export const localizeVulnerabilityName = (name: string, slug: string, language: string): string => {
  if (language === 'vi') return name;
  return englishVulnerabilities[slug]?.name || name;
};

export const localizeVulnerabilityDescription = (description: string, slug: string, language: string): string => {
  if (language === 'vi') return description;
  return englishVulnerabilities[slug]?.description || description;
};

export const localizeVulnerabilityExploitationGuide = (guide: string, slug: string, language: string): string => {
  if (language === 'vi') return guide;
  return englishVulnerabilities[slug]?.exploitationGuide || guide;
};

export const localizeVulnerabilityPreventionGuide = (guide: string, slug: string, language: string): string => {
  if (language === 'vi') return guide;
  return englishVulnerabilities[slug]?.preventionGuide || guide;
};

export const localizeLessonTitle = (title: string, language: string): string => {
  if (language === 'vi') return title;
  
  // Direct translation fallback list
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
  
  const cleanTitle = title ? title.trim() : "";
  return englishLessons[cleanTitle]?.title || translations[cleanTitle] || title;
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
  
  const cleanTitle = title ? title.trim() : "";
  return englishLessons[cleanTitle]?.learningObjective || translations[cleanTitle] || fallback || '';
};

export const localizeLessonContent = (title: string, language: string, fallback: string): string => {
  if (language === 'vi') return fallback;
  const cleanTitle = title ? title.trim() : "";
  return englishLessons[cleanTitle]?.contentMarkdown || fallback;
};

export const localizeLabTitle = (title: string, language: string): string => {
  if (language === 'vi') return title;
  if (!title) return '';
  const cleanTitle = title.trim();
  if (englishLabs[cleanTitle]?.title) {
    return englishLabs[cleanTitle].title;
  }
  let localized = cleanTitle;
  localized = localized.replace(/Lỗi Cấp Quyền Chức Năng Bị Hỏng \(BFLA\)/g, 'Broken Function Level Authorization (BFLA)');
  localized = localized.replace(/Lỗi Cấp Quyền Chức Năng Bị Hỏng/g, 'Broken Function Level Authorization (BFLA)');
  localized = localized.replace(/Truy cập trái phép dữ liệu/g, 'Insecure Direct Object References (IDOR)');
  localized = localized.replace(/Xem hồ sơ người dùng khác/g, 'View Other User Profiles');
  localized = localized.replace(/Thay đổi vai trò người dùng/g, 'User Role Escalation');
  localized = localized.replace(/Đọc file nội bộ/g, 'Local File Read');
  localized = localized.replace(/Ping Tool/g, 'Ping Tool');
  return localized;
};

export const localizeLabDescription = (description: string, title: string, language: string): string => {
  if (language === 'vi') return description;
  const cleanTitle = title ? title.trim() : "";
  return englishLabs[cleanTitle]?.description || description;
};

export const localizeLabHints = (hintsJson: string, title: string, language: string): string[] => {
  try {
    const rawHints: string[] = JSON.parse(hintsJson);
    if (language === 'vi') return rawHints;
    const cleanTitle = title ? title.trim() : "";
    return englishLabs[cleanTitle]?.hints || rawHints;
  } catch {
    return [];
  }
};

export const localizeFeedbackSummary = (summary: string, language: string): string => {
  if (language === 'vi') return summary;
  if (!summary) return '';
  if (summary.includes('truy vấn SQL')) {
    return 'You manipulated the SQL query structure through user input.';
  }
  if (summary.includes('không tin cậy vào HTML')) {
    return 'You injected untrusted data into HTML without proper context-aware encoding.';
  }
  if (summary.includes('ID hợp lệ nhưng không thuộc quyền')) {
    return 'You accessed an object using a valid ID that does not belong to you.';
  }
  if (summary.includes('server gửi request tới')) {
    return 'You forced the server to make a request to a location under your control.';
  }
  if (summary.includes('lệnh hệ điều hành')) {
    return 'You injected system commands into process execution arguments.';
  }
  if (summary.includes('tải lên nội dung nguy hiểm')) {
    return 'You uploaded a malicious file due to incomplete validation.';
  }
  if (summary.includes('phiên đăng nhập của nạn nhân')) {
    return "You performed state-changing requests using a victim's active session from a cross-site origin.";
  }
  if (summary.includes('xác thực hoặc phân quyền')) {
    return 'You bypassed an insecure authentication or authorization check.';
  }
  return summary;
};

export const localizeFeedbackWhyItWorked = (whyItWorked: string, language: string): string => {
  if (language === 'vi') return whyItWorked;
  if (!whyItWorked) return '';
  if (whyItWorked.includes('nối trực tiếp input')) {
    return 'The application concatenated user input directly into the SQL statement. The payload altered the WHERE condition logic, causing the database to return data not intended for user access.';
  }
  if (whyItWorked.includes('diễn giải payload')) {
    return 'The browser interpreted the payload as executable HTML/JavaScript because the application used an unsafe HTML sink.';
  }
  if (whyItWorked.includes('kiểm tra đối tượng có tồn tại')) {
    return 'The server checked if the object existed, but failed to verify whether the current authenticated user has ownership permissions over it.';
  }
  if (whyItWorked.includes('chấp nhận URL tùy ý')) {
    return 'The application processed arbitrary user-supplied URLs, enabling the server to access internal networks or APIs inaccessible to public clients.';
  }
  if (whyItWorked.includes('ký tự phân tách')) {
    return 'The system shell processed control characters in the payload, executing additional commands outside the application\'s design.';
  }
  if (whyItWorked.includes('tin tên tệp')) {
    return 'The application trusted client-supplied file names or Content-Type headers and saved the file to an executable directory.';
  }
  if (whyItWorked.includes('Trình duyệt tự gửi cookie')) {
    return 'The browser automatically attached session credentials, while the server did not require verification tokens generated from valid user interface state.';
  }
  if (whyItWorked.includes('tin dữ liệu do client')) {
    return 'The server trusted client-supplied input rather than verifying user identity and access rights.';
  }
  return whyItWorked;
};

export const localizeFeedbackRemediationSteps = (steps: string[], language: string): string[] => {
  if (language === 'vi') return steps;
  if (!steps) return [];
  return steps.map(step => {
    if (step.includes('prepared statement')) {
      return 'Use parameterized queries (prepared statements) for all inputs';
    }
    if (step.includes('lỗi database chi tiết')) {
      return 'Do not expose detailed database error messages to users';
    }
    if (step.includes('tài khoản database')) {
      return 'Apply the principle of least privilege to database accounts';
    }
    if (step.includes('textContent')) {
      return 'Use textContent instead of innerHTML when HTML is not required';
    }
    if (step.includes('output theo ngữ cảnh')) {
      return 'Apply context-appropriate output encoding';
    }
    if (step.includes('Content-Security-Policy')) {
      return 'Implement a strong Content-Security-Policy (CSP)';
    }
    if (step.includes('quyền trên từng đối tượng')) {
      return 'Enforce object-level access control checks on the server-side';
    }
    if (step.includes('ID và owner ID')) {
      return 'Query resources by matching both resource ID and owner ID';
    }
    if (step.includes('phân quyền')) {
      return 'Do not rely on unguessable UUIDs as an authorization mechanism';
    }
    if (step.includes('allowlist hostname')) {
      return 'Enforce strict allowlists for destination domains and ports';
    }
    if (step.includes('loopback, private')) {
      return 'Block loopback addresses, private IP ranges, and redirections';
    }
    if (step.includes('gọi URL')) {
      return 'Isolate the network environment of the URL fetching service';
    }
    if (step.includes('gọi shell')) {
      return 'Avoid invoking shell interpreters when program APIs exist';
    }
    if (step.includes('argument array')) {
      return 'Pass process parameters via argument arrays';
    }
    if (step.includes('allowlist chặt chẽ')) {
      return 'Apply strict allowlist input validation';
    }
    if (step.includes('magic bytes')) {
      return 'Verify magic bytes of files and limit maximum file size';
    }
    if (step.includes('tệp phía server')) {
      return 'Rename files using random UUIDs on the server';
    }
    if (step.includes('quyền thực thi')) {
      return 'Store uploaded files outside the web root and disable execution permissions';
    }
    if (step.includes('không thể đoán')) {
      return 'Implement unpredictable anti-CSRF tokens';
    }
    if (step.includes('SameSite')) {
      return 'Configure SameSite attributes (Lax or Strict) for session cookies';
    }
    if (step.includes('Origin')) {
      return 'Verify request Origin headers for state-changing endpoints';
    }
    if (step.includes('kiểm tra quyền ở server')) {
      return 'Perform all authorization validation checks strictly on the server';
    }
    if (step.includes('tự khai báo')) {
      return 'Do not trust roles or permission claims declared by clients';
    }
    if (step.includes('deny-by-default')) {
      return 'Implement a deny-by-default access policy';
    }
    return step;
  });
};

export const localizeFeedbackLessonTakeaway = (takeaway: string, language: string): string => {
  if (language === 'vi') return takeaway;
  if (!takeaway) return '';
  if (takeaway.includes('luôn là tham số')) {
    return 'User data must always be passed as query parameters, never combined directly with SQL statement syntax.';
  }
  if (takeaway.includes('output sink')) {
    return 'XSS prevention must be implemented at output sinks, not just via input sanitization filters.';
  }
  if (takeaway.includes('Authentication xác định')) {
    return 'Authentication identifies who you are; authorization controls which resources you are permitted to access.';
  }
  if (takeaway.includes('validate cả URL')) {
    return 'For SSRF prevention, validate target URLs, DNS resolution, and any subsequent redirects.';
  }
  if (takeaway.includes('blacklist')) {
    return 'Do not attempt to escape shell arguments with blacklists; design shells out of the execution flow completely.';
  }
  if (takeaway.includes('bao phủ nội dung')) {
    return 'Upload security requires validating content, file name, storage directory, and how files are served back.';
  }
  if (takeaway.includes('ý định thực hiện')) {
    return 'Authentication session cookies verify the user but do not prove user intent to perform a specific action.';
  }
  if (takeaway.includes('trạng thái được server')) {
    return 'All security assertions must rely on state verified directly by the server.';
  }
  return takeaway;
};

export const localizeFeedbackCode = (code: string, language: string): string => {
  if (language === 'vi' || !code) return code;
  let localized = code;
  localized = localized.replace(/\/\/ thiếu kiểm tra owner/g, '// missing owner check');
  localized = localized.replace(/\/\/ Hoặc encode output theo đúng HTML context/g, '// Or encode output according to the correct HTML context');
  localized = localized.replace(/\/\/ Chỉ kiểm tra session cookie/g, '// Only check session cookie');
  localized = localized.replace(/\/\/ Cookie: SameSite=Lax hoặc Strict/g, '// Cookie: SameSite=Lax or Strict');
  return localized;
};

