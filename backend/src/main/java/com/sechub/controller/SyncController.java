package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.SyncLessonDto;
import com.sechub.service.LessonSyncService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final LessonSyncService lessonSyncService;

    @Value("${app.sync.token:sechub-data-sync-token-super-secret}")
    private String syncToken;

    public SyncController(LessonSyncService lessonSyncService) {
        this.lessonSyncService = lessonSyncService;
    }

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<String>> syncLessons(
            @RequestHeader(value = "X-Sync-Token", required = false) String xSyncToken,
            @RequestBody List<SyncLessonDto> lessons) {

        if (xSyncToken == null || !xSyncToken.equals(syncToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Mã xác thực đồng bộ không hợp lệ."));
        }

        try {
            lessonSyncService.syncLessons(lessons);
            return ResponseEntity.ok(ApiResponse.success("Đồng bộ danh sách bài học thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi đồng bộ dữ liệu: " + e.getMessage()));
        }
    }
}
