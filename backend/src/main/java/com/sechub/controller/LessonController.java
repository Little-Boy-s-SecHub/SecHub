package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.LessonDto;
import com.sechub.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LessonDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(lessonService.getById(id)));
    }
}
