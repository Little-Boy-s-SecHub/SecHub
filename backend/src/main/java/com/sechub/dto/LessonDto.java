package com.sechub.dto;

import com.sechub.entity.Lesson;

import java.util.UUID;

public record LessonDto(
    UUID id,
    UUID pathId,
    String title,
    String contentMarkdown,
    int sortOrder,
    UUID vulnerabilityId,
    String vulnerabilityName
) {
    public static LessonDto fromEntity(Lesson lesson) {
        return new LessonDto(
            lesson.getId(),
            lesson.getLearningPath().getId(),
            lesson.getTitle(),
            lesson.getContentMarkdown(),
            lesson.getSortOrder(),
            lesson.getVulnerability() != null ? lesson.getVulnerability().getId() : null,
            lesson.getVulnerability() != null ? lesson.getVulnerability().getName() : null
        );
    }
}
