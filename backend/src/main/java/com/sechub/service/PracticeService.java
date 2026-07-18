package com.sechub.service;

import com.sechub.dto.LabDto;
import com.sechub.dto.PracticeCardDto;
import com.sechub.dto.PracticeDeckDto;
import com.sechub.entity.Lab;
import com.sechub.entity.Lesson;
import com.sechub.entity.User;
import com.sechub.entity.UserProgress;
import com.sechub.entity.GrowthProfile;
import com.sechub.exception.BadRequestException;
import com.sechub.repository.UserProgressRepository;
import com.sechub.repository.GrowthProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class PracticeService {

    private final UserService userService;
    private final UserProgressRepository progressRepository;
    private final GrowthProfileRepository growthProfileRepository;
    private final OpenAiService openAiService;

    public PracticeService(UserService userService, UserProgressRepository progressRepository,
                           GrowthProfileRepository growthProfileRepository, OpenAiService openAiService) {
        this.userService = userService;
        this.progressRepository = progressRepository;
        this.growthProfileRepository = growthProfileRepository;
        this.openAiService = openAiService;
    }

    @Transactional(readOnly = true)
    public PracticeDeckDto generateDeck(String username) {
        User user = userService.findByUsername(username);
        List<Lesson> lessons = completedLessons(user);
        if (lessons.isEmpty()) {
            throw new BadRequestException("Hãy hoàn thành ít nhất một bài học để mở bộ flashcard");
        }
        List<PracticeCardDto> cards = openAiService.generatePracticeCards(lessons.stream().limit(4).toList());
        return new PracticeDeckDto(LocalDate.now(), cards, null, lessons.size());
    }

    @Transactional
    public PracticeDeckDto generateDailyLab(String username) {
        User user = userService.findByUsername(username);
        List<Lesson> lessons = completedLessons(user);
        Lesson lesson = lessons.stream()
                .filter(item -> item.getVulnerability() != null)
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Các bài đã hoàn thành chưa có loại lỗ hổng phù hợp để tạo lab hằng ngày"));
        
        String track = growthProfileRepository.findByUserId(user.getId()).map(GrowthProfile::getRecommendedTrack).orElse("BEGINNER");
        String adaptiveDifficulty = adaptiveDifficulty(lesson.getLearningPath().getDifficulty().name(), track);
        
        String scenario = "LESSON TITLE: " + lesson.getTitle() + "\n"
                + "LEARNING PATH: " + lesson.getLearningPath().getTitle() + "\n"
                + "LESSON CONTENT: " + compact(lesson.getContentMarkdown(), 700) + "\n"
                + "LEARNER TRACK: " + track + "\n"
                + "REQUIREMENT: Tạo thử thách hằng ngày ngắn, bám sát bài học và chỉ chạy trong sandbox. Điều chỉnh độ phức tạp dựa trên trình độ.";
                
        Lab lab = openAiService.generateAndSaveLab(
                lesson.getVulnerability().getSlug(),
                adaptiveDifficulty,
                scenario);
        return new PracticeDeckDto(LocalDate.now(), List.of(), LabDto.fromEntity(lab), lessons.size());
    }

    private String adaptiveDifficulty(String requested, String track) {
        int requestedLevel = switch (requested == null ? "BEGINNER" : requested.toUpperCase()) {
            case "ADVANCED" -> 2; case "INTERMEDIATE" -> 1; default -> 0;
        };
        int learnerLevel = switch (track == null ? "BEGINNER" : track) {
            case "PENTESTER" -> 2; case "WEB_DEVELOPER" -> 1; default -> 0;
        };
        return new String[]{"BEGINNER", "INTERMEDIATE", "ADVANCED"}[Math.max(requestedLevel, learnerLevel)];
    }

    private List<Lesson> completedLessons(User user) {
        return progressRepository.findByUserIdAndCompletedTrue(user.getId()).stream()
                .sorted(Comparator.comparing(UserProgress::getCompletedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(UserProgress::getLesson)
                .toList();
    }

    private String compact(String value, int maxLength) {
        if (value == null) return "";
        String compact = value.replaceAll("```[\\s\\S]*?```", " ")
                .replaceAll("[#*_>`\\[\\]()!-]", " ")
                .replaceAll("\\s+", " ").trim();
        return compact.substring(0, Math.min(maxLength, compact.length()));
    }
}
