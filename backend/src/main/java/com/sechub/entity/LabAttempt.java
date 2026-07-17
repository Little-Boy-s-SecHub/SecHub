package com.sechub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lab_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_id", nullable = false)
    private Lab lab;

    @Column(name = "container_id", length = 200)
    private String containerId;

    @Column(name = "container_port")
    private Integer containerPort;

    @Column(name = "runtime_token", unique = true, length = 64)
    private String runtimeToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.STARTED;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "extension_count")
    @Builder.Default
    private Integer extensionCount = 0;

    @Column(name = "flag_submitted", length = 500)
    private String flagSubmitted;

    @Column
    @Builder.Default
    private Integer score = 0;

    @Column(name = "hints_used")
    @Builder.Default
    private Integer hintsUsed = 0;

    @Column(name = "mentor_prompted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean mentorPrompted = false;

    public enum Status {
        STARTED, RUNNING, COMPLETED, FAILED, EXPIRED
    }
}
