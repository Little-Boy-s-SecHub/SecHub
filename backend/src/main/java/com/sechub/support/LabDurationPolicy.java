package com.sechub.support;

import com.sechub.entity.Lab;

import java.time.LocalDateTime;

public final class LabDurationPolicy {
    public static final int MIN_LAB_DURATION_MINUTES = 15;
    public static final int MAX_LAB_DURATION_MINUTES = 90;
    public static final int EXTENSION_MINUTES = 30;

    private LabDurationPolicy() {
    }

    public static int sessionMinutes(Lab lab) {
        return sessionMinutes(lab == null ? null : lab.getEstimatedMinutes());
    }

    public static int sessionMinutes(Integer estimatedMinutes) {
        int minutes = estimatedMinutes != null ? estimatedMinutes : 30;
        return Math.max(MIN_LAB_DURATION_MINUTES, Math.min(MAX_LAB_DURATION_MINUTES, minutes));
    }

    public static LocalDateTime expiresAt(LocalDateTime startedAt, Lab lab, Integer extensionCount) {
        LocalDateTime start = startedAt != null ? startedAt : LocalDateTime.now();
        int extensions = Math.max(0, extensionCount == null ? 0 : extensionCount);
        return start.plusMinutes(sessionMinutes(lab) + extensions * EXTENSION_MINUTES);
    }
}
