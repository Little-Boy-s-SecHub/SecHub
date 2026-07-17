package com.sechub.dto;
import java.util.List;
public record PublicProfileDto(String username,int xp,int level,String levelTitle,int completedLabs,
        List<GrowthOverviewDto.SkillDto> skills,List<String> badges,String shareText){}
