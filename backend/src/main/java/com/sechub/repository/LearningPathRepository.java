package com.sechub.repository;

import com.sechub.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {

    List<LearningPath> findAllByOrderBySortOrderAsc();

    List<LearningPath> findByDifficulty(LearningPath.Difficulty difficulty);
    List<LearningPath> findByStatusOrderBySortOrderAsc(LearningPath.PublicationStatus status);
    List<LearningPath> findByDifficultyAndStatus(LearningPath.Difficulty difficulty, LearningPath.PublicationStatus status);
    List<LearningPath> findByAuthorIdOrderBySortOrderAsc(UUID authorId);
}
