package com.sechub.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.SyncLessonDto;
import com.sechub.entity.Vulnerability;
import com.sechub.repository.VulnerabilityRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class GithubLessonDataService implements LessonDataSourceService {

    private static final Pattern LEADING_CATEGORY_NUMBER = Pattern.compile("^(\\d+)-");
    private static final Pattern FIRST_MARKDOWN_HEADING = Pattern.compile("(?m)^#\\s+(.+?)\\s*$");

    private final ObjectMapper objectMapper;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final HttpClient httpClient;
    private final String apiBaseUrl;
    private final String rawBaseUrl;
    private final String owner;
    private final String repo;
    private final String branch;
    private final Duration requestTimeout;

    public GithubLessonDataService(ObjectMapper objectMapper,
                                   VulnerabilityRepository vulnerabilityRepository,
                                   @Value("${app.lesson-data.github.api-base-url:https://api.github.com}") String apiBaseUrl,
                                   @Value("${app.lesson-data.github.raw-base-url:https://raw.githubusercontent.com}") String rawBaseUrl,
                                   @Value("${app.lesson-data.github.owner:Little-Boy-s-SecHub}") String owner,
                                   @Value("${app.lesson-data.github.repo:Data}") String repo,
                                   @Value("${app.lesson-data.github.branch:main}") String branch,
                                   @Value("${app.lesson-data.github.request-timeout-seconds:20}") long requestTimeoutSeconds) {
        this.objectMapper = objectMapper;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.apiBaseUrl = trimTrailingSlash(apiBaseUrl);
        this.rawBaseUrl = trimTrailingSlash(rawBaseUrl);
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.requestTimeout = Duration.ofSeconds(requestTimeoutSeconds);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(this.requestTimeout)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Override
    public List<SyncLessonDto> fetchLessons() {
        GithubTreeResponse treeResponse = fetchJson(treeUri(), GithubTreeResponse.class);
        if (treeResponse.tree() == null || treeResponse.tree().isEmpty()) {
            throw new IllegalStateException("GitHub lesson data repository does not contain any files.");
        }

        Set<String> knownVulnerabilitySlugs = vulnerabilityRepository.findAll()
                .stream()
                .map(Vulnerability::getSlug)
                .collect(Collectors.toSet());
        Map<String, Integer> sortOrdersByDifficulty = new HashMap<>();

        return treeResponse.tree()
                .stream()
                .filter(item -> "blob".equals(item.type()))
                .map(GithubTreeItem::path)
                .filter(this::isLessonReadme)
                .sorted()
                .map(path -> toSyncLesson(path, knownVulnerabilitySlugs, sortOrdersByDifficulty))
                .toList();
    }

    private SyncLessonDto toSyncLesson(String path,
                                       Set<String> knownVulnerabilitySlugs,
                                       Map<String, Integer> sortOrdersByDifficulty) {
        String contentMarkdown = fetchText(rawFileUri(path));
        String difficulty = difficultyFromPath(path);
        Integer sortOrder = sortOrdersByDifficulty.merge(difficulty, 1, Integer::sum);
        String slug = slugFromPath(path);
        String vulnerabilitySlug = knownVulnerabilitySlugs.contains(slug) ? slug : null;

        return new SyncLessonDto(
                difficulty,
                vulnerabilitySlug,
                titleFromMarkdown(contentMarkdown, slug),
                sortOrder,
                contentMarkdown,
                slug
        );
    }

    private boolean isLessonReadme(String path) {
        return path != null && path.endsWith("/README.md") && path.split("/").length >= 3;
    }

    private String difficultyFromPath(String path) {
        String topLevelFolder = path.split("/")[0];
        Matcher matcher = LEADING_CATEGORY_NUMBER.matcher(topLevelFolder);
        if (!matcher.find()) {
            return "BEGINNER";
        }

        int categoryNumber = Integer.parseInt(matcher.group(1));
        if (categoryNumber <= 4) {
            return "BEGINNER";
        }
        if (categoryNumber <= 8) {
            return "INTERMEDIATE";
        }
        return "ADVANCED";
    }

    private String slugFromPath(String path) {
        String[] segments = path.split("/");
        return segments[segments.length - 2];
    }

    private String titleFromMarkdown(String markdown, String fallbackSlug) {
        Matcher matcher = FIRST_MARKDOWN_HEADING.matcher(markdown);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        return Arrays.stream(fallbackSlug.split("-"))
                .filter(part -> !part.isBlank())
                .map(part -> Character.toUpperCase(part.charAt(0)) + part.substring(1))
                .collect(Collectors.joining(" "));
    }

    private URI treeUri() {
        String encodedOwner = UriUtils.encodePathSegment(owner, StandardCharsets.UTF_8);
        String encodedRepo = UriUtils.encodePathSegment(repo, StandardCharsets.UTF_8);
        String encodedBranch = UriUtils.encodePathSegment(branch, StandardCharsets.UTF_8);
        return URI.create("%s/repos/%s/%s/git/trees/%s?recursive=1".formatted(
                apiBaseUrl,
                encodedOwner,
                encodedRepo,
                encodedBranch
        ));
    }

    private URI rawFileUri(String path) {
        String encodedPath = Arrays.stream(path.split("/"))
                .map(segment -> UriUtils.encodePathSegment(segment, StandardCharsets.UTF_8))
                .collect(Collectors.joining("/"));

        return URI.create("%s/%s/%s/%s/%s".formatted(
                rawBaseUrl,
                UriUtils.encodePathSegment(owner, StandardCharsets.UTF_8),
                UriUtils.encodePathSegment(repo, StandardCharsets.UTF_8),
                UriUtils.encodePathSegment(branch, StandardCharsets.UTF_8),
                encodedPath
        ));
    }

    private <T> T fetchJson(URI uri, Class<T> responseType) {
        try {
            return objectMapper.readValue(fetchText(uri), responseType);
        } catch (IOException e) {
            throw new IllegalStateException("Could not parse GitHub response from " + uri, e);
        }
    }

    private String fetchText(URI uri) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(requestTimeout)
                .header("Accept", "application/vnd.github+json,text/plain")
                .header("User-Agent", "SecHub")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "GitHub request failed with HTTP " + response.statusCode() + ": " + uri
                );
            }
            return response.body();
        } catch (IOException e) {
            throw new IllegalStateException("Could not fetch GitHub lesson data from " + uri, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("GitHub lesson data request was interrupted: " + uri, e);
        }
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GithubTreeResponse(List<GithubTreeItem> tree) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GithubTreeItem(String path, String type) {
    }
}
