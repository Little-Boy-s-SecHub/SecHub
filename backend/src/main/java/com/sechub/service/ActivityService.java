package com.sechub.service;

import com.sechub.entity.User;
import com.sechub.entity.UserActivity;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.support.LocaleHolder;
import com.sechub.repository.UserActivityRepository;
import com.sechub.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ActivityService {

    private final UserActivityRepository activityRepository;
    private final UserRepository userRepository;

    public ActivityService(UserActivityRepository activityRepository, UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void incrementActivity(UUID userId) {
        if (userId == null) return;
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(LocaleHolder.isEn() ? "User" : "Người dùng", "id", userId));

        LocalDate today = LocalDate.now();
        UserActivity activity = activityRepository.findByUserIdAndActivityDate(userId, today)
                .orElseGet(() -> UserActivity.builder()
                        .user(user)
                        .activityDate(today)
                        .count(0)
                        .build());

        activity.setCount(activity.getCount() + 1);
        activityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public List<UserActivity> getRecentActivities(UUID userId) {
        LocalDate oneYearAgo = LocalDate.now().minusDays(365);
        return activityRepository.findByUserIdAndActivityDateAfter(userId, oneYearAgo);
    }
}
