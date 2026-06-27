package com.sechub.service;

import com.sechub.dto.LabAttemptDto;
import com.sechub.dto.LabDto;
import com.sechub.entity.Lab;
import com.sechub.entity.LabAttempt;
import com.sechub.entity.User;
import com.sechub.exception.BadRequestException;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.LabAttemptRepository;
import com.sechub.repository.LabRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class LabService {

    private final LabRepository labRepository;
    private final LabAttemptRepository labAttemptRepository;
    private final UserService userService;

    public LabService(LabRepository labRepository,
                      LabAttemptRepository labAttemptRepository,
                      UserService userService) {
        this.labRepository = labRepository;
        this.labAttemptRepository = labAttemptRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<LabDto> getAllLabs() {
        return labRepository.findAll()
                .stream()
                .map(LabDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public LabDto getById(UUID id) {
        Lab lab = labRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", "id", id));
        return LabDto.fromEntity(lab);
    }

    @Transactional(readOnly = true)
    public List<LabDto> getByVulnerabilityId(UUID vulnerabilityId) {
        return labRepository.findByVulnerabilityId(vulnerabilityId)
                .stream()
                .map(LabDto::fromEntity)
                .toList();
    }

    @Transactional
    public LabAttemptDto startLab(UUID labId, String username) {
        Lab lab = labRepository.findById(labId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", "id", labId));
        User user = userService.findByUsername(username);

        // Check if user already has a running attempt
        var existing = labAttemptRepository.findFirstByUserIdAndLabIdAndStatus(
                user.getId(), labId, LabAttempt.Status.RUNNING);
        if (existing.isPresent()) {
            return LabAttemptDto.fromEntity(existing.get());
        }

        LabAttempt attempt = LabAttempt.builder()
                .user(user)
                .lab(lab)
                .status(LabAttempt.Status.RUNNING)
                .startedAt(LocalDateTime.now())
                .build();

        attempt = labAttemptRepository.save(attempt);
        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto submitFlag(UUID attemptId, String flag, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Bạn không có quyền nộp flag cho phiên thực hành này");
        }

        if (attempt.getStatus() == LabAttempt.Status.COMPLETED) {
            throw new BadRequestException("Phiên thực hành này đã hoàn thành");
        }

        attempt.setFlagSubmitted(flag);

        if (attempt.getLab().getFlag() != null && attempt.getLab().getFlag().equals(flag.trim())) {
            attempt.setStatus(LabAttempt.Status.COMPLETED);
            attempt.setCompletedAt(LocalDateTime.now());

            // Calculate score based on hints used
            int basePoints = attempt.getLab().getPoints();
            int hintPenalty = attempt.getHintsUsed() * (basePoints / 10);
            attempt.setScore(Math.max(basePoints - hintPenalty, basePoints / 4));
        } else {
            throw new BadRequestException("Flag không chính xác. Hãy thử lại!");
        }

        attempt = labAttemptRepository.save(attempt);
        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto useHint(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Bạn không có quyền sử dụng gợi ý cho phiên thực hành này");
        }

        attempt.setHintsUsed(attempt.getHintsUsed() + 1);
        attempt = labAttemptRepository.save(attempt);
        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional(readOnly = true)
    public List<LabAttemptDto> getUserAttempts(String username) {
        User user = userService.findByUsername(username);
        return labAttemptRepository.findByUserIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(LabAttemptDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LabAttemptDto> getLabAttempts(UUID labId, String username) {
        User user = userService.findByUsername(username);
        return labAttemptRepository.findByUserIdAndLabId(user.getId(), labId)
                .stream()
                .map(LabAttemptDto::fromEntity)
                .toList();
    }
}
