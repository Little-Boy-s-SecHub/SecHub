package com.sechub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.GeneratedLabSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.net.ServerSocket;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LabArtifactServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void generatedSqlInjectionLabCanBeExploited() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        LabArtifactService service = new LabArtifactService(mapper, tempDir.toString());
        String flag = "SecHub{integration_test_flag}";
        GeneratedLabSpec spec = new GeneratedLabSpec(
                "SQLi Test Lab", "Intentionally vulnerable login", "Find the admin flag",
                List.of("Inspect login", "Try a boolean condition", "Submit the flag"), 20, 100);

        LabArtifactService.LabArtifact artifact = service.create("sql-injection", flag, spec, "en");
        assertThat(artifact.directory().resolve("Dockerfile")).isRegularFile();
        assertThat(artifact.directory().resolve("app.py")).isRegularFile();
        JsonNode manifest = mapper.readTree(Files.readString(artifact.directory().resolve("manifest.json")));
        assertThat(manifest.path("flag").asText()).isEqualTo(flag);
        String inputName = manifest.path("challenge").path("inputName").asText();
        assertThat(inputName).isEqualTo("username");

        int port;
        try (ServerSocket socket = new ServerSocket(0)) {
            port = socket.getLocalPort();
        }
        ProcessBuilder builder = new ProcessBuilder("python", "app.py")
                .directory(artifact.directory().toFile())
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.DISCARD);
        builder.environment().put("PORT", Integer.toString(port));
        Process process = builder.start();
        try {
            waitUntilHealthy(port);

            String payload = URLEncoder.encode(inputName, StandardCharsets.UTF_8) + "="
                    + URLEncoder.encode("' OR 1=1 --", StandardCharsets.UTF_8)
                    + "&password=x";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://127.0.0.1:" + port + "/login"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response = HttpClient.newHttpClient().send(request,
                    HttpResponse.BodyHandlers.ofString());
            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).contains(flag);
        } finally {
            process.destroyForcibly();
        }
    }

    @Test
    void unsupportedLessonSlugFallsBackToSafeExecutableTemplate() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        LabArtifactService service = new LabArtifactService(mapper, tempDir.toString());
        GeneratedLabSpec spec = new GeneratedLabSpec(
                "Downgrade Attacks Lab", "TLS downgrade practice", "Practice a TLS downgrade decision point",
                List.of("Inspect protocol negotiation"), 30, 150);

        LabArtifactService.LabArtifact artifact = service.create("downgrade-attacks", "SecHub{crypto_flag}", spec, "vi");

        JsonNode manifest = mapper.readTree(Files.readString(artifact.directory().resolve("manifest.json")));
        assertThat(manifest.path("vulnerability").asText()).isEqualTo("auth-bypass");
        assertThat(manifest.path("topic").asText()).isEqualTo("downgrade-attacks");
        assertThat(manifest.path("challenge").path("endpoint").asText()).isEqualTo("/tls/handshake");
        assertThat(manifest.path("challenge").path("successValues")).anySatisfy(value ->
                assertThat(value.asText()).isEqualTo("TLS1.0"));
        assertThat(artifact.directory().resolve("app.py")).isRegularFile();
    }

    @Test
    void refreshUpgradesLegacyManifestToTopicChallenge() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        LabArtifactService service = new LabArtifactService(mapper, tempDir.toString());
        Path artifact = tempDir.resolve("legacy-artifact");
        Files.createDirectories(artifact);
        Files.writeString(artifact.resolve("manifest.json"), mapper.writeValueAsString(java.util.Map.of(
                "vulnerability", "auth-bypass",
                "title", "Downgrade Attacks Lab",
                "scenario", "TLS protocol negotiation downgrade",
                "language", "vi",
                "variant", java.util.Map.of("targetId", 7))));
        Files.writeString(artifact.resolve("app.py"), "legacy");
        Files.writeString(artifact.resolve("Dockerfile"), "legacy");

        service.refreshRuntimeTemplate(artifact.toString());

        JsonNode manifest = mapper.readTree(artifact.resolve("manifest.json").toFile());
        assertThat(manifest.path("topic").asText()).isEqualTo("downgrade-attacks");
        assertThat(manifest.path("challenge").path("endpoint").asText()).isEqualTo("/tls/handshake");
        assertThat(Files.readString(artifact.resolve("app.py"))).contains("X-Forwarded-Prefix");
    }

    private void waitUntilHealthy(int port) throws Exception {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(250)).build();
        Exception lastError = null;
        for (int i = 0; i < 30; i++) {
            try {
                HttpResponse<String> response = client.send(HttpRequest.newBuilder()
                                .uri(URI.create("http://127.0.0.1:" + port + "/health"))
                                .timeout(Duration.ofMillis(500)).GET().build(),
                        HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) return;
            } catch (Exception e) {
                lastError = e;
            }
            Thread.sleep(100);
        }
        throw new AssertionError("Generated lab did not become healthy", lastError);
    }
}
