package com.sechub.dto;

import java.time.LocalDate;

public record UserActivityDto(
    String date,
    int count
) {}
