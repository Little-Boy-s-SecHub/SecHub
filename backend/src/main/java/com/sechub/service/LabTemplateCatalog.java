package com.sechub.service;

import com.sechub.dto.GeneratedLabSpec;

import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

final class LabTemplateCatalog {

    static final Set<String> SUPPORTED_RUNTIME_TYPES = Set.of(
            "sql-injection", "xss", "csrf", "idor", "ssrf",
            "command-injection", "file-upload", "auth-bypass");

    static final Set<String> KNOWN_TOPIC_SLUGS = Set.of(
            "bfla", "broken-access-control", "directory-traversal", "idor", "open-redirects",
            "privilege-escalation", "ssrf", "clickjacking", "cors", "csp-bypass",
            "host-header-poisoning", "lax-security-settings", "subdomain-takeover", "malvertising",
            "subdomain-squatting", "supply-chain-attacks", "toxic-dependencies", "dns-poisoning",
            "downgrade-attacks", "insecure-randomness", "ssl-stripping", "unencrypted-communication",
            "code-injection", "command-execution", "crlf-injection", "css-injection",
            "csv-formula-injection", "dom-based", "dom-clobbering", "http-parameter-pollution",
            "ldap-injection", "lfi-rfi", "nosql-injection", "postmessage-exploitation", "reflected",
            "regex-injection", "second-order-sqli", "sql-injection", "ssi-injection", "ssti", "stored",
            "websocket-hijacking", "xpath-injection", "xss", "xssi", "xxe",
            "business-logic-vulnerabilities", "error-handling", "file-upload", "information-leakage",
            "insecure-design", "mass-assignment", "race-conditions", "2fa-mfa-bypass",
            "credential-stuffing", "csrf", "email-spoofing", "jwt-attacks", "oauth-vulnerabilities",
            "password-mismanagement", "session-fixation", "session-hijacking", "user-enumeration",
            "weak-session-ids", "http-request-smuggling", "insecure-deserialization",
            "prototype-pollution", "web-cache-deception", "web-cache-poisoning",
            "logging-and-monitoring", "buffer-overflows", "denial-of-service", "remote-code-execution",
            "xml-bombs", "api-rate-limiting", "graphql-vulnerabilities", "shadow-apis");

    record ChallengeProfile(
            String topicSlug,
            String runtimeType,
            String method,
            String endpoint,
            String inputName,
            String labelVi,
            String labelEn,
            String defaultValue,
            String inputMode,
            String successMode,
            List<String> successValues,
            String failureVi,
            String failureEn) {

        Map<String, Object> toManifest(String targetId, String language) {
            boolean vi = "vi".equalsIgnoreCase(language);
            Map<String, Object> manifest = new LinkedHashMap<>();
            manifest.put("method", method);
            manifest.put("endpoint", endpoint);
            manifest.put("inputName", inputName);
            manifest.put("inputLabel", vi ? labelVi : labelEn);
            manifest.put("defaultValue", replaceTarget(defaultValue, targetId));
            manifest.put("inputMode", inputMode);
            manifest.put("successMode", successMode);
            manifest.put("successValues", successValues.stream()
                    .map(value -> replaceTarget(value, targetId)).toList());
            manifest.put("failureMessage", vi ? failureVi : failureEn);
            return manifest;
        }

        private String replaceTarget(String value, String targetId) {
            return value == null ? "" : value.replace("{targetId}", targetId);
        }
    }

    private LabTemplateCatalog() {
    }

    static String runtimeTypeFor(String requestedSlug, GeneratedLabSpec spec) {
        String context = spec == null ? "" : String.join("\n",
                value(spec.title()), value(spec.description()), value(spec.scenario()));
        return challengeFor(requestedSlug, context).runtimeType();
    }

    static String runtimeTypeFor(String requestedSlug, String context) {
        return challengeFor(requestedSlug, context).runtimeType();
    }

    static String topicFor(String requestedSlug, String context) {
        String requested = slugify(requestedSlug);
        if (!requested.isBlank() && !SUPPORTED_RUNTIME_TYPES.contains(requested)) {
            return requested;
        }

        String titleContext = value(context);
        int titleEnd = titleContext.indexOf('\n');
        if (titleEnd > 0) titleContext = titleContext.substring(0, titleEnd);
        if (titleContext.length() > 240) titleContext = titleContext.substring(0, 240);
        String searchable = normalize(titleContext);
        String inferred = KNOWN_TOPIC_SLUGS.stream()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .filter(topic -> searchable.contains(normalize(topic.replace('-', ' '))))
                .findFirst()
                .orElse("");
        return inferred.isBlank() ? requested : inferred;
    }

    static ChallengeProfile challengeFor(String requestedSlug, String context) {
        String topic = topicFor(requestedSlug, context);
        if (topic.isBlank()) topic = "auth-bypass";

        return switch (topic) {
            case "idor" -> profile(topic, "idor", "GET", "/api/profile", "ref",
                    "Mã hồ sơ", "Profile ID", "1", "text", "equals-any", "{targetId}");
            case "bfla", "broken-access-control", "privilege-escalation" -> profile(topic, "idor", "POST", "/api/admin/action", "role",
                    "Quyền gửi lên server", "Role sent to server", "user", "text", "equals-any", "admin", "superadmin");
            case "directory-traversal" -> profile(topic, "file-upload", "GET", "/download", "path",
                    "Đường dẫn tệp", "File path", "reports/today.txt", "text", "contains-any", "../", "..%2f");
            case "open-redirects" -> profile(topic, "ssrf", "GET", "/redirect", "next",
                    "URL chuyển hướng", "Redirect URL", "/dashboard", "url", "contains-any", "evil.example", "//evil");
            case "ssrf" -> profile(topic, "ssrf", "GET", "/fetch", "url",
                    "URL máy chủ sẽ truy cập", "Server-side URL", "https://example.com", "url", "equals-any",
                    "http://internal/flag", "http://127.0.0.1/internal/flag");

            case "clickjacking" -> profile(topic, "csrf", "POST", "/frame-check", "xFrameOptions",
                    "Giá trị X-Frame-Options", "X-Frame-Options value", "DENY", "text", "equals-any", "missing", "allowall");
            case "cors" -> profile(topic, "csrf", "GET", "/api/account", "origin",
                    "Header Origin", "Origin header", "https://app.example", "url", "contains-any", "evil.example", "null");
            case "csp-bypass" -> profile(topic, "xss", "POST", "/preview", "payload",
                    "HTML cần kiểm thử", "HTML to test", "<p>preview</p>", "textarea", "contains-any", "<script", "onerror", "unsafe-inline");
            case "host-header-poisoning" -> profile(topic, "ssrf", "POST", "/password-reset", "host",
                    "Header Host", "Host header", "api.example.local", "text", "contains-any", "evil.example", "@evil");
            case "lax-security-settings" -> profile(topic, "auth-bypass", "GET", "/settings", "config",
                    "Tham số cấu hình", "Configuration parameter", "debug=false", "text", "contains-any", "debug=true", "security=off");
            case "subdomain-takeover" -> profile(topic, "ssrf", "POST", "/dns/claim", "record",
                    "Bản ghi CNAME", "CNAME record", "assets.example.com", "text", "contains-any", "dangling", "unclaimed");

            case "malvertising" -> profile(topic, "xss", "POST", "/ads/preview", "creative",
                    "Nội dung quảng cáo", "Ad creative", "https://cdn.example/banner.png", "textarea", "contains-any", "javascript:", "<script");
            case "subdomain-squatting" -> profile(topic, "auth-bypass", "POST", "/domain/check", "domain",
                    "Tên miền tương tự", "Lookalike domain", "example.com", "text", "contains-any", "paypa1", "micros0ft", "g00gle");
            case "supply-chain-attacks" -> profile(topic, "auth-bypass", "POST", "/build/source", "source",
                    "Nguồn gói build", "Build package source", "registry.company.local", "text", "contains-any", "untrusted", "public-registry");
            case "toxic-dependencies" -> profile(topic, "auth-bypass", "POST", "/dependencies/audit", "package",
                    "Gói phụ thuộc", "Dependency package", "safe-utils@2.1.0", "text", "contains-any", "malicious-package", "0.0.0-compromised");

            case "dns-poisoning" -> profile(topic, "ssrf", "POST", "/dns/resolve", "answer",
                    "Địa chỉ IP trả về", "Returned IP address", "203.0.113.10", "text", "equals-any", "10.0.0.7", "127.0.0.1");
            case "downgrade-attacks" -> profile(topic, "auth-bypass", "POST", "/tls/handshake", "version",
                    "Phiên bản giao thức", "Protocol version", "TLS1.3", "text", "equals-any", "TLS1.0", "SSLv3");
            case "insecure-randomness" -> profile(topic, "auth-bypass", "POST", "/token/predict", "token",
                    "Token dự đoán", "Predicted token", "000000", "text", "equals-any", "424242", "13371337");
            case "ssl-stripping", "unencrypted-communication" -> profile(topic, "auth-bypass", "POST", "/transport/check", "url",
                    "URL kết nối", "Connection URL", "https://secure.example", "url", "contains-any", "http://", "ws://");

            case "sql-injection", "second-order-sqli" -> profile(topic, "sql-injection", "POST", "/login", "username",
                    "Tên đăng nhập", "Username", "analyst", "text", "contains-any", "' or", "union select", "or 1=1");
            case "nosql-injection" -> profile(topic, "sql-injection", "POST", "/api/login", "filter",
                    "Bộ lọc JSON", "JSON filter", "{\"username\":\"analyst\"}", "textarea", "contains-any", "$ne", "$gt", "$regex");
            case "ldap-injection" -> profile(topic, "sql-injection", "POST", "/directory/search", "filter",
                    "Bộ lọc LDAP", "LDAP filter", "(uid=analyst)", "text", "contains-any", "*)(", "(|", "uid=*");
            case "xpath-injection" -> profile(topic, "sql-injection", "POST", "/xml/login", "query",
                    "Giá trị truy vấn XPath", "XPath query value", "analyst", "text", "contains-any", "' or", "or '1'='1", "//*");
            case "http-parameter-pollution" -> profile(topic, "sql-injection", "GET", "/account/update", "parameters",
                    "Chuỗi query", "Query string", "role=user", "text", "contains-all", "role=user", "role=admin");
            case "crlf-injection" -> profile(topic, "sql-injection", "GET", "/redirect", "value",
                    "Giá trị header", "Header value", "/home", "text", "contains-any", "%0d%0a", "\r\n", "x-admin:");
            case "csv-formula-injection" -> profile(topic, "sql-injection", "POST", "/export", "cell",
                    "Giá trị ô CSV", "CSV cell value", "Quarterly report", "text", "contains-any", "=hyperlink", "=cmd", "+cmd");
            case "regex-injection" -> profile(topic, "command-injection", "POST", "/validate", "pattern",
                    "Biểu thức chính quy", "Regular expression", "^[a-z]+$", "text", "contains-any", "(a+)+", "(.*)+", "(.+)+");
            case "code-injection", "command-execution", "remote-code-execution" -> profile(topic, "command-injection", "POST", "/execute", "code",
                    "Lệnh hoặc biểu thức", "Command or expression", "status", "textarea", "contains-any", "cat /flag", "read('/flag')", "system(");
            case "ssi-injection" -> profile(topic, "command-injection", "POST", "/template", "payload",
                    "Chỉ thị SSI", "SSI directive", "<!--#echo var=\"DATE_LOCAL\" -->", "textarea", "contains-any", "<!--#exec", "file=\"/flag\"");
            case "ssti" -> profile(topic, "command-injection", "POST", "/template/render", "template",
                    "Biểu thức template", "Template expression", "Hello {{name}}", "textarea", "contains-any", "{{7*7}}", "${7*7}", "<%= 7*7 %>");
            case "lfi-rfi" -> profile(topic, "file-upload", "GET", "/include", "file",
                    "Tệp cần include", "File to include", "pages/home.html", "text", "contains-any", "../", "file:///", "http://evil");
            case "xxe" -> profile(topic, "ssrf", "POST", "/xml/import", "xml",
                    "Tài liệu XML", "XML document", "<profile><name>analyst</name></profile>", "textarea", "contains-all", "<!doctype", "system", "file:///flag");

            case "xss", "reflected", "stored", "dom-based" -> profile(topic, "xss", "GET", "/search", "q",
                    "Nội dung không tin cậy", "Untrusted input", "SecHub", "textarea", "contains-any", "<script", "onerror", "javascript:");
            case "dom-clobbering" -> profile(topic, "xss", "POST", "/dom/render", "html",
                    "HTML chèn vào DOM", "HTML inserted into DOM", "<p id=\"profile\">user</p>", "textarea", "contains-all", "<form", "id=");
            case "css-injection" -> profile(topic, "xss", "POST", "/theme", "css",
                    "CSS tùy chỉnh", "Custom CSS", "body { color: #222; }", "textarea", "contains-any", "</style>", "url(javascript", "@import");
            case "postmessage-exploitation" -> profile(topic, "xss", "POST", "/message", "message",
                    "Message gửi vào cửa sổ", "Window message", "{\"action\":\"ping\"}", "textarea", "contains-all", "getflag", "origin");
            case "websocket-hijacking" -> profile(topic, "csrf", "POST", "/socket/connect", "origin",
                    "Origin khi WebSocket handshake", "WebSocket handshake Origin", "https://app.example", "url", "contains-any", "evil.example", "null");
            case "xssi" -> profile(topic, "xss", "GET", "/api/private.js", "callback",
                    "Callback JavaScript", "JavaScript callback", "render", "text", "contains-any", "alert", "steal", "callback=");

            case "business-logic-vulnerabilities" -> profile(topic, "auth-bypass", "POST", "/checkout", "quantity",
                    "Số lượng đặt hàng", "Order quantity", "1", "number", "contains-any", "-1", "-10");
            case "error-handling" -> profile(topic, "file-upload", "GET", "/report", "option",
                    "Tùy chọn request", "Request option", "format=html", "text", "contains-any", "debug=true", "trace=true");
            case "file-upload" -> profile(topic, "file-upload", "POST", "/upload", "file",
                    "Tên tệp và nội dung", "Filename and content", "report.jpg | image data", "textarea", "contains-all", ".php", "<?php");
            case "information-leakage" -> profile(topic, "file-upload", "GET", "/static", "path",
                    "Đường dẫn tài nguyên", "Resource path", "/robots.txt", "text", "contains-any", "/.env", "/backup", "stacktrace");
            case "insecure-design" -> profile(topic, "auth-bypass", "POST", "/workflow/approve", "state",
                    "Trạng thái workflow", "Workflow state", "pending", "text", "contains-any", "approved", "role=admin");
            case "mass-assignment" -> profile(topic, "idor", "POST", "/api/profile", "json",
                    "Dữ liệu JSON cập nhật", "JSON update body", "{\"displayName\":\"student\"}", "textarea", "contains-any", "isadmin", "role\":\"admin", "privileged");
            case "race-conditions" -> profile(topic, "auth-bypass", "POST", "/coupon/redeem", "requests",
                    "Số request đồng thời", "Concurrent request count", "1", "number", "numeric-at-least", "2");

            case "2fa-mfa-bypass" -> profile(topic, "auth-bypass", "POST", "/mfa/verify", "code",
                    "Mã xác thực", "Verification code", "123456", "text", "equals-any", "000000", "null");
            case "credential-stuffing" -> profile(topic, "auth-bypass", "POST", "/login/check", "credential",
                    "Cặp tài khoản", "Credential pair", "analyst:password", "text", "contains-any", "admin:welcome123", "admin:password");
            case "csrf" -> profile(topic, "csrf", "POST", "/transfer", "csrfToken",
                    "CSRF token", "CSRF token", "valid-token", "text", "equals-any", "missing", "null", "none");
            case "email-spoofing" -> profile(topic, "auth-bypass", "POST", "/mail/send", "from",
                    "Địa chỉ From", "From address", "student@example.com", "text", "contains-any", "admin@", "support@");
            case "jwt-attacks" -> profile(topic, "auth-bypass", "GET", "/admin", "token",
                    "JWT header/payload", "JWT header/payload", "{\"alg\":\"RS256\",\"role\":\"user\"}", "textarea", "contains-any", "\"alg\":\"none\"", "\"role\":\"admin\"");
            case "oauth-vulnerabilities" -> profile(topic, "auth-bypass", "GET", "/oauth/authorize", "redirectUri",
                    "OAuth redirect_uri", "OAuth redirect_uri", "https://app.example/callback", "url", "contains-any", "evil.example", "localhost");
            case "password-mismanagement" -> profile(topic, "auth-bypass", "POST", "/login", "password",
                    "Mật khẩu mặc định", "Default password", "********", "text", "equals-any", "admin123", "password", "changeme");
            case "session-fixation" -> profile(topic, "auth-bypass", "POST", "/session/login", "sessionId",
                    "Session ID có sẵn", "Pre-set session ID", "random-session", "text", "contains-any", "fixed-session", "known-session");
            case "session-hijacking" -> profile(topic, "auth-bypass", "GET", "/account", "cookie",
                    "Cookie phiên", "Session cookie", "SESSION=new", "text", "contains-any", "SESSION=admin", "stolen-session");
            case "user-enumeration" -> profile(topic, "auth-bypass", "POST", "/forgot-password", "username",
                    "Tên tài khoản cần kiểm tra", "Username to probe", "student", "text", "equals-any", "admin", "administrator");
            case "weak-session-ids" -> profile(topic, "auth-bypass", "POST", "/session/predict", "sessionId",
                    "Session ID dự đoán", "Predicted session ID", "session-1001", "text", "equals-any", "session-1002", "1002");

            case "http-request-smuggling" -> profile(topic, "ssrf", "POST", "/proxy/raw", "request",
                    "HTTP request thô", "Raw HTTP request", "POST / HTTP/1.1\nContent-Length: 0", "textarea", "contains-all", "content-length", "transfer-encoding");
            case "insecure-deserialization" -> profile(topic, "command-injection", "POST", "/session/import", "object",
                    "Đối tượng tuần tự hóa", "Serialized object", "O:4:\"User\"", "textarea", "contains-any", "gadget", "rce", "ysoserial");
            case "prototype-pollution" -> profile(topic, "xss", "POST", "/config/merge", "json",
                    "JSON cần merge", "JSON to merge", "{\"theme\":\"light\"}", "textarea", "contains-any", "__proto__", "constructor.prototype");
            case "web-cache-deception" -> profile(topic, "ssrf", "GET", "/account", "path",
                    "Đường dẫn giả tài nguyên tĩnh", "Static-looking path", "/account", "text", "contains-any", ".css", ".js", ";.png");
            case "web-cache-poisoning" -> profile(topic, "ssrf", "POST", "/cache/key", "header",
                    "Header không nằm trong cache key", "Unkeyed header", "X-Forwarded-Host: app.example", "text", "contains-any", "evil.example", "x-original-url");

            case "logging-and-monitoring" -> profile(topic, "auth-bypass", "POST", "/login/log", "username",
                    "Giá trị ghi vào log", "Value written to logs", "analyst", "text", "contains-any", "%0a", "\nadmin", "log-level=off");
            case "buffer-overflows" -> profile(topic, "command-injection", "POST", "/parser", "input",
                    "Dữ liệu đầu vào", "Parser input", "AAAA", "textarea", "length-at-least", "128");
            case "denial-of-service" -> profile(topic, "command-injection", "POST", "/work", "iterations",
                    "Số vòng lặp yêu cầu", "Requested iteration count", "10", "number", "numeric-at-least", "1000000");
            case "xml-bombs" -> profile(topic, "command-injection", "POST", "/xml/parse", "xml",
                    "Tài liệu XML", "XML document", "<root>ok</root>", "textarea", "contains-all", "<!doctype", "<!entity", "&lol");

            case "api-rate-limiting" -> profile(topic, "idor", "POST", "/api/login", "headers",
                    "Header nhận diện client", "Client identity headers", "X-Forwarded-For: 203.0.113.1", "textarea", "contains-any", "x-forwarded-for: 127.0.0.2", "x-real-ip:");
            case "graphql-vulnerabilities" -> profile(topic, "idor", "POST", "/graphql", "query",
                    "GraphQL query", "GraphQL query", "query { viewer { id } }", "textarea", "contains-any", "__schema", "__type", "introspectionquery");
            case "shadow-apis" -> profile(topic, "idor", "GET", "/router", "path",
                    "Đường dẫn API chưa công bố", "Undocumented API path", "/api/v2/profile", "text", "contains-any", "/internal/admin", "/api/v1/debug", "/shadow");

            case "command-injection" -> profile(topic, "command-injection", "GET", "/ping", "host",
                    "Host hoặc địa chỉ IP", "Host or IP address", "127.0.0.1", "text", "contains-any", ";cat /flag", "&& cat /flag", "|cat /flag");
            case "auth-bypass" -> profile(topic, "auth-bypass", "GET", "/admin", "token",
                    "Access token", "Access token", "eyJ...", "text", "contains-any", "none", "admin");
            default -> profile(topic, runtimeTypeFromText(topic), "POST", "/challenge", "payload",
                    "Payload kiểm thử", "Test payload", "", "textarea", "contains-any", "admin", "debug=true", "../");
        };
    }

    private static ChallengeProfile profile(String topic, String runtimeType, String method, String endpoint,
                                            String inputName, String labelVi, String labelEn, String defaultValue,
                                            String inputMode, String successMode, String... successValues) {
        return new ChallengeProfile(topic, runtimeType, method, endpoint, inputName, labelVi, labelEn,
                defaultValue, inputMode, successMode, Arrays.asList(successValues),
                "Request chưa khai thác được điểm yếu. Hãy kiểm tra lại payload và request.",
                "The request did not exploit the weakness. Review the payload and request.");
    }

    private static String runtimeTypeFromText(String topic) {
        String searchable = normalize(topic);
        if (contains(searchable, "sql", "nosql", "ldap", "xpath", "injection")) return "sql-injection";
        if (contains(searchable, "xss", "dom", "script", "css")) return "xss";
        if (contains(searchable, "csrf", "cors", "clickjack", "websocket")) return "csrf";
        if (contains(searchable, "file", "path", "traversal", "upload", "leak")) return "file-upload";
        if (contains(searchable, "command", "code", "rce", "overflow", "denial", "xml-bomb")) return "command-injection";
        if (contains(searchable, "ssrf", "redirect", "host", "dns", "cache", "smuggling")) return "ssrf";
        if (contains(searchable, "idor", "access", "bfla", "graphql", "api", "assignment")) return "idor";
        return "auth-bypass";
    }

    private static boolean contains(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(normalize(needle))) return true;
        }
        return false;
    }

    private static String slugify(String value) {
        return value(value).toLowerCase(Locale.ROOT).replace('_', '-')
                .replaceAll("[^a-z0-9-]+", "-").replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private static String normalize(String value) {
        return value(value).toLowerCase(Locale.ROOT).replace('_', ' ')
                .replace('-', ' ').replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ").trim();
    }

    private static String value(String value) {
        return value == null ? "" : value;
    }
}
