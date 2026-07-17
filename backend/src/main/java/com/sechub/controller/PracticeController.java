package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.PracticeDeckDto;
import com.sechub.service.PracticeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @PostMapping("/deck")
    public ResponseEntity<ApiResponse<PracticeDeckDto>> generateDeck(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(practiceService.generateDeck(userDetails.getUsername())));
    }

    @PostMapping("/daily-lab")
    public ResponseEntity<ApiResponse<PracticeDeckDto>> generateDailyLab(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã tạo thử thách hằng ngày từ bài học của bạn",
                practiceService.generateDailyLab(userDetails.getUsername())));
    }
}
