package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.UserProgressDto;
import com.sechub.service.ProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserProgressDto>>> getMyProgress(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                progressService.getUserProgress(userDetails.getUsername())));
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public ResponseEntity<ApiResponse<UserProgressDto>> markComplete(
            @PathVariable UUID lessonId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProgressDto progress = progressService.markLessonComplete(lessonId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành bài học", progress));
    }

    @GetMapping("/paths/{pathId}")
    public ResponseEntity<ApiResponse<List<UserProgressDto>>> getPathProgress(
            @PathVariable UUID pathId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                progressService.getProgressByPath(pathId, userDetails.getUsername())));
    }
}
