package com.sechub.dto;

import com.sechub.entity.LearningPath;

import java.util.List;
import java.util.UUID;

public record LearningPathDto(
    UUID id,
    String title,
    String description,
    String difficulty,
    Integer estimatedHours,
    int sortOrder,
    int lessonCount,
    List<LessonDto> lessons
) {
    public static LearningPathDto fromEntity(LearningPath lp) {
        List<LessonDto> lessonDtos = lp.getLessons() != null
            ? lp.getLessons().stream().map(LessonDto::fromEntity).toList()
            : List.of();

        return new LearningPathDto(
            lp.getId(),
            lp.getTitle(),
            lp.getDescription(),
            lp.getDifficulty().name(),
            lp.getEstimatedHours(),
            lp.getSortOrder(),
            lessonDtos.size(),
            lessonDtos
        );
    }

    public static LearningPathDto summary(LearningPath lp) {
        return new LearningPathDto(
            lp.getId(),
            lp.getTitle(),
            lp.getDescription(),
            lp.getDifficulty().name(),
            lp.getEstimatedHours(),
            lp.getSortOrder(),
            lp.getLessons() != null ? lp.getLessons().size() : 0,
            null
        );
    }
}
