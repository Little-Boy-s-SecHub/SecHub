package com.sechub.dto;

import com.sechub.entity.Lab;

import java.util.UUID;

public record LabDto(
    UUID id,
    UUID vulnerabilityId,
    String vulnerabilityName,
    String vulnerabilitySlug,
    String title,
    String description,
    String difficulty,
    String dockerImage,
    Integer dockerPort,
    String hintsJson,
    Integer estimatedMinutes,
    Integer points
) {
    public static LabDto fromEntity(Lab lab) {
        return new LabDto(
            lab.getId(),
            lab.getVulnerability().getId(),
            lab.getVulnerability().getName(),
            lab.getVulnerability().getSlug(),
            lab.getTitle(),
            lab.getDescription(),
            lab.getDifficulty().name(),
            lab.getDockerImage(),
            lab.getDockerPort(),
            lab.getHintsJson(),
            lab.getEstimatedMinutes(),
            lab.getPoints()
        );
    }
}
