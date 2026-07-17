package com.sechub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_learning_state", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserLearningState {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "lesson_id") private Lesson lesson;
    @Builder.Default @Column(name = "scroll_progress", nullable = false) private Integer scrollProgress = 0;
    @Builder.Default @Column(name = "scroll_y", nullable = false) private Integer scrollY = 0;
    @Builder.Default @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt = LocalDateTime.now();
}
