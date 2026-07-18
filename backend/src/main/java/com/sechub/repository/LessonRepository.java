package com.sechub.repository;

import com.sechub.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByLearningPathIdOrderBySortOrderAsc(UUID pathId);

    List<Lesson> findByVulnerabilityIdOrderBySortOrderAsc(UUID vulnerabilityId);

    Optional<Lesson> findByTitleAndLearningPathId(String title, UUID pathId);

    @Query("""
        select l from Lesson l
        join fetch l.vulnerability v
        join fetch l.learningPath
        where lower(v.name) = lower(:skill) or lower(v.slug) = lower(:skill)
        order by l.sortOrder asc
        """)
    List<Lesson> findByVulnerabilityNameOrSlug(@Param("skill") String skill);
}
