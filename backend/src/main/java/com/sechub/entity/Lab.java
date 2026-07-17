package com.sechub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "labs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lab {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vulnerability_id", nullable = false)
    private Vulnerability vulnerability;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LearningPath.Difficulty difficulty;

    @Column(name = "docker_image", length = 300)
    private String dockerImage;

    @Column(name = "artifact_path", length = 1000)
    private String artifactPath;

    @Column(name = "docker_port")
    private Integer dockerPort;

    @Column(length = 500)
    private String flag;

    @Column(name = "hints_json", columnDefinition = "TEXT")
    private String hintsJson;

    @Column(name = "estimated_minutes")
    @Builder.Default
    private Integer estimatedMinutes = 30;

    @Column
    @Builder.Default
    private Integer points = 100;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'PUBLISHED'")
    @Builder.Default
    private LearningPath.PublicationStatus status = LearningPath.PublicationStatus.PUBLISHED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
