package com.sechub.repository;

import com.sechub.entity.Lab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LabRepository extends JpaRepository<Lab, UUID> {

    List<Lab> findByVulnerabilityId(UUID vulnerabilityId);

    List<Lab> findByDifficulty(com.sechub.entity.LearningPath.Difficulty difficulty);
}
