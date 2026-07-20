package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.SyncLessonDto;
import com.sechub.support.LocaleHolder;
import com.sechub.service.LessonDataSourceService;
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
    private final LessonDataSourceService lessonDataSourceService;

    @Value("${app.sync.token:sechub-data-sync-token-super-secret}")
    private String syncToken;

    public SyncController(LessonSyncService lessonSyncService,
                          LessonDataSourceService lessonDataSourceService) {
        this.lessonSyncService = lessonSyncService;
        this.lessonDataSourceService = lessonDataSourceService;
    }

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<String>> syncLessons(
            @RequestHeader(value = "X-Sync-Token", required = false) String xSyncToken,
            @RequestBody List<SyncLessonDto> lessons) {

        ResponseEntity<ApiResponse<String>> unauthorizedResponse = validateSyncToken(xSyncToken);
        if (unauthorizedResponse != null) {
            return unauthorizedResponse;
        }

        try {
            lessonSyncService.syncLessons(lessons);
            return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn() ? "Lesson synchronization successful!" : "Đồng bộ danh sách bài học thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error((LocaleHolder.isEn() ? "Data synchronization error: " : "Lỗi đồng bộ dữ liệu: ") + e.getMessage()));
        }
    }

    @PostMapping("/lessons/github")
    public ResponseEntity<ApiResponse<String>> syncLessonsFromGithub(
            @RequestHeader(value = "X-Sync-Token", required = false) String xSyncToken) {

        ResponseEntity<ApiResponse<String>> unauthorizedResponse = validateSyncToken(xSyncToken);
        if (unauthorizedResponse != null) {
            return unauthorizedResponse;
        }

        try {
            List<SyncLessonDto> lessons = lessonDataSourceService.fetchLessons();
            lessonSyncService.syncLessons(lessons);
            return ResponseEntity.ok(ApiResponse.success(
                    LocaleHolder.isEn()
                            ? "Successfully synced " + lessons.size() + " lessons from GitHub!"
                            : "Đồng bộ " + lessons.size() + " bài học từ GitHub thành công!"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error((LocaleHolder.isEn() ? "GitHub data synchronization error: " : "Lỗi đồng bộ dữ liệu từ GitHub: ") + e.getMessage()));
        }
    }

    private ResponseEntity<ApiResponse<String>> validateSyncToken(String xSyncToken) {
        if (xSyncToken == null || !xSyncToken.equals(syncToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(LocaleHolder.isEn() ? "Invalid sync authentication code." : "Mã xác thực đồng bộ không hợp lệ."));
        }
        return null;
    }
}
