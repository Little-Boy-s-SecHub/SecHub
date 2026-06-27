package com.sechub.entity;

import jakarta.persistence.*;
import lombok.*;

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
}
