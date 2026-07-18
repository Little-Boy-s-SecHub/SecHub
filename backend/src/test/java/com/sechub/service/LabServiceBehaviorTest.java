package com.sechub.service;

import com.sechub.dto.LabAttemptDto;
import com.sechub.entity.*;
import com.sechub.exception.BadRequestException;
import com.sechub.repository.LabAttemptRepository;
import com.sechub.repository.LabRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LabServiceBehaviorTest {
    @Mock LabRepository labs; @Mock LabAttemptRepository attempts; @Mock UserService users;
    @Mock DockerService docker; @Mock ActivityService activity; @Mock LabArtifactService artifacts;
    @Mock NotificationService notifications;
    LabService service; User user; Lab lab; LabAttempt attempt;

    @BeforeEach void setup() {
        service=new LabService(labs,attempts,users,docker,activity,artifacts,notifications);
        user=User.builder().id(UUID.randomUUID()).username("student").email("s@test.local").build();
        Vulnerability vulnerability=Vulnerability.builder().id(UUID.randomUUID()).slug("sql-injection").name("SQL Injection").build();
        lab=Lab.builder().id(UUID.randomUUID()).vulnerability(vulnerability).title("SQLi").difficulty(LearningPath.Difficulty.BEGINNER)
                .status(LearningPath.PublicationStatus.PUBLISHED).flag("SecHub{ok}").points(100).build();
        attempt=LabAttempt.builder().id(UUID.randomUUID()).user(user).lab(lab).status(LabAttempt.Status.RUNNING)
                .startedAt(LocalDateTime.now().minusMinutes(20)).expiresAt(LocalDateTime.now().plusMinutes(40))
                .containerId("container-1").hintsUsed(0).build();
        lenient().when(attempts.findById(attempt.getId())).thenReturn(Optional.of(attempt));
        lenient().when(attempts.save(any())).thenAnswer(invocation->invocation.getArgument(0));
    }

    @Test void requiresMentorBeforeEveryHint() {
        assertThatThrownBy(()->service.useHint(attempt.getId(),"student"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("AI mentor");
        assertThat(service.getMentorGuidance(attempt.getId(),"student").question()).isNotBlank();
        LabAttemptDto result=service.useHint(attempt.getId(),"student");
        assertThat(result.hintsUsed()).isEqualTo(1);assertThat(attempt.getMentorPrompted()).isFalse();
        assertThatThrownBy(()->service.useHint(attempt.getId(),"student")).isInstanceOf(BadRequestException.class);
    }

    @Test void hintPenaltyIsFivePercentAfterFirstFreeAndNeverBelowHalf() {
        attempt.setHintsUsed(3); LabAttemptDto result=service.submitFlag(attempt.getId()," SecHub{ok} ","student");
        assertThat(result.status()).isEqualTo("COMPLETED");assertThat(result.score()).isEqualTo(90);
        verify(docker).stopContainer("container-1");verify(activity).incrementActivity(user.getId());
        verify(notifications).notifyLabCompleted(attempt);

        LabAttempt manyHints=LabAttempt.builder().id(UUID.randomUUID()).user(user).lab(lab).status(LabAttempt.Status.RUNNING)
                .startedAt(LocalDateTime.now()).expiresAt(LocalDateTime.now().plusHours(1)).hintsUsed(20).build();
        when(attempts.findById(manyHints.getId())).thenReturn(Optional.of(manyHints));
        assertThat(service.submitFlag(manyHints.getId(),"SecHub{ok}","student").score()).isEqualTo(50);
    }

    @Test void rejectsWrongFlagWithoutCompletingAttempt() {
        assertThatThrownBy(()->service.submitFlag(attempt.getId(),"wrong","student"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("không chính xác");
        assertThat(attempt.getStatus()).isEqualTo(LabAttempt.Status.RUNNING);
        verify(docker,never()).stopContainer(any());
    }

    @Test void existingRunningAttemptUsesLabEstimatedMinutes() {
        lab.setEstimatedMinutes(45);
        LocalDateTime started = LocalDateTime.now().minusMinutes(5).withNano(0);
        LabAttempt staleAttempt = LabAttempt.builder().id(UUID.randomUUID()).user(user).lab(lab)
                .status(LabAttempt.Status.RUNNING).startedAt(started).expiresAt(started.plusMinutes(90))
                .containerId("container-old").runtimeToken("runtime-token").hintsUsed(0).build();
        when(labs.findById(lab.getId())).thenReturn(Optional.of(lab));
        when(users.findByUsername("student")).thenReturn(user);
        when(attempts.findFirstByUserIdAndLabIdAndStatus(user.getId(), lab.getId(), LabAttempt.Status.RUNNING))
                .thenReturn(Optional.of(staleAttempt));

        LabAttemptDto result = service.startLab(lab.getId(), "student");

        assertThat(result.expiresAt()).isEqualTo(started.plusMinutes(45));
        assertThat(staleAttempt.getExpiresAt()).isEqualTo(started.plusMinutes(45));
        verify(docker, never()).startContainer(any(), anyInt(), any(), any());
    }

    @Test void listingAttemptsAlsoSyncsRunningAttemptDuration() {
        lab.setEstimatedMinutes(30);
        LocalDateTime started = LocalDateTime.now().minusMinutes(8).withNano(0);
        LabAttempt staleAttempt = LabAttempt.builder().id(UUID.randomUUID()).user(user).lab(lab)
                .status(LabAttempt.Status.RUNNING).startedAt(started).expiresAt(started.plusMinutes(90))
                .containerId("container-old").runtimeToken("runtime-token").hintsUsed(0).build();
        when(users.findByUsername("student")).thenReturn(user);
        when(attempts.findByUserIdAndLabId(user.getId(), lab.getId())).thenReturn(List.of(staleAttempt));

        List<LabAttemptDto> result = service.getLabAttempts(lab.getId(), "student");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).expiresAt()).isEqualTo(started.plusMinutes(30));
        assertThat(staleAttempt.getExpiresAt()).isEqualTo(started.plusMinutes(30));
    }
}
