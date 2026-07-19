package com.sechub.service;

import com.sechub.dto.SyncLessonDto;
import com.sechub.entity.LearningPath;
import com.sechub.entity.Lesson;
import com.sechub.entity.Vulnerability;
import com.sechub.repository.LearningPathRepository;
import com.sechub.repository.LessonRepository;
import com.sechub.repository.UserProgressRepository;
import com.sechub.repository.VulnerabilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LessonSyncServiceImpl implements LessonSyncService {

    private final LearningPathRepository learningPathRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final LessonRepository lessonRepository;
    private final UserProgressRepository userProgressRepository;

    public LessonSyncServiceImpl(LearningPathRepository learningPathRepository,
                                 VulnerabilityRepository vulnerabilityRepository,
                                 LessonRepository lessonRepository,
                                 UserProgressRepository userProgressRepository) {
        this.learningPathRepository = learningPathRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.lessonRepository = lessonRepository;
        this.userProgressRepository = userProgressRepository;
    }

    @Override
    @Transactional
    public void syncLessons(List<SyncLessonDto> syncList) {
        List<Lesson> allLessonsBefore = lessonRepository.findAll();
        List<UUID> preservedIds = new ArrayList<>();

        for (SyncLessonDto dto : syncList) {
            if (dto.learningPathDifficulty() == null || dto.title() == null || dto.contentMarkdown() == null) {
                throw new IllegalArgumentException("learningPathDifficulty, title, and contentMarkdown are required fields.");
            }

            // 1. Resolve LearningPath
            LearningPath.Difficulty difficulty;
            try {
                difficulty = LearningPath.Difficulty.valueOf(dto.learningPathDifficulty().toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid learningPathDifficulty value: " + dto.learningPathDifficulty());
            }

            List<LearningPath> paths = learningPathRepository.findByDifficulty(difficulty);
            if (paths.isEmpty()) {
                throw new IllegalArgumentException("No Learning Path found for difficulty: " + difficulty);
            }
            LearningPath path = paths.get(0);

            // 2. Resolve Vulnerability (optional)
            Vulnerability vulnerability = null;
            if (dto.vulnerabilitySlug() != null && !dto.vulnerabilitySlug().isBlank()) {
                vulnerability = vulnerabilityRepository.findBySlug(dto.vulnerabilitySlug().trim())
                        .orElseThrow(() -> new IllegalArgumentException("Vulnerability not found for slug: " + dto.vulnerabilitySlug()));
            }

            // 3. Upsert Lesson
            Optional<Lesson> existingOpt = lessonRepository.findByTitleAndLearningPathId(dto.title().trim(), path.getId());
            Lesson lesson;
            if (existingOpt.isPresent()) {
                lesson = existingOpt.get();
                lesson.setContentMarkdown(dto.contentMarkdown());
                lesson.setSortOrder(dto.sortOrder() != null ? dto.sortOrder() : 0);
                lesson.setVulnerability(vulnerability);
                lesson.setTopicSlug(normalizeTopicSlug(dto.topicSlug(), dto.vulnerabilitySlug()));
            } else {
                lesson = Lesson.builder()
                        .learningPath(path)
                        .title(dto.title().trim())
                        .contentMarkdown(dto.contentMarkdown())
                        .sortOrder(dto.sortOrder() != null ? dto.sortOrder() : 0)
                        .vulnerability(vulnerability)
                        .topicSlug(normalizeTopicSlug(dto.topicSlug(), dto.vulnerabilitySlug()))
                        .build();
            }

            lesson = lessonRepository.save(lesson);
            preservedIds.add(lesson.getId());
        }

        // 4. Clean up orphans
        for (Lesson oldLesson : allLessonsBefore) {
            if (!preservedIds.contains(oldLesson.getId())) {
                userProgressRepository.deleteByLessonId(oldLesson.getId());
                lessonRepository.delete(oldLesson);
            }
        }
    }

    private String normalizeTopicSlug(String topicSlug, String vulnerabilitySlug) {
        String value = topicSlug == null || topicSlug.isBlank() ? vulnerabilitySlug : topicSlug;
        return value == null || value.isBlank() ? null : value.trim().toLowerCase().replace('_', '-');
    }
}
