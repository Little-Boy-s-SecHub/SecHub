package com.sechub.controller;

import com.sechub.service.LabRuntimeProxyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LabRuntimeProxyController {

    private final LabRuntimeProxyService proxyService;

    public LabRuntimeProxyController(LabRuntimeProxyService proxyService) {
        this.proxyService = proxyService;
    }

    @RequestMapping({"/api/lab-runtime/{token}", "/api/lab-runtime/{token}/**"})
    public ResponseEntity<byte[]> proxy(
            @PathVariable String token,
            @RequestBody(required = false) byte[] body,
            HttpServletRequest request) {
        return proxyService.proxy(token, body == null ? new byte[0] : body, request);
    }
}
