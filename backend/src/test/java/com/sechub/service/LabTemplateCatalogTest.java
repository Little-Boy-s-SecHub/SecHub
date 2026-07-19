package com.sechub.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LabTemplateCatalogTest {

    @Test
    void mapsUnsupportedLessonTopicsToExecutableRuntimeTypes() {
        assertThat(LabTemplateCatalog.runtimeTypeFor("downgrade-attacks", "TLS handshake downgrade"))
                .isEqualTo("auth-bypass");
        assertThat(LabTemplateCatalog.runtimeTypeFor("cors", "Cross-Origin Resource Sharing"))
                .isEqualTo("csrf");
        assertThat(LabTemplateCatalog.runtimeTypeFor("ssti", "Server-Side Template Injection"))
                .isEqualTo("command-injection");
        assertThat(LabTemplateCatalog.runtimeTypeFor("graphql-vulnerabilities", "GraphQL improper authorization"))
                .isEqualTo("idor");
        assertThat(LabTemplateCatalog.runtimeTypeFor("web-cache-poisoning", "poisoned cache key"))
                .isEqualTo("ssrf");
    }

    @Test
    void everySyncedLessonTopicHasAnExecutableChallengeProfile() {
        assertThat(LabTemplateCatalog.KNOWN_TOPIC_SLUGS).hasSize(77);
        assertThat(LabTemplateCatalog.KNOWN_TOPIC_SLUGS)
                .allSatisfy(topic -> {
                    LabTemplateCatalog.ChallengeProfile challenge = LabTemplateCatalog.challengeFor(topic, "");
                    assertThat(challenge.topicSlug()).isEqualTo(topic);
                    assertThat(challenge.endpoint()).startsWith("/");
                    assertThat(challenge.successValues()).isNotEmpty();
                    assertThat(LabTemplateCatalog.SUPPORTED_RUNTIME_TYPES).contains(challenge.runtimeType());
                });
    }

    @Test
    void keepsLessonTopicWhenLegacyClientSendsOnlyCanonicalType() {
        assertThat(LabTemplateCatalog.challengeFor("auth-bypass", "LESSON TITLE: Downgrade Attacks")
                .endpoint()).isEqualTo("/tls/handshake");
        assertThat(LabTemplateCatalog.challengeFor("csrf", "LESSON TITLE: CORS")
                .endpoint()).isEqualTo("/api/account");
        assertThat(LabTemplateCatalog.challengeFor("idor", "LESSON TITLE: GraphQL Vulnerabilities")
                .endpoint()).isEqualTo("/graphql");
    }
}
