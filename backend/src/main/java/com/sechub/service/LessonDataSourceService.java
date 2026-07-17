package com.sechub.service;

import com.sechub.dto.SyncLessonDto;

import java.util.List;

public interface LessonDataSourceService {

    List<SyncLessonDto> fetchLessons();
}
