package com.sechub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.entity.Lab;
import com.sechub.entity.LearningPath;
import com.sechub.entity.Vulnerability;
import com.sechub.exception.BadRequestException;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.LabRepository;
import com.sechub.repository.VulnerabilityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiService.class);
    
    private final LabRepository labRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.openai.api-key:}")
    private String defaultApiKey;

    public OpenAiService(LabRepository labRepository,
                         VulnerabilityRepository vulnerabilityRepository,
                         ObjectMapper objectMapper) {
        this.labRepository = labRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    @Transactional
    public Lab generateAndSaveLab(String vulnerabilitySlug, String difficultyStr, String scenario, String customApiKey) {
        Vulnerability vulnerability = vulnerabilityRepository.findBySlug(vulnerabilitySlug)
                .orElseThrow(() -> new ResourceNotFoundException("Vulnerability", "slug", vulnerabilitySlug));

        String apiKey = (customApiKey != null && !customApiKey.isBlank()) ? customApiKey : defaultApiKey;
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("Mã khóa OpenAI API Key bị thiếu. Vui lòng cấu hình trên server hoặc cung cấp qua giao diện.");
        }

        LearningPath.Difficulty difficulty;
        try {
            difficulty = LearningPath.Difficulty.valueOf(difficultyStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            difficulty = LearningPath.Difficulty.BEGINNER;
        }

        String prompt = "You are Codex 5.6, a specialized coding assistant for security web penetration testing labs.\n" +
                "Generate a security training lab for the vulnerability: " + vulnerability.getName() + " (slug: " + vulnerability.getSlug() + ").\n" +
                "Difficulty: " + difficulty.name() + ".\n" +
                "Scenario prompt: " + (scenario != null && !scenario.isBlank() ? scenario : "A realistic exploitation scenario.") + "\n\n" +
                "Return the response strictly as a JSON object with the following fields:\n" +
                "{\n" +
                "  \"title\": \"A short, descriptive, engaging title for the lab (under 100 characters)\",\n" +
                "  \"description\": \"A detailed description (under 500 characters) explaining what the lab simulates, what vulnerability exists, and what the user's objective is.\",\n" +
                "  \"dockerImage\": \"sechub/" + vulnerability.getSlug() + "-lab-simulated\",\n" +
                "  \"dockerPort\": 80,\n" +
                "  \"flag\": \"SecHub{[random_hex_or_string]}\",\n" +
                "  \"hints\": [\n" +
                "    \"Hint 1 detailing the vulnerability location\",\n" +
                "    \"Hint 2 detailing the payload structure\",\n" +
                "    \"Hint 3 detailing how to submit the flag\"\n" +
                "  ],\n" +
                "  \"estimatedMinutes\": 20,\n" +
                "  \"points\": 100\n" +
                "}\n" +
                "Do not include any extra text or code block formatting outside the raw JSON object.";

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("response_format", Map.of("type", "json_object"));
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", "You are a secure coding assistant generating structured training labs in JSON format."),
                    Map.of("role", "user", "content", prompt)
            ));

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson, StandardCharsets.UTF_8))
                    .build();

            log.info("Sending request to OpenAI Chat Completion API...");
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() != 200) {
                log.error("OpenAI API call failed with status: {}, response: {}", response.statusCode(), response.body());
                throw new BadRequestException("Gọi OpenAI API thất bại. Phản hồi lỗi: " + response.body());
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            String jsonOutput = rootNode.path("choices").get(0).path("message").path("content").asText();

            JsonNode labNode = objectMapper.readTree(jsonOutput);
            String title = labNode.path("title").asText("Simulated " + vulnerability.getName() + " Lab");
            String description = labNode.path("description").asText("A dynamically generated lab to practice Web Security.");
            String dockerImage = labNode.path("dockerImage").asText("sechub/simulated-lab");
            int dockerPort = labNode.path("dockerPort").asInt(80);
            String flag = labNode.path("flag").asText("SecHub{generated_flag}");
            
            // Format hintsJson
            JsonNode hintsNode = labNode.path("hints");
            String hintsJson = objectMapper.writeValueAsString(hintsNode);
            
            int estimatedMinutes = labNode.path("estimatedMinutes").asInt(20);
            int points = labNode.path("points").asInt(100);

            Lab lab = Lab.builder()
                    .vulnerability(vulnerability)
                    .title(title)
                    .description(description)
                    .difficulty(difficulty)
                    .dockerImage(dockerImage)
                    .dockerPort(dockerPort)
                    .flag(flag)
                    .hintsJson(hintsJson)
                    .estimatedMinutes(estimatedMinutes)
                    .points(points)
                    .build();

            return labRepository.save(lab);

        } catch (Exception e) {
            log.error("Error generating lab through OpenAI: ", e);
            throw new BadRequestException("Lỗi sinh bài lab từ OpenAI: " + e.getMessage());
        }
    }
}
