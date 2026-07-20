package com.sechub.controller;

import com.sechub.dto.*;
import com.sechub.service.LabService;
import com.sechub.support.LocaleHolder;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/labs")
public class LabController {

    private final LabService labService;

    public LabController(LabService labService) {
        this.labService = labService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LabDto>>> getAll(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(labService.getAllLabs(username)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LabDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(labService.getById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGeneratedLab(@PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        labService.deleteGeneratedLab(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "AI lab deleted" : "Đã xoá bài lab AI", null));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<LabAttemptDto>> startLab(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.startLab(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "Lab session started" : "Bắt đầu phiên thực hành", attempt));
    }

    @PostMapping("/attempts/{attemptId}/stop")
    public ResponseEntity<ApiResponse<LabAttemptDto>> stopLab(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.stopLab(attemptId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "Lab session stopped" : "Đã dừng phiên thực hành", attempt));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<ApiResponse<LabAttemptDto>> submitFlag(
            @PathVariable UUID attemptId,
            @Valid @RequestBody FlagSubmissionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.submitFlag(attemptId, request.flag(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "Congratulations! Correct flag!" : "Chúc mừng! Flag chính xác!", attempt));
    }

    @PostMapping("/attempts/{attemptId}/hint")
    public ResponseEntity<ApiResponse<LabAttemptDto>> useHint(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.useHint(attemptId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "Hint used" : "Đã sử dụng gợi ý", attempt));
    }

    @GetMapping("/attempts/{attemptId}/mentor")
    public ResponseEntity<ApiResponse<MentorGuidanceDto>> getMentorGuidance(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(labService.getMentorGuidance(attemptId, userDetails.getUsername())));
    }

    @PostMapping("/attempts/{attemptId}/extend")
    public ResponseEntity<ApiResponse<LabAttemptDto>> extendLab(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.extendLab(attemptId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "Extended by 30 minutes" : "Đã gia hạn thêm 30 phút", attempt));
    }

    @GetMapping("/attempts/{attemptId}/feedback")
    public ResponseEntity<ApiResponse<LabFeedbackDto>> getFeedback(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(labService.getCompletionFeedback(attemptId, userDetails.getUsername())));
    }

    @GetMapping("/attempts/me")
    public ResponseEntity<ApiResponse<List<LabAttemptDto>>> getMyAttempts(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(labService.getUserAttempts(userDetails.getUsername())));
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<ApiResponse<List<LabAttemptDto>>> getLabAttempts(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabAttempts(id, userDetails.getUsername())));
    }
}
