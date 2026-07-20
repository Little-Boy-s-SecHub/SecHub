package com.sechub.service;

import com.sechub.dto.*;
import com.sechub.entity.*;
import com.sechub.exception.*;
import com.sechub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.WeekFields;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import com.sechub.support.LocaleHolder;

@Service
public class GrowthService {
    private final GrowthProfileRepository profiles; private final UserRepository users;
    private final UserProgressRepository progress; private final LabAttemptRepository attempts;
    private final UserActivityRepository activities; private final LabRepository labs;
    private final FlashcardRepository flashcards;
    private final OpenAiService ai;
    private final LessonRepository lessonRepository;
    public GrowthService(GrowthProfileRepository profiles,UserRepository users,UserProgressRepository progress,
            LabAttemptRepository attempts,UserActivityRepository activities,LabRepository labs,OpenAiService ai,
            FlashcardRepository flashcards, LessonRepository lessonRepository){
        this.profiles=profiles;this.users=users;this.progress=progress;this.attempts=attempts;this.activities=activities;this.labs=labs;this.ai=ai;this.flashcards=flashcards;
        this.lessonRepository=lessonRepository;
    }

    private boolean isVi(String lang) {
        return lang != null && lang.toLowerCase().startsWith("vi");
    }

    @Transactional
    public GrowthOverviewDto overview(String username) {
        return overview(username, "en");
    }

    @Transactional
    public GrowthOverviewDto overview(String username, String lang){
        User user=findUser(username); GrowthProfile profile=getProfile(user); LocalDateTime weekStart=LocalDate.now().minusDays(6).atStartOfDay();
        List<LabAttempt> all=attempts.findByUserIdOrderByStartedAtDesc(user.getId());
        List<LabAttempt> completed=all.stream().filter(a->a.getStatus()==LabAttempt.Status.COMPLETED).toList();
        List<UserProgress> learned=progress.findByUserIdAndCompletedTrue(user.getId());
        List<Lab> publishedLabs=labs.findByStatus(LearningPath.PublicationStatus.PUBLISHED).stream()
                .filter(l -> l.getAuthor() == null || l.getAuthor().getId().equals(user.getId()))
                .toList();
        int totalScore=completed.stream().mapToInt(a->Optional.ofNullable(a.getScore()).orElse(0)).sum();
        int xp=totalScore+learned.size()*25; int level=1+xp/500;
        List<GrowthOverviewDto.SkillDto> skills=skills(completed,publishedLabs);
        List<String> badges=badges(skills,completed.size(),learned.size(),completed);
        int streak=streak(user,profile); int weekLabs=(int)completed.stream().filter(a->a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)).count();
        int weekLessons=(int)learned.stream().filter(p->p.getCompletedAt()!=null&&p.getCompletedAt().isAfter(weekStart)).count();
        
        boolean isVi = isVi(lang);
        String strongest=skills.stream().max(Comparator.comparingInt(GrowthOverviewDto.SkillDto::xp)).map(GrowthOverviewDto.SkillDto::name).orElse(isVi ? "Chưa có" : "None yet");
        String weak=skills.stream().min(Comparator.comparingInt(GrowthOverviewDto.SkillDto::xp)).map(GrowthOverviewDto.SkillDto::name).orElse(isVi ? "Hoàn thành lab đầu tiên" : "Complete your first lab");
        
        String recommendation = isVi ? "Ôn tập chuyên đề bằng flashcard và các bài thực hành lab." : "Review topics using flashcards and practical lab exercises.";
        if (!"Hoàn thành lab đầu tiên".equals(weak) && !"Chưa có".equals(weak) && !"None yet".equals(weak) && !"Complete your first lab".equals(weak)) {
            java.util.Set<UUID> completedLessonIds = learned.stream().map(p -> p.getLesson().getId()).collect(Collectors.toSet());
            var weakLessons = lessonRepository.findByVulnerabilityNameOrSlug(weak);
            
            var uncompletedLesson = weakLessons.stream()
                    .filter(l -> !completedLessonIds.contains(l.getId()))
                    .findFirst();
            if (uncompletedLesson.isPresent()) {
                Lesson l = uncompletedLesson.get();
                recommendation = isVi 
                        ? "Đọc bài: " + l.getTitle() + " (Lộ trình " + l.getLearningPath().getTitle() + ")"
                        : "Read lesson: " + l.getTitle() + " (Path: " + l.getLearningPath().getTitle() + ")";
            } else if (!weakLessons.isEmpty()) {
                Lesson l = weakLessons.get(0);
                recommendation = isVi 
                        ? "Ôn tập lại bài: " + l.getTitle()
                        : "Review lesson: " + l.getTitle();
            }
        }
        
        var report=new GrowthOverviewDto.WeeklyReportDto(weekLabs,weekLessons,
                completed.stream().filter(a->a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)).mapToInt(a->a.getScore()==null?0:a.getScore()).sum()+weekLessons*25,
                strongest,weak,recommendation);
        boolean dailyDone=flashcards.countByUserIdAndLastReviewedAtAfter(user.getId(),LocalDate.now().atStartOfDay())>0
                ||completed.stream().anyMatch(a->a.getCompletedAt()!=null&&a.getCompletedAt().toLocalDate().equals(LocalDate.now())&&a.getLab().getTitle().startsWith("Daily "));
        boolean weeklyDone=completed.stream().anyMatch(a->a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)&&a.getLab().getTitle().startsWith("Weekly "));
        return new GrowthOverviewDto(Boolean.TRUE.equals(user.getOnboardingRequired()),Boolean.TRUE.equals(profile.getAssessmentCompleted()),profile.getRecommendedTrack(),profile.getAssessmentScore(),xp,level,streak,
                profile.getFreezeTickets(),levelTitle(level, isVi),skills,badges,
                new GrowthOverviewDto.MissionDto(isVi ? "Ôn tập hằng ngày" : "Daily Review", isVi ? "Hoàn thành flashcard đến hạn hoặc Daily Lab." : "Complete due flashcards or Daily Lab.", "/review", 12, dailyDone),
                new GrowthOverviewDto.MissionDto(isVi ? "Thử thách tuần" : "Weekly Challenge", isVi ? "Giải một tình huống thực tế biến thể từ kỹ năng đã học." : "Solve a real-world variant challenge based on learned skills.", "/growth?weekly=1", 15, weeklyDone),report,List.of());
    }

    @Transactional
    public GrowthOverviewDto assess(String username, AssessmentRequest request) {
        return assess(username, request, "en");
    }

    @Transactional
    public GrowthOverviewDto assess(String username, AssessmentRequest request, String lang){
        if(request.answers()==null||request.answers().size()!=5) throw new BadRequestException(isVi(lang) ? "Bài đánh giá cần đủ 5 câu trả lời" : "Assessment needs at least 5 answers");
        int[] correct={1,2,1,2,1}; int score=0; for(int i=0;i<5;i++) if(Objects.equals(request.answers().get(i),correct[i])) score+=20;
        String track=score<40?"BEGINNER":score<80?"WEB_DEVELOPER":"PENTESTER";
        User user=findUser(username);GrowthProfile p=getProfile(user);p.setAssessmentCompleted(true);p.setAssessmentScore(score);p.setRecommendedTrack(track);p.setUpdatedAt(LocalDateTime.now());profiles.save(p);
        user.setOnboardingRequired(false);users.save(user);
        return overview(username, lang);
    }

    @Transactional
    public LabDto weeklyLab(String username){
        User user=findUser(username); int week=LocalDate.now().get(WeekFields.ISO.weekOfWeekBasedYear());
        int year=LocalDate.now().get(WeekFields.ISO.weekBasedYear());
        String title="Weekly "+year+"-W"+week+" - "+user.getUsername();
        return LabDto.fromEntity(labs.findFirstByTitle(title).orElseGet(()->{
            LabAttempt source=attempts.findByUserIdOrderByStartedAtDesc(user.getId()).stream().filter(a->a.getStatus()==LabAttempt.Status.COMPLETED).findFirst()
                    .orElseThrow(()->new BadRequestException(LocaleHolder.isEn() ? "Complete a lab to unlock the weekly challenge" : "Hoàn thành một lab để mở thử thách tuần"));
            String next=source.getLab().getDifficulty()==LearningPath.Difficulty.BEGINNER?"INTERMEDIATE":"ADVANCED";
            GrowthProfile profile=getProfile(user);
            String track=profile.getRecommendedTrack();
            String adaptiveDifficulty=adaptiveDifficulty(next, track);
            Lab lab=ai.generateAndSaveLab(source.getLab().getVulnerability().getSlug(),adaptiveDifficulty,
                    LocaleHolder.isEn() ? "LESSON TITLE: Weekly challenge from "+source.getLab().getTitle()+"\nLESSON CONTENT: Change context, parameters and data but keep the technical objective. Create a harder 15-minute challenge.\nLEARNER TRACK: "+track+"\nREQUIREMENT: Do not reuse old data or flags. Adjust complexity to match proficiency." : "LESSON TITLE: Weekly challenge từ "+source.getLab().getTitle()+"\nLESSON CONTENT: Đổi bối cảnh, tham số và dữ liệu nhưng giữ nguyên mục tiêu kỹ thuật. Tạo thử thách 15 phút khó hơn.\nLEARNER TRACK: "+track+"\nREQUIREMENT: Không lặp lại dữ liệu hoặc flag cũ. Điều chỉnh độ phức tạp phù hợp với trình độ.", "en", user);
            lab.setTitle(title);return labs.save(lab);
        }));
    }

    @Transactional
    public LabDto harderVariant(String username,UUID attemptId){
        User user=findUser(username);LabAttempt source=attempts.findById(attemptId).orElseThrow(()->new ResourceNotFoundException("Attempt","id",attemptId));
        if(!source.getUser().getId().equals(user.getId())||source.getStatus()!=LabAttempt.Status.COMPLETED) throw new BadRequestException(LocaleHolder.isEn() ? "You can only create harder versions from labs you've completed" : "Chỉ tạo bản khó hơn từ lab bạn đã hoàn thành");
        String diff=source.getLab().getDifficulty()==LearningPath.Difficulty.BEGINNER?"INTERMEDIATE":"ADVANCED";
        GrowthProfile profile=getProfile(user);
        String track=profile.getRecommendedTrack();
        String adaptiveDifficulty=adaptiveDifficulty(diff, track);
        Lab variant=ai.generateAndSaveLab(source.getLab().getVulnerability().getSlug(),adaptiveDifficulty,
                LocaleHolder.isEn() ? "Create a harder variant from lab \""+source.getLab().getTitle()+"\". Change context, endpoints, data and flag; keep the technical objective.\nLEARNER TRACK: "+track+"\nREQUIREMENT: Match the learner's proficiency level." : "Tạo bản khó hơn từ lab \""+source.getLab().getTitle()+"\". Đổi bối cảnh, endpoint, dữ liệu và flag; giữ đúng mục tiêu kỹ thuật.\nLEARNER TRACK: "+track+"\nREQUIREMENT: Phù hợp với trình độ người dùng.", "en", user);
        return LabDto.fromEntity(labs.save(variant));
    }

    @Transactional(readOnly=true)
    public PublicProfileDto publicProfile(String username){
        return publicProfile(username, "en");
    }

    @Transactional(readOnly=true)
    public PublicProfileDto publicProfile(String username, String lang){
        boolean isVi = isVi(lang);
        User user=findUser(username);List<LabAttempt> completed=attempts.findByUserIdAndStatus(user.getId(),LabAttempt.Status.COMPLETED);
        int learned=progress.findByUserIdAndCompletedTrue(user.getId()).size();int xp=completed.stream().mapToInt(a->Optional.ofNullable(a.getScore()).orElse(0)).sum()+learned*25;
        int level=1+xp/500;List<GrowthOverviewDto.SkillDto> userSkills=skills(completed);List<String> userBadges=badges(userSkills,completed.size(),learned,completed);
        String shareText = isVi 
                ? username + " đạt cấp " + level + " trên SecHub với " + completed.size() + " lab hoàn thành. Không chia sẻ flag hoặc payload."
                : username + " reached level " + level + " on SecHub with " + completed.size() + " labs completed. Do not share flags or payloads.";
        return new PublicProfileDto(username,xp,level,levelTitle(level, isVi),completed.size(),userSkills,userBadges,shareText);
    }
    @Transactional(readOnly=true)
    public List<com.sechub.dto.UserActivityDto> publicProfileActivities(String username){
        User user=findUser(username);
        return activities.findByUserIdAndActivityDateAfter(user.getId(), LocalDate.now().minusDays(365))
                .stream()
                .map(a -> new com.sechub.dto.UserActivityDto(a.getActivityDate().toString(), a.getCount()))
                .toList();
    }

    @Transactional(readOnly=true)
    public List<LeaderboardEntryDto> leaderboard(String track){
        return leaderboard(track, "en");
    }

    @Transactional(readOnly=true)
    public List<LeaderboardEntryDto> leaderboard(String track, String lang){
        boolean isVi = isVi(lang);
        LocalDateTime weekStart=LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        return users.findAll().stream().map(user->{
            GrowthProfile profile=profiles.findByUserId(user.getId()).orElse(null);
            String userTrack=profile==null?"BEGINNER":profile.getRecommendedTrack();
            if(track!=null&&!track.isBlank()&&!userTrack.equalsIgnoreCase(track))return null;
            List<LabAttempt> weekAttempts=attempts.findByUserIdOrderByStartedAtDesc(user.getId()).stream()
                    .filter(a->a.getStatus()==LabAttempt.Status.COMPLETED&&a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)).toList();
            List<UserProgress> weekLessons=progress.findByUserIdAndCompletedTrue(user.getId()).stream()
                    .filter(p->p.getCompletedAt()!=null&&p.getCompletedAt().isAfter(weekStart)).toList();
            int weeklyXp=weekAttempts.stream().mapToInt(a->Optional.ofNullable(a.getScore()).orElse(0)).sum()+weekLessons.size()*25;
            String strongest=skills(weekAttempts).stream().findFirst().map(GrowthOverviewDto.SkillDto::name).orElse(isVi ? "Chưa có" : "None yet");
            return new LeaderboardEntryDto(user.getUsername(),userTrack,weeklyXp,weekAttempts.size(),weekLessons.size(),strongest);
        }).filter(Objects::nonNull).filter(entry->entry.weeklyXp()>0)
                .sorted(Comparator.comparingInt(LeaderboardEntryDto::weeklyXp).reversed()).limit(20).toList();
    }

    private List<GrowthOverviewDto.SkillDto> skills(List<LabAttempt> completed){
        return skills(completed, labs.findByStatus(LearningPath.PublicationStatus.PUBLISHED));
    }
    private List<GrowthOverviewDto.SkillDto> skills(List<LabAttempt> completed, List<Lab> availableLabs){
        var allVulns = availableLabs.stream()
                .map(Lab::getVulnerability)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Vulnerability::getSlug, v -> v, (v1, v2) -> v1))
                .values();
        var completedMap = completed.stream()
                .collect(Collectors.groupingBy(a -> a.getLab().getVulnerability().getSlug()));
                
        return allVulns.stream().map(v -> {
            var attemptsList = completedMap.get(v.getSlug());
            if (attemptsList != null && !attemptsList.isEmpty()) {
                int score = attemptsList.stream().mapToInt(a -> a.getScore() == null ? 0 : a.getScore()).sum();
                int hints = (int) Math.round(attemptsList.stream().mapToInt(a -> a.getHintsUsed() == null ? 0 : a.getHintsUsed()).average().orElse(0));
                return new GrowthOverviewDto.SkillDto(v.getSlug(), v.getName(), score, Math.min(5, 1 + score / 300), attemptsList.size(), hints);
            } else {
                return new GrowthOverviewDto.SkillDto(v.getSlug(), v.getName(), 0, 1, 0, 0);
            }
        }).sorted(Comparator.comparingInt(GrowthOverviewDto.SkillDto::xp).reversed()).toList();
    }
    private List<String> badges(List<GrowthOverviewDto.SkillDto> skills, int labsDone, int lessons, List<LabAttempt> completed) {
        List<String> b = new ArrayList<>();
        if (labsDone > 0) b.add("First Blood");
        if (labsDone >= 5) b.add("Lab Explorer");
        if (lessons >= 10) b.add("Knowledge Builder");
        
        // Huy hiệu chuyên gia theo kỹ năng (Specialist badges)
        for (var s : skills) {
            if (s.completedLabs() >= 2) {
                if (s.name().toLowerCase().contains("sql injection")) {
                    b.add("SQLi Slayer");
                } else if (s.name().toLowerCase().contains("idor") || s.name().toLowerCase().contains("direct object reference")) {
                    b.add("IDOR Guardian");
                } else if (s.name().toLowerCase().contains("xss") || s.name().toLowerCase().contains("cross-site scripting")) {
                    b.add("XSS Sweeper");
                } else if (s.name().toLowerCase().contains("access control") || s.name().toLowerCase().contains("broken access")) {
                    b.add("Access Defender");
                } else {
                    b.add("Specialist: " + s.name());
                }
            }
        }
        
        // Huy hiệu hiệu năng kỹ năng
        boolean perfectRun = completed.stream().anyMatch(a -> a.getHintsUsed() != null && a.getHintsUsed() == 0);
        if (perfectRun) {
            b.add("Perfect Run");
        }
        
        boolean zeroHintsSpecialist = skills.stream().anyMatch(s -> s.completedLabs() >= 2 && s.averageHints() == 0);
        if (zeroHintsSpecialist) {
            b.add("Zero Hint Legend");
        }
        
        return b;
    }
    private int streak(User user,GrowthProfile p){
        Set<LocalDate> dates=activities.findByUserIdAndActivityDateAfter(user.getId(),LocalDate.now().minusDays(90)).stream().map(UserActivity::getActivityDate).collect(Collectors.toSet());
        int count=0;LocalDate d=dates.contains(LocalDate.now())?LocalDate.now():LocalDate.now().minusDays(1);boolean freeze=false;
        while(dates.contains(d)||(!freeze&&p.getFreezeTickets()>0&&dates.contains(d.minusDays(1)))){
            if(dates.contains(d))count++;else{
                freeze=true;count++;
                if(!d.equals(p.getLastFreezeDate())){p.setFreezeTickets(Math.max(0,p.getFreezeTickets()-1));p.setLastFreezeDate(d);profiles.save(p);}
            }
            d=d.minusDays(1);
        }
        if(count>0&&count%7==0&&!LocalDate.now().equals(p.getUpdatedAt().toLocalDate())){p.setFreezeTickets(Math.min(3,p.getFreezeTickets()+1));p.setUpdatedAt(LocalDateTime.now());profiles.save(p);}
        return count;
    }
    @Transactional
    public GrowthOverviewDto updateTrack(String username, String track) {
        return updateTrack(username, track, "en");
    }
    @Transactional
    public GrowthOverviewDto updateTrack(String username, String track, String lang) {
        User user = findUser(username);
        GrowthProfile p = getProfile(user);
        p.setRecommendedTrack(track);
        p.setUpdatedAt(LocalDateTime.now());
        profiles.save(p);
        return overview(username, lang);
    }
    @Transactional
    public GrowthOverviewDto resetOnboarding(String username) {
        return resetOnboarding(username, "en");
    }
    @Transactional
    public GrowthOverviewDto resetOnboarding(String username, String lang) {
        User user = findUser(username);
        user.setOnboardingRequired(true);
        users.save(user);
        GrowthProfile p = getProfile(user);
        p.setAssessmentCompleted(false);
        p.setAssessmentScore(0);
        p.setUpdatedAt(LocalDateTime.now());
        profiles.save(p);
        return overview(username, lang);
    }
    private String adaptiveDifficulty(String requested, String track) {
        int requestedLevel = switch (requested == null ? "BEGINNER" : requested.toUpperCase()) {
            case "ADVANCED" -> 2; case "INTERMEDIATE" -> 1; default -> 0;
        };
        int learnerLevel = switch (track == null ? "BEGINNER" : track) {
            case "PENTESTER" -> 2; case "WEB_DEVELOPER" -> 1; default -> 0;
        };
        return new String[]{"BEGINNER", "INTERMEDIATE", "ADVANCED"}[Math.max(requestedLevel, learnerLevel)];
    }
    private GrowthProfile getProfile(User u){return profiles.findByUserId(u.getId()).orElseGet(()->profiles.save(GrowthProfile.builder().user(u).recommendedTrack("BEGINNER").build()));}
    private User findUser(String username){return users.findByUsername(username).orElseThrow(()->new ResourceNotFoundException("User","username",username));}
    private String levelTitle(int l) {
        return levelTitle(l, false);
    }
    private String levelTitle(int l, boolean isVi){
        if (isVi) {
            return l>=10?"Chuyên gia bảo mật":l>=6?"Web Pentester":l>=3?"Tập sự bảo mật":"Người mới";
        } else {
            return l>=10?"Security Specialist":l>=6?"Web Pentester":l>=3?"Security Apprentice":"Newcomer";
        }
    }
}
