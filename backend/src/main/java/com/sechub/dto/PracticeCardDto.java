package com.sechub.dto;

public record PracticeCardDto(
        String id,
        String type,
        String question,
        String answer,
        String explanation,
        String lessonTitle
) {}
