package com.sechub.controller;

import com.sechub.dto.AiGenerateLabRequest;
import com.sechub.dto.ApiResponse;
import com.sechub.dto.LabDto;
import com.sechub.entity.Lab;
import com.sechub.service.OpenAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final OpenAiService openAiService;

    public AiController(OpenAiService openAiService) {
        this.openAiService = openAiService;
    }

    @PostMapping("/generate-lab")
    public ResponseEntity<ApiResponse<LabDto>> generateLab(
            @RequestHeader(value = "X-OpenAI-Key", required = false) String xOpenAiKey,
            @RequestBody AiGenerateLabRequest request) {
        
        Lab generatedLab = openAiService.generateAndSaveLab(
                request.vulnerabilitySlug(),
                request.difficulty(),
                request.scenario(),
                xOpenAiKey
        );

        return ResponseEntity.ok(ApiResponse.success(LabDto.fromEntity(generatedLab)));
    }
}
