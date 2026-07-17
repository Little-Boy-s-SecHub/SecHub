package com.sechub.dto;
import java.time.LocalDateTime;
import java.util.UUID;
public record ResumeLearningDto(String type, String url, String title, String subtitle, Integer progress,
        Integer scrollY, UUID lessonId, UUID labId, UUID attemptId, Integer hintsUsed, LocalDateTime updatedAt) {}
