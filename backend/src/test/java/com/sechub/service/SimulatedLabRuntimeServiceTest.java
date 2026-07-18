package com.sechub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.entity.Lab;
import com.sechub.entity.LabAttempt;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class SimulatedLabRuntimeServiceTest {

    @TempDir
    Path tempDir;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void rendersGeneratedLabHomeWithoutDocker() throws Exception {
        LabAttempt attempt = attempt("sql-injection");
        MockHttpServletRequest request = request("GET", "/api/lab-runtime/runtime-token/");

        var response = new SimulatedLabRuntimeService(objectMapper).handle(attempt, new byte[0], request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(text(response.getBody())).contains("Production diagnostic", "Đăng nhập");
    }

    @Test
    void sqlInjectionPayloadReturnsAttemptFlag() throws Exception {
        LabAttempt attempt = attempt("sql-injection");
        MockHttpServletRequest request = request("POST", "/api/lab-runtime/runtime-token/login");
        byte[] body = "ref_abc=admin%27+OR+%271%27%3D%271&password=x".getBytes(StandardCharsets.UTF_8);

        var response = new SimulatedLabRuntimeService(objectMapper).handle(attempt, body, request);

        assertThat(text(response.getBody())).contains("SecHub{test_flag}", "Làm lại");
    }

    @Test
    void idorOnlyReturnsFlagForGeneratedTargetId() throws Exception {
        LabAttempt attempt = attempt("idor");
        MockHttpServletRequest normal = request("GET", "/api/lab-runtime/runtime-token/api/profile");
        normal.setQueryString("ref_abc=1");
        MockHttpServletRequest target = request("GET", "/api/lab-runtime/runtime-token/api/profile");
        target.setQueryString("ref_abc=7");
        SimulatedLabRuntimeService service = new SimulatedLabRuntimeService(objectMapper);

        assertThat(text(service.handle(attempt, new byte[0], normal).getBody())).doesNotContain("SecHub{test_flag}");
        assertThat(text(service.handle(attempt, new byte[0], target).getBody())).contains("SecHub{test_flag}");
    }

    private LabAttempt attempt(String vulnerability) throws Exception {
        Files.writeString(tempDir.resolve("manifest.json"), objectMapper.writeValueAsString(java.util.Map.of(
                "vulnerability", vulnerability,
                "flag", "SecHub{test_flag}",
                "title", "Production diagnostic",
                "scenario", "Isolated lab",
                "variant", java.util.Map.of("parameter", "ref_abc", "targetId", 7, "account", "analyst_abc")
        )));
        Lab lab = Lab.builder().artifactPath(tempDir.toString()).build();
        return LabAttempt.builder().lab(lab).runtimeToken("runtime-token").containerId("sim-test").build();
    }

    private MockHttpServletRequest request(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRequestURI(uri);
        return request;
    }

    private String text(byte[] value) {
        return new String(value, StandardCharsets.UTF_8);
    }
}
