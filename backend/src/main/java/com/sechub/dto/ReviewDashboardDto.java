package com.sechub.dto;
import java.util.List;
public record ReviewDashboardDto(long dueCount, long totalCards, int completedToday, List<FlashcardDto> cards) {}
