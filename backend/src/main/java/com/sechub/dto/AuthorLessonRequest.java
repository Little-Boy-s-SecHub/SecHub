package com.sechub.dto;

import java.util.UUID;

public record AuthorLessonRequest(String title, String contentMarkdown, String learningObjective,
        Integer estimatedMinutes, UUID vulnerabilityId) {}
