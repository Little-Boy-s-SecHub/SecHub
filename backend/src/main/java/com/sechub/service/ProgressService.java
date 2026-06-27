package com.sechub.service;

import com.sechub.dto.UserProgressDto;
import com.sechub.entity.Lesson;
import com.sechub.entity.User;
import com.sechub.entity.UserProgress;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.LessonRepository;
import com.sechub.repository.UserProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ProgressService {

    private final UserProgressRepository progressRepository;
    private final LessonRepository lessonRepository;
    private final UserService userService;

    public ProgressService(UserProgressRepository progressRepository,
                           LessonRepository lessonRepository,
                           UserService userService) {
        this.progressRepository = progressRepository;
        this.lessonRepository = lessonRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<UserProgressDto> getUserProgress(String username) {
        User user = userService.findByUsername(username);
        return progressRepository.findByUserId(user.getId())
                .stream()
                .map(UserProgressDto::fromEntity)
                .toList();
    }

    @Transactional
    public UserProgressDto markLessonComplete(UUID lessonId, String username) {
        User user = userService.findByUsername(username);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài học", "id", lessonId));

        UserProgress progress = progressRepository
                .findByUserIdAndLessonId(user.getId(), lessonId)
                .orElseGet(() -> UserProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .build());

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());
        progress = progressRepository.save(progress);

        return UserProgressDto.fromEntity(progress);
    }

    @Transactional(readOnly = true)
    public List<UserProgressDto> getProgressByPath(UUID pathId, String username) {
        User user = userService.findByUsername(username);
        List<Lesson> lessons = lessonRepository.findByLearningPathIdOrderBySortOrderAsc(pathId);

        return lessons.stream()
                .map(lesson -> {
                    var progress = progressRepository
                            .findByUserIdAndLessonId(user.getId(), lesson.getId());
                    if (progress.isPresent()) {
                        return UserProgressDto.fromEntity(progress.get());
                    } else {
                        return new UserProgressDto(
                                null, user.getId(), lesson.getId(),
                                lesson.getTitle(), false, null);
                    }
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public long getCompletedCountForPath(UUID pathId, String username) {
        User user = userService.findByUsername(username);
        return progressRepository.countCompletedByUserIdAndPathId(user.getId(), pathId);
    }
}
