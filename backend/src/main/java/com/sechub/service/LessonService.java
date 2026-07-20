package com.sechub.service;

import com.sechub.dto.LessonDto;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.entity.LearningPath;
import com.sechub.repository.LessonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;

    public LessonService(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    @Transactional(readOnly = true)
    public List<LessonDto> getByPathId(UUID pathId) {
        return lessonRepository.findByLearningPathIdOrderBySortOrderAsc(pathId)
                .stream()
                .filter(lesson -> lesson.getLearningPath().getStatus() == LearningPath.PublicationStatus.PUBLISHED)
                .map(LessonDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public LessonDto getById(UUID id) {
        return lessonRepository.findById(id)
                .filter(lesson -> lesson.getLearningPath().getStatus() == LearningPath.PublicationStatus.PUBLISHED)
                .map(LessonDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException(
                    com.sechub.support.LocaleHolder.isEn() ? "Lesson" : "Bài học", "id", id));
    }

    @Transactional(readOnly = true)
    public List<LessonDto> getByVulnerabilityId(UUID vulnerabilityId) {
        return lessonRepository.findByVulnerabilityIdOrderBySortOrderAsc(vulnerabilityId)
                .stream()
                .filter(lesson -> lesson.getLearningPath().getStatus() == LearningPath.PublicationStatus.PUBLISHED)
                .map(LessonDto::fromEntity)
                .toList();
    }
}
