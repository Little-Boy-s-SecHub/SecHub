package com.sechub.dto;

public record MentorGuidanceDto(
        String question,
        String focusArea,
        boolean hintAvailable,
        int stage
) {}
