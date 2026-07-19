package com.sechub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sechub.dto.GeneratedLabSpec;
import com.sechub.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class LabArtifactService {

    private final ObjectMapper objectMapper;
    private final Path generatedLabsRoot;

    public record LabArtifact(Path directory, String imageName, int containerPort) {}

    public LabArtifactService(ObjectMapper objectMapper,
            @Value("${app.lab.generated-root:./runtime/generated-labs}") String generatedRoot) {
        this.objectMapper = objectMapper;
        this.generatedLabsRoot = Path.of(generatedRoot).toAbsolutePath().normalize();
    }

    public LabArtifact create(String vulnerabilitySlug, String flag, GeneratedLabSpec spec, String language) {
        String context = String.join("\n", spec.title(), spec.description(), spec.scenario());
        LabTemplateCatalog.ChallengeProfile profile = LabTemplateCatalog.challengeFor(vulnerabilitySlug, context);
        String artifactId = UUID.randomUUID().toString();
        String variantKey = artifactId.replace("-", "").substring(0, 6);
        String targetId = String.valueOf(2 + Math.floorMod(artifactId.hashCode(), 8));
        Path directory = generatedLabsRoot.resolve(artifactId).normalize();
        if (!directory.startsWith(generatedLabsRoot)) {
            throw new BadRequestException("Đường dẫn artifact lab không hợp lệ");
        }

        try {
            Files.createDirectories(directory);
            write(directory.resolve("app.py"), challengePythonApplication());
            write(directory.resolve("Dockerfile"), dockerfile());
            String lang = language == null || language.isBlank() ? "en" : language;
            Map<String, Object> manifest = new LinkedHashMap<>();
            manifest.put("id", artifactId);
            manifest.put("vulnerability", profile.runtimeType());
            manifest.put("topic", profile.topicSlug());
            manifest.put("flag", flag);
            manifest.put("title", spec.title());
            manifest.put("scenario", spec.scenario() == null ? "" : spec.scenario());
            manifest.put("language", lang);
            manifest.put("variant", Map.of(
                    "parameter", "ref_" + variantKey.substring(0, 3),
                    "targetId", targetId,
                    "account", "analyst_" + variantKey));
            manifest.put("challenge", profile.toManifest(targetId, lang));
            write(directory.resolve("manifest.json"), objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(manifest));
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
            ObjectNode manifest = (ObjectNode) objectMapper.readTree(directory.resolve("manifest.json").toFile());
            String requestedTopic = manifest.path("topic").asText("");
            if (requestedTopic.isBlank()) requestedTopic = manifest.path("vulnerability").asText("");
            String context = manifest.path("title").asText("") + "\n" + manifest.path("scenario").asText("");
            String language = manifest.path("language").asText("en");
            String targetId = manifest.path("variant").path("targetId").asText("7");
            LabTemplateCatalog.ChallengeProfile profile = LabTemplateCatalog.challengeFor(requestedTopic, context);
            manifest.put("vulnerability", profile.runtimeType());
            manifest.put("topic", profile.topicSlug());
            manifest.set("challenge", objectMapper.valueToTree(profile.toManifest(targetId, language)));

            Files.writeString(directory.resolve("app.py"), challengePythonApplication(), StandardCharsets.UTF_8,
                    StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
            Files.writeString(directory.resolve("Dockerfile"), dockerfile(), StandardCharsets.UTF_8,
                    StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
            Files.writeString(directory.resolve("manifest.json"),
                    objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(manifest), StandardCharsets.UTF_8,
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

    private String challengePythonApplication() {
        return """
                import html
                import json
                import os
                import urllib.parse
                from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

                with open("manifest.json", encoding="utf-8") as source:
                    LAB = json.load(source)

                FLAG = LAB["flag"]
                TITLE = LAB.get("title", "SecHub Generated Lab")
                SCENARIO = LAB.get("scenario", "")
                TOPIC = LAB.get("topic", LAB.get("vulnerability", "security-lab"))
                LANG = LAB.get("language", "en")
                CHALLENGE = LAB.get("challenge", {})
                METHOD = CHALLENGE.get("method", "POST").upper()
                ENDPOINT = CHALLENGE.get("endpoint", "/challenge")
                INPUT_NAME = CHALLENGE.get("inputName", "payload")
                INPUT_LABEL = CHALLENGE.get("inputLabel", "Test payload")
                DEFAULT_VALUE = CHALLENGE.get("defaultValue", "")
                INPUT_MODE = CHALLENGE.get("inputMode", "textarea")
                SUCCESS_MODE = CHALLENGE.get("successMode", "contains-any")
                SUCCESS_VALUES = [str(value) for value in CHALLENGE.get("successValues", ["admin"])]
                FAILURE_MESSAGE = CHALLENGE.get("failureMessage", "The request did not exploit the weakness.")

                def succeeds(value):
                    raw = str(value or "")
                    normalized = raw.lower()
                    expected = [item.lower() for item in SUCCESS_VALUES]
                    if SUCCESS_MODE == "equals-any":
                        return normalized.strip() in [item.strip() for item in expected]
                    if SUCCESS_MODE == "contains-all":
                        return all(item in normalized for item in expected)
                    if SUCCESS_MODE == "length-at-least":
                        return len(raw) >= int(SUCCESS_VALUES[0])
                    if SUCCESS_MODE == "numeric-at-least":
                        try:
                            return float(raw) >= float(SUCCESS_VALUES[0])
                        except ValueError:
                            return False
                    return any(item in normalized for item in expected)

                def page(body, prefix=""):
                    lang_attr = "vi" if LANG == "vi" else "en"
                    base_path = (prefix.rstrip("/") + "/") if prefix else "/"
                    return ("<!doctype html><html lang='" + lang_attr + "'><head><meta charset='utf-8'>"
                            + "<meta name='viewport' content='width=device-width,initial-scale=1'><base href='" + html.escape(base_path) + "'>"
                            + "<title>" + html.escape(TITLE) + "</title><style>"
                            + ":root{color-scheme:light;--ink:#161b2a;--muted:#657084;--line:#dce2eb;--brand:#2147ad;--soft:#f4f7fb;--ok:#08775d}"
                            + "*{box-sizing:border-box}body{margin:0;background:var(--soft);color:var(--ink);font:15px/1.6 Inter,ui-sans-serif,system-ui,sans-serif}"
                            + ".topbar{height:54px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 28px;font-weight:750;color:var(--brand)}"
                            + ".shell{max-width:860px;margin:38px auto;padding:0 22px}.panel{background:#fff;border:1px solid var(--line);border-radius:8px;padding:30px;box-shadow:0 10px 30px rgba(20,35,70,.07)}"
                            + ".eyebrow{font-size:12px;font-weight:800;color:var(--brand);text-transform:uppercase}.topic{display:inline-flex;margin-left:8px;padding:2px 7px;border:1px solid #b9c8ed;border-radius:4px;text-transform:none}"
                            + "h1{font-size:28px;line-height:1.25;margin:8px 0 10px}.scenario{color:var(--muted);margin:0 0 20px;white-space:pre-line}.request{font:13px ui-monospace,monospace;background:#111827;color:#dbeafe;border-radius:6px;padding:10px 13px;margin-bottom:18px}"
                            + "form{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.field{display:flex;min-width:260px;flex:1;flex-direction:column;gap:6px}label{font-size:12px;font-weight:750;color:#3d4658}"
                            + "input,textarea{width:100%;border:1px solid #c7d0df;border-radius:6px;padding:11px 12px;background:#fff;font:14px/1.45 ui-monospace,monospace}textarea{min-height:112px;resize:vertical}"
                            + "input:focus,textarea:focus{outline:3px solid #dce6ff;border-color:var(--brand)}button{border:0;border-radius:6px;padding:11px 18px;background:var(--brand);color:#fff;font-weight:750;cursor:pointer}"
                            + ".result{margin-top:18px;border-radius:7px;padding:16px}.success{background:#eaf8f3;border:1px solid #9ed8c6;color:var(--ok)}.failure{background:#fff4ed;border:1px solid #efc2a7;color:#8a3d12}"
                            + "pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#101522;color:#dce7ff;border-radius:7px;padding:16px;margin:10px 0 0}.retry{display:inline-flex;margin-top:14px;color:var(--brand);font-weight:750;text-decoration:none}"
                            + "@media(max-width:600px){.panel{padding:21px}.shell{margin-top:20px}h1{font-size:23px}}"
                            + "</style></head><body><div class='topbar'>SecHub / Isolated Training Lab</div>"
                            + "<main class='shell'><section class='panel'>" + body + "</section></main></body></html>")

                class Handler(BaseHTTPRequestHandler):
                    def prefix(self):
                        return self.headers.get("X-Forwarded-Prefix", "").rstrip("/")

                    def send(self, status, body, content_type="text/html; charset=utf-8"):
                        data = body.encode("utf-8")
                        self.send_response(status)
                        self.send_header("Content-Type", content_type)
                        self.send_header("Cache-Control", "no-store")
                        self.send_header("Content-Length", str(len(data)))
                        self.end_headers()
                        self.wfile.write(data)

                    def values(self):
                        if self.command == "GET":
                            encoded = urllib.parse.urlparse(self.path).query
                        else:
                            length = int(self.headers.get("Content-Length", "0"))
                            encoded = self.rfile.read(length).decode("utf-8", errors="replace")
                        return {key: items[-1] for key, items in urllib.parse.parse_qs(encoded, keep_blank_values=True).items()}

                    def do_GET(self):
                        self.handle_request()

                    def do_POST(self):
                        self.handle_request()

                    def handle_request(self):
                        path = urllib.parse.urlparse(self.path).path
                        if path == "/health":
                            return self.send(200, "ok", "text/plain; charset=utf-8")
                        if path == ENDPOINT:
                            if self.command != METHOD:
                                return self.send(405, "method not allowed", "text/plain; charset=utf-8")
                            value = self.values().get(INPUT_NAME, "")
                            if succeeds(value):
                                heading = "Khai thác thành công" if LANG == "vi" else "Exploit successful"
                                body = "<div class='result success'><strong>" + heading + "</strong><pre>" + html.escape(FLAG) + "</pre></div>"
                            else:
                                body = "<div class='result failure'>" + html.escape(FAILURE_MESSAGE) + "</div>"
                            retry = "Làm lại" if LANG == "vi" else "Try again"
                            return self.send(200, page(self.header() + body + "<a class='retry' href='" + html.escape(self.prefix() + "/") + "'>" + retry + "</a>", self.prefix()))
                        return self.send(200, page(self.header() + self.form(), self.prefix()))

                    def header(self):
                        eyebrow = "BÀI THỰC HÀNH BẢO MẬT" if LANG == "vi" else "SECURITY PRACTICE LAB"
                        return ("<div class='eyebrow'>" + eyebrow + "<span class='topic'>" + html.escape(TOPIC) + "</span></div>"
                                + "<h1>" + html.escape(TITLE) + "</h1><p class='scenario'>" + html.escape(SCENARIO) + "</p>"
                                + "<div class='request'>" + html.escape(METHOD + " " + ENDPOINT) + "</div>")

                    def form(self):
                        action = self.prefix() + ENDPOINT
                        if INPUT_MODE == "textarea":
                            control = "<textarea name='" + html.escape(INPUT_NAME) + "'>" + html.escape(DEFAULT_VALUE) + "</textarea>"
                        else:
                            input_type = INPUT_MODE if INPUT_MODE in ("text", "url", "number", "password") else "text"
                            control = "<input type='" + input_type + "' name='" + html.escape(INPUT_NAME) + "' value='" + html.escape(DEFAULT_VALUE) + "' autocomplete='off'>"
                        button = "Gửi request" if LANG == "vi" else "Send request"
                        return ("<form method='" + METHOD.lower() + "' action='" + html.escape(action) + "'><div class='field'><label>"
                                + html.escape(INPUT_LABEL) + "</label>" + control + "</div><button>" + button + "</button></form>")

                    def log_message(self, fmt, *args):
                        pass

                ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), Handler).serve_forever()
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
                LANG = LAB.get("language", "en")

                def page(title, body):
                    lang_attr = "vi" if LANG == "vi" else "en"
                    retry_text = "L\u00e0m l\u1ea1i" if LANG == "vi" else "Try again"
                    retry = "<a class='retry' href='./'>" + retry_text + "</a>" if "<pre>" in body else ""
                    return ("<!doctype html><html lang='" + lang_attr + "'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>"
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
                            + body + retry + "</section></main></body></html>")

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
                        vi = LANG == "vi"
                        forms = {
                            "sql-injection": "<form method='post' action='/login'><div class='field'><label>" + ("T\u00ean \u0111\u0103ng nh\u1eadp" if vi else "Username") + "</label><input name='" + PARAM + "' autocomplete='off' placeholder='" + ACCOUNT + "'></div><div class='field'><label>" + ("M\u1eadt kh\u1ea9u" if vi else "Password") + "</label><input name='password' type='password' placeholder='" + ("Nh\u1eadp m\u1eadt kh\u1ea9u" if vi else "Enter password") + "'></div><button>" + ("\u0110\u0103ng nh\u1eadp" if vi else "Login") + "</button></form>",
                            "xss": "<form action='/search'><div class='field'><label>" + ("T\u1eeb kh\u00f3a" if vi else "Keyword") + "</label><input name='" + PARAM + "' placeholder='" + ("T\u00ecm trong t\u00e0i li\u1ec7u" if vi else "Search documents") + "'></div><button>" + ("T\u00ecm ki\u1ebfm" if vi else "Search") + "</button></form>",
                            "csrf": "<form method='post' action='/transfer'><div class='field'><label>" + ("Ng\u01b0\u1eddi nh\u1eadn" if vi else "Recipient") + "</label><input name='to' value='merchant'></div><div class='field'><label>" + ("S\u1ed1 ti\u1ec1n" if vi else "Amount") + "</label><input name='amount' value='10'></div><button>" + ("Chuy\u1ec3n kho\u1ea3n" if vi else "Transfer") + "</button></form>",
                            "idor": "<p>Try <a href='/api/profile?" + PARAM + "=1'>your profile</a>. Resource key: <code>" + PARAM + "</code></p>",
                            "ssrf": "<form action='/fetch'><div class='field'><label>" + ("URL c\u1ea7n l\u1ea5y" if vi else "URL to fetch") + "</label><input name='" + PARAM + "' value='https://example.com'></div><button>" + ("G\u1eedi y\u00eau c\u1ea7u" if vi else "Send request") + "</button></form>",
                            "command-injection": "<form action='/ping'><div class='field'><label>" + ("Host ho\u1eb7c \u0111\u1ecba ch\u1ec9 IP" if vi else "Host or IP address") + "</label><input name='" + PARAM + "' value='127.0.0.1'></div><button>" + ("Ki\u1ec3m tra" if vi else "Check") + "</button></form>",
                            "file-upload": "<form method='post' action='/upload'><div class='field'><label>" + ("T\u00ean t\u1ec7p" if vi else "Filename") + "</label><input name='filename' placeholder='report.jpg'></div><div class='field'><label>" + ("N\u1ed9i dung t\u1ec7p" if vi else "File content") + "</label><textarea name='content' rows='4'></textarea></div><button>" + ("T\u1ea3i l\u00ean" if vi else "Upload") + "</button></form>",
                            "auth-bypass": "<form action='/admin'><div class='field'><label>Access token</label><input name='token' placeholder='eyJ...'></div><button>" + ("M\u1edf trang qu\u1ea3n tr\u1ecb" if vi else "Open admin panel") + "</button></form>"
                        }
                        eyebrow = "B\u00c0I TH\u1ef0C H\u00c0NH B\u1ea2O M\u1eacT" if vi else "SECURITY PRACTICE LAB"
                        return page(LAB["title"], "<div class='eyebrow'>" + eyebrow + "</div><h1>" + html.escape(LAB["title"]) + "</h1><p class='scenario'>" + html.escape(LAB.get("scenario", "")) + "</p>" + forms.get(TYPE, ""))

                    def log_message(self, fmt, *args):
                        pass

                ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), Handler).serve_forever()
                """;
    }
}
