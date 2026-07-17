package com.sechub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.GeneratedLabSpec;
import com.sechub.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class LabArtifactService {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "sql-injection", "xss", "csrf", "idor", "ssrf",
            "command-injection", "file-upload", "auth-bypass");

    private final ObjectMapper objectMapper;
    private final Path generatedLabsRoot;

    public record LabArtifact(Path directory, String imageName, int containerPort) {}

    public LabArtifactService(ObjectMapper objectMapper,
            @Value("${app.lab.generated-root:./runtime/generated-labs}") String generatedRoot) {
        this.objectMapper = objectMapper;
        this.generatedLabsRoot = Path.of(generatedRoot).toAbsolutePath().normalize();
    }

    public LabArtifact create(String vulnerabilitySlug, String flag, GeneratedLabSpec spec) {
        if (!SUPPORTED_TYPES.contains(vulnerabilitySlug)) {
            throw new BadRequestException("Loại lỗ hổng chưa có template thực thi an toàn: " + vulnerabilitySlug);
        }

        String artifactId = UUID.randomUUID().toString();
        String variantKey = artifactId.replace("-", "").substring(0, 6);
        Path directory = generatedLabsRoot.resolve(artifactId).normalize();
        if (!directory.startsWith(generatedLabsRoot)) {
            throw new BadRequestException("Đường dẫn artifact lab không hợp lệ");
        }

        try {
            Files.createDirectories(directory);
            write(directory.resolve("app.py"), pythonApplication());
            write(directory.resolve("Dockerfile"), dockerfile());
            write(directory.resolve("manifest.json"), objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(Map.of(
                    "id", artifactId,
                    "vulnerability", vulnerabilitySlug,
                    "flag", flag,
                    "title", spec.title(),
                    "scenario", spec.scenario() == null ? "" : spec.scenario(),
                    "variant", Map.of("parameter", "ref_" + variantKey.substring(0, 3),
                            "targetId", 2 + Math.floorMod(artifactId.hashCode(), 8),
                            "account", "analyst_" + variantKey))));
            write(directory.resolve("README.md"), readme(spec, vulnerabilitySlug));
            return new LabArtifact(directory, "sechub/generated-lab-" + artifactId + ":latest", 8080);
        } catch (IOException e) {
            throw new BadRequestException("Không thể tạo source cho lab: " + e.getMessage());
        }
    }

    public void refreshRuntimeTemplate(String artifactPath) {
        if (artifactPath == null || artifactPath.isBlank()) return;
        Path directory = Path.of(artifactPath).toAbsolutePath().normalize();
        if (!directory.startsWith(generatedLabsRoot) || !Files.isRegularFile(directory.resolve("manifest.json"))) {
            throw new BadRequestException("Artifact lab không thuộc thư mục runtime được quản lý");
        }
        try {
            Files.writeString(directory.resolve("app.py"), pythonApplication(), StandardCharsets.UTF_8,
                    StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
            Files.writeString(directory.resolve("Dockerfile"), dockerfile(), StandardCharsets.UTF_8,
                    StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new BadRequestException("Không thể cập nhật UI template của lab: " + e.getMessage());
        }
    }

    public void deleteArtifact(String artifactPath) {
        if (artifactPath == null || artifactPath.isBlank()) return;
        Path directory = Path.of(artifactPath).toAbsolutePath().normalize();
        if (!directory.startsWith(generatedLabsRoot) || directory.equals(generatedLabsRoot)) {
            throw new BadRequestException("Artifact lab không thuộc thư mục runtime được quản lý");
        }
        if (!Files.exists(directory)) return;
        try (var paths = Files.walk(directory)) {
            for (Path path : paths.sorted(java.util.Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(path);
            }
        } catch (IOException e) {
            throw new BadRequestException("Không thể xoá artifact của lab: " + e.getMessage());
        }
    }

    private void write(Path path, String content) throws IOException {
        Files.writeString(path, content, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
    }

    private String readme(GeneratedLabSpec spec, String vulnerabilitySlug) {
        return "# " + spec.title() + "\n\n"
                + spec.description() + "\n\n"
                + "Vulnerability: `" + vulnerabilitySlug + "`\n\n"
                + "This intentionally vulnerable application is for isolated security training only.\n";
    }

    private String dockerfile() {
        return """
                FROM python:3.13-alpine
                RUN addgroup -S lab && adduser -S lab -G lab
                WORKDIR /app
                COPY --chown=lab:lab app.py manifest.json ./
                USER lab
                EXPOSE 8080
                HEALTHCHECK --interval=3s --timeout=2s --retries=10 CMD wget -q -O - http://127.0.0.1:8080/health || exit 1
                CMD ["python", "app.py"]
                """;
    }

    private String pythonApplication() {
        return """
                import html
                import json
                import os
                import sqlite3
                import urllib.parse
                from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

                with open("manifest.json", encoding="utf-8") as source:
                    LAB = json.load(source)
                FLAG = LAB["flag"]
                TYPE = LAB["vulnerability"]
                VARIANT = LAB.get("variant", {})
                PARAM = VARIANT.get("parameter", "ref")
                TARGET_ID = str(VARIANT.get("targetId", 7))
                ACCOUNT = VARIANT.get("account", "analyst")

                def page(title, body):
                    retry = "<a class='retry' href='./'>Làm lại</a>" if "<pre>" in body else ""
                    return ("<!doctype html><html lang='vi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>"
                            + "<title>" + html.escape(title) + "</title><style>"
                            + ":root{color-scheme:light;--ink:#191d2b;--muted:#657084;--line:#dfe4ec;--brand:#2447a8;--soft:#f5f7fb}"
                            + "*{box-sizing:border-box}body{margin:0;background:var(--soft);color:var(--ink);font:15px/1.6 Inter,ui-sans-serif,system-ui,sans-serif}"
                            + ".topbar{height:54px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 28px;font-weight:750;color:var(--brand)}"
                            + ".shell{max-width:820px;margin:42px auto;padding:0 22px}.panel{background:#fff;border:1px solid var(--line);border-radius:8px;padding:30px;box-shadow:0 10px 30px rgba(20,35,70,.07)}"
                            + ".eyebrow{font-size:12px;font-weight:800;color:var(--brand);text-transform:uppercase}h1{font-size:28px;line-height:1.2;margin:8px 0 12px}"
                            + ".scenario{color:var(--muted);margin:0 0 24px}.fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{display:flex;flex-direction:column;gap:6px}"
                            + "label{font-size:12px;font-weight:750;color:#3d4658}input,textarea{width:100%;border:1px solid #cbd3df;border-radius:6px;padding:11px 12px;background:#fff;font:inherit}"
                            + "input:focus,textarea:focus{outline:3px solid #dce6ff;border-color:var(--brand)}button{border:0;border-radius:6px;padding:11px 18px;background:var(--brand);color:#fff;font-weight:750;cursor:pointer}"
                            + "form{display:flex;gap:12px;align-items:end;flex-wrap:wrap}form .field{min-width:220px;flex:1}pre{white-space:pre-wrap;background:#101522;color:#dce7ff;border-radius:7px;padding:18px;margin-top:20px}.retry{display:inline-flex;margin-top:14px;padding:9px 14px;border:1px solid var(--line);border-radius:6px;color:var(--brand);font-weight:750;text-decoration:none;background:#fff}"
                            + "@media(max-width:600px){.fields{grid-template-columns:1fr}.panel{padding:22px}.shell{margin-top:22px}}"
                            + "</style></head><body><div class='topbar'>SecHub / Isolated Training Lab</div><main class='shell'><section class='panel'>"
                            + "<div class='eyebrow'>Bài thực hành bảo mật</div><h1>" + html.escape(title) + "</h1>" + body + retry + "</section></main></body></html>")

                class Handler(BaseHTTPRequestHandler):
                    def send(self, status, body, content_type="text/html; charset=utf-8"):
                        data = body.encode()
                        self.send_response(status)
                        self.send_header("Content-Type", content_type)
                        self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
                        self.send_header("Content-Length", str(len(data)))
                        self.end_headers()
                        self.wfile.write(data)

                    def params(self):
                        query = urllib.parse.urlparse(self.path).query
                        return {k: v[-1] for k, v in urllib.parse.parse_qs(query, keep_blank_values=True).items()}

                    def body(self):
                        length = int(self.headers.get("Content-Length", "0"))
                        return urllib.parse.parse_qs(self.rfile.read(length).decode(), keep_blank_values=True)

                    def do_GET(self):
                        path = urllib.parse.urlparse(self.path).path
                        p = self.params()
                        if path == "/health":
                            return self.send(200, "ok", "text/plain")
                        if TYPE == "idor" and path == "/api/profile":
                            user_id = p.get(PARAM, "1")
                            data = {"id": user_id, "name": "student" if user_id == "1" else "admin"}
                            if user_id == TARGET_ID: data["private_note"] = FLAG
                            return self.send(200, json.dumps(data), "application/json")
                        if TYPE == "ssrf" and path == "/fetch":
                            url = p.get(PARAM, "")
                            result = FLAG if url in ("http://internal/flag", "http://127.0.0.1/internal/flag") else "Fetched: " + url
                            return self.send(200, page("URL Fetcher", "<pre>" + html.escape(result) + "</pre>"))
                        if TYPE == "command-injection" and path == "/ping":
                            host = p.get(PARAM, "")
                            result = "PING " + host
                            if any(x in host for x in (";cat /flag", "&& cat /flag", "|cat /flag")): result += "\\n" + FLAG
                            return self.send(200, page("Ping Tool", "<pre>" + html.escape(result) + "</pre>"))
                        if TYPE == "xss" and path == "/search":
                            q = p.get(PARAM, "")
                            result = q + ("<div id='flag'>" + FLAG + "</div>" if ("<script" in q.lower() or "onerror" in q.lower()) else "")
                            return self.send(200, page("Search", "Results: " + result))
                        if TYPE == "auth-bypass" and path == "/admin":
                            token = p.get("token", "")
                            result = FLAG if ("none" in token.lower() or "admin" in token.lower()) else "Access denied"
                            return self.send(200, page("Admin", "<pre>" + html.escape(result) + "</pre>"))
                        return self.send(200, self.home())

                    def do_POST(self):
                        path = urllib.parse.urlparse(self.path).path
                        form = self.body()
                        value = lambda key: form.get(key, [""])[-1]
                        if TYPE == "sql-injection" and path == "/login":
                            username = value(PARAM)
                            password = value("password")
                            connection = sqlite3.connect(":memory:")
                            connection.execute("CREATE TABLE users (username TEXT, password TEXT, private_note TEXT)")
                            connection.execute("INSERT INTO users VALUES (?, ?, ?)", ("admin", "change-me", FLAG))
                            connection.execute("INSERT INTO users VALUES (?, ?, ?)", (ACCOUNT, "welcome123", "No sensitive data"))
                            query = "SELECT private_note FROM users WHERE username='" + username + "' AND password='" + password + "'"
                            try:
                                row = connection.execute(query).fetchone()
                                result = row[0] if row else "Database result: 0 rows matched"
                            except sqlite3.Error as error:
                                result = "Database error: " + str(error) + "\\nQuery: " + query
                            finally:
                                connection.close()
                            return self.send(200, page("Login", "<pre>" + html.escape(result) + "</pre>"))
                        if TYPE == "csrf" and path == "/transfer":
                            result = "Transfer completed without CSRF validation. Receipt: " + FLAG
                            return self.send(200, page("Transfer", "<pre>" + html.escape(result) + "</pre>"))
                        if TYPE == "file-upload" and path == "/upload":
                            filename = value("filename").lower()
                            content = value("content")
                            result = FLAG if (filename.endswith((".php", ".phtml", ".php.jpg")) and "<?php" in content) else "Upload rejected"
                            return self.send(200, page("Upload", "<pre>" + html.escape(result) + "</pre>"))
                        return self.send(404, "not found", "text/plain")

                    def home(self):
                        forms = {
                            "sql-injection": "<form method='post' action='/login'><div class='field'><label>Tên đăng nhập</label><input name='" + PARAM + "' autocomplete='off' placeholder='" + ACCOUNT + "'></div><div class='field'><label>Mật khẩu</label><input name='password' type='password' placeholder='Nhập mật khẩu'></div><button>Đăng nhập</button></form>",
                            "xss": "<form action='/search'><div class='field'><label>Từ khóa</label><input name='" + PARAM + "' placeholder='Tìm trong tài liệu'></div><button>Tìm kiếm</button></form>",
                            "csrf": "<form method='post' action='/transfer'><div class='field'><label>Người nhận</label><input name='to' value='merchant'></div><div class='field'><label>Số tiền</label><input name='amount' value='10'></div><button>Chuyển khoản</button></form>",
                            "idor": "<p>Try <a href='/api/profile?" + PARAM + "=1'>your profile</a>. Resource key: <code>" + PARAM + "</code></p>",
                            "ssrf": "<form action='/fetch'><div class='field'><label>URL cần lấy</label><input name='" + PARAM + "' value='https://example.com'></div><button>Gửi yêu cầu</button></form>",
                            "command-injection": "<form action='/ping'><div class='field'><label>Host hoặc địa chỉ IP</label><input name='" + PARAM + "' value='127.0.0.1'></div><button>Kiểm tra</button></form>",
                            "file-upload": "<form method='post' action='/upload'><div class='field'><label>Tên tệp</label><input name='filename' placeholder='report.jpg'></div><div class='field'><label>Nội dung tệp</label><textarea name='content' rows='4'></textarea></div><button>Tải lên</button></form>",
                            "auth-bypass": "<form action='/admin'><div class='field'><label>Access token</label><input name='token' placeholder='eyJ...'></div><button>Mở trang quản trị</button></form>"
                        }
                        return page(LAB["title"], "<p class='scenario'>" + html.escape(LAB.get("scenario", "")) + "</p>" + forms[TYPE])

                    def log_message(self, fmt, *args):
                        pass

                ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), Handler).serve_forever()
                """;
    }
}
