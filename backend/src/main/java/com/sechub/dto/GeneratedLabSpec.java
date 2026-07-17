package com.sechub.dto;

import java.util.List;

public record GeneratedLabSpec(
        String title,
        String description,
        String scenario,
        List<String> hints,
        Integer estimatedMinutes,
        Integer points
) {}
