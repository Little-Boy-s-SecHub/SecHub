package com.sechub.repository;

import com.sechub.entity.LabAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LabAttemptRepository extends JpaRepository<LabAttempt, UUID> {

    List<LabAttempt> findByUserIdOrderByStartedAtDesc(UUID userId);

    List<LabAttempt> findByUserIdAndLabId(UUID userId, UUID labId);

    Optional<LabAttempt> findFirstByUserIdAndLabIdAndStatus(UUID userId, UUID labId, LabAttempt.Status status);

    @Query("SELECT COALESCE(SUM(la.score), 0) FROM LabAttempt la WHERE la.user.id = :userId AND la.status = 'COMPLETED'")
    int getTotalScoreByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(DISTINCT la.lab.id) FROM LabAttempt la WHERE la.user.id = :userId AND la.status = 'COMPLETED'")
    long countCompletedLabsByUserId(@Param("userId") UUID userId);

    List<LabAttempt> findByUserIdAndStatus(UUID userId, LabAttempt.Status status);
}
