package com.sechub.dto;

import jakarta.validation.constraints.NotBlank;

public record FlagSubmissionRequest(
    @NotBlank(message = "Flag không được để trống")
    String flag
) {}
