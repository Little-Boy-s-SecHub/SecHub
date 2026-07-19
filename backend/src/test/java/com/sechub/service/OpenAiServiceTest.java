package com.sechub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.GeneratedLabSpec;
import com.sechub.entity.Lab;
import com.sechub.entity.LearningPath;
import com.sechub.entity.Vulnerability;
import com.sechub.repository.LabRepository;
import com.sechub.repository.VulnerabilityRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpenAiServiceTest {

    @Mock
    LabRepository labRepository;
    @Mock
    VulnerabilityRepository vulnerabilityRepository;
    @Mock
    LabArtifactService labArtifactService;

    @TempDir
    Path tempDir;

    @Test
    void unsupportedLessonTopicStillCreatesGeneratedLab() {
        Vulnerability authBypass = Vulnerability.builder()
                .id(UUID.randomUUID())
                .slug("auth-bypass")
                .name("Authentication Bypass")
                .build();
        when(vulnerabilityRepository.findBySlug("auth-bypass")).thenReturn(Optional.of(authBypass));
        when(labArtifactService.create(eq("downgrade-attacks"), anyString(), any(GeneratedLabSpec.class), eq("vi")))
                .thenReturn(new LabArtifactService.LabArtifact(tempDir, "sechub/generated-lab-test:latest", 8080));
        when(labRepository.save(any(Lab.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OpenAiService service = new OpenAiService(labRepository, vulnerabilityRepository, labArtifactService, new ObjectMapper());

        Lab lab = service.generateAndSaveLab(
                "downgrade-attacks",
                "BEGINNER",
                "LESSON TITLE: Downgrade Attacks\nLESSON CONTENT: TLS downgrade and weak negotiation",
                "vi",
                null);

        assertThat(lab.getVulnerability()).isEqualTo(authBypass);
        assertThat(lab.getDifficulty()).isEqualTo(LearningPath.Difficulty.BEGINNER);
        assertThat(lab.getFlag()).startsWith("SecHub{downgrade_attacks_");
        assertThat(lab.getTitle()).contains("Downgrade Attacks");
    }
}
