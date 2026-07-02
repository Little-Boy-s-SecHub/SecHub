package com.sechub.service;

import com.sechub.dto.SyncLessonDto;
import com.sechub.entity.LearningPath;
import com.sechub.entity.Lesson;
import com.sechub.entity.Vulnerability;
import com.sechub.repository.LearningPathRepository;
import com.sechub.repository.LessonRepository;
import com.sechub.repository.UserProgressRepository;
import com.sechub.repository.VulnerabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LessonSyncServiceTest {

    @Mock
    private LearningPathRepository learningPathRepository;

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private UserProgressRepository userProgressRepository;

    @InjectMocks
    private LessonSyncServiceImpl lessonSyncService;

    private LearningPath beginnerPath;
    private Vulnerability sqliVuln;
    private UUID pathId;

    @BeforeEach
    void setUp() {
        pathId = UUID.randomUUID();
        beginnerPath = LearningPath.builder()
                .id(pathId)
                .title("Nhập môn Bảo mật Web")
                .difficulty(LearningPath.Difficulty.BEGINNER)
                .build();

        sqliVuln = Vulnerability.builder()
                .id(UUID.randomUUID())
                .slug("sql-injection")
                .name("SQL Injection")
                .build();
    }

    @Test
    void testSyncLessons_Success_NewLesson() {
        // Arrange
        SyncLessonDto dto = new SyncLessonDto(
                "BEGINNER",
                "sql-injection",
                "SQL Injection Basic",
                1,
                "# Intro to SQLi"
        );

        when(lessonRepository.findAll()).thenReturn(new ArrayList<>());
        when(learningPathRepository.findByDifficulty(LearningPath.Difficulty.BEGINNER))
                .thenReturn(List.of(beginnerPath));
        when(vulnerabilityRepository.findBySlug("sql-injection"))
                .thenReturn(Optional.of(sqliVuln));
        when(lessonRepository.findByTitleAndLearningPathId("SQL Injection Basic", pathId))
                .thenReturn(Optional.empty());
        
        Lesson savedLesson = Lesson.builder()
                .id(UUID.randomUUID())
                .title("SQL Injection Basic")
                .learningPath(beginnerPath)
                .vulnerability(sqliVuln)
                .contentMarkdown("# Intro to SQLi")
                .sortOrder(1)
                .build();
        when(lessonRepository.save(any(Lesson.class))).thenReturn(savedLesson);

        // Act
        assertDoesNotThrow(() -> lessonSyncService.syncLessons(List.of(dto)));

        // Assert
        verify(lessonRepository, times(1)).save(any(Lesson.class));
        verify(lessonRepository, never()).delete(any(Lesson.class));
    }

    @Test
    void testSyncLessons_Success_UpdateExistingLesson() {
        // Arrange
        SyncLessonDto dto = new SyncLessonDto(
                "BEGINNER",
                "",
                "Existing Lesson",
                2,
                "# Updated Content"
        );

        Lesson existingLesson = Lesson.builder()
                .id(UUID.randomUUID())
                .title("Existing Lesson")
                .learningPath(beginnerPath)
                .contentMarkdown("# Old Content")
                .sortOrder(1)
                .build();

        when(lessonRepository.findAll()).thenReturn(List.of(existingLesson));
        when(learningPathRepository.findByDifficulty(LearningPath.Difficulty.BEGINNER))
                .thenReturn(List.of(beginnerPath));
        when(lessonRepository.findByTitleAndLearningPathId("Existing Lesson", pathId))
                .thenReturn(Optional.of(existingLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(existingLesson);

        // Act
        assertDoesNotThrow(() -> lessonSyncService.syncLessons(List.of(dto)));

        // Assert
        assertEquals("# Updated Content", existingLesson.getContentMarkdown());
        assertEquals(2, existingLesson.getSortOrder());
        verify(lessonRepository, times(1)).save(existingLesson);
        verify(lessonRepository, never()).delete(any(Lesson.class));
    }

    @Test
    void testSyncLessons_OrphanCleanup() {
        // Arrange
        SyncLessonDto dto = new SyncLessonDto(
                "BEGINNER",
                "",
                "Kept Lesson",
                1,
                "# Kept Content"
        );

        UUID keptLessonId = UUID.randomUUID();
        Lesson keptLesson = Lesson.builder()
                .id(keptLessonId)
                .title("Kept Lesson")
                .learningPath(beginnerPath)
                .build();

        UUID orphanLessonId = UUID.randomUUID();
        Lesson orphanLesson = Lesson.builder()
                .id(orphanLessonId)
                .title("Orphaned Lesson")
                .learningPath(beginnerPath)
                .build();

        when(lessonRepository.findAll()).thenReturn(List.of(keptLesson, orphanLesson));
        when(learningPathRepository.findByDifficulty(LearningPath.Difficulty.BEGINNER))
                .thenReturn(List.of(beginnerPath));
        when(lessonRepository.findByTitleAndLearningPathId("Kept Lesson", pathId))
                .thenReturn(Optional.of(keptLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(keptLesson);

        // Act
        assertDoesNotThrow(() -> lessonSyncService.syncLessons(List.of(dto)));

        // Assert
        verify(userProgressRepository, times(1)).deleteByLessonId(orphanLessonId);
        verify(lessonRepository, times(1)).delete(orphanLesson);
        verify(userProgressRepository, never()).deleteByLessonId(keptLessonId);
    }

    @Test
    void testSyncLessons_InvalidDifficulty() {
        // Arrange
        SyncLessonDto dto = new SyncLessonDto(
                "INVALID_DIFF",
                "",
                "Title",
                1,
                "Content"
        );

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
                lessonSyncService.syncLessons(List.of(dto))
        );
        assertTrue(exception.getMessage().contains("Invalid learningPathDifficulty value"));
    }

    @Test
    void testSyncLessons_LearningPathNotFound() {
        // Arrange
        SyncLessonDto dto = new SyncLessonDto(
                "BEGINNER",
                "",
                "Title",
                1,
                "Content"
        );

        when(learningPathRepository.findByDifficulty(LearningPath.Difficulty.BEGINNER))
                .thenReturn(Collections.emptyList());

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
                lessonSyncService.syncLessons(List.of(dto))
        );
        assertTrue(exception.getMessage().contains("No Learning Path found for difficulty"));
    }

    @Test
    void testSyncLessons_VulnerabilityNotFound() {
        // Arrange
        SyncLessonDto dto = new SyncLessonDto(
                "BEGINNER",
                "invalid-slug",
                "Title",
                1,
                "Content"
        );

        when(learningPathRepository.findByDifficulty(LearningPath.Difficulty.BEGINNER))
                .thenReturn(List.of(beginnerPath));
        when(vulnerabilityRepository.findBySlug("invalid-slug"))
                .thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
                lessonSyncService.syncLessons(List.of(dto))
        );
        assertTrue(exception.getMessage().contains("Vulnerability not found for slug"));
    }
}
