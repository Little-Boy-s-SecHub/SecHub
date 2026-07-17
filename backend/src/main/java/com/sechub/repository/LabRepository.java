package com.sechub.repository;

import com.sechub.entity.Lab;
import com.sechub.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface LabRepository extends JpaRepository<Lab, UUID> {

    List<Lab> findByVulnerabilityId(UUID vulnerabilityId);

    List<Lab> findByDifficulty(com.sechub.entity.LearningPath.Difficulty difficulty);

    Optional<Lab> findFirstByTitle(String title);
    List<Lab> findByStatus(LearningPath.PublicationStatus status);
    List<Lab> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}
