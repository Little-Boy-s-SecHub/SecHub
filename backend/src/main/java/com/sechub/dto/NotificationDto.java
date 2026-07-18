package com.sechub.dto;

import com.sechub.entity.Notification;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String type,
        String title,
        String message,
        String actionUrl,
        boolean read,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
    public static NotificationDto fromEntity(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getActionUrl(),
                notification.getReadAt() != null,
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
