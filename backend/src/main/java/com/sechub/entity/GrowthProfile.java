package com.sechub.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Table(name="growth_profiles", uniqueConstraints=@UniqueConstraint(columnNames="user_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GrowthProfile {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="assessment_completed",nullable=false) @Builder.Default private Boolean assessmentCompleted=false;
    @Column(name="assessment_score",nullable=false) @Builder.Default private Integer assessmentScore=0;
    @Column(name="recommended_track",length=30) private String recommendedTrack;
    @Column(name="freeze_tickets",nullable=false) @Builder.Default private Integer freezeTickets=1;
    @Column(name="last_freeze_date") private LocalDate lastFreezeDate;
    @Column(name="updated_at",nullable=false) @Builder.Default private LocalDateTime updatedAt=LocalDateTime.now();
}
