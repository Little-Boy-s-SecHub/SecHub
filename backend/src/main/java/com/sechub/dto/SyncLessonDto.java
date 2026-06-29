package com.sechub.dto;

public record SyncLessonDto(
    String learningPathDifficulty, // BEGINNER, INTERMEDIATE, ADVANCED
    String vulnerabilitySlug,      // e.g. sql-injection (optional)
    String title,
    Integer sortOrder,
    String contentMarkdown
) {}
