package com.sechub.dto;

import java.util.List;
import java.util.UUID;

public record NotificationReadRequest(List<UUID> ids) {
}
