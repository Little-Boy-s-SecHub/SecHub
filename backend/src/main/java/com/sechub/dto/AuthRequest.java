package com.sechub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(
    @NotBlank(message = "Username must not be empty")
    String username,

    @NotBlank(message = "Password must not be empty")
    @Size(min = 6, message = "Password must have at least 6 characters")
    String password
) {}
