package com.sechub.controller;

import com.sechub.dto.*;
import com.sechub.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/review")
public class ReviewController {
    private final ReviewService service;
    public ReviewController(ReviewService service) { this.service = service; }
    @GetMapping public ResponseEntity<ApiResponse<ReviewDashboardDto>> dashboard(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.success(service.dashboard(user.getUsername())));
    }
    @PostMapping("/{id}/answer") public ResponseEntity<ApiResponse<FlashcardReviewResult>> answer(
            @PathVariable UUID id, @RequestBody FlashcardReviewRequest request, @AuthenticationPrincipal UserDetails user,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        return ResponseEntity.ok(ApiResponse.success(service.review(id, request, user.getUsername(), lang)));
    }
    @PostMapping("/daily-lab") public ResponseEntity<ApiResponse<LabDto>> dailyLab(@AuthenticationPrincipal UserDetails user,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        return ResponseEntity.ok(ApiResponse.success(service.dailyLab(user.getUsername(), lang)));
    }
}
