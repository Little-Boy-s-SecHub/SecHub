package com.sechub.dto;

public record AiGenerateLabRequest(
    String vulnerabilitySlug,
    String difficulty,
    String scenario,
    String language
) {}
