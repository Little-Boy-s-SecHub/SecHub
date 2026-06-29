package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.DashboardDto;
import com.sechub.dto.UserDto;
import com.sechub.service.UserService;
import com.sechub.service.ActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final ActivityService activityService;

    public UserController(UserService userService, ActivityService activityService) {
        this.userService = userService;
        this.activityService = activityService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserDto user = userService.getUserByUsername(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<ApiResponse<DashboardDto>> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        DashboardDto dashboard = userService.getDashboard(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @GetMapping("/me/activities")
    public ResponseEntity<ApiResponse<List<com.sechub.dto.UserActivityDto>>> getMyActivities(
            @AuthenticationPrincipal UserDetails userDetails) {
        com.sechub.entity.User user = userService.findByUsername(userDetails.getUsername());
        List<com.sechub.dto.UserActivityDto> activities = activityService.getRecentActivities(user.getId())
                .stream()
                .map(a -> new com.sechub.dto.UserActivityDto(a.getActivityDate().toString(), a.getCount()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
