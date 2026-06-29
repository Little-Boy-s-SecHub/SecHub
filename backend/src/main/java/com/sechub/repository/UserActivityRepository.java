package com.sechub.repository;

import com.sechub.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, UUID> {

    Optional<UserActivity> findByUserIdAndActivityDate(UUID userId, LocalDate date);

    List<UserActivity> findByUserIdAndActivityDateAfter(UUID userId, LocalDate date);
}
