package com.sechub.controller;

import com.sechub.dto.*;
import com.sechub.service.AuthorService;
import com.sechub.support.LocaleHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/author")
public class AuthorController {
    private final AuthorService service;
    public AuthorController(AuthorService service){this.service=service;}
    @GetMapping public ResponseEntity<ApiResponse<AuthorWorkspaceDto>> workspace(@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.workspace(u.getUsername())));}
    @PostMapping("/paths") public ResponseEntity<ApiResponse<LearningPathDto>> createPath(@RequestBody AuthorPathRequest r,@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.createPath(u.getUsername(),r)));}
    @PostMapping("/paths/{id}/lessons") public ResponseEntity<ApiResponse<LessonDto>> addLesson(@PathVariable UUID id,@RequestBody AuthorLessonRequest r,@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.addLesson(u.getUsername(),id,r)));}
    @PostMapping("/paths/{id}/publish") public ResponseEntity<ApiResponse<Void>> publishPath(@PathVariable UUID id,@AuthenticationPrincipal UserDetails u){service.publishPath(u.getUsername(),id);return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn()?"Path published":"Đã xuất bản lộ trình",null));}
    @PostMapping("/labs") public ResponseEntity<ApiResponse<LabDto>> createLab(@RequestBody AuthorLabRequest r,@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.createChallenge(u.getUsername(),r)));}
    @PostMapping("/labs/{id}/publish") public ResponseEntity<ApiResponse<Void>> publishLab(@PathVariable UUID id,@AuthenticationPrincipal UserDetails u){service.publishLab(u.getUsername(),id);return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn()?"Challenge published":"Đã xuất bản challenge",null));}
    @DeleteMapping("/paths/{id}") public ResponseEntity<ApiResponse<Void>> deletePath(@PathVariable UUID id,@AuthenticationPrincipal UserDetails u){service.deletePath(u.getUsername(),id);return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn()?"Draft deleted":"Đã xoá bản nháp",null));}
    @DeleteMapping("/labs/{id}") public ResponseEntity<ApiResponse<Void>> deleteLab(@PathVariable UUID id,@AuthenticationPrincipal UserDetails u){service.deleteLab(u.getUsername(),id);return ResponseEntity.ok(ApiResponse.success(LocaleHolder.isEn()?"Challenge draft deleted":"Đã xoá challenge nháp",null));}
}
