package com.sechub.dto;

public record ChangePasswordRequest(
    String currentPassword,
    String newPassword
) {}
