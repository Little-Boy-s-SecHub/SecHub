package com.sechub.service;

import com.sechub.dto.LabAttemptDto;
import com.sechub.dto.LabDto;
import com.sechub.dto.LabFeedbackDto;
import com.sechub.dto.MentorGuidanceDto;
import com.sechub.entity.Lab;
import com.sechub.entity.LabAttempt;
import com.sechub.entity.User;
import com.sechub.exception.BadRequestException;
import com.sechub.exception.ResourceNotFoundException;
import com.sechub.repository.LabAttemptRepository;
import com.sechub.repository.LabRepository;
import com.sechub.support.LabDurationPolicy;
import com.sechub.support.LocaleHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LabService {

    private static final Logger log = LoggerFactory.getLogger(LabService.class);
    private static final int EXTENSION_WINDOW_MINUTES = 10;

    private final LabRepository labRepository;
    private final LabAttemptRepository labAttemptRepository;
    private final UserService userService;
    private final DockerService dockerService;
    private final ActivityService activityService;
    private final LabArtifactService labArtifactService;
    private final NotificationService notificationService;

    public LabService(LabRepository labRepository,
                      LabAttemptRepository labAttemptRepository,
                      UserService userService,
                      DockerService dockerService,
                      ActivityService activityService,
                      LabArtifactService labArtifactService,
                      NotificationService notificationService) {
        this.labRepository = labRepository;
        this.labAttemptRepository = labAttemptRepository;
        this.userService = userService;
        this.dockerService = dockerService;
        this.activityService = activityService;
        this.labArtifactService = labArtifactService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<LabDto> getAllLabs(String username) {
        return labRepository.findByStatus(com.sechub.entity.LearningPath.PublicationStatus.PUBLISHED)
                .stream()
                .filter(lab -> lab.getAuthor() == null || (username != null && lab.getAuthor().getUsername().equals(username)))
                .sorted(Comparator
                        .comparing((Lab lab) -> lab.getArtifactPath() != null && !lab.getArtifactPath().isBlank())
                        .reversed()
                        .thenComparing(Lab::getCreatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(LabDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public LabDto getById(UUID id) {
        Lab lab = labRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", "id", id));
        requirePublished(lab);
        return LabDto.fromEntity(lab);
    }

    @Transactional(readOnly = true)
    public List<LabDto> getByVulnerabilityId(UUID vulnerabilityId, String username) {
        return labRepository.findByVulnerabilityId(vulnerabilityId)
                .stream()
                .filter(lab -> lab.getStatus() == com.sechub.entity.LearningPath.PublicationStatus.PUBLISHED)
                .filter(lab -> lab.getAuthor() == null || (username != null && lab.getAuthor().getUsername().equals(username)))
                .map(LabDto::fromEntity)
                .toList();
    }

    @Transactional
    public LabAttemptDto startLab(UUID labId, String username) {
        Lab lab = labRepository.findById(labId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", "id", labId));
        requirePublished(lab);
        User user = userService.findByUsername(username);

        // Check if user already has a running attempt
        var existing = labAttemptRepository.findFirstByUserIdAndLabIdAndStatus(
                user.getId(), labId, LabAttempt.Status.RUNNING);
        if (existing.isPresent()) {
            LabAttempt running = syncActiveAttemptDuration(existing.get());
            if (running.getStatus() != LabAttempt.Status.RUNNING && running.getStatus() != LabAttempt.Status.STARTED) {
                return createLabAttempt(lab, user);
            }
            if (running.getRuntimeToken() == null || running.getRuntimeToken().isBlank()) {
                running.setRuntimeToken(UUID.randomUUID().toString().replace("-", ""));
                running = labAttemptRepository.save(running);
            }
            return LabAttemptDto.fromEntity(running);
        }

        return createLabAttempt(lab, user);
    }

    private LabAttemptDto createLabAttempt(Lab lab, User user) {
        LocalDateTime startedAt = LocalDateTime.now();
        // Create the attempt record first (status STARTED) to get a database ID
        LabAttempt attempt = LabAttempt.builder()
                .user(user)
                .lab(lab)
                .status(LabAttempt.Status.STARTED)
                .startedAt(startedAt)
                .expiresAt(LabDurationPolicy.expiresAt(startedAt, lab, 0))
                .build();
        attempt = labAttemptRepository.save(attempt);

        try {
            labArtifactService.refreshRuntimeTemplate(lab.getArtifactPath());
            // Spin up the Docker container
            DockerService.ContainerInfo containerInfo = dockerService.startContainer(
                    lab.getDockerImage(), lab.getDockerPort(), attempt.getId(), lab.getArtifactPath());
            
            attempt.setContainerId(containerInfo.containerId());
            attempt.setContainerPort(containerInfo.port());
            attempt.setRuntimeToken(UUID.randomUUID().toString().replace("-", ""));
            attempt.setStatus(LabAttempt.Status.RUNNING);
            attempt = labAttemptRepository.save(attempt);

            activityService.incrementActivity(user.getId());
        } catch (Exception e) {
            log.error("Failed to start docker container for attempt: " + attempt.getId(), e);
            attempt.setStatus(LabAttempt.Status.FAILED);
            attempt = labAttemptRepository.save(attempt);
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "Failed to start lab environment: " + e.getMessage()
                    : "Không thể khởi động môi trường lab: " + e.getMessage());
        }

        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto stopLab(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You do not have permission to stop this lab session"
                    : "Bạn không có quyền dừng phiên thực hành này");
        }

        if (attempt.getStatus() == LabAttempt.Status.RUNNING || attempt.getStatus() == LabAttempt.Status.STARTED) {
            dockerService.stopContainer(attempt.getContainerId());
            attempt.setStatus(LabAttempt.Status.FAILED);
            attempt.setCompletedAt(LocalDateTime.now());
            attempt = labAttemptRepository.save(attempt);
        }

        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto submitFlag(UUID attemptId, String flag, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You do not have permission to submit a flag for this session"
                    : "Bạn không có quyền nộp flag cho phiên thực hành này");
        }

        if (attempt.getStatus() == LabAttempt.Status.COMPLETED) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "This lab session has already been completed"
                    : "Phiên thực hành này đã hoàn thành");
        }
        ensureAttemptIsActive(attempt);

        attempt.setFlagSubmitted(flag);

        boolean isSimulated = attempt.getContainerId() != null && attempt.getContainerId().startsWith("sim-");
        boolean isCorrectFlag = (attempt.getLab().getFlag() != null && attempt.getLab().getFlag().equals(flag.trim()))
                || (isSimulated && "FLAG{sechub_simulated_success}".equals(flag.trim()));

        if (isCorrectFlag) {
            attempt.setStatus(LabAttempt.Status.COMPLETED);
            attempt.setCompletedAt(LocalDateTime.now());

            // Stop the Docker container since it's completed
            dockerService.stopContainer(attempt.getContainerId());

            // Calculate score based on hints used (first hint is free, subsequent hints cost 5% each, minimum score is 50%)
            int basePoints = attempt.getLab().getPoints();
            int hintsUsed = attempt.getHintsUsed();
            int penaltyPercent = hintsUsed > 0 ? (hintsUsed - 1) * 5 : 0;
            int hintPenalty = (basePoints * penaltyPercent) / 100;
            attempt.setScore(Math.max(basePoints - hintPenalty, basePoints / 2));

            activityService.incrementActivity(attempt.getUser().getId());
        } else {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "Incorrect flag. Try again!"
                    : "Flag không chính xác. Hãy thử lại!");
        }

        attempt = labAttemptRepository.save(attempt);
        if (attempt.getStatus() == LabAttempt.Status.COMPLETED) {
            notificationService.notifyLabCompleted(attempt);
        }
        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto useHint(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You do not have permission to use hints for this session"
                    : "Bạn không có quyền sử dụng gợi ý cho phiên thực hành này");
        }
        ensureAttemptIsActive(attempt);

        if (!Boolean.TRUE.equals(attempt.getMentorPrompted())) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "Ask the AI Mentor for guiding questions before unlocking hints"
                    : "Hãy hỏi AI mentor để nhận câu hỏi dẫn dắt trước khi mở gợi ý");
        }

        attempt.setHintsUsed(attempt.getHintsUsed() + 1);
        attempt.setMentorPrompted(false);
        attempt = labAttemptRepository.save(attempt);
        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public MentorGuidanceDto getMentorGuidance(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));
        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You do not have permission to access this session's mentor"
                    : "Bạn không có quyền truy cập mentor của phiên này");
        }
        ensureAttemptIsActive(attempt);
        int stage = Math.min(3, Optional.ofNullable(attempt.getHintsUsed()).orElse(0) + 1);
        String slug = attempt.getLab().getVulnerability().getSlug();
        String[] prompts = mentorPrompts(slug);
        attempt.setMentorPrompted(true);
        labAttemptRepository.save(attempt);
        return new MentorGuidanceDto(prompts[Math.min(stage - 1, prompts.length - 1)],
                attempt.getLab().getVulnerability().getName(), true, stage);
    }

    private String[] mentorPrompts(String slug) {
        boolean en = LocaleHolder.isEn();
        return switch (slug) {
            case "sql-injection" -> new String[]{
                    en ? "Which input might be concatenated directly into the query? Try to change the response before finding the final payload."
                       : "Đầu vào nào của bạn có khả năng được ghép trực tiếp vào câu truy vấn? Hãy thử làm phản hồi thay đổi trước khi tìm payload hoàn chỉnh.",
                    en ? "If the query condition is always true, what will the application return? Pay attention to how the string is closed and the rest of the statement."
                       : "Nếu điều kiện truy vấn luôn đúng thì ứng dụng sẽ trả về gì? Chú ý cách đóng chuỗi và phần còn lại của câu lệnh.",
                    en ? "Have you tried comparing two requests that differ by only a single quote or a boolean expression?"
                       : "Bạn đã thử so sánh hai request chỉ khác một ký tự nháy hoặc một biểu thức boolean chưa?"};
            case "xss" -> new String[]{
                    en ? "Which input data is reflected back in the HTML, and does it appear in a text, attribute, or script context?"
                       : "Dữ liệu nào bạn nhập được phản chiếu lại trong HTML, và nó xuất hiện ở ngữ cảnh text, thuộc tính hay script?",
                    en ? "Which characters is the browser encoding? Find a context that allows you to escape the current structure."
                       : "Trình duyệt đang encode ký tự nào? Hãy tìm một ngữ cảnh cho phép thoát khỏi cấu trúc hiện tại.",
                    en ? "Can you prove JavaScript executes with a harmless behavior before building the final payload?"
                       : "Bạn có thể chứng minh JavaScript chạy bằng một hành vi vô hại trước khi xây payload cuối không?"};
            case "idor" -> new String[]{
                    en ? "Which request contains a resource identifier belonging to the current user? What happens when you only change that identifier?"
                       : "Request nào chứa định danh tài nguyên thuộc về người dùng hiện tại? Điều gì xảy ra khi chỉ đổi định danh đó?",
                    en ? "Is the server checking that you're logged in, or actually verifying the resource belongs to you?"
                       : "Server đang kiểm tra bạn đã đăng nhập, hay thực sự kiểm tra tài nguyên có thuộc về bạn?",
                    en ? "Compare the responses of two adjacent IDs and look for data that the current account shouldn't see."
                       : "Hãy so sánh phản hồi của hai ID liền kề và tìm dữ liệu mà tài khoản hiện tại không nên thấy."};
            case "ssrf" -> new String[]{
                    en ? "Which parameter causes the server to fetch a URL on your behalf instead of the browser?"
                       : "Tham số nào khiến server tự tải một URL thay cho trình duyệt của bạn?",
                    en ? "Are there internal addresses or metadata endpoints that only the server can access?"
                       : "Có địa chỉ nội bộ hoặc endpoint metadata nào chỉ server mới truy cập được không?",
                    en ? "Observe differences in status, timing, and content when changing the target host."
                       : "Hãy quan sát khác biệt về status, thời gian và nội dung khi đổi host đích."};
            case "csrf" -> new String[]{
                    en ? "Which sensitive action is performed via GET/POST? Does the request contain any anti-forgery security token?"
                       : "Hành động nhạy cảm nào đang được thực hiện qua phương thức GET/POST? Yêu cầu này có chứa token bảo mật chống giả mạo nào không?",
                    en ? "If a third-party website automatically sends this request on behalf of the victim (while they're logged in), would the server accept it?"
                       : "Nếu một trang web của bên thứ ba tự động gửi yêu cầu này thay cho nạn nhân (khi họ đã đăng nhập), liệu server có chấp nhận không?",
                    en ? "Try creating a simple auto-submit HTML form that sends the request and check the response."
                       : "Hãy thử tạo một form HTML đơn giản tự động gửi (auto-submit) request đó và kiểm tra phản hồi nhận được."};
            case "command-injection" -> new String[]{
                    en ? "Which input parameter is being forwarded to an OS command? Are any command control characters filtered?"
                       : "Tham số đầu vào nào đang được chuyển tiếp tới một lệnh hệ điều hành? Có ký tự điều khiển lệnh nào bị lọc không?",
                    en ? "Can you append a new command using special characters like ';', '&&', or '|' and check the server response?"
                       : "Bạn có thể nối thêm lệnh mới bằng các ký tự đặc biệt như ';', '&&', hoặc '|' để kiểm tra phản hồi từ server không?",
                    en ? "Try running a simple directory listing command (e.g., 'ls' or 'dir') before attempting to read the sensitive flag file."
                       : "Hãy thử chạy một lệnh đọc thư mục đơn giản (ví dụ: 'ls' hoặc 'dir') trước khi tìm cách đọc tệp flag nhạy cảm."};
            case "file-upload" -> new String[]{
                    en ? "What file extensions is the server restricting for uploads? Does this check happen on the client or server side?"
                       : "Server đang giới hạn phần mở rộng của tệp tải lên (extension) bằng những đuôi tệp nào? Kiểm tra này diễn ra ở client hay server?",
                    en ? "Have you tried renaming the file (e.g., '.php.jpg' or '.phtml') or changing the 'Content-Type' HTTP header when uploading?"
                       : "Bạn đã thử đổi tên tệp (ví dụ: '.php.jpg' hoặc '.phtml') hoặc thay đổi HTTP header 'Content-Type' khi tải tệp lên chưa?",
                    en ? "How can you trigger or directly access the malicious source file after successfully uploading it?"
                       : "Làm cách nào để bạn kích hoạt hoặc truy cập trực tiếp vào tệp mã nguồn độc hại sau khi tải lên thành công?"};
            case "auth-bypass" -> new String[]{
                    en ? "Is the app managing your session with cookies, sessions, or JWT tokens? Can that data be decoded or modified?"
                       : "Ứng dụng đang quản lý phiên đăng nhập của bạn bằng cookie, session hay JWT token? Dữ liệu đó có thể giải mã hoặc chỉnh sửa không?",
                    en ? "Is there a parameter that defines access rights (like 'role=user' or 'isAdmin=false') that you can change directly in the request?"
                       : "Có tham số nào định vị quyền truy cập (như 'role=user' hoặc 'isAdmin=false') mà bạn có thể thay đổi trực tiếp trên request chưa?",
                    en ? "Check whether the server validates the token's signature or just reads the decoded payload."
                       : "Hãy kiểm tra xem server có xác thực chữ ký (signature) của token hay chỉ đọc phần thông tin giải mã thô."};
            default -> new String[]{
                    en ? "Identify the trust boundary: which data is user-controlled and where does the server use it?"
                       : "Hãy xác định ranh giới tin cậy: dữ liệu nào do người dùng kiểm soát và được server sử dụng ở đâu?",
                    en ? "Try changing one parameter at a time and compare status, content, and response time."
                       : "Thử thay đổi một tham số mỗi lần và so sánh status, nội dung, thời gian phản hồi.",
                    en ? "Can you create a small, harmless proof that the security control has been bypassed?"
                       : "Bạn có thể tạo một bằng chứng nhỏ, vô hại cho thấy kiểm soát bảo mật đã bị bỏ qua không?"};
        };
    }

    @Transactional
    public List<LabAttemptDto> getUserAttempts(String username) {
        User user = userService.findByUsername(username);
        return labAttemptRepository.findByUserIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(this::syncActiveAttemptDuration)
                .map(LabAttemptDto::fromEntity)
                .toList();
    }

    @Transactional
    public List<LabAttemptDto> getLabAttempts(UUID labId, String username) {
        User user = userService.findByUsername(username);
        return labAttemptRepository.findByUserIdAndLabId(user.getId(), labId)
                .stream()
                .map(this::syncActiveAttemptDuration)
                .map(LabAttemptDto::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteGeneratedLab(UUID labId, String username) {
        Lab lab = labRepository.findById(labId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", "id", labId));
        if (lab.getArtifactPath() == null || lab.getArtifactPath().isBlank()) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "Only AI-generated labs can be deleted"
                    : "Chỉ có thể xoá bài lab được tạo bởi AI");
        }
        User user = userService.findByUsername(username);
        if (user.getRole() != User.Role.ADMIN && (lab.getAuthor() == null || !lab.getAuthor().getId().equals(user.getId()))) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You can only delete AI labs that you created"
                    : "Bạn chỉ có thể xoá bài lab AI do mình tạo");
        }
        List<LabAttempt> attempts = labAttemptRepository.findByLabId(labId);
        attempts.forEach(attempt -> dockerService.stopContainer(attempt.getContainerId()));
        labAttemptRepository.deleteAll(attempts);
        labRepository.delete(lab);
        labArtifactService.deleteArtifact(lab.getArtifactPath());
    }

    @Transactional
    public LabAttemptDto extendLab(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));
        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You do not have permission to extend this session"
                    : "Bạn không có quyền gia hạn phiên này");
        }
        ensureAttemptIsActive(attempt);
        if (attempt.getExtensionCount() != null && attempt.getExtensionCount() >= 1) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "This lab session has already been extended once"
                    : "Phiên lab này đã được gia hạn một lần");
        }
        LocalDateTime now = LocalDateTime.now();
        if (attempt.getExpiresAt() == null || attempt.getExpiresAt().isAfter(now.plusMinutes(EXTENSION_WINDOW_MINUTES))) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You can only request extra time when less than 10 minutes remain"
                    : "Chỉ có thể xin thêm thời gian khi phiên còn dưới 10 phút");
        }
        attempt.setExpiresAt(attempt.getExpiresAt().plusMinutes(LabDurationPolicy.EXTENSION_MINUTES));
        attempt.setExtensionCount(1);
        return LabAttemptDto.fromEntity(labAttemptRepository.save(attempt));
    }

    @Transactional(readOnly = true)
    public LabFeedbackDto getCompletionFeedback(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));
        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "You do not have permission to view feedback for this session"
                    : "Bạn không có quyền xem phản hồi của phiên này");
        }
        if (attempt.getStatus() != LabAttempt.Status.COMPLETED) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "Complete the lab before viewing the solution"
                    : "Hãy hoàn thành bài lab trước khi xem lời giải");
        }
        Lab current = attempt.getLab();
        LabFeedbackDto feedback = feedbackFor(current);
        return labRepository.findByVulnerabilityId(current.getVulnerability().getId()).stream()
                .filter(candidate -> !candidate.getId().equals(current.getId()))
                .filter(candidate -> !candidate.getTitle().startsWith("Daily ") && !candidate.getTitle().startsWith("Weekly "))
                .sorted(Comparator
                        .comparingInt((Lab candidate) -> Math.abs(candidate.getDifficulty().ordinal() - Math.min(2, current.getDifficulty().ordinal() + 1)))
                        .thenComparing(candidate -> Boolean.TRUE.equals(candidate.getArtifactPath() != null)))
                .findFirst()
                .map(next -> feedback.withNextLab(next.getId(), next.getTitle(), next.getDifficulty().name()))
                .orElse(feedback);
    }

    private LabFeedbackDto feedbackFor(Lab lab) {
        String slug = lab.getVulnerability().getSlug();
        boolean en = LocaleHolder.isEn();
        return switch (slug) {
            case "sql-injection" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You manipulated the SQL query structure through user input."
                       : "Bạn đã điều khiển cấu trúc truy vấn SQL thông qua dữ liệu đầu vào.",
                    en ? "The application concatenates input directly into the SQL statement. The payload alters the WHERE condition so the database returns data the application didn't intend to allow."
                       : "Ứng dụng nối trực tiếp input vào câu lệnh SQL. Payload làm thay đổi điều kiện WHERE nên database trả về dữ liệu mà ứng dụng không dự định cho phép.",
                    "String sql = \"SELECT * FROM users WHERE username='\" + username + \"'\";\nstatement.executeQuery(sql);",
                    "PreparedStatement ps = connection.prepareStatement(\n    \"SELECT * FROM users WHERE username = ?\");\nps.setString(1, username);\nResultSet rows = ps.executeQuery();",
                    en ? List.of("Use prepared statements for all input values", "Don't expose detailed database errors to users", "Limit database account privileges")
                       : List.of("Dùng prepared statement cho mọi giá trị đầu vào", "Không hiển thị lỗi database chi tiết cho người dùng", "Giới hạn quyền của tài khoản database"),
                    en ? "Data must always be a query parameter, never part of the SQL syntax."
                       : "Dữ liệu phải luôn là tham số của truy vấn, không được trở thành một phần cú pháp SQL.");
            case "xss" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You injected untrusted data into HTML without context-appropriate encoding."
                       : "Bạn đã đưa dữ liệu không tin cậy vào HTML mà không encode theo ngữ cảnh.",
                    en ? "The browser interprets the payload as HTML/JavaScript because the application uses an unsafe HTML sink."
                       : "Trình duyệt diễn giải payload như mã HTML/JavaScript vì ứng dụng dùng một HTML sink không an toàn.",
                    "result.innerHTML = request.query.q;",
                    en ? "result.textContent = request.query.q;\n// Or encode output for the correct HTML context"
                       : "result.textContent = request.query.q;\n// Hoặc encode output theo đúng HTML context",
                    en ? List.of("Use textContent when HTML is not needed", "Encode output for the correct context", "Add Content-Security-Policy")
                       : List.of("Dùng textContent khi không cần HTML", "Encode output theo ngữ cảnh", "Bổ sung Content-Security-Policy"),
                    en ? "XSS prevention must happen at the output sink, not by filtering a few input characters."
                       : "Phòng chống XSS phải thực hiện tại output sink, không chỉ lọc một vài ký tự đầu vào.");
            case "idor" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You accessed an object using a valid ID that doesn't belong to you."
                       : "Bạn đã truy cập một đối tượng bằng ID hợp lệ nhưng không thuộc quyền sở hữu của mình.",
                    en ? "The server checks if the object exists but doesn't verify whether the current user has permission to read it."
                       : "Server kiểm tra đối tượng có tồn tại nhưng không kiểm tra người dùng hiện tại có quyền đọc đối tượng đó hay không.",
                    en ? "Profile profile = repository.findById(request.id);\nreturn profile; // missing owner check"
                       : "Profile profile = repository.findById(request.id);\nreturn profile; // thiếu kiểm tra owner",
                    "Profile profile = repository.findByIdAndOwnerId(\n    request.id, currentUser.id);\nif (profile == null) throw new ForbiddenException();\nreturn profile;",
                    en ? List.of("Check permissions on each object server-side", "Query by both object ID and owner ID", "Don't treat hard-to-guess UUIDs as an authorization mechanism")
                       : List.of("Kiểm tra quyền trên từng đối tượng ở phía server", "Truy vấn theo cả object ID và owner ID", "Không coi UUID khó đoán là cơ chế phân quyền"),
                    en ? "Authentication determines who you are; authorization decides which objects you can access."
                       : "Authentication xác định bạn là ai; authorization quyết định bạn được truy cập đối tượng nào.");
            case "ssrf" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You made the server send a request to an address you control."
                       : "Bạn đã khiến server gửi request tới một địa chỉ do bạn kiểm soát.",
                    en ? "The application accepts arbitrary URLs, so the server-side request can reach internal services that the user's browser cannot access."
                       : "Ứng dụng chấp nhận URL tùy ý, nên request phía server có thể chạm tới dịch vụ nội bộ mà trình duyệt người dùng không truy cập được.",
                    "return httpClient.get(request.url);",
                    "URI target = validateAgainstAllowlist(request.url);\nrejectPrivateAndLoopbackAddresses(target);\nreturn restrictedClient.get(target);",
                    en ? List.of("Use an allowlist for hostnames and protocols", "Block loopback, private IPs, and redirects", "Isolate the network of URL-fetching services")
                       : List.of("Dùng allowlist hostname và protocol", "Chặn loopback, private IP và redirect", "Cô lập network của dịch vụ gọi URL"),
                    en ? "With SSRF, you must validate the original URL, DNS resolution, and all redirects."
                       : "Với SSRF, phải xác thực cả URL ban đầu, DNS resolution và mọi redirect.");
            case "command-injection" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You turned user input into part of an OS command."
                       : "Bạn đã biến input thành một phần của lệnh hệ điều hành.",
                    en ? "The shell processes separator characters in the payload and executes additional commands beyond the original intent."
                       : "Shell xử lý ký tự phân tách trong payload và thực thi thêm lệnh ngoài ý định ban đầu.",
                    "Runtime.exec(\"ping \" + request.host);",
                    "if (!isValidIp(request.host)) throw new BadRequestException();\nnew ProcessBuilder(\"ping\", \"-c\", \"1\", request.host).start();",
                    en ? List.of("Avoid calling the shell when an equivalent API exists", "Pass parameters using an argument array", "Validate with a strict allowlist")
                       : List.of("Tránh gọi shell khi có API tương đương", "Truyền tham số bằng argument array", "Validate theo allowlist chặt chẽ"),
                    en ? "Don't escape the shell with a blacklist; remove the shell from the processing flow if possible."
                       : "Không escape shell bằng blacklist; hãy loại shell khỏi luồng xử lý nếu có thể.");
            case "file-upload" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You uploaded dangerous content through incomplete file validation."
                       : "Bạn đã tải lên nội dung nguy hiểm qua kiểm tra tệp không đầy đủ.",
                    en ? "The application trusts the filename or Content-Type from the client and stores the file in a location where it can be served/executed."
                       : "Ứng dụng tin tên tệp hoặc Content-Type từ client và lưu tệp vào vị trí có thể được phục vụ/thực thi.",
                    "file.save(upload.originalFilename);",
                    "String safeName = UUID.randomUUID().toString();\nverifyMagicBytes(upload);\nstoreOutsideWebRoot(safeName, upload.bytes());",
                    en ? List.of("Check magic bytes and limit file size", "Rename files server-side", "Store outside the web root without execute permissions")
                       : List.of("Kiểm tra magic bytes và giới hạn kích thước", "Đổi tên tệp phía server", "Lưu ngoài web root và không cấp quyền thực thi"),
                    en ? "Upload validation must cover content, storage location, filename, and how the file is served back."
                       : "Kiểm tra upload cần bao phủ nội dung, vị trí lưu, tên tệp và cách tệp được phục vụ lại.");
            case "csrf" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You performed an action using the victim's session from a different request origin."
                       : "Bạn đã thực hiện hành động bằng phiên đăng nhập của nạn nhân từ một nguồn request khác.",
                    en ? "The browser automatically sends the session cookie, and the server doesn't require proof that the request was created from a legitimate interface."
                       : "Trình duyệt tự gửi cookie phiên, còn server không yêu cầu bằng chứng request được tạo từ giao diện hợp lệ.",
                    en ? "POST /transfer\n// Only checks session cookie"
                       : "POST /transfer\n// Chỉ kiểm tra session cookie",
                    "POST /transfer\nverifyCsrfToken(request.csrfToken, session);\n// Cookie: SameSite=Lax or Strict",
                    en ? List.of("Use unpredictable CSRF tokens", "Set SameSite on cookies", "Check Origin for sensitive actions")
                       : List.of("Dùng CSRF token không thể đoán", "Thiết lập SameSite cho cookie", "Kiểm tra Origin cho thao tác nhạy cảm"),
                    en ? "Cookies authenticate the user but don't prove the intent to perform the action."
                       : "Cookie xác thực người dùng nhưng không chứng minh ý định thực hiện hành động.");
            default -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    en ? "You bypassed an insecure authentication or authorization condition."
                       : "Bạn đã vượt qua một điều kiện xác thực hoặc phân quyền không an toàn.",
                    en ? "The server trusts data provided by the client instead of verifying identity and access rights itself."
                       : "Server tin dữ liệu do client cung cấp thay vì tự xác minh danh tính và quyền truy cập.",
                    "if (request.role.equals(\"admin\")) return adminData;",
                    "User user = authenticatedSession.user();\nrequireRole(user, Role.ADMIN);\nreturn adminData;",
                    en ? List.of("Enforce permission checks on the server", "Don't trust roles/tokens declared by the client", "Use deny-by-default")
                       : List.of("Thực thi kiểm tra quyền ở server", "Không tin role/token do client tự khai báo", "Dùng deny-by-default"),
                    en ? "All security decisions must be based on server-verified state."
                       : "Mọi quyết định bảo mật phải dựa trên trạng thái được server xác minh.");
        };
    }

    private void requirePublished(Lab lab) {
        if (lab.getStatus() != com.sechub.entity.LearningPath.PublicationStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Lab", "id", lab.getId());
        }
    }

    @Transactional
    public void expireOverdueAttempts() {
        List<LabAttempt> overdue = new java.util.ArrayList<>();
        overdue.addAll(labAttemptRepository.findByStatusAndExpiresAtBefore(
                LabAttempt.Status.RUNNING, LocalDateTime.now()));
        overdue.addAll(labAttemptRepository.findByStatusAndExpiresAtBefore(
                LabAttempt.Status.STARTED, LocalDateTime.now()));
        
        List<LabAttempt> activeAttempts = new java.util.ArrayList<>();
        activeAttempts.addAll(labAttemptRepository.findByStatus(LabAttempt.Status.RUNNING));
        activeAttempts.addAll(labAttemptRepository.findByStatus(LabAttempt.Status.STARTED));
        
        for (LabAttempt active : activeAttempts) {
            boolean generated = active.getLab().getArtifactPath() != null && !active.getLab().getArtifactPath().isBlank();
            if (generated && !dockerService.isContainerRunning(active.getContainerId()) && !overdue.contains(active)) {
                overdue.add(active);
            }
        }
        
        for (LabAttempt attempt : overdue) {
            dockerService.stopContainer(attempt.getContainerId());
            attempt.setStatus(LabAttempt.Status.EXPIRED);
            attempt.setCompletedAt(LocalDateTime.now());
        }
        if (!overdue.isEmpty()) {
            labAttemptRepository.saveAll(overdue);
            log.info("Expired {} overdue lab attempt(s)", overdue.size());
        }
    }

    private void ensureAttemptIsActive(LabAttempt attempt) {
        if (attempt.getStatus() != LabAttempt.Status.RUNNING) {
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "This lab session is no longer active"
                    : "Phiên lab không còn hoạt động");
        }
        if (attempt.getExpiresAt() != null && !attempt.getExpiresAt().isAfter(LocalDateTime.now())) {
            dockerService.stopContainer(attempt.getContainerId());
            attempt.setStatus(LabAttempt.Status.EXPIRED);
            attempt.setCompletedAt(LocalDateTime.now());
            labAttemptRepository.save(attempt);
            throw new BadRequestException(LocaleHolder.isEn()
                    ? "This lab session has expired"
                    : "Phiên lab đã hết thời gian");
        }
    }

    private LabAttempt syncActiveAttemptDuration(LabAttempt attempt) {
        if (attempt.getStatus() != LabAttempt.Status.RUNNING && attempt.getStatus() != LabAttempt.Status.STARTED) {
            return attempt;
        }

        boolean changed = false;
        if (attempt.getStartedAt() == null) {
            attempt.setStartedAt(LocalDateTime.now());
            changed = true;
        }

        LocalDateTime expectedExpiry = LabDurationPolicy.expiresAt(
                attempt.getStartedAt(), attempt.getLab(), attempt.getExtensionCount());
        if (attempt.getExpiresAt() == null || !attempt.getExpiresAt().equals(expectedExpiry)) {
            attempt.setExpiresAt(expectedExpiry);
            changed = true;
        }

        if (!expectedExpiry.isAfter(LocalDateTime.now())) {
            dockerService.stopContainer(attempt.getContainerId());
            attempt.setStatus(LabAttempt.Status.EXPIRED);
            attempt.setCompletedAt(LocalDateTime.now());
            changed = true;
        }

        return changed ? labAttemptRepository.save(attempt) : attempt;
    }
}
