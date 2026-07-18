package com.sechub.controller;

import com.sechub.dto.AiGenerateLabRequest;
import com.sechub.dto.ApiResponse;
import com.sechub.dto.LabDto;
import com.sechub.entity.Lab;
import com.sechub.service.OpenAiService;
import com.sechub.entity.GrowthProfile;
import com.sechub.entity.User;
import com.sechub.repository.GrowthProfileRepository;
import com.sechub.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final OpenAiService openAiService;
    private final UserService userService;
    private final GrowthProfileRepository growthProfiles;

    public AiController(OpenAiService openAiService, UserService userService, GrowthProfileRepository growthProfiles) {
        this.openAiService = openAiService;
        this.userService = userService;
        this.growthProfiles = growthProfiles;
    }

    @PostMapping("/generate-lab")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<LabDto>> generateLab(@RequestBody AiGenerateLabRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userService.findByUsername(principal.getUsername());
        String track = growthProfiles.findByUserId(user.getId()).map(GrowthProfile::getRecommendedTrack).orElse("BEGINNER");
        String adaptiveDifficulty = adaptiveDifficulty(request.difficulty(), track);
        String adaptiveScenario = (request.scenario() == null ? "" : request.scenario()) + "\nLEARNER TRACK: " + track
                + "\nADAPTATION: Điều chỉnh số bước, độ rõ của dữ liệu và mức trực tiếp của gợi ý theo trình độ này.";
        Lab generatedLab = openAiService.generateAndSaveLab(
                request.vulnerabilitySlug(),
                adaptiveDifficulty,
                adaptiveScenario
        );
        generatedLab.setAuthor(user);
        generatedLab = openAiService.saveGeneratedLab(generatedLab);

        return ResponseEntity.ok(ApiResponse.success(LabDto.fromEntity(generatedLab)));
    }

    private String adaptiveDifficulty(String requested, String track) {
        int requestedLevel = switch (requested == null ? "BEGINNER" : requested.toUpperCase()) {
            case "ADVANCED" -> 2; case "INTERMEDIATE" -> 1; default -> 0;
        };
        int learnerLevel = switch (track == null ? "BEGINNER" : track) {
            case "PENTESTER" -> 2; case "WEB_DEVELOPER" -> 1; default -> 0;
        };
        return new String[]{"BEGINNER", "INTERMEDIATE", "ADVANCED"}[Math.max(requestedLevel, learnerLevel)];
    }
}
