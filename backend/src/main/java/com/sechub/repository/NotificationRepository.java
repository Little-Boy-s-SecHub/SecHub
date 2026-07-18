package com.sechub.repository;

import com.sechub.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByUserIdAndReadAtIsNull(UUID userId);

    List<Notification> findByUserIdAndIdIn(UUID userId, List<UUID> ids);

    long countByUserIdAndReadAtIsNull(UUID userId);

    boolean existsByUserIdAndTypeAndSourceKey(UUID userId, Notification.Type type, String sourceKey);
}
