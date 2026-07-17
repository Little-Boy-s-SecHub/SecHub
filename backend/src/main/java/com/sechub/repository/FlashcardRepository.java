package com.sechub.repository;

import com.sechub.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {
    List<Flashcard> findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(UUID userId, LocalDateTime now);
    boolean existsByUserIdAndLessonId(UUID userId, UUID lessonId);
    long countByUserId(UUID userId);
    long countByUserIdAndNextReviewAtLessThanEqual(UUID userId, LocalDateTime now);
    long countByUserIdAndLastReviewedAtAfter(UUID userId, LocalDateTime since);
}
