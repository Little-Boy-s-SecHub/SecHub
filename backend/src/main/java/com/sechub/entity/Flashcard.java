package com.sechub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcards", indexes = {
    @Index(name = "idx_flashcard_user_review", columnList = "user_id,next_review_at"),
    @Index(name = "idx_flashcard_user_last_review", columnList = "user_id,last_reviewed_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Flashcard {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;
    @Column(nullable = false, length = 30) private String type;
    @Column(nullable = false, columnDefinition = "TEXT") private String question;
    @Column(columnDefinition = "TEXT") private String code;
    @Column(name = "choices_json", columnDefinition = "TEXT") private String choicesJson;
    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT") private String correctAnswer;
    @Column(nullable = false, columnDefinition = "TEXT") private String explanation;
    @Column(name = "vulnerability_slug", length = 80) private String vulnerabilitySlug;
    @Column(name = "source_model", length = 80) private String sourceModel;
    @Column(name = "next_review_at", nullable = false) private LocalDateTime nextReviewAt;
    @Builder.Default @Column(name = "interval_days", nullable = false) private Integer intervalDays = 0;
    @Builder.Default @Column(nullable = false) private Integer repetitions = 0;
    @Builder.Default @Column(name = "correct_count", nullable = false) private Integer correctCount = 0;
    @Builder.Default @Column(name = "wrong_count", nullable = false) private Integer wrongCount = 0;
    @Builder.Default @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "last_reviewed_at") private LocalDateTime lastReviewedAt;
}
