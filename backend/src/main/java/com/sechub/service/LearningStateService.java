package com.sechub.service;

import com.sechub.dto.*;
import com.sechub.entity.*;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Comparator;

@Service
public class LearningStateService {
    private final UserLearningStateRepository states;
    private final LessonRepository lessons;
    private final LabAttemptRepository attempts;
    private final UserService users;
    public LearningStateService(UserLearningStateRepository states, LessonRepository lessons,
            LabAttemptRepository attempts, UserService users) {
        this.states = states; this.lessons = lessons; this.attempts = attempts; this.users = users;
    }

    @Transactional
    public ResumeLearningDto save(String username, LearningStateRequest request) {
        User user = users.findByUsername(username);
        Lesson lesson = lessons.findById(request.lessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Bài học", "id", request.lessonId()));
        if (lesson.getLearningPath().getStatus() != LearningPath.PublicationStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Bài học", "id", request.lessonId());
        }
        UserLearningState state = states.findByUserId(user.getId()).orElseGet(() ->
                UserLearningState.builder().user(user).build());
        state.setLesson(lesson);
        state.setScrollProgress(Math.max(0, Math.min(100, request.scrollProgress() == null ? 0 : request.scrollProgress())));
        state.setScrollY(Math.max(0, request.scrollY() == null ? 0 : request.scrollY()));
        state.setUpdatedAt(LocalDateTime.now());
        states.save(state);
        return lessonResume(state);
    }

    @Transactional(readOnly = true)
    public ResumeLearningDto get(String username) {
        User user = users.findByUsername(username);
        var running = attempts.findByUserIdAndStatus(user.getId(), LabAttempt.Status.RUNNING).stream()
                .filter(item -> item.getExpiresAt() == null || item.getExpiresAt().isAfter(LocalDateTime.now()))
                .max(Comparator.comparing(LabAttempt::getStartedAt));
        if (running.isPresent()) {
            LabAttempt attempt = running.get();
            return new ResumeLearningDto("LAB", "/labs/" + attempt.getLab().getId() + "/play",
                    attempt.getLab().getTitle(), "Phiên lab đang chạy · " + attempt.getHintsUsed() + " gợi ý đã mở",
                    null, null, null, attempt.getLab().getId(), attempt.getId(), attempt.getHintsUsed(), attempt.getStartedAt());
        }
        return states.findByUserId(user.getId()).map(this::lessonResume).orElse(null);
    }

    private ResumeLearningDto lessonResume(UserLearningState state) {
        Lesson lesson = state.getLesson();
        return new ResumeLearningDto("LESSON",
                "/learning/" + lesson.getLearningPath().getId() + "/lessons/" + lesson.getId() + "?resume=1",
                lesson.getTitle(), lesson.getLearningPath().getTitle(), state.getScrollProgress(), state.getScrollY(),
                lesson.getId(), null, null, null, state.getUpdatedAt());
    }
}
