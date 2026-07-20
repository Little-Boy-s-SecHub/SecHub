package com.sechub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.entity.LabAttempt;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.sechub.support.LocaleHolder;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.GONE;

@Service
public class SimulatedLabRuntimeService {

    private static final Logger log = LoggerFactory.getLogger(SimulatedLabRuntimeService.class);
    private final ObjectMapper objectMapper;

    public SimulatedLabRuntimeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<byte[]> handle(LabAttempt attempt, byte[] body, HttpServletRequest request) {
        try {
            JsonNode manifest = readManifest(attempt);
            String type = manifest.path("vulnerability").asText();
            String flag = manifest.path("flag").asText();
            String title = manifest.path("title").asText("SecHub Generated Lab");
            String scenario = manifest.path("scenario").asText("");
            JsonNode variant = manifest.path("variant");
            String parameter = variant.path("parameter").asText("ref");
            String targetId = variant.path("targetId").asText("7");
            String account = variant.path("account").asText("analyst");
            String path = runtimePath(request, attempt.getRuntimeToken());
            Map<String, String> values = "POST".equalsIgnoreCase(request.getMethod())
                    ? parseForm(new String(body, StandardCharsets.UTF_8))
                    : parseForm(request.getQueryString());

            if ("/health".equals(path)) return response(200, "text/plain; charset=utf-8", "ok");
            JsonNode challenge = manifest.path("challenge");
            if (challenge.isObject() && !challenge.isEmpty()) {
                String prefix = request.getContextPath() + "/api/lab-runtime/" + attempt.getRuntimeToken();
                String language = manifest.path("language").asText("en");
                String topic = manifest.path("topic").asText(type);
                String endpoint = challenge.path("endpoint").asText("/challenge");
                String method = challenge.path("method").asText("POST");
                if (endpoint.equals(path)) {
                    if (!method.equalsIgnoreCase(request.getMethod())) {
                        return response(405, "text/plain; charset=utf-8", "method not allowed");
                    }
                    String input = values.getOrDefault(challenge.path("inputName").asText("payload"), "");
                    boolean successful = challengeSucceeds(challenge, input);
                    String result = successful
                            ? "<div class='result success'><strong>" + ("vi".equals(language) ? "Khai thác thành công" : "Exploit successful")
                                    + "</strong><pre>" + escape(flag) + "</pre></div>"
                            : "<div class='result failure'>" + escape(challenge.path("failureMessage")
                                    .asText("The request did not exploit the weakness.")) + "</div>";
                    String retry = "vi".equals(language) ? "Làm lại" : "Try again";
                    return response(200, MediaType.TEXT_HTML_VALUE,
                            challengePage(title, scenario, topic, challenge, result
                                    + "<a class='retry' href='" + escape(prefix + "/") + "'>" + retry + "</a>", prefix, language));
                }
                return response(200, MediaType.TEXT_HTML_VALUE,
                        challengePage(title, scenario, topic, challenge,
                                challengeForm(challenge, prefix, language), prefix, language));
            }
            if ("idor".equals(type) && "/api/profile".equals(path)) {
                String id = values.getOrDefault(parameter, "1");
                Map<String, Object> result = new HashMap<>();
                result.put("id", id);
                result.put("name", "1".equals(id) ? "student" : "admin");
                if (targetId.equals(id)) result.put("private_note", flag);
                return response(200, MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsString(result));
            }

            String result = exploitResult(type, path, values, parameter, flag);
            if (result != null) return response(200, MediaType.TEXT_HTML_VALUE, page(title, scenario, result));
            return response(200, MediaType.TEXT_HTML_VALUE, page(title, scenario, home(type, parameter, account)));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to serve simulated runtime for attempt {}", attempt.getId(), e);
            throw new ResponseStatusException(GONE, LocaleHolder.isEn() ? "Embedded lab sandbox cannot respond" : "Sandbox lab nhúng không thể phản hồi", e);
        }
    }

    private JsonNode readManifest(LabAttempt attempt) throws Exception {
        String artifactPath = attempt.getLab().getArtifactPath();
        if (artifactPath == null || artifactPath.isBlank()) {
            throw new ResponseStatusException(GONE, LocaleHolder.isEn() ? "Lab has no executable artifact" : "Lab không có artifact thực thi");
        }
        Path manifest = Path.of(artifactPath).toAbsolutePath().normalize().resolve("manifest.json");
        if (!Files.isRegularFile(manifest)) throw new ResponseStatusException(GONE, LocaleHolder.isEn() ? "Lab artifact no longer exists" : "Artifact lab không còn tồn tại");
        return objectMapper.readTree(manifest.toFile());
    }

    private String runtimePath(HttpServletRequest request, String token) {
        String prefix = request.getContextPath() + "/api/lab-runtime/" + token;
        String path = request.getRequestURI().substring(Math.min(prefix.length(), request.getRequestURI().length()));
        return path.isBlank() ? "/" : path;
    }

    private Map<String, String> parseForm(String encoded) {
        Map<String, String> values = new HashMap<>();
        if (encoded == null || encoded.isBlank()) return values;
        for (String pair : encoded.split("&")) {
            String[] parts = pair.split("=", 2);
            String key = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
            String value = parts.length == 2 ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8) : "";
            values.put(key, value);
        }
        return values;
    }

    private String exploitResult(String type, String path, Map<String, String> values, String parameter, String flag) {
        String input = values.getOrDefault(parameter, "");
        return switch (type) {
            case "sql-injection" -> "/login".equals(path)
                    ? pre(sqlResult(input, values.getOrDefault("password", ""), flag)) : null;
            case "xss" -> "/search".equals(path)
                    ? (LocaleHolder.isEn() ? "Result: " : "Kết quả: ") + input + (containsAny(input.toLowerCase(), "<script", "onerror") ? "<div>" + escape(flag) + "</div>" : "") : null;
            case "csrf" -> "/transfer".equals(path) && !values.isEmpty()
                    ? pre("Transfer completed without CSRF validation. Receipt: " + flag) : null;
            case "ssrf" -> "/fetch".equals(path)
                    ? pre(("http://internal/flag".equals(input) || "http://127.0.0.1/internal/flag".equals(input)) ? flag : "Fetched: " + input) : null;
            case "command-injection" -> "/ping".equals(path)
                    ? pre("PING " + input + (containsAny(input, ";cat /flag", "&& cat /flag", "|cat /flag") ? "\n" + flag : "")) : null;
            case "file-upload" -> "/upload".equals(path)
                    ? pre(isUnsafeUpload(values) ? flag : "Upload rejected") : null;
            case "auth-bypass" -> "/admin".equals(path)
                    ? pre(containsAny(values.getOrDefault("token", "").toLowerCase(), "none", "admin") ? flag : "Access denied") : null;
            default -> null;
        };
    }

    private String sqlResult(String username, String password, String flag) {
        String query = "SELECT private_note FROM users WHERE username='" + username + "' AND password='" + password + "'";
        String lower = username.toLowerCase();
        if (containsAny(lower, "' or", "\" or", "or 1=1")) return flag;
        if ((username.length() - username.replace("'", "").length()) % 2 == 1) {
            return "Database error: unterminated quoted string\nQuery: " + query;
        }
        return "Database result: 0 rows matched";
    }

    private boolean isUnsafeUpload(Map<String, String> values) {
        String filename = values.getOrDefault("filename", "").toLowerCase();
        return (filename.endsWith(".php") || filename.endsWith(".phtml") || filename.endsWith(".php.jpg"))
                && values.getOrDefault("content", "").contains("<?php");
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) if (value.contains(needle)) return true;
        return false;
    }

    private boolean challengeSucceeds(JsonNode challenge, String value) {
        String raw = value == null ? "" : value;
        String normalized = raw.toLowerCase(java.util.Locale.ROOT);
        List<String> expected = new java.util.ArrayList<>();
        challenge.path("successValues").forEach(item -> expected.add(item.asText("").toLowerCase(java.util.Locale.ROOT)));
        if (expected.isEmpty()) return false;
        return switch (challenge.path("successMode").asText("contains-any")) {
            case "equals-any" -> expected.stream().map(String::trim).anyMatch(normalized.trim()::equals);
            case "contains-all" -> expected.stream().allMatch(normalized::contains);
            case "length-at-least" -> raw.length() >= parseNumber(expected.get(0), Integer.MAX_VALUE);
            case "numeric-at-least" -> parseNumber(raw, Double.NEGATIVE_INFINITY) >= parseNumber(expected.get(0), Double.POSITIVE_INFINITY);
            default -> expected.stream().anyMatch(normalized::contains);
        };
    }

    private double parseNumber(String value, double fallback) {
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String challengeForm(JsonNode challenge, String prefix, String language) {
        String inputName = challenge.path("inputName").asText("payload");
        String inputMode = challenge.path("inputMode").asText("textarea");
        String defaultValue = challenge.path("defaultValue").asText("");
        String control;
        if ("textarea".equals(inputMode)) {
            control = "<textarea name='" + escape(inputName) + "' rows='5'>" + escape(defaultValue) + "</textarea>";
        } else {
            String inputType = Set.of("text", "url", "number", "password").contains(inputMode) ? inputMode : "text";
            control = "<input type='" + inputType + "' name='" + escape(inputName) + "' value='" + escape(defaultValue) + "' autocomplete='off'>";
        }
        String button = "vi".equals(language) ? "Gửi request" : "Send request";
        return "<form method='" + escape(challenge.path("method").asText("POST").toLowerCase(java.util.Locale.ROOT))
                + "' action='" + escape(prefix + challenge.path("endpoint").asText("/challenge")) + "'>"
                + "<label>" + escape(challenge.path("inputLabel").asText("Test payload")) + control + "</label>"
                + "<button>" + button + "</button></form>";
    }

    private String challengePage(String title, String scenario, String topic, JsonNode challenge,
                                 String content, String prefix, String language) {
        String eyebrow = "vi".equals(language) ? "BÀI THỰC HÀNH BẢO MẬT" : "SECURITY PRACTICE LAB";
        String requestLine = challenge.path("method").asText("POST") + " " + challenge.path("endpoint").asText("/challenge");
        return """
            <!doctype html><html lang='%s'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><base href='%s/'>
            <style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#191d2b;font:15px/1.6 system-ui}.top{height:54px;background:#fff;border-bottom:1px solid #dfe4ec;padding:15px 28px;font-weight:750;color:#2447a8}.shell{max-width:860px;margin:38px auto;padding:0 22px}.panel{background:#fff;border:1px solid #dfe4ec;border-radius:8px;padding:30px;box-shadow:0 10px 30px #14234612}.eyebrow{font-size:12px;font-weight:800;color:#2447a8}.topic{display:inline-block;margin-left:8px;padding:2px 7px;border:1px solid #b9c8ed;border-radius:4px;text-transform:none}h1{font-size:28px;margin:6px 0}.scenario{color:#657084;white-space:pre-line}.request{font:13px ui-monospace,monospace;background:#111827;color:#dbeafe;border-radius:6px;padding:10px 13px;margin:18px 0}form{display:flex;gap:12px;align-items:end;flex-wrap:wrap}label{display:flex;flex:1;min-width:250px;flex-direction:column;font-size:12px;font-weight:700}input,textarea{border:1px solid #cbd3df;border-radius:6px;padding:11px;font:14px/1.45 ui-monospace,monospace}button{border:0;border-radius:6px;padding:11px 18px;background:#2447a8;color:#fff;font-weight:750}.result{margin-top:18px;border-radius:7px;padding:16px}.success{background:#eaf8f3;border:1px solid #9ed8c6;color:#08775d}.failure{background:#fff4ed;border:1px solid #efc2a7;color:#8a3d12}pre{white-space:pre-wrap;background:#101522;color:#dce7ff;border-radius:7px;padding:16px}.retry{display:inline-block;margin-top:12px}</style>
            </head><body><div class='top'>SecHub / Isolated Training Lab</div><main class='shell'><section class='panel'><div class='eyebrow'>%s<span class='topic'>%s</span></div><h1>%s</h1><p class='scenario'>%s</p><div class='request'>%s</div>%s</section></main></body></html>
            """.formatted(escape(language), escape(prefix), escape(eyebrow), escape(topic), escape(title),
                escape(scenario), escape(requestLine), content);
    }

    private String home(String type, String parameter, String account) {
        boolean en = LocaleHolder.isEn();
        return switch (type) {
            case "sql-injection" -> form("post", "login", field(en ? "Username" : "Tên đăng nhập", parameter, account, "text") + field(en ? "Password" : "Mật khẩu", "password", "", "password"), en ? "Login" : "Đăng nhập");
            case "xss" -> form("get", "search", field(en ? "Keyword" : "Từ khóa", parameter, "", "text"), en ? "Search" : "Tìm kiếm");
            case "csrf" -> form("post", "transfer", field(en ? "Recipient" : "Người nhận", "to", "merchant", "text") + field(en ? "Amount" : "Số tiền", "amount", "10", "text"), en ? "Transfer" : "Chuyển khoản");
            case "idor" -> en ? "<p>Try <a href='api/profile?" + escape(parameter) + "=1'>your profile</a>. Resource key: <code>" + escape(parameter) + "</code></p>" : "<p>Thử <a href='api/profile?" + escape(parameter) + "=1'>hồ sơ của bạn</a>. Resource key: <code>" + escape(parameter) + "</code></p>";
            case "ssrf" -> form("get", "fetch", field(en ? "URL to fetch" : "URL cần lấy", parameter, "https://example.com", "text"), en ? "Send request" : "Gửi yêu cầu");
            case "command-injection" -> form("get", "ping", field(en ? "Host or IP address" : "Host hoặc địa chỉ IP", parameter, "127.0.0.1", "text"), en ? "Check" : "Kiểm tra");
            case "file-upload" -> form("post", "upload", field(en ? "Filename" : "Tên tệp", "filename", "report.jpg", "text") + "<textarea name='content' rows='4'></textarea>", en ? "Upload" : "Tải lên");
            case "auth-bypass" -> form("get", "admin", field("Access token", "token", "", "text"), en ? "Open admin page" : "Mở trang quản trị");
            default -> en ? "<p>This lab template is not yet supported.</p>" : "<p>Template lab chưa được hỗ trợ.</p>";
        };
    }

    private String field(String label, String name, String value, String type) {
        return "<label>" + escape(label) + "<input type='" + type + "' name='" + escape(name) + "' value='" + escape(value) + "'></label>";
    }

    private String form(String method, String action, String fields, String button) {
        return "<form method='" + method + "' action='" + action + "'>" + fields + "<button>" + escape(button) + "</button></form>";
    }

    private String pre(String value) {
        return "<pre>" + escape(value) + "</pre><a class='retry' href='./'>" + (LocaleHolder.isEn() ? "Retry" : "Làm lại") + "</a>";
    }

    private String page(String title, String scenario, String content) {
        boolean en = LocaleHolder.isEn();
        String lang = en ? "en" : "vi";
        String eyebrow = en ? "SECURITY LAB" : "BÀI THỰC HÀNH BẢO MẬT";
        return """
            <!doctype html><html lang='%s'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>
            <style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#191d2b;font:15px/1.6 system-ui}.top{height:54px;background:#fff;border-bottom:1px solid #dfe4ec;padding:15px 28px;font-weight:750;color:#2447a8}.shell{max-width:820px;margin:42px auto;padding:0 22px}.panel{background:#fff;border:1px solid #dfe4ec;border-radius:8px;padding:30px;box-shadow:0 10px 30px #14234612}h1{font-size:28px;margin:6px 0}.scenario{color:#657084}form{display:flex;gap:12px;align-items:end;flex-wrap:wrap}label{display:flex;flex:1;min-width:220px;flex-direction:column;font-weight:700}input,textarea{border:1px solid #cbd3df;border-radius:6px;padding:11px}button{border:0;border-radius:6px;padding:11px 18px;background:#2447a8;color:#fff;font-weight:750}pre{white-space:pre-wrap;background:#101522;color:#dce7ff;border-radius:7px;padding:18px}.retry{display:inline-block;margin-top:12px}</style>
            </head><body><div class='top'>SecHub / Isolated Training Lab</div><main class='shell'><section class='panel'><small>%s</small><h1>%s</h1><p class='scenario'>%s</p>%s</section></main></body></html>
            """.formatted(escape(lang), escape(eyebrow), escape(title), escape(scenario), content);
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private ResponseEntity<byte[]> response(int status, String contentType, String body) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(body.getBytes(StandardCharsets.UTF_8));
    }
}
