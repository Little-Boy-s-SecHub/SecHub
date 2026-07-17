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

@Service
public class GrowthService {
    private final GrowthProfileRepository profiles; private final UserRepository users;
    private final UserProgressRepository progress; private final LabAttemptRepository attempts;
    private final UserActivityRepository activities; private final LabRepository labs;
    private final FlashcardRepository flashcards;
    private final OpenAiService ai;
    public GrowthService(GrowthProfileRepository profiles,UserRepository users,UserProgressRepository progress,
            LabAttemptRepository attempts,UserActivityRepository activities,LabRepository labs,OpenAiService ai,FlashcardRepository flashcards){
        this.profiles=profiles;this.users=users;this.progress=progress;this.attempts=attempts;this.activities=activities;this.labs=labs;this.ai=ai;this.flashcards=flashcards;
    }

    @Transactional
    public GrowthOverviewDto overview(String username){
        User user=findUser(username); GrowthProfile profile=getProfile(user); LocalDateTime weekStart=LocalDate.now().minusDays(6).atStartOfDay();
        List<LabAttempt> all=attempts.findByUserIdOrderByStartedAtDesc(user.getId());
        List<LabAttempt> completed=all.stream().filter(a->a.getStatus()==LabAttempt.Status.COMPLETED).toList();
        List<UserProgress> learned=progress.findByUserIdAndCompletedTrue(user.getId());
        int totalScore=completed.stream().mapToInt(a->Optional.ofNullable(a.getScore()).orElse(0)).sum();
        int xp=totalScore+learned.size()*25; int level=1+xp/500;
        List<GrowthOverviewDto.SkillDto> skills=skills(completed);
        List<String> badges=badges(skills,completed.size(),learned.size());
        int streak=streak(user,profile); int weekLabs=(int)completed.stream().filter(a->a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)).count();
        int weekLessons=(int)learned.stream().filter(p->p.getCompletedAt()!=null&&p.getCompletedAt().isAfter(weekStart)).count();
        String strongest=skills.stream().max(Comparator.comparingInt(GrowthOverviewDto.SkillDto::xp)).map(GrowthOverviewDto.SkillDto::name).orElse("Chưa có");
        String weak=skills.stream().min(Comparator.comparingInt(GrowthOverviewDto.SkillDto::xp)).map(GrowthOverviewDto.SkillDto::name).orElse("Hoàn thành lab đầu tiên");
        var report=new GrowthOverviewDto.WeeklyReportDto(weekLabs,weekLessons,
                completed.stream().filter(a->a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)).mapToInt(a->a.getScore()==null?0:a.getScore()).sum()+weekLessons*25,
                strongest,weak,"Ôn " + weak + " bằng flashcard và một lab biến thể.");
        boolean dailyDone=flashcards.countByUserIdAndLastReviewedAtAfter(user.getId(),LocalDate.now().atStartOfDay())>0
                ||completed.stream().anyMatch(a->a.getCompletedAt()!=null&&a.getCompletedAt().toLocalDate().equals(LocalDate.now())&&a.getLab().getTitle().startsWith("Daily "));
        boolean weeklyDone=completed.stream().anyMatch(a->a.getCompletedAt()!=null&&a.getCompletedAt().isAfter(weekStart)&&a.getLab().getTitle().startsWith("Weekly "));
        List<String> notices=new ArrayList<>();
        labs.findAll().stream().filter(l->l.getArtifactPath()!=null)
                .filter(l->l.getStatus()==LearningPath.PublicationStatus.PUBLISHED)
                .filter(l->!l.getTitle().startsWith("Daily ")&&!l.getTitle().startsWith("Weekly "))
                .sorted(Comparator.comparing(Lab::getCreatedAt,Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(1).forEach(l->notices.add("Có lab mới về "+l.getVulnerability().getName()+": "+l.getTitle()));
        return new GrowthOverviewDto(Boolean.TRUE.equals(user.getOnboardingRequired()),Boolean.TRUE.equals(profile.getAssessmentCompleted()),profile.getRecommendedTrack(),profile.getAssessmentScore(),xp,level,streak,
                profile.getFreezeTickets(),levelTitle(level),skills,badges,
                new GrowthOverviewDto.MissionDto("Ôn tập hằng ngày","Hoàn thành flashcard đến hạn hoặc Daily Lab.","/review",12,dailyDone),
                new GrowthOverviewDto.MissionDto("Thử thách tuần","Giải một tình huống thực tế biến thể từ kỹ năng đã học.","/growth?weekly=1",15,weeklyDone),report,notices);
    }

    @Transactional
    public GrowthOverviewDto assess(String username, AssessmentRequest request){
        if(request.answers()==null||request.answers().size()!=5) throw new BadRequestException("Bài đánh giá cần đủ 5 câu trả lời");
        int[] correct={1,2,1,2,1}; int score=0; for(int i=0;i<5;i++) if(Objects.equals(request.answers().get(i),correct[i])) score+=20;
        String track=score<40?"BEGINNER":score<80?"WEB_DEVELOPER":"PENTESTER";
        User user=findUser(username);GrowthProfile p=getProfile(user);p.setAssessmentCompleted(true);p.setAssessmentScore(score);p.setRecommendedTrack(track);p.setUpdatedAt(LocalDateTime.now());profiles.save(p);
        user.setOnboardingRequired(false);users.save(user);
        return overview(username);
    }

    @Transactional
    public LabDto weeklyLab(String username){
        User user=findUser(username); int week=LocalDate.now().get(WeekFields.ISO.weekOfWeekBasedYear());
        int year=LocalDate.now().get(WeekFields.ISO.weekBasedYear());
        String title="Weekly "+year+"-W"+week+" - "+user.getUsername();
        return LabDto.fromEntity(labs.findFirstByTitle(title).orElseGet(()->{
            LabAttempt source=attempts.findByUserIdOrderByStartedAtDesc(user.getId()).stream().filter(a->a.getStatus()==LabAttempt.Status.COMPLETED).findFirst()
                    .orElseThrow(()->new BadRequestException("Hoàn thành một lab để mở thử thách tuần"));
            String next=source.getLab().getDifficulty()==LearningPath.Difficulty.BEGINNER?"INTERMEDIATE":"ADVANCED";
            Lab lab=ai.generateAndSaveLab(source.getLab().getVulnerability().getSlug(),next,
                    "LESSON TITLE: Weekly challenge từ "+source.getLab().getTitle()+"\nLESSON CONTENT: Đổi bối cảnh, tham số và dữ liệu nhưng giữ nguyên mục tiêu kỹ thuật. Tạo thử thách 15 phút khó hơn.\nREQUIREMENT: Không lặp lại dữ liệu hoặc flag cũ.");
            lab.setTitle(title);lab.setAuthor(user);return labs.save(lab);
        }));
    }

    @Transactional
    public LabDto harderVariant(String username,UUID attemptId){
        User user=findUser(username);LabAttempt source=attempts.findById(attemptId).orElseThrow(()->new ResourceNotFoundException("Attempt","id",attemptId));
        if(!source.getUser().getId().equals(user.getId())||source.getStatus()!=LabAttempt.Status.COMPLETED) throw new BadRequestException("Chỉ tạo bản khó hơn từ lab bạn đã hoàn thành");
        String diff=source.getLab().getDifficulty()==LearningPath.Difficulty.BEGINNER?"INTERMEDIATE":"ADVANCED";
        Lab variant=ai.generateAndSaveLab(source.getLab().getVulnerability().getSlug(),diff,
                "Tạo bản khó hơn từ lab \""+source.getLab().getTitle()+"\". Đổi bối cảnh, endpoint, dữ liệu và flag; giữ đúng mục tiêu kỹ thuật.");
        variant.setAuthor(user);return LabDto.fromEntity(labs.save(variant));
    }

    @Transactional(readOnly=true)
    public PublicProfileDto publicProfile(String username){
        User user=findUser(username);List<LabAttempt> completed=attempts.findByUserIdAndStatus(user.getId(),LabAttempt.Status.COMPLETED);
        int learned=progress.findByUserIdAndCompletedTrue(user.getId()).size();int xp=completed.stream().mapToInt(a->Optional.ofNullable(a.getScore()).orElse(0)).sum()+learned*25;
        int level=1+xp/500;List<GrowthOverviewDto.SkillDto> userSkills=skills(completed);List<String> userBadges=badges(userSkills,completed.size(),learned);
        return new PublicProfileDto(username,xp,level,levelTitle(level),completed.size(),userSkills,userBadges,
                username+" đạt cấp "+level+" trên SecHub với "+completed.size()+" lab hoàn thành. Không chia sẻ flag hoặc payload.");
    }

    @Transactional(readOnly=true)
    public List<LeaderboardEntryDto> leaderboard(String track){
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
            String strongest=skills(weekAttempts).stream().findFirst().map(GrowthOverviewDto.SkillDto::name).orElse("Chưa có");
            return new LeaderboardEntryDto(user.getUsername(),userTrack,weeklyXp,weekAttempts.size(),weekLessons.size(),strongest);
        }).filter(Objects::nonNull).filter(entry->entry.weeklyXp()>0)
                .sorted(Comparator.comparingInt(LeaderboardEntryDto::weeklyXp).reversed()).limit(20).toList();
    }

    private List<GrowthOverviewDto.SkillDto> skills(List<LabAttempt> completed){
        return completed.stream().collect(Collectors.groupingBy(a->a.getLab().getVulnerability())).entrySet().stream().map(e->{
            int score=e.getValue().stream().mapToInt(a->a.getScore()==null?0:a.getScore()).sum();int hints=(int)Math.round(e.getValue().stream().mapToInt(a->a.getHintsUsed()==null?0:a.getHintsUsed()).average().orElse(0));
            return new GrowthOverviewDto.SkillDto(e.getKey().getSlug(),e.getKey().getName(),score,Math.min(5,1+score/300),e.getValue().size(),hints);
        }).sorted(Comparator.comparingInt(GrowthOverviewDto.SkillDto::xp).reversed()).toList();
    }
    private List<String> badges(List<GrowthOverviewDto.SkillDto> skills,int labsDone,int lessons){
        List<String>b=new ArrayList<>();if(labsDone>0)b.add("First Blood");if(labsDone>=5)b.add("Lab Explorer");if(lessons>=10)b.add("Knowledge Builder");
        skills.stream().filter(s->s.completedLabs()>=3).forEach(s->b.add("Specialist: "+s.name()));return b;
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
    private GrowthProfile getProfile(User u){return profiles.findByUserId(u.getId()).orElseGet(()->profiles.save(GrowthProfile.builder().user(u).recommendedTrack("BEGINNER").build()));}
    private User findUser(String username){return users.findByUsername(username).orElseThrow(()->new ResourceNotFoundException("User","username",username));}
    private String levelTitle(int l){return l>=10?"Security Specialist":l>=6?"Web Pentester":l>=3?"Security Apprentice":"Newcomer";}
}
