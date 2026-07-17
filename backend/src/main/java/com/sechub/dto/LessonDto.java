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
    String vulnerabilityName,
    String vulnerabilitySlug,
    String learningObjective,
    Integer estimatedMinutes
) {
    public static LessonDto fromEntity(Lesson lesson) {
        return new LessonDto(
            lesson.getId(),
            lesson.getLearningPath().getId(),
            lesson.getTitle(),
            lesson.getContentMarkdown(),
            lesson.getSortOrder(),
            lesson.getVulnerability() != null ? lesson.getVulnerability().getId() : null,
            lesson.getVulnerability() != null ? lesson.getVulnerability().getName() : null,
            lesson.getVulnerability() != null ? lesson.getVulnerability().getSlug() : null,
            lesson.getLearningObjective() == null || lesson.getLearningObjective().isBlank()
                    ? "Hiểu và nhận diện " + lesson.getTitle() : lesson.getLearningObjective(),
            lesson.getEstimatedMinutes() == null ? 12 : lesson.getEstimatedMinutes()
        );
    }
}
