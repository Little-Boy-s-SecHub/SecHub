package com.sechub.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {

    @Test
    void corsAlwaysAllowsProductionAndPreviewOrigins() {
        SecurityConfig config = new SecurityConfig(mock(JwtAuthenticationFilter.class));
        ReflectionTestUtils.setField(config, "allowedOriginPatterns", "http://localhost:3000");

        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration cors = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/lab-runtime/token/"));

        assertThat(cors).isNotNull();
        assertThat(cors.checkOrigin("https://sechub-academy.vercel.app"))
                .isEqualTo("https://sechub-academy.vercel.app");
        assertThat(cors.checkOrigin("https://sechub-academy-preview.vercel.app"))
                .isEqualTo("https://sechub-academy-preview.vercel.app");
        assertThat(cors.checkOrigin("https://api.littleboys.biz"))
                .isEqualTo("https://api.littleboys.biz");
        assertThat(cors.checkOrigin("https://untrusted.example")).isNull();
        assertThat(cors.getAllowedMethods()).contains("OPTIONS");
    }
}
