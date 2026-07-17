package com.sechub.service;

import com.sechub.entity.LabAttempt;
import com.sechub.repository.LabAttemptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class LabAttemptRecovery {
    private static final Logger log = LoggerFactory.getLogger(LabAttemptRecovery.class);
    private final LabAttemptRepository repository;

    public LabAttemptRecovery(LabAttemptRepository repository) {
        this.repository = repository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void expireInterruptedAttempts() {
        List<LabAttempt> interrupted = repository.findAll().stream()
                .filter(attempt -> attempt.getStatus() == LabAttempt.Status.RUNNING
                        || attempt.getStatus() == LabAttempt.Status.STARTED)
                .toList();
        for (LabAttempt attempt : interrupted) {
            attempt.setStatus(LabAttempt.Status.EXPIRED);
            attempt.setCompletedAt(LocalDateTime.now());
        }
        if (!interrupted.isEmpty()) {
            repository.saveAll(interrupted);
            log.info("Marked {} interrupted lab attempt(s) as expired", interrupted.size());
        }
    }
}
