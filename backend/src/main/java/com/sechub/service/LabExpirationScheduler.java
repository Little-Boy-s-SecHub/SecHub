package com.sechub.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LabExpirationScheduler {

    private final LabService labService;

    public LabExpirationScheduler(LabService labService) {
        this.labService = labService;
    }

    @Scheduled(fixedDelayString = "${app.lab.expiration-check-ms:30000}")
    public void expireOverdueAttempts() {
        labService.expireOverdueAttempts();
    }
}
