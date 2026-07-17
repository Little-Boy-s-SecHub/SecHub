package com.sechub.dto;
import java.time.LocalDateTime;
public record FlashcardReviewResult(boolean correct, String correctAnswer, String explanation, LocalDateTime nextReviewAt) {}
