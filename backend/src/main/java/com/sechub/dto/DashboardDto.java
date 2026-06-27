package com.sechub.dto;

import java.util.UUID;

public record DashboardDto(
    UUID userId,
    String username,
    long completedLessons,
    long totalLessons,
    long completedLabs,
    long totalLabs,
    int totalScore,
    double progressPercentage
) {}
