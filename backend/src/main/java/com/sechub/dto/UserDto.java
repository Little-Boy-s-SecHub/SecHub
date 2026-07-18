package com.sechub.dto;

import com.sechub.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserDto(
    UUID id,
    String username,
    String email,
    String avatarUrl,
    String role,
    Boolean notificationsEnabled,
    LocalDateTime createdAt
) {
    public static UserDto fromEntity(User user) {
        return new UserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getAvatarUrl(),
            user.getRole().name(),
            !Boolean.FALSE.equals(user.getNotificationsEnabled()),
            user.getCreatedAt()
        );
    }
}
