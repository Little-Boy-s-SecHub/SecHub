package com.sechub.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class DockerService {

    private static final Logger log = LoggerFactory.getLogger(DockerService.class);
    private static final long DOCKER_CHECK_TIMEOUT_SECONDS = 5;
    private static final long DOCKER_COMMAND_TIMEOUT_SECONDS = 120;
    private boolean isDockerAvailable = false;

    public record ContainerInfo(String containerId, int port) {}

    @PostConstruct
    public void init() {
        checkDockerAvailability();
        if (isDockerAvailable) {
            cleanupAllContainers();
        } else {
            log.info("Docker is not available. Lab containers will be simulated.");
        }
    }

    @PreDestroy
    public void cleanup() {
        if (isDockerAvailable) {
            cleanupAllContainers();
        }
    }

    private void checkDockerAvailability() {
        try {
            runCommand(DOCKER_CHECK_TIMEOUT_SECONDS, "docker", "ps");
            isDockerAvailable = true;
            log.info("Docker daemon check: AVAILABLE");
        } catch (Exception e) {
            log.warn("Docker check failed: {}. Fallback to Simulation Mode.", e.getMessage());
            isDockerAvailable = false;
        }
    }

    public ContainerInfo startContainer(String imageName, int targetPort, UUID attemptId, String artifactPath) {
        String containerName = "sechub-attempt-" + attemptId;
        int hostPort = findFreePort();
        boolean generatedLab = artifactPath != null && !artifactPath.isBlank();

        if (!isDockerAvailable) {
            log.info("Simulating container startup for {} on port {}", imageName, hostPort);
            return new ContainerInfo("sim-" + UUID.randomUUID(), hostPort);
        }

        try {
            if (generatedLab) {
                Path buildContext = Path.of(artifactPath).toAbsolutePath().normalize();
                if (!Files.isDirectory(buildContext) || !Files.isRegularFile(buildContext.resolve("Dockerfile"))) {
                    throw new IOException("Generated lab artifact is missing: " + buildContext);
                }
                log.info("Building generated lab image {}", imageName);
                runCommand("docker", "build", "--pull", "-t", imageName, buildContext.toString());
            } else {
                log.info("Pulling docker image: {}", imageName);
                runCommand("docker", "pull", imageName);
            }

            log.info("Starting docker container: {} -> Host Port: {}", containerName, hostPort);
            List<String> command = List.of(
                "docker", "run", "-d",
                "--name", containerName,
                "--label", "sechub.managed=true",
                "--read-only",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                "--memory", "128m",
                "--cpus", "0.5",
                "--pids-limit", "64",
                "-p", hostPort + ":" + targetPort,
                imageName
            );

            String containerId = runCommand(command.toArray(new String[0])).trim();
            if (containerId.isEmpty()) {
                throw new RuntimeException("Docker run returned empty container ID");
            }

            if (generatedLab) {
                waitForHealthy(containerId);
            }

            log.info("Container started successfully. ID: {}, Port: {}", containerId.substring(0, Math.min(12, containerId.length())), hostPort);
            return new ContainerInfo(containerId, hostPort);
        } catch (Exception e) {
            if (generatedLab) {
                throw new IllegalStateException("Không thể build/chạy generated lab: " + e.getMessage(), e);
            }
            log.error("Failed to start Docker container for {}. Falling back to Simulation Mode.", imageName, e);
            return new ContainerInfo("sim-" + UUID.randomUUID(), hostPort);
        }
    }

    public void stopContainer(String containerId) {
        if (containerId == null || containerId.isEmpty()) {
            return;
        }

        if (containerId.startsWith("sim-")) {
            log.info("Stopping simulated container: {}", containerId);
            return;
        }

        if (!isDockerAvailable) {
            return;
        }

        try {
            log.info("Stopping Docker container: {}", containerId);
            runCommand("docker", "stop", containerId);
            log.info("Removing Docker container and its volumes: {}", containerId);
            runCommand("docker", "rm", "-v", containerId);
        } catch (Exception e) {
            log.error("Failed to stop/remove Docker container: {}", containerId, e);
        }
    }

    public boolean isContainerRunning(String containerId) {
        if (containerId == null || containerId.isBlank()) return false;
        if (containerId.startsWith("sim-")) return true;
        if (!isDockerAvailable) return false;
        try {
            return "true".equals(runCommand(DOCKER_CHECK_TIMEOUT_SECONDS, "docker", "inspect", "--format",
                    "{{.State.Running}}", containerId).trim());
        } catch (Exception e) {
            return false;
        }
    }

    public void cleanupAllContainers() {
        if (!isDockerAvailable) {
            return;
        }

        try {
            log.info("Cleaning up existing SecHub lab containers...");
            String output = runCommand("docker", "ps", "-a", "--filter", "name=sechub-attempt-", "-q");
            if (output != null && !output.trim().isEmpty()) {
                String[] containerIds = output.split("\\s+");
                for (String id : containerIds) {
                    if (!id.trim().isEmpty()) {
                        log.info("Force removing container and its volumes: {}", id);
                        runCommand("docker", "rm", "-f", "-v", id);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to clean up docker containers: {}", e.getMessage());
        }
    }

    private int findFreePort() {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (IOException e) {
            log.warn("Failed to find free port automatically, defaulting to 18080", e);
            return 10000 + (int)(Math.random() * 10000);
        }
    }

    private void waitForHealthy(String containerId) throws IOException, InterruptedException {
        for (int i = 0; i < 30; i++) {
            String status = runCommand(DOCKER_CHECK_TIMEOUT_SECONDS, "docker", "inspect", "--format",
                    "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", containerId).trim();
            if ("healthy".equals(status) || "running".equals(status)) return;
            if ("unhealthy".equals(status) || "exited".equals(status) || "dead".equals(status)) {
                throw new IOException("Container entered state: " + status);
            }
            Thread.sleep(500);
        }
        throw new IOException("Container health check timed out");
    }

    private String runCommand(String... command) throws IOException, InterruptedException {
        return runCommand(DOCKER_COMMAND_TIMEOUT_SECONDS, command);
    }

    private String runCommand(long timeoutSeconds, String... command) throws IOException, InterruptedException {
        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);
        Process process = builder.start();

        StringBuffer output = new StringBuffer();
        Thread outputReader = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            } catch (IOException e) {
                output.append(e.getMessage()).append("\n");
            }
        }, "docker-command-output");
        outputReader.setDaemon(true);
        outputReader.start();

        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            outputReader.join(TimeUnit.SECONDS.toMillis(1));
            throw new IOException("Command timed out after " + timeoutSeconds + " seconds: " + String.join(" ", command));
        }

        outputReader.join(TimeUnit.SECONDS.toMillis(1));
        int exitCode = process.exitValue();
        if (exitCode != 0) {
            throw new IOException("Command failed with exit code " + exitCode + ". Output: " + output);
        }

        return output.toString();
    }
}
