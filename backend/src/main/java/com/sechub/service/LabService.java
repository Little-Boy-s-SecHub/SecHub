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
    private static final int MIN_LAB_DURATION = 15;
    private static final int MAX_LAB_DURATION = 90;
    private static final int EXTENSION_WINDOW_MINUTES = 10;
    private static final int EXTENSION_MINUTES = 30;

    private final LabRepository labRepository;
    private final LabAttemptRepository labAttemptRepository;
    private final UserService userService;
    private final DockerService dockerService;
    private final ActivityService activityService;
    private final LabArtifactService labArtifactService;

    public LabService(LabRepository labRepository,
                      LabAttemptRepository labAttemptRepository,
                      UserService userService,
                      DockerService dockerService,
                      ActivityService activityService,
                      LabArtifactService labArtifactService) {
        this.labRepository = labRepository;
        this.labAttemptRepository = labAttemptRepository;
        this.userService = userService;
        this.dockerService = dockerService;
        this.activityService = activityService;
        this.labArtifactService = labArtifactService;
    }

    @Transactional(readOnly = true)
    public List<LabDto> getAllLabs() {
        return labRepository.findByStatus(com.sechub.entity.LearningPath.PublicationStatus.PUBLISHED)
                .stream()
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
    public List<LabDto> getByVulnerabilityId(UUID vulnerabilityId) {
        return labRepository.findByVulnerabilityId(vulnerabilityId)
                .stream()
                .filter(lab -> lab.getStatus() == com.sechub.entity.LearningPath.PublicationStatus.PUBLISHED)
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
            LabAttempt running = existing.get();
            if (running.getExpiresAt() == null) {
                running.setExpiresAt(LocalDateTime.now().plusMinutes(labDuration(lab)));
                running = labAttemptRepository.save(running);
            }
            if (running.getRuntimeToken() == null || running.getRuntimeToken().isBlank()) {
                running.setRuntimeToken(UUID.randomUUID().toString().replace("-", ""));
                running = labAttemptRepository.save(running);
            }
            return LabAttemptDto.fromEntity(running);
        }

        // Create the attempt record first (status STARTED) to get a database ID
        LabAttempt attempt = LabAttempt.builder()
                .user(user)
                .lab(lab)
                .status(LabAttempt.Status.STARTED)
                .startedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(labDuration(lab)))
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
            throw new BadRequestException("Không thể khởi động môi trường lab: " + e.getMessage());
        }

        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto stopLab(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Bạn không có quyền dừng phiên thực hành này");
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
            throw new BadRequestException("Bạn không có quyền nộp flag cho phiên thực hành này");
        }

        if (attempt.getStatus() == LabAttempt.Status.COMPLETED) {
            throw new BadRequestException("Phiên thực hành này đã hoàn thành");
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
            throw new BadRequestException("Flag không chính xác. Hãy thử lại!");
        }

        attempt = labAttemptRepository.save(attempt);
        return LabAttemptDto.fromEntity(attempt);
    }

    @Transactional
    public LabAttemptDto useHint(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Bạn không có quyền sử dụng gợi ý cho phiên thực hành này");
        }
        ensureAttemptIsActive(attempt);

        if (!Boolean.TRUE.equals(attempt.getMentorPrompted())) {
            throw new BadRequestException("Hãy hỏi AI mentor để nhận câu hỏi dẫn dắt trước khi mở gợi ý");
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
            throw new BadRequestException("Bạn không có quyền truy cập mentor của phiên này");
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
        return switch (slug) {
            case "sql-injection" -> new String[]{
                    "Đầu vào nào của bạn có khả năng được ghép trực tiếp vào câu truy vấn? Hãy thử làm phản hồi thay đổi trước khi tìm payload hoàn chỉnh.",
                    "Nếu điều kiện truy vấn luôn đúng thì ứng dụng sẽ trả về gì? Chú ý cách đóng chuỗi và phần còn lại của câu lệnh.",
                    "Bạn đã thử so sánh hai request chỉ khác một ký tự nháy hoặc một biểu thức boolean chưa?"};
            case "xss" -> new String[]{
                    "Dữ liệu nào bạn nhập được phản chiếu lại trong HTML, và nó xuất hiện ở ngữ cảnh text, thuộc tính hay script?",
                    "Trình duyệt đang encode ký tự nào? Hãy tìm một ngữ cảnh cho phép thoát khỏi cấu trúc hiện tại.",
                    "Bạn có thể chứng minh JavaScript chạy bằng một hành vi vô hại trước khi xây payload cuối không?"};
            case "idor" -> new String[]{
                    "Request nào chứa định danh tài nguyên thuộc về người dùng hiện tại? Điều gì xảy ra khi chỉ đổi định danh đó?",
                    "Server đang kiểm tra bạn đã đăng nhập, hay thực sự kiểm tra tài nguyên có thuộc về bạn?",
                    "Hãy so sánh phản hồi của hai ID liền kề và tìm dữ liệu mà tài khoản hiện tại không nên thấy."};
            case "ssrf" -> new String[]{
                    "Tham số nào khiến server tự tải một URL thay cho trình duyệt của bạn?",
                    "Có địa chỉ nội bộ hoặc endpoint metadata nào chỉ server mới truy cập được không?",
                    "Hãy quan sát khác biệt về status, thời gian và nội dung khi đổi host đích."};
            case "csrf" -> new String[]{
                    "Hành động nhạy cảm nào đang được thực hiện qua phương thức GET/POST? Yêu cầu này có chứa token bảo mật chống giả mạo nào không?",
                    "Nếu một trang web của bên thứ ba tự động gửi yêu cầu này thay cho nạn nhân (khi họ đã đăng nhập), liệu server có chấp nhận không?",
                    "Hãy thử tạo một form HTML đơn giản tự động gửi (auto-submit) request đó và kiểm tra phản hồi nhận được."};
            case "command-injection" -> new String[]{
                    "Tham số đầu vào nào đang được chuyển tiếp tới một lệnh hệ điều hành? Có ký tự điều khiển lệnh nào bị lọc không?",
                    "Bạn có thể nối thêm lệnh mới bằng các ký tự đặc biệt như ';', '&&', hoặc '|' để kiểm tra phản hồi từ server không?",
                    "Hãy thử chạy một lệnh đọc thư mục đơn giản (ví dụ: 'ls' hoặc 'dir') trước khi tìm cách đọc tệp flag nhạy cảm."};
            case "file-upload" -> new String[]{
                    "Server đang giới hạn phần mở rộng của tệp tải lên (extension) bằng những đuôi tệp nào? Kiểm tra này diễn ra ở client hay server?",
                    "Bạn đã thử đổi tên tệp (ví dụ: '.php.jpg' hoặc '.phtml') hoặc thay đổi HTTP header 'Content-Type' khi tải tệp lên chưa?",
                    "Làm cách nào để bạn kích hoạt hoặc truy cập trực tiếp vào tệp mã nguồn độc hại sau khi tải lên thành công?"};
            case "auth-bypass" -> new String[]{
                    "Ứng dụng đang quản lý phiên đăng nhập của bạn bằng cookie, session hay JWT token? Dữ liệu đó có thể giải mã hoặc chỉnh sửa không?",
                    "Có tham số nào định vị quyền truy cập (như 'role=user' hoặc 'isAdmin=false') mà bạn có thể thay đổi trực tiếp trên request chưa?",
                    "Hãy kiểm tra xem server có xác thực chữ ký (signature) của token hay chỉ đọc phần thông tin giải mã thô."};
            default -> new String[]{
                    "Hãy xác định ranh giới tin cậy: dữ liệu nào do người dùng kiểm soát và được server sử dụng ở đâu?",
                    "Thử thay đổi một tham số mỗi lần và so sánh status, nội dung, thời gian phản hồi.",
                    "Bạn có thể tạo một bằng chứng nhỏ, vô hại cho thấy kiểm soát bảo mật đã bị bỏ qua không?"};
        };
    }

    @Transactional(readOnly = true)
    public List<LabAttemptDto> getUserAttempts(String username) {
        User user = userService.findByUsername(username);
        return labAttemptRepository.findByUserIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(LabAttemptDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LabAttemptDto> getLabAttempts(UUID labId, String username) {
        User user = userService.findByUsername(username);
        return labAttemptRepository.findByUserIdAndLabId(user.getId(), labId)
                .stream()
                .map(LabAttemptDto::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteGeneratedLab(UUID labId, String username) {
        Lab lab = labRepository.findById(labId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", "id", labId));
        if (lab.getArtifactPath() == null || lab.getArtifactPath().isBlank()) {
            throw new BadRequestException("Chỉ có thể xoá bài lab được tạo bởi AI");
        }
        User user = userService.findByUsername(username);
        if (user.getRole() != User.Role.ADMIN && (lab.getAuthor() == null || !lab.getAuthor().getId().equals(user.getId()))) {
            throw new BadRequestException("Bạn chỉ có thể xoá bài lab AI do mình tạo");
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
            throw new BadRequestException("Bạn không có quyền gia hạn phiên này");
        }
        ensureAttemptIsActive(attempt);
        if (attempt.getExtensionCount() != null && attempt.getExtensionCount() >= 1) {
            throw new BadRequestException("Phiên lab này đã được gia hạn một lần");
        }
        LocalDateTime now = LocalDateTime.now();
        if (attempt.getExpiresAt() == null || attempt.getExpiresAt().isAfter(now.plusMinutes(EXTENSION_WINDOW_MINUTES))) {
            throw new BadRequestException("Chỉ có thể xin thêm thời gian khi phiên còn dưới 10 phút");
        }
        attempt.setExpiresAt(attempt.getExpiresAt().plusMinutes(EXTENSION_MINUTES));
        attempt.setExtensionCount(1);
        return LabAttemptDto.fromEntity(labAttemptRepository.save(attempt));
    }

    @Transactional(readOnly = true)
    public LabFeedbackDto getCompletionFeedback(UUID attemptId, String username) {
        LabAttempt attempt = labAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Attempt", "id", attemptId));
        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Bạn không có quyền xem phản hồi của phiên này");
        }
        if (attempt.getStatus() != LabAttempt.Status.COMPLETED) {
            throw new BadRequestException("Hãy hoàn thành bài lab trước khi xem lời giải");
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
        return switch (slug) {
            case "sql-injection" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã điều khiển cấu trúc truy vấn SQL thông qua dữ liệu đầu vào.",
                    "Ứng dụng nối trực tiếp input vào câu lệnh SQL. Payload làm thay đổi điều kiện WHERE nên database trả về dữ liệu mà ứng dụng không dự định cho phép.",
                    "String sql = \"SELECT * FROM users WHERE username='\" + username + \"'\";\nstatement.executeQuery(sql);",
                    "PreparedStatement ps = connection.prepareStatement(\n    \"SELECT * FROM users WHERE username = ?\");\nps.setString(1, username);\nResultSet rows = ps.executeQuery();",
                    List.of("Dùng prepared statement cho mọi giá trị đầu vào", "Không hiển thị lỗi database chi tiết cho người dùng", "Giới hạn quyền của tài khoản database"),
                    "Dữ liệu phải luôn là tham số của truy vấn, không được trở thành một phần cú pháp SQL.");
            case "xss" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã đưa dữ liệu không tin cậy vào HTML mà không encode theo ngữ cảnh.",
                    "Trình duyệt diễn giải payload như mã HTML/JavaScript vì ứng dụng dùng một HTML sink không an toàn.",
                    "result.innerHTML = request.query.q;",
                    "result.textContent = request.query.q;\n// Hoặc encode output theo đúng HTML context",
                    List.of("Dùng textContent khi không cần HTML", "Encode output theo ngữ cảnh", "Bổ sung Content-Security-Policy"),
                    "Phòng chống XSS phải thực hiện tại output sink, không chỉ lọc một vài ký tự đầu vào.");
            case "idor" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã truy cập một đối tượng bằng ID hợp lệ nhưng không thuộc quyền sở hữu của mình.",
                    "Server kiểm tra đối tượng có tồn tại nhưng không kiểm tra người dùng hiện tại có quyền đọc đối tượng đó hay không.",
                    "Profile profile = repository.findById(request.id);\nreturn profile; // thiếu kiểm tra owner",
                    "Profile profile = repository.findByIdAndOwnerId(\n    request.id, currentUser.id);\nif (profile == null) throw new ForbiddenException();\nreturn profile;",
                    List.of("Kiểm tra quyền trên từng đối tượng ở phía server", "Truy vấn theo cả object ID và owner ID", "Không coi UUID khó đoán là cơ chế phân quyền"),
                    "Authentication xác định bạn là ai; authorization quyết định bạn được truy cập đối tượng nào.");
            case "ssrf" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã khiến server gửi request tới một địa chỉ do bạn kiểm soát.",
                    "Ứng dụng chấp nhận URL tùy ý, nên request phía server có thể chạm tới dịch vụ nội bộ mà trình duyệt người dùng không truy cập được.",
                    "return httpClient.get(request.url);",
                    "URI target = validateAgainstAllowlist(request.url);\nrejectPrivateAndLoopbackAddresses(target);\nreturn restrictedClient.get(target);",
                    List.of("Dùng allowlist hostname và protocol", "Chặn loopback, private IP và redirect", "Cô lập network của dịch vụ gọi URL"),
                    "Với SSRF, phải xác thực cả URL ban đầu, DNS resolution và mọi redirect.");
            case "command-injection" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã biến input thành một phần của lệnh hệ điều hành.",
                    "Shell xử lý ký tự phân tách trong payload và thực thi thêm lệnh ngoài ý định ban đầu.",
                    "Runtime.exec(\"ping \" + request.host);",
                    "if (!isValidIp(request.host)) throw new BadRequestException();\nnew ProcessBuilder(\"ping\", \"-c\", \"1\", request.host).start();",
                    List.of("Tránh gọi shell khi có API tương đương", "Truyền tham số bằng argument array", "Validate theo allowlist chặt chẽ"),
                    "Không escape shell bằng blacklist; hãy loại shell khỏi luồng xử lý nếu có thể.");
            case "file-upload" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã tải lên nội dung nguy hiểm qua kiểm tra tệp không đầy đủ.",
                    "Ứng dụng tin tên tệp hoặc Content-Type từ client và lưu tệp vào vị trí có thể được phục vụ/thực thi.",
                    "file.save(upload.originalFilename);",
                    "String safeName = UUID.randomUUID().toString();\nverifyMagicBytes(upload);\nstoreOutsideWebRoot(safeName, upload.bytes());",
                    List.of("Kiểm tra magic bytes và giới hạn kích thước", "Đổi tên tệp phía server", "Lưu ngoài web root và không cấp quyền thực thi"),
                    "Kiểm tra upload cần bao phủ nội dung, vị trí lưu, tên tệp và cách tệp được phục vụ lại.");
            case "csrf" -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã thực hiện hành động bằng phiên đăng nhập của nạn nhân từ một nguồn request khác.",
                    "Trình duyệt tự gửi cookie phiên, còn server không yêu cầu bằng chứng request được tạo từ giao diện hợp lệ.",
                    "POST /transfer\n// Chỉ kiểm tra session cookie",
                    "POST /transfer\nverifyCsrfToken(request.csrfToken, session);\n// Cookie: SameSite=Lax hoặc Strict",
                    List.of("Dùng CSRF token không thể đoán", "Thiết lập SameSite cho cookie", "Kiểm tra Origin cho thao tác nhạy cảm"),
                    "Cookie xác thực người dùng nhưng không chứng minh ý định thực hiện hành động.");
            default -> new LabFeedbackDto(lab.getVulnerability().getName(),
                    "Bạn đã vượt qua một điều kiện xác thực hoặc phân quyền không an toàn.",
                    "Server tin dữ liệu do client cung cấp thay vì tự xác minh danh tính và quyền truy cập.",
                    "if (request.role.equals(\"admin\")) return adminData;",
                    "User user = authenticatedSession.user();\nrequireRole(user, Role.ADMIN);\nreturn adminData;",
                    List.of("Thực thi kiểm tra quyền ở server", "Không tin role/token do client tự khai báo", "Dùng deny-by-default"),
                    "Mọi quyết định bảo mật phải dựa trên trạng thái được server xác minh.");
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
            throw new BadRequestException("Phiên lab không còn hoạt động");
        }
        if (attempt.getExpiresAt() != null && !attempt.getExpiresAt().isAfter(LocalDateTime.now())) {
            dockerService.stopContainer(attempt.getContainerId());
            attempt.setStatus(LabAttempt.Status.EXPIRED);
            attempt.setCompletedAt(LocalDateTime.now());
            labAttemptRepository.save(attempt);
            throw new BadRequestException("Phiên lab đã hết thời gian");
        }
    }

    /** Return session duration based on the lab's estimated time, clamped to a safe range. */
    private int labDuration(Lab lab) {
        int minutes = lab.getEstimatedMinutes() != null ? lab.getEstimatedMinutes() : 30;
        return Math.max(MIN_LAB_DURATION, Math.min(MAX_LAB_DURATION, minutes));
    }
}
