package com.sechub.service;

import com.sechub.entity.LabAttempt;
import com.sechub.repository.LabAttemptRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

import static org.springframework.http.HttpStatus.GONE;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class LabRuntimeProxyService {

    private static final Set<String> REQUEST_HEADERS_TO_SKIP = Set.of(
            "host", "content-length", "connection", "authorization");
    private static final Set<String> RESPONSE_HEADERS_TO_SKIP = Set.of(
            "connection", "content-length", "transfer-encoding", "content-encoding",
            "access-control-allow-origin", "access-control-allow-credentials",
            "access-control-allow-methods", "access-control-allow-headers");

    private final LabAttemptRepository attemptRepository;
    private final DockerService dockerService;
    private final HttpClient httpClient;

    public LabRuntimeProxyService(LabAttemptRepository attemptRepository, DockerService dockerService) {
        this.attemptRepository = attemptRepository;
        this.dockerService = dockerService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    public ResponseEntity<byte[]> proxy(String token, byte[] body, HttpServletRequest incoming) {
        LabAttempt attempt = attemptRepository.findByRuntimeToken(token)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Runtime lab không tồn tại"));
        if (attempt.getStatus() != LabAttempt.Status.RUNNING
                || (attempt.getExpiresAt() != null && !attempt.getExpiresAt().isAfter(LocalDateTime.now()))
                || !dockerService.isContainerRunning(attempt.getContainerId())) {
            throw new ResponseStatusException(GONE, "Phiên lab đã kết thúc");
        }

        try {
            String prefix = incoming.getContextPath() + "/api/lab-runtime/" + token;
            String requestPath = incoming.getRequestURI().substring(prefix.length());
            if (requestPath.isBlank()) requestPath = "/";
            String target = "http://127.0.0.1:" + attempt.getContainerPort() + requestPath;
            if (incoming.getQueryString() != null && !incoming.getQueryString().isBlank()) {
                target += "?" + incoming.getQueryString();
            }

            HttpRequest.Builder outgoing = HttpRequest.newBuilder()
                    .uri(URI.create(target))
                    .timeout(Duration.ofSeconds(15));
            incoming.getHeaderNames().asIterator().forEachRemaining(name -> {
                if (!REQUEST_HEADERS_TO_SKIP.contains(name.toLowerCase(Locale.ROOT))) {
                    incoming.getHeaders(name).asIterator().forEachRemaining(value -> outgoing.header(name, value));
                }
            });
            outgoing.method(incoming.getMethod(), body.length == 0
                    ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofByteArray(body));

            HttpResponse<byte[]> response = httpClient.send(outgoing.build(),
                    HttpResponse.BodyHandlers.ofByteArray());
            HttpHeaders headers = new HttpHeaders();
            response.headers().map().forEach((name, values) -> {
                if (!RESPONSE_HEADERS_TO_SKIP.contains(name.toLowerCase(Locale.ROOT))) {
                    values.forEach(value -> headers.add(name, value));
                }
            });
            String location = headers.getFirst(HttpHeaders.LOCATION);
            if (location != null && location.startsWith("/")) {
                headers.set(HttpHeaders.LOCATION, "/api/lab-runtime/" + token + location);
            }
            headers.set("Cache-Control", "no-store");
            byte[] responseBody = response.body();
            String contentType = headers.getFirst(HttpHeaders.CONTENT_TYPE);
            if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("text/html")) {
                String html = new String(responseBody, StandardCharsets.UTF_8)
                        .replace("action='/", "action='")
                        .replace("href='/", "href='");
                responseBody = html.getBytes(StandardCharsets.UTF_8);
            }
            return ResponseEntity.status(response.statusCode()).headers(headers).body(responseBody);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(GONE, "Ứng dụng lab tạm thời không phản hồi", e);
        }
    }
}
