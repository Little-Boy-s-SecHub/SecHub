package com.sechub.dto;

import com.sechub.entity.UserProgress;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProgressDto(
    UUID id,
    UUID userId,
    UUID lessonId,
    String lessonTitle,
    Boolean completed,
    LocalDateTime completedAt
) {
    public static UserProgressDto fromEntity(UserProgress progress) {
        return new UserProgressDto(
            progress.getId(),
            progress.getUser().getId(),
            progress.getLesson().getId(),
            progress.getLesson().getTitle(),
            progress.getCompleted(),
            progress.getCompletedAt()
        );
    }
}
