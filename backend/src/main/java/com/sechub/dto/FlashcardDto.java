package com.sechub.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.entity.Flashcard;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record FlashcardDto(UUID id, UUID lessonId, String lessonTitle, String type, String question,
        String code, List<String> choices, String explanation, String vulnerabilitySlug,
        LocalDateTime nextReviewAt, int repetitions, int correctCount, int wrongCount) {
    public static FlashcardDto fromEntity(Flashcard card, ObjectMapper mapper, boolean reveal) {
        try {
            List<String> choices = card.getChoicesJson() == null ? List.of() :
                    mapper.readValue(card.getChoicesJson(), new TypeReference<>() {});
            return new FlashcardDto(card.getId(), card.getLesson().getId(), card.getLesson().getTitle(),
                    card.getType(), card.getQuestion(), card.getCode(), choices,
                    reveal ? card.getExplanation() : null, card.getVulnerabilitySlug(), card.getNextReviewAt(),
                    card.getRepetitions(), card.getCorrectCount(), card.getWrongCount());
        } catch (Exception e) { throw new IllegalStateException("Flashcard data invalid", e); }
    }
}
