package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.LearningPathDto;
import com.sechub.dto.LessonDto;
import com.sechub.service.LearningPathService;
import com.sechub.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning-paths")
public class LearningPathController {

    private final LearningPathService learningPathService;
    private final LessonService lessonService;

    public LearningPathController(LearningPathService learningPathService, LessonService lessonService) {
        this.learningPathService = learningPathService;
        this.lessonService = lessonService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LearningPathDto>>> getAll(
            @RequestParam(required = false) String difficulty) {
        List<LearningPathDto> paths;
        if (difficulty != null && !difficulty.isBlank()) {
            paths = learningPathService.getByDifficulty(difficulty);
        } else {
            paths = learningPathService.getAllPaths();
        }
        return ResponseEntity.ok(ApiResponse.success(paths));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LearningPathDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(learningPathService.getById(id)));
    }

    @GetMapping("/{id}/lessons")
    public ResponseEntity<ApiResponse<List<LessonDto>>> getLessons(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(lessonService.getByPathId(id)));
    }
}
