package com.sechub.dto;

import java.time.LocalDate;
import java.util.List;

public record PracticeDeckDto(
        LocalDate date,
        List<PracticeCardDto> cards,
        LabDto dailyLab,
        int completedLessonCount
) {}
