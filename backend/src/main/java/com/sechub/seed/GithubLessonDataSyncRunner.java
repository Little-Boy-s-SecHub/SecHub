package com.sechub.seed;

import com.sechub.dto.SyncLessonDto;
import com.sechub.service.LessonDataSourceService;
import com.sechub.service.LessonSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1)
public class GithubLessonDataSyncRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(GithubLessonDataSyncRunner.class);

    private final LessonDataSourceService lessonDataSourceService;
    private final LessonSyncService lessonSyncService;
    private final boolean autoSyncEnabled;

    public GithubLessonDataSyncRunner(LessonDataSourceService lessonDataSourceService,
                                      LessonSyncService lessonSyncService,
                                      @Value("${app.lesson-data.github.auto-sync:true}") boolean autoSyncEnabled) {
        this.lessonDataSourceService = lessonDataSourceService;
        this.lessonSyncService = lessonSyncService;
        this.autoSyncEnabled = autoSyncEnabled;
    }

    @Override
    public void run(String... args) {
        if (!autoSyncEnabled) {
            log.info("GitHub lesson data auto-sync is disabled.");
            return;
        }

        try {
            List<SyncLessonDto> lessons = lessonDataSourceService.fetchLessons();
            lessonSyncService.syncLessons(lessons);
            log.info("Synced {} lessons from GitHub lesson data repository.", lessons.size());
        } catch (Exception e) {
            log.warn("Could not auto-sync lessons from GitHub. The application will continue with existing data.", e);
        }
    }
}
