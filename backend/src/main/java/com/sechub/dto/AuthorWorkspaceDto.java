package com.sechub.dto;

import java.util.List;

public record AuthorWorkspaceDto(List<LearningPathDto> paths, List<LabDto> labs) {}
