package com.sechub.controller;

import com.sechub.dto.ApiResponse;
import com.sechub.dto.NotificationDto;
import com.sechub.dto.NotificationReadRequest;
import com.sechub.service.NotificationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> list(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(service.list(userDetails.getUsername())));
    }

    @PutMapping("/read")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> markRead(@RequestBody(required = false) NotificationReadRequest request,
                                                                       @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(service.markRead(userDetails.getUsername(), request)));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UserDetails userDetails) {
        return service.stream(userDetails.getUsername());
    }
}
