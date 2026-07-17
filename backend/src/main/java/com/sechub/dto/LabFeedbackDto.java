package com.sechub.dto;

import java.util.List;
import java.util.UUID;

public record LabFeedbackDto(
        String vulnerabilityName,
        String summary,
        String whyItWorked,
        String vulnerableCode,
        String secureCode,
        List<String> remediationSteps,
        String lessonTakeaway,
        UUID nextLabId,
        String nextLabTitle,
        String nextLabDifficulty
) {
    public LabFeedbackDto(String vulnerabilityName, String summary, String whyItWorked,
            String vulnerableCode, String secureCode, List<String> remediationSteps, String lessonTakeaway) {
        this(vulnerabilityName, summary, whyItWorked, vulnerableCode, secureCode, remediationSteps,
                lessonTakeaway, null, null, null);
    }

    public LabFeedbackDto withNextLab(UUID id, String title, String difficulty) {
        return new LabFeedbackDto(vulnerabilityName, summary, whyItWorked, vulnerableCode, secureCode,
                remediationSteps, lessonTakeaway, id, title, difficulty);
    }
}
