package com.sechub.service;

import com.sechub.dto.LearningPathDto;
import com.sechub.entity.LearningPath;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.support.LocaleHolder;
import com.sechub.repository.LearningPathRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LearningPathService {

    private final LearningPathRepository learningPathRepository;

    public LearningPathService(LearningPathRepository learningPathRepository) {
        this.learningPathRepository = learningPathRepository;
    }

    @Transactional(readOnly = true)
    public List<LearningPathDto> getAllPaths() {
        return learningPathRepository.findByStatusOrderBySortOrderAsc(LearningPath.PublicationStatus.PUBLISHED)
                .stream()
                .map(LearningPathDto::summary)
                .toList();
    }

    @Transactional(readOnly = true)
    public LearningPathDto getById(UUID id) {
        LearningPath lp = learningPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(LocaleHolder.isEn() ? "Learning path" : "Lộ trình học", "id", id));
        if (lp.getStatus() != LearningPath.PublicationStatus.PUBLISHED) {
            throw new ResourceNotFoundException(LocaleHolder.isEn() ? "Learning path" : "Lộ trình học", "id", id);
        }
        return LearningPathDto.fromEntity(lp);
    }

    @Transactional(readOnly = true)
    public List<LearningPathDto> getByDifficulty(String difficulty) {
        LearningPath.Difficulty diff = LearningPath.Difficulty.valueOf(difficulty.toUpperCase());
        return learningPathRepository.findByDifficultyAndStatus(diff, LearningPath.PublicationStatus.PUBLISHED)
                .stream()
                .map(LearningPathDto::summary)
                .toList();
    }
}
