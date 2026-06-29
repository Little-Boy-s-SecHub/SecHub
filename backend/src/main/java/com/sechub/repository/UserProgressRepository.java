package com.sechub.repository;

import com.sechub.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, UUID> {

    List<UserProgress> findByUserId(UUID userId);

    Optional<UserProgress> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    List<UserProgress> findByUserIdAndCompletedTrue(UUID userId);

    @Query("SELECT COUNT(up) FROM UserProgress up WHERE up.user.id = :userId AND up.completed = true")
    long countCompletedByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(up) FROM UserProgress up WHERE up.user.id = :userId AND up.lesson.learningPath.id = :pathId AND up.completed = true")
    long countCompletedByUserIdAndPathId(@Param("userId") UUID userId, @Param("pathId") UUID pathId);

    void deleteByLessonId(UUID lessonId);
}
