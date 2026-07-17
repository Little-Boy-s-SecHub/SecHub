package com.sechub.dto;
import java.util.List;
public record GrowthOverviewDto(boolean onboardingRequired, boolean assessmentCompleted, String recommendedTrack, int assessmentScore,
        int xp, int level, int streak, int freezeTickets, String levelTitle,
        List<SkillDto> skills, List<String> badges, MissionDto dailyMission, MissionDto weeklyChallenge,
        WeeklyReportDto weeklyReport, List<String> notifications) {
    public record SkillDto(String slug,String name,int xp,int level,int completedLabs,int averageHints){}
    public record MissionDto(String title,String description,String actionUrl,int minutes,boolean completed){}
    public record WeeklyReportDto(int labsCompleted,int lessonsCompleted,int xpGained,String strongestSkill,String weakSkill,String recommendation){}
}
