package com.sechub.dto;

import jakarta.validation.constraints.NotBlank;

public record FlagSubmissionRequest(
    @NotBlank(message = "Flag must not be empty")
    String flag
) {}
