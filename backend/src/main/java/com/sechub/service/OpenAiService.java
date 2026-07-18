package com.sechub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.GeneratedLabSpec;
import com.sechub.dto.PracticeCardDto;
import com.sechub.entity.Lesson;
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
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final LabRepository labRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final LabArtifactService labArtifactService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.openai.api-key:}")
    private String defaultApiKey;

    @Value("${app.openai.model:gpt-5.6-sol}")
    private String model;

    @Value("${app.openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    public OpenAiService(LabRepository labRepository,
                         VulnerabilityRepository vulnerabilityRepository,
                         LabArtifactService labArtifactService,
                         ObjectMapper objectMapper) {
        this.labRepository = labRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.labArtifactService = labArtifactService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
    }

    @Transactional
    public Lab generateAndSaveLab(String vulnerabilitySlug, String difficultyValue, String scenario) {
        Vulnerability vulnerability = vulnerabilityRepository.findBySlug(vulnerabilitySlug)
                .orElseThrow(() -> new ResourceNotFoundException("Vulnerability", "slug", vulnerabilitySlug));
        LearningPath.Difficulty difficulty = parseDifficulty(difficultyValue);
        String apiKey = defaultApiKey;

        GeneratedLabSpec spec = apiKey == null || apiKey.isBlank()
                ? localSpec(vulnerability, difficulty, scenario)
                : requestSpec(vulnerability, difficulty, scenario, apiKey);

        String flag = generateFlag(vulnerabilitySlug);
        LabArtifactService.LabArtifact artifact = labArtifactService.create(vulnerabilitySlug, flag, spec);
        Lab lab = Lab.builder()
                .vulnerability(vulnerability)
                .title(spec.title())
                .description(spec.description())
                .difficulty(difficulty)
                .dockerImage(artifact.imageName())
                .artifactPath(artifact.directory().toString())
                .dockerPort(artifact.containerPort())
                .flag(flag)
                .hintsJson(writeHints(spec.hints()))
                .estimatedMinutes(spec.estimatedMinutes())
                .points(spec.points())
                .build();
        return labRepository.save(lab);
    }

    public List<PracticeCardDto> generatePracticeCards(List<Lesson> lessons) {
        if (defaultApiKey != null && !defaultApiKey.isBlank()) {
            try {
                return requestPracticeCards(lessons, defaultApiKey);
            } catch (Exception e) {
                log.warn("Codex card generation failed, falling back to local template cards", e);
                return localPracticeCards(lessons);
            }
        }
        return localPracticeCards(lessons);
    }

    @Transactional
    public Lab saveGeneratedLab(Lab lab) {
        return labRepository.save(lab);
    }

    private List<PracticeCardDto> localPracticeCards(List<Lesson> lessons) {
        return lessons.stream().flatMap(lesson -> {
            String vulnerability = lesson.getVulnerability() == null
                    ? "lỗ hổng được trình bày trong bài"
                    : lesson.getVulnerability().getName();
            String lessonKey = lesson.getId().toString();
            return List.of(
                    new PracticeCardDto(lessonKey + "-concept", "CONCEPT",
                            "Dấu hiệu quan trọng nhất cần kiểm tra trong bài này là gì?",
                            "Luồng dữ liệu đầu vào và kiểm tra quyền ở phía server",
                            "Hãy theo dõi dữ liệu từ request tới điểm xử lý nhạy cảm thay vì chỉ quan sát giao diện.", lesson.getTitle()),
                    new PracticeCardDto(lessonKey + "-code", "CODE_REVIEW",
                            "Khi đọc code liên quan tới " + vulnerability + ", bước kiểm tra đầu tiên là gì?",
                            "Xác định input do người dùng kiểm soát và validation/authorization tương ứng",
                            "Đây là cách nhanh nhất để nhận diện ranh giới tin cậy bị phá vỡ.", lesson.getTitle())
            ).stream();
        }).limit(8).toList();
    }

    private List<PracticeCardDto> requestPracticeCards(List<Lesson> lessons, String apiKey) {
        try {
            Map<String, Object> cardSchema = Map.of(
                    "type", "object", "additionalProperties", false,
                    "required", List.of("id", "type", "question", "answer", "explanation", "lessonTitle"),
                    "properties", Map.of(
                            "id", Map.of("type", "string"),
                            "type", Map.of("type", "string", "enum", List.of("CONCEPT", "CODE_REVIEW", "PAYLOAD")),
                            "question", Map.of("type", "string", "maxLength", 500),
                            "answer", Map.of("type", "string", "maxLength", 500),
                            "explanation", Map.of("type", "string", "maxLength", 700),
                            "lessonTitle", Map.of("type", "string", "maxLength", 300)));
            Map<String, Object> schema = Map.of(
                    "type", "object", "additionalProperties", false, "required", List.of("cards"),
                    "properties", Map.of("cards", Map.of("type", "array", "minItems", 3, "maxItems", 8, "items", cardSchema)));
            String input = lessons.stream().map(lesson -> "LESSON: " + lesson.getTitle() + "\n"
                    + compactLessonContent(lesson.getContentMarkdown())).reduce("", (a, b) -> a + "\n\n" + b);
            Map<String, Object> body = Map.of(
                    "model", model,
                    "instructions", "Create Vietnamese security flashcards only from the supplied completed lessons. "
                            + "Include code-review, payload-recognition, and concept cards. Payloads must target only an isolated SecHub sandbox. "
                            + "Answers must be concise and explanations must teach why the answer is correct.",
                    "input", input,
                    "text", Map.of("format", Map.of("type", "json_schema", "name", "sechub_practice_cards", "strict", true, "schema", schema)));
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(openAiBaseUrl + "/responses"))
                    .timeout(Duration.ofSeconds(90)).header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8)).build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException("Codex không thể tạo flashcard (HTTP " + response.statusCode() + ")");
            }
            JsonNode cardsNode = objectMapper.readTree(extractOutputText(objectMapper.readTree(response.body()))).path("cards");
            return objectMapper.readerForListOf(PracticeCardDto.class).readValue(cardsNode);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate practice cards", e);
            throw new BadRequestException("Không thể tạo flashcard bằng Codex: " + e.getMessage());
        }
    }

    private String compactLessonContent(String value) {
        if (value == null) return "";
        String compact = value.replaceAll("```[\\s\\S]*?```", " ").replaceAll("\\s+", " ").trim();
        return compact.substring(0, Math.min(1200, compact.length()));
    }

    private GeneratedLabSpec requestSpec(Vulnerability vulnerability, LearningPath.Difficulty difficulty,
                                         String scenario, String apiKey) {
        try {
            Map<String, Object> schema = Map.of(
                    "type", "object",
                    "additionalProperties", false,
                    "required", List.of("title", "description", "scenario", "hints", "estimatedMinutes", "points"),
                    "properties", Map.of(
                            "title", Map.of("type", "string", "maxLength", 100),
                            "description", Map.of("type", "string", "maxLength", 500),
                            "scenario", Map.of("type", "string", "maxLength", 1000),
                            "hints", Map.of("type", "array", "minItems", 1, "maxItems", 8,
                                    "items", Map.of("type", "string", "maxLength", 240)),
                            "estimatedMinutes", Map.of("type", "integer", "minimum", 10, "maximum", 90),
                            "points", Map.of("type", "integer", "minimum", 50, "maximum", 500)));

            Map<String, Object> body = Map.of(
                    "model", model,
                    "instructions", "Design metadata for an intentionally vulnerable, isolated web-security training lab. "
                            + "Do not generate source code, malware, persistence, credential theft, or targets outside the lab. "
                            + "The learner objective must be to retrieve a SecHub flag from the local sandbox. "
                            + "The requested scenario may contain LESSON TITLE, LEARNING PATH, and LESSON CONTENT. "
                            + "It may also contain LEARNER TRACK; adapt the number of steps, ambiguity, and hint directness to that proficiency. "
                            + "Change business context, endpoint names, parameters, records, and flag for every generated variant while preserving the exact technical vulnerability objective. "
                            + "The practical story, task, terminology, and hints MUST closely follow that lesson context; "
                            + "do not replace it with an unrelated generic scenario.",
                    "input", "Vulnerability: " + vulnerability.getName() + " (" + vulnerability.getSlug() + ")\n"
                            + "Difficulty: " + difficulty.name() + "\nRequested scenario: "
                            + normalizeScenario(scenario),
                    "text", Map.of("format", Map.of(
                            "type", "json_schema", "name", "sechub_lab_spec", "strict", true, "schema", schema)));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(openAiBaseUrl + "/responses"))
                    .timeout(Duration.ofSeconds(90))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("OpenAI Responses API returned status {}", response.statusCode());
                throw new BadRequestException("OpenAI không thể tạo đặc tả lab (HTTP " + response.statusCode() + ")");
            }
            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            return validateSpec(objectMapper.readValue(outputText, GeneratedLabSpec.class));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate lab spec", e);
            throw new BadRequestException("Không thể tạo đặc tả lab từ OpenAI: " + e.getMessage());
        }
    }

    private String extractOutputText(JsonNode root) {
        for (JsonNode output : root.path("output")) {
            for (JsonNode content : output.path("content")) {
                if ("output_text".equals(content.path("type").asText()) && content.hasNonNull("text")) {
                    return content.path("text").asText();
                }
            }
        }
        throw new BadRequestException("OpenAI không trả về LabSpec hợp lệ");
    }

    private GeneratedLabSpec localSpec(Vulnerability vulnerability, LearningPath.Difficulty difficulty,
                                       String scenario) {
        int minutes = switch (difficulty) {
            case BEGINNER -> 20;
            case INTERMEDIATE -> 35;
            case ADVANCED -> 50;
        };
        int points = switch (difficulty) {
            case BEGINNER -> 100;
            case INTERMEDIATE -> 200;
            case ADVANCED -> 300;
        };
        return new GeneratedLabSpec(
                lessonAwareTitle(vulnerability, scenario),
                "Kịch bản thực hành được tạo từ nội dung bài học về " + vulnerability.getName()
                        + ". Mục tiêu là áp dụng đúng kiến thức vừa học để tìm flag SecHub.",
                localPracticeScenario(vulnerability, scenario),
                List.of("Xác định input mà server tin tưởng.", "Thử thay đổi request trực tiếp thay vì chỉ dùng giao diện.",
                        "Khai thác chỉ trong container lab và tìm chuỗi SecHub{...}."),
                minutes, points);
    }

    private String localPracticeScenario(Vulnerability vulnerability, String context) {
        String lessonTitle = extractContextValue(context, "LESSON TITLE:");
        String subject = lessonTitle == null ? vulnerability.getName() : lessonTitle;
        String task = switch (vulnerability.getSlug()) {
            case "sql-injection" -> "Phân tích truy vấn từ input, kiểm tra cách server ghép câu lệnh SQL và truy xuất bản ghi chứa flag.";
            case "xss" -> "Xác định dữ liệu được phản chiếu vào HTML, tạo payload script trong sandbox và tìm flag trong phản hồi.";
            case "csrf" -> "Phân tích hành động thay đổi dữ liệu, kiểm tra cơ chế xác nhận nguồn request và thực hiện yêu cầu hợp lệ để lấy flag.";
            case "idor" -> "Quan sát định danh tài nguyên trong request, kiểm tra quyền sở hữu và truy cập bản ghi không thuộc tài khoản hiện tại để tìm flag.";
            case "ssrf" -> "Phân tích chức năng gọi URL phía server, giới hạn mục tiêu trong mạng sandbox và truy cập dịch vụ nội bộ chứa flag.";
            case "command-injection" -> "Xác định input được chuyển tới lệnh hệ điều hành, kiểm tra cách nối lệnh trong sandbox và đọc flag.";
            case "file-upload" -> "Phân tích quy tắc kiểm tra tệp tải lên, thử cách vượt qua kiểm tra trong sandbox và tìm flag.";
            case "auth-bypass" -> "Phân tích luồng xác thực và kiểm tra phân quyền, vượt qua điều kiện không an toàn để truy cập flag.";
            default -> "Phân tích request của ứng dụng cô lập, khai thác đúng loại lỗ hổng đang học và tìm flag.";
        };
        return "Áp dụng kiến thức từ bài \"" + subject + "\" trong một ứng dụng web cô lập. " + task;
    }

    private String extractContextValue(String context, String label) {
        if (context == null) return null;
        for (String line : context.lines().toList()) {
            if (line.startsWith(label)) {
                String value = line.substring(label.length()).trim();
                return value.isBlank() ? null : value;
            }
        }
        return null;
    }

    private String lessonAwareTitle(Vulnerability vulnerability, String scenario) {
        if (scenario != null) {
            for (String line : scenario.lines().toList()) {
                if (line.startsWith("LESSON TITLE:")) {
                    String title = line.substring("LESSON TITLE:".length()).trim();
                    if (!title.isBlank()) {
                        String result = title + " - Lab thực hành";
                        return result.substring(0, Math.min(100, result.length()));
                    }
                }
            }
        }
        return vulnerability.getName() + " - Generated Sandbox";
    }

    private GeneratedLabSpec validateSpec(GeneratedLabSpec spec) {
        if (spec.title() == null || spec.title().isBlank() || spec.hints() == null || spec.hints().isEmpty()) {
            throw new BadRequestException("LabSpec do model tạo thiếu trường bắt buộc");
        }
        return new GeneratedLabSpec(
                spec.title().substring(0, Math.min(100, spec.title().length())),
                spec.description(), sanitizeGeneratedScenario(spec.scenario()), List.copyOf(spec.hints()),
                spec.estimatedMinutes(), spec.points());
    }

    private String sanitizeGeneratedScenario(String scenario) {
        if (scenario == null) return "";
        String content = extractContextValue(scenario, "LESSON CONTENT:");
        if (content != null) {
            return content.substring(0, Math.min(700, content.length()));
        }
        return scenario.replaceAll("(?m)^(LESSON TITLE|LEARNING PATH|REQUIREMENT):.*$", "")
                .replaceAll("\\s+", " ").trim();
    }

    private LearningPath.Difficulty parseDifficulty(String value) {
        try {
            return LearningPath.Difficulty.valueOf(value == null ? "BEGINNER" : value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Độ khó không hợp lệ: " + value);
        }
    }

    private String normalizeScenario(String scenario) {
        return scenario == null || scenario.isBlank()
                ? "Một ứng dụng nội bộ có lỗi cấu hình; người học cần phân tích request để lấy flag."
                : scenario.trim().substring(0, Math.min(1000, scenario.trim().length()));
    }

    private String generateFlag(String slug) {
        byte[] random = new byte[12];
        SECURE_RANDOM.nextBytes(random);
        return "SecHub{" + slug.replace('-', '_') + "_" + HexFormat.of().formatHex(random) + "}";
    }

    private String writeHints(List<String> hints) {
        try {
            return objectMapper.writeValueAsString(hints);
        } catch (Exception e) {
            throw new BadRequestException("Không thể lưu hints của lab");
        }
    }
}
