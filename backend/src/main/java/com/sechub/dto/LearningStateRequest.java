package com.sechub.dto;
import java.util.UUID;
public record LearningStateRequest(UUID lessonId, Integer scrollProgress, Integer scrollY) {}
