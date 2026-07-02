package com.sechub.service;

import com.sechub.dto.SyncLessonDto;
import java.util.List;

public interface LessonSyncService {
    void syncLessons(List<SyncLessonDto> syncList);
}
