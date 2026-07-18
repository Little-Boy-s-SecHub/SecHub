package com.sechub.service;

import com.sechub.entity.Lab;
import com.sechub.entity.LabAttempt;
import com.sechub.entity.LearningPath;
import com.sechub.entity.Notification;
import com.sechub.entity.User;
import com.sechub.entity.Vulnerability;
import com.sechub.repository.NotificationRepository;
import com.sechub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    @Mock NotificationRepository notifications;
    @Mock UserRepository users;

    NotificationService service;
    User user;
    Lab lab;
    LabAttempt attempt;

    @BeforeEach
    void setup() {
        service = new NotificationService(notifications, users);
        user = User.builder().id(UUID.randomUUID()).username("student").email("s@test.local").notificationsEnabled(true).build();
        Vulnerability vulnerability = Vulnerability.builder().id(UUID.randomUUID()).slug("sql-injection").name("SQL Injection").build();
        lab = Lab.builder().id(UUID.randomUUID()).vulnerability(vulnerability).title("SQLi Basics")
                .difficulty(LearningPath.Difficulty.BEGINNER).build();
        attempt = LabAttempt.builder().id(UUID.randomUUID()).user(user).lab(lab)
                .status(LabAttempt.Status.COMPLETED).score(100).build();
    }

    @Test
    void disabledUsersDoNotReceiveNotifications() {
        user.setNotificationsEnabled(false);
        when(users.findByUsername("student")).thenReturn(Optional.of(user));

        assertThat(service.list("student")).isEmpty();
        assertThat(service.notifyLabCompleted(attempt)).isEmpty();
        verify(notifications, never()).save(any());
    }

    @Test
    void completedLabNotificationIsCreatedForEnabledUsers() {
        when(notifications.existsByUserIdAndTypeAndSourceKey(
                user.getId(), Notification.Type.LAB_COMPLETED, attempt.getId().toString())).thenReturn(false);
        when(notifications.save(any())).thenAnswer(invocation -> {
            Notification notification = invocation.getArgument(0);
            notification.setId(UUID.randomUUID());
            return notification;
        });

        var result = service.notifyLabCompleted(attempt);

        assertThat(result).isPresent();
        assertThat(result.get().type()).isEqualTo("LAB_COMPLETED");
        assertThat(result.get().message()).contains("SQLi Basics").contains("100 XP");
    }
}
