package com.sechub.service;

import com.sechub.dto.DashboardDto;
import com.sechub.dto.UserDto;
import com.sechub.entity.User;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final LabRepository labRepository;
    private final UserProgressRepository progressRepository;
    private final LabAttemptRepository labAttemptRepository;

    public UserService(UserRepository userRepository,
                       LessonRepository lessonRepository,
                       LabRepository labRepository,
                       UserProgressRepository progressRepository,
                       LabAttemptRepository labAttemptRepository) {
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.labRepository = labRepository;
        this.progressRepository = progressRepository;
        this.labAttemptRepository = labAttemptRepository;
    }

    @Transactional(readOnly = true)
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));
        return UserDto.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", id));
        return UserDto.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardDto getDashboard(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        long completedLessons = progressRepository.countCompletedByUserId(user.getId());
        long totalLessons = lessonRepository.count();
        long completedLabs = labAttemptRepository.countCompletedLabsByUserId(user.getId());
        long totalLabs = labRepository.count();
        int totalScore = labAttemptRepository.getTotalScoreByUserId(user.getId());

        double progressPercentage = totalLessons > 0
                ? (double) completedLessons / totalLessons * 100
                : 0;

        return new DashboardDto(
                user.getId(),
                user.getUsername(),
                completedLessons,
                totalLessons,
                completedLabs,
                totalLabs,
                totalScore,
                Math.round(progressPercentage * 100.0) / 100.0
        );
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));
    }
}
