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
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       LessonRepository lessonRepository,
                       LabRepository labRepository,
                       UserProgressRepository progressRepository,
                       LabAttemptRepository labAttemptRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.labRepository = labRepository;
        this.progressRepository = progressRepository;
        this.labAttemptRepository = labAttemptRepository;
        this.passwordEncoder = passwordEncoder;
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

    @Transactional
    public void changePassword(String username, com.sechub.dto.ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));
        
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new com.sechub.exception.BadRequestException("Mật khẩu hiện tại không đúng");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserDto updateAvatar(String username, String avatarUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));
        
        user.setAvatarUrl(avatarUrl);
        User updated = userRepository.save(user);
        return UserDto.fromEntity(updated);
    }

    @Transactional
    public UserDto updateNotificationPreference(String username, boolean enabled) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        user.setNotificationsEnabled(enabled);
        User updated = userRepository.save(user);
        return UserDto.fromEntity(updated);
    }
}
