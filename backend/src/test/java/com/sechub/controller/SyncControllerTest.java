package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.SyncLessonDto;
import com.sechub.service.LessonDataSourceService;
import com.sechub.service.LessonSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SyncControllerTest {

    @Mock
    private LessonSyncService lessonSyncService;

    @Mock
    private LessonDataSourceService lessonDataSourceService;

    private SyncController syncController;

    @BeforeEach
    void setUp() {
        syncController = new SyncController(lessonSyncService, lessonDataSourceService);
        ReflectionTestUtils.setField(syncController, "syncToken", "test-secret-token");
    }

    @Test
    void testSyncLessons_Success() {
        // Arrange
        List<SyncLessonDto> payload = List.of(
                new SyncLessonDto("BEGINNER", "sql-injection", "SQL Injection Intro", 1, "# markdown content")
        );
        doNothing().when(lessonSyncService).syncLessons(payload);

        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessons("test-secret-token", payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().success());
        assertEquals("Đồng bộ danh sách bài học thành công!", response.getBody().data());
        verify(lessonSyncService, times(1)).syncLessons(payload);
    }

    @Test
    void testSyncLessons_Unauthorized_MissingHeader() {
        // Arrange
        List<SyncLessonDto> payload = List.of(
                new SyncLessonDto("BEGINNER", "sql-injection", "SQL Injection Intro", 1, "# markdown content")
        );

        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessons(null, payload);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Mã xác thực đồng bộ không hợp lệ.", response.getBody().message());
        verify(lessonSyncService, never()).syncLessons(anyList());
    }

    @Test
    void testSyncLessons_Unauthorized_InvalidToken() {
        // Arrange
        List<SyncLessonDto> payload = List.of(
                new SyncLessonDto("BEGINNER", "sql-injection", "SQL Injection Intro", 1, "# markdown content")
        );

        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessons("wrong-secret-token", payload);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Mã xác thực đồng bộ không hợp lệ.", response.getBody().message());
        verify(lessonSyncService, never()).syncLessons(anyList());
    }

    @Test
    void testSyncLessons_BadRequest_ServiceException() {
        // Arrange
        List<SyncLessonDto> payload = List.of(
                new SyncLessonDto("BEGINNER", "sql-injection", "SQL Injection Intro", 1, "# markdown content")
        );
        doThrow(new IllegalArgumentException("Vulnerability not found for slug"))
                .when(lessonSyncService).syncLessons(payload);

        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessons("test-secret-token", payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Vulnerability not found for slug", response.getBody().message());
        verify(lessonSyncService, times(1)).syncLessons(payload);
    }

    @Test
    void testSyncLessons_InternalServerError_ServiceException() {
        // Arrange
        List<SyncLessonDto> payload = List.of(
                new SyncLessonDto("BEGINNER", "sql-injection", "SQL Injection Intro", 1, "# markdown content")
        );
        doThrow(new RuntimeException("Database connection timeout"))
                .when(lessonSyncService).syncLessons(payload);

        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessons("test-secret-token", payload);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Lỗi đồng bộ dữ liệu: Database connection timeout", response.getBody().message());
        verify(lessonSyncService, times(1)).syncLessons(payload);
    }

    @Test
    void testSyncLessonsFromGithub_Success() {
        // Arrange
        List<SyncLessonDto> payload = List.of(
                new SyncLessonDto("BEGINNER", "sql-injection", "SQL Injection Intro", 1, "# markdown content")
        );
        when(lessonDataSourceService.fetchLessons()).thenReturn(payload);
        doNothing().when(lessonSyncService).syncLessons(payload);

        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessonsFromGithub("test-secret-token");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().success());
        assertEquals("Đồng bộ 1 bài học từ GitHub thành công!", response.getBody().data());
        verify(lessonDataSourceService, times(1)).fetchLessons();
        verify(lessonSyncService, times(1)).syncLessons(payload);
    }

    @Test
    void testSyncLessonsFromGithub_Unauthorized_InvalidToken() {
        // Act
        ResponseEntity<ApiResponse<String>> response = syncController.syncLessonsFromGithub("wrong-secret-token");

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Mã xác thực đồng bộ không hợp lệ.", response.getBody().message());
        verify(lessonDataSourceService, never()).fetchLessons();
        verify(lessonSyncService, never()).syncLessons(anyList());
    }
}
