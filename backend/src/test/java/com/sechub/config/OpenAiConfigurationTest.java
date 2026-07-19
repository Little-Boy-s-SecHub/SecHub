package com.sechub.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class OpenAiConfigurationTest {

    @Test
    void defaultsRuntimeGenerationToGpt56Terra() throws IOException {
        Properties properties = new Properties();
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("application.properties")) {
            assertThat(input).isNotNull();
            properties.load(input);
        }

        assertThat(properties.getProperty("app.openai.model"))
                .isEqualTo("${OPENAI_MODEL:gpt-5.6-terra}");
    }
}
