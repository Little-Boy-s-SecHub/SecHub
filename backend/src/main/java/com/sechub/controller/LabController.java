package com.sechub.controller;

import com.sechub.dto.*;
import com.sechub.service.LabService;
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
    public ResponseEntity<ApiResponse<List<LabDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(labService.getAllLabs()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LabDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(labService.getById(id)));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<LabAttemptDto>> startLab(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.startLab(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu phiên thực hành", attempt));
    }

    @PostMapping("/attempts/{attemptId}/stop")
    public ResponseEntity<ApiResponse<LabAttemptDto>> stopLab(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.stopLab(attemptId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã dừng phiên thực hành", attempt));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<ApiResponse<LabAttemptDto>> submitFlag(
            @PathVariable UUID attemptId,
            @Valid @RequestBody FlagSubmissionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.submitFlag(attemptId, request.flag(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Chúc mừng! Flag chính xác!", attempt));
    }

    @PostMapping("/attempts/{attemptId}/hint")
    public ResponseEntity<ApiResponse<LabAttemptDto>> useHint(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LabAttemptDto attempt = labService.useHint(attemptId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã sử dụng gợi ý", attempt));
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
