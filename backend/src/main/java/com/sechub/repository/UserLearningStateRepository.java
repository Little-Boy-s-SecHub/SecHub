package com.sechub.repository;
import com.sechub.entity.UserLearningState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface UserLearningStateRepository extends JpaRepository<UserLearningState, UUID> {
    Optional<UserLearningState> findByUserId(UUID userId);
}
