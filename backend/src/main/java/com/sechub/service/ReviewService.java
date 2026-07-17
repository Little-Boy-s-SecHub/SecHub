package com.sechub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.*;
import com.sechub.entity.*;
import com.sechub.exception.BadRequestException;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
public class ReviewService {
    private final FlashcardRepository cards;
    private final UserProgressRepository progress;
    private final VulnerabilityRepository vulnerabilities;
    private final LabRepository labs;
    private final UserService users;
    private final OpenAiService openAiService;
    private final ObjectMapper mapper;
    private final ActivityService activityService;
    @Value("${app.openai.model:gpt-5.6-sol}") private String model;

    public ReviewService(FlashcardRepository cards, UserProgressRepository progress,
            VulnerabilityRepository vulnerabilities, LabRepository labs, UserService users,
            OpenAiService openAiService, ObjectMapper mapper, ActivityService activityService) {
        this.cards = cards; this.progress = progress; this.vulnerabilities = vulnerabilities;
        this.labs = labs; this.users = users; this.openAiService = openAiService; this.mapper = mapper; this.activityService = activityService;
    }

    @Transactional
    public ReviewDashboardDto dashboard(String username) {
        User user = users.findByUsername(username);
        generateMissingCards(user);
        LocalDateTime now = LocalDateTime.now();
        List<FlashcardDto> due = cards.findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(user.getId(), now)
                .stream().limit(10).map(card -> FlashcardDto.fromEntity(card, mapper, false)).toList();
        return new ReviewDashboardDto(cards.countByUserIdAndNextReviewAtLessThanEqual(user.getId(), now),
                cards.countByUserId(user.getId()), (int) cards.countByUserIdAndLastReviewedAtAfter(user.getId(), LocalDate.now().atStartOfDay()), due);
    }

    @Transactional
    public FlashcardReviewResult review(UUID id, FlashcardReviewRequest request, String username) {
        User user = users.findByUsername(username);
        Flashcard card = cards.findById(id).orElseThrow(() -> new ResourceNotFoundException("Flashcard", "id", id));
        if (!card.getUser().getId().equals(user.getId())) throw new BadRequestException("Flashcard không thuộc tài khoản này");
        boolean correct = normalize(request.answer()).equals(normalize(card.getCorrectAnswer()));
        String rating = request.rating() == null ? "AGAIN" : request.rating().toUpperCase();
        int days = switch (rating) {
            case "HARD" -> 2;
            case "GOOD" -> Math.max(4, card.getIntervalDays() * 2);
            case "EASY" -> Math.max(7, card.getIntervalDays() * 3);
            default -> 0;
        };
        if (!correct) days = 0;
        card.setRepetitions(card.getRepetitions() + 1);
        card.setIntervalDays(days);
        card.setCorrectCount(card.getCorrectCount() + (correct ? 1 : 0));
        card.setWrongCount(card.getWrongCount() + (correct ? 0 : 1));
        card.setNextReviewAt(days == 0 ? LocalDateTime.now().plusHours(8) : LocalDateTime.now().plusDays(days));
        card.setLastReviewedAt(LocalDateTime.now());
        cards.save(card);
        activityService.incrementActivity(user.getId());
        return new FlashcardReviewResult(correct, card.getCorrectAnswer(), card.getExplanation(), card.getNextReviewAt());
    }

    @Transactional
    public LabDto dailyLab(String username) {
        User user = users.findByUsername(username);
        UserProgress latest = progress.findByUserIdAndCompletedTrue(user.getId()).stream()
                .max(Comparator.comparing(item -> Optional.ofNullable(item.getCompletedAt()).orElse(LocalDateTime.MIN)))
                .orElseThrow(() -> new BadRequestException("Hãy hoàn thành ít nhất một bài học để mở Daily Lab"));
        Vulnerability vulnerability = resolveVulnerability(latest.getLesson());
        String dailyTitle = "Daily " + LocalDate.now() + " - " + user.getUsername();
        return LabDto.fromEntity(labs.findFirstByTitle(dailyTitle).orElseGet(() -> {
            String scenario = "LESSON TITLE: " + latest.getLesson().getTitle() + "\n"
                    + "LEARNING PATH: Daily Review\nLESSON CONTENT: " + summarize(latest.getLesson().getContentMarkdown())
                    + "\nREQUIREMENT: Tạo thử thách ôn tập 10-15 phút bám sát bài học; tiêu đề phải là " + dailyTitle;
            Lab generated = openAiService.generateAndSaveLab(vulnerability.getSlug(), "BEGINNER", scenario);
            generated.setTitle(dailyTitle);
            generated.setAuthor(user);
            return labs.save(generated);
        }));
    }

    private void generateMissingCards(User user) {
        for (UserProgress item : progress.findByUserIdAndCompletedTrue(user.getId())) {
            Lesson lesson = item.getLesson();
            if (cards.existsByUserIdAndLessonId(user.getId(), lesson.getId())) continue;
            Vulnerability vulnerability = resolveVulnerability(lesson);
            List<Flashcard> generated = new ArrayList<>(templateCards(user, lesson, vulnerability));
            openAiService.generatePracticeCards(List.of(lesson)).stream().limit(2)
                    .map(itemCard -> generatedCard(user, lesson, vulnerability, itemCard))
                    .forEach(generated::add);
            cards.saveAll(generated);
        }
    }

    private Flashcard generatedCard(User user, Lesson lesson, Vulnerability vulnerability, PracticeCardDto generated) {
        List<String> choices = new ArrayList<>(List.of(generated.answer(), "Kiểm tra giao diện mà không xem request",
                "Thử payload trên hệ thống bên ngoài", "Bỏ qua kiểm tra phía server"));
        Collections.rotate(choices, Math.floorMod(generated.question().hashCode(), choices.size()));
        return card(user, lesson, vulnerability.getSlug(), generated.type(), generated.question(), null,
                choices, generated.answer(), generated.explanation());
    }

    private List<Flashcard> templateCards(User user, Lesson lesson, Vulnerability vuln) {
        String slug = vuln.getSlug();
        String unsafeCode = switch (slug) {
            case "sql-injection" -> "query = \"SELECT * FROM users WHERE id = \" + request.id";
            case "xss" -> "element.innerHTML = request.query.q;";
            case "idor" -> "return repository.findById(request.id); // không kiểm tra owner";
            case "ssrf" -> "return httpClient.get(request.url);";
            case "command-injection" -> "exec(\"ping \" + request.host);";
            case "file-upload" -> "file.save(upload.originalFilename);";
            case "csrf" -> "POST /transfer // không kiểm tra CSRF token";
            default -> "if (request.token != null) return adminData;";
        };
        String payload = switch (slug) {
            case "sql-injection" -> "' OR 1=1 --"; case "xss" -> "<script>alert(1)</script>";
            case "idor" -> "Thay id tài nguyên bằng ID của người dùng khác";
            case "ssrf" -> "http://127.0.0.1/internal"; case "command-injection" -> "127.0.0.1; id";
            case "file-upload" -> "Tệp có nội dung thực thi nhưng phần mở rộng được ngụy trang";
            case "csrf" -> "Gửi POST thay đổi dữ liệu từ một origin khác"; default -> "Bỏ qua điều kiện xác thực không an toàn";
        };
        return List.of(
            card(user, lesson, slug, "CODE_REVIEW", "Đoạn code này có nguy cơ lỗ hổng nào?", unsafeCode,
                    List.of(vuln.getName(), "Race Condition", "Information Disclosure", "Không có lỗi"), vuln.getName(),
                    "Dữ liệu người dùng được tin cậy mà thiếu kiểm tra hoặc ràng buộc bảo mật phù hợp."),
            card(user, lesson, slug, "PAYLOAD", "Thao tác hoặc payload nào phù hợp nhất trong sandbox của bài này?", null,
                    List.of(payload, "Chỉ tải lại trang", "Đổi User-Agent", "Xoá cookie giao diện"), payload,
                    "Payload này tác động trực tiếp vào điểm yếu " + vuln.getName() + " đang được ôn tập."),
            card(user, lesson, slug, "MULTIPLE_CHOICE", "Bước nào cần làm trước khi thử khai thác?", null,
                    List.of("Xác định input và quan sát request", "Tấn công hệ thống bên ngoài", "Đoán flag", "Tắt logging"),
                    "Xác định input và quan sát request", "Hiểu luồng dữ liệu và ranh giới tin cậy giúp chọn payload đúng và an toàn.")
        );
    }

    private Flashcard card(User user, Lesson lesson, String slug, String type, String question, String code,
            List<String> choices, String answer, String explanation) {
        try {
            return Flashcard.builder().user(user).lesson(lesson).type(type).question(question).code(code)
                    .choicesJson(mapper.writeValueAsString(choices)).correctAnswer(answer).explanation(explanation)
                    .vulnerabilitySlug(slug).sourceModel(model).nextReviewAt(LocalDateTime.now()).build();
        } catch (Exception e) { throw new BadRequestException("Không thể tạo flashcard: " + e.getMessage()); }
    }

    private Vulnerability resolveVulnerability(Lesson lesson) {
        if (lesson.getVulnerability() != null) return lesson.getVulnerability();
        String text = (lesson.getTitle() + " " + lesson.getContentMarkdown()).toLowerCase();
        String slug = text.contains("sql") ? "sql-injection" : text.contains("xss") ? "xss" :
                text.contains("ssrf") ? "ssrf" : text.contains("upload") ? "file-upload" :
                text.contains("command") ? "command-injection" : text.contains("csrf") || text.contains("clickjack") ? "csrf" :
                text.contains("privilege") || text.contains("auth") ? "auth-bypass" : "idor";
        return vulnerabilities.findBySlug(slug).orElseThrow(() -> new BadRequestException("Chưa có template ôn tập cho bài học"));
    }
    private String summarize(String value) { return value == null ? "" : value.replaceAll("\\s+", " ").substring(0, Math.min(650, value.replaceAll("\\s+", " ").length())); }
    private String normalize(String value) { return value == null ? "" : value.trim().toLowerCase(); }
}
