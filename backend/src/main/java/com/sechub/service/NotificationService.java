package com.sechub.service;

import com.sechub.dto.NotificationDto;
import com.sechub.dto.NotificationReadRequest;
import com.sechub.entity.Lab;
import com.sechub.entity.LabAttempt;
import com.sechub.entity.Notification;
import com.sechub.entity.User;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.NotificationRepository;
import com.sechub.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public NotificationService(NotificationRepository notifications, UserRepository users) {
        this.notifications = notifications;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> list(String username) {
        User user = findUser(username);
        if (!notificationsEnabled(user)) {
            return List.of();
        }
        return notifications.findTop20ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationDto::fromEntity)
                .toList();
    }

    @Transactional
    public List<NotificationDto> markRead(String username, NotificationReadRequest request) {
        User user = findUser(username);
        List<Notification> targets = request == null || request.ids() == null || request.ids().isEmpty()
                ? notifications.findByUserIdAndReadAtIsNull(user.getId())
                : notifications.findByUserIdAndIdIn(user.getId(), request.ids());
        LocalDateTime now = LocalDateTime.now();
        targets.stream()
                .filter(notification -> notification.getReadAt() == null)
                .forEach(notification -> notification.setReadAt(now));
        notifications.saveAll(targets);
        send(user.getId(), "notifications-updated", Map.of("unreadCount", notifications.countByUserIdAndReadAtIsNull(user.getId())));
        return list(username);
    }

    @Transactional(readOnly = true)
    public SseEmitter stream(String username) {
        User user = findUser(username);
        SseEmitter emitter = new SseEmitter(0L);
        if (!notificationsEnabled(user)) {
            sendToEmitter(emitter, "notifications-disabled", Map.of("enabled", false));
            emitter.complete();
            return emitter;
        }

        emitters.computeIfAbsent(user.getId(), id -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeEmitter(user.getId(), emitter));
        emitter.onTimeout(() -> removeEmitter(user.getId(), emitter));
        emitter.onError(error -> removeEmitter(user.getId(), emitter));
        sendToEmitter(emitter, "ready", Map.of("unreadCount", notifications.countByUserIdAndReadAtIsNull(user.getId())));
        return emitter;
    }

    @Transactional
    public Optional<NotificationDto> notifyLabCompleted(LabAttempt attempt) {
        Lab lab = attempt.getLab();
        int score = attempt.getScore() == null ? 0 : attempt.getScore();
        return createForUser(
                attempt.getUser(),
                Notification.Type.LAB_COMPLETED,
                attempt.getId().toString(),
                "Hoàn thành lab",
                "Bạn vừa hoàn thành " + lab.getTitle() + " và nhận " + score + " XP.",
                "/labs/" + lab.getId() + "/play"
        );
    }

    @Transactional
    public void notifyLabPublished(Lab lab) {
        String vulnerabilityName = lab.getVulnerability() == null ? "bảo mật web" : lab.getVulnerability().getName();
        users.findByNotificationsEnabledTrue().stream()
                .filter(user -> lab.getAuthor() == null || !lab.getAuthor().getId().equals(user.getId()))
                .forEach(user -> createForUser(
                        user,
                        Notification.Type.LAB_PUBLISHED,
                        lab.getId().toString(),
                        "Lab mới",
                        "Có lab mới về " + vulnerabilityName + ": " + lab.getTitle(),
                        "/labs/" + lab.getId()
                ));
    }

    private Optional<NotificationDto> createForUser(User user, Notification.Type type, String sourceKey,
                                                    String title, String message, String actionUrl) {
        if (!notificationsEnabled(user)
                || notifications.existsByUserIdAndTypeAndSourceKey(user.getId(), type, sourceKey)) {
            return Optional.empty();
        }

        Notification notification = notifications.save(Notification.builder()
                .user(user)
                .type(type)
                .sourceKey(sourceKey)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .createdAt(LocalDateTime.now())
                .build());
        NotificationDto dto = NotificationDto.fromEntity(notification);
        send(user.getId(), "notification", dto);
        return Optional.of(dto);
    }

    private void send(UUID userId, String eventName, Object data) {
        List<SseEmitter> userEmitters = emitters.getOrDefault(userId, new CopyOnWriteArrayList<>());
        userEmitters.forEach(emitter -> {
            if (!sendToEmitter(emitter, eventName, data)) {
                removeEmitter(userId, emitter);
            }
        });
    }

    private boolean sendToEmitter(SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
            return true;
        } catch (IOException | IllegalStateException e) {
            emitter.completeWithError(e);
            return false;
        }
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }
        userEmitters.remove(emitter);
        if (userEmitters.isEmpty()) {
            emitters.remove(userId);
        }
    }

    private boolean notificationsEnabled(User user) {
        return !Boolean.FALSE.equals(user.getNotificationsEnabled());
    }

    private User findUser(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));
    }
}
