package com.sechub.dto;

public record LeaderboardEntryDto(
        String username,
        String track,
        int weeklyXp,
        int labsCompleted,
        int lessonsCompleted,
        String strongestSkill
) {}
