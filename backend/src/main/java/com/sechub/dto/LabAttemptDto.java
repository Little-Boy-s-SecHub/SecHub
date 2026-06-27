package com.sechub.dto;

import com.sechub.entity.LabAttempt;

import java.time.LocalDateTime;
import java.util.UUID;

public record LabAttemptDto(
    UUID id,
    UUID userId,
    UUID labId,
    String labTitle,
    String containerId,
    Integer containerPort,
    String status,
    LocalDateTime startedAt,
    LocalDateTime completedAt,
    String flagSubmitted,
    Integer score,
    Integer hintsUsed
) {
    public static LabAttemptDto fromEntity(LabAttempt attempt) {
        return new LabAttemptDto(
            attempt.getId(),
            attempt.getUser().getId(),
            attempt.getLab().getId(),
            attempt.getLab().getTitle(),
            attempt.getContainerId(),
            attempt.getContainerPort(),
            attempt.getStatus().name(),
            attempt.getStartedAt(),
            attempt.getCompletedAt(),
            attempt.getFlagSubmitted(),
            attempt.getScore(),
            attempt.getHintsUsed()
        );
    }
}
