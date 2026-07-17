package com.sechub.service;

import com.sechub.dto.*;
import com.sechub.entity.*;
import com.sechub.exception.*;
import com.sechub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class AuthorService {
    private final UserService users; private final LearningPathRepository paths; private final LessonRepository lessons;
    private final LabRepository labs; private final VulnerabilityRepository vulnerabilities; private final OpenAiService ai;
    private final LabArtifactService artifacts;
    public AuthorService(UserService users, LearningPathRepository paths, LessonRepository lessons, LabRepository labs,
            VulnerabilityRepository vulnerabilities, OpenAiService ai, LabArtifactService artifacts) {
        this.users=users;this.paths=paths;this.lessons=lessons;this.labs=labs;this.vulnerabilities=vulnerabilities;this.ai=ai;this.artifacts=artifacts;
    }

    @Transactional(readOnly=true)
    public AuthorWorkspaceDto workspace(String username) {
        User user=users.findByUsername(username);
        return new AuthorWorkspaceDto(paths.findByAuthorIdOrderBySortOrderAsc(user.getId()).stream().map(LearningPathDto::fromEntity).toList(),
                labs.findByAuthorIdOrderByCreatedAtDesc(user.getId()).stream().map(LabDto::fromEntity).toList());
    }

    @Transactional
    public LearningPathDto createPath(String username, AuthorPathRequest request) {
        if(request.title()==null||request.title().isBlank())throw new BadRequestException("Tên lộ trình không được để trống");
        LearningPath path=LearningPath.builder().author(users.findByUsername(username)).title(request.title().trim())
                .description(request.description()).difficulty(parseDifficulty(request.difficulty()))
                .estimatedHours(request.estimatedHours()==null?1:Math.max(1,request.estimatedHours()))
                .status(LearningPath.PublicationStatus.DRAFT).build();
        return LearningPathDto.fromEntity(paths.save(path));
    }

    @Transactional
    public LessonDto addLesson(String username, UUID pathId, AuthorLessonRequest request) {
        LearningPath path=ownedPath(username,pathId);
        Vulnerability vulnerability=request.vulnerabilityId()==null?null:vulnerabilities.findById(request.vulnerabilityId()).orElse(null);
        Lesson lesson=Lesson.builder().learningPath(path).title(request.title()).contentMarkdown(request.contentMarkdown())
                .learningObjective(request.learningObjective()).estimatedMinutes(request.estimatedMinutes()==null?12:request.estimatedMinutes())
                .sortOrder(path.getLessons().size()+1).vulnerability(vulnerability).build();
        path.getLessons().add(lesson); lessons.save(lesson); paths.save(path); return LessonDto.fromEntity(lesson);
    }

    @Transactional
    public LabDto createChallenge(String username, AuthorLabRequest request) {
        User author=users.findByUsername(username);
        Lab lab=ai.generateAndSaveLab(request.vulnerabilitySlug(),request.difficulty(),
                "AUTHOR CHALLENGE: "+request.title()+"\n"+(request.scenario()==null?"":request.scenario())+"\nREQUIREMENT: Tạo challenge cô lập, đổi toàn bộ dữ liệu và flag.");
        if(request.title()!=null&&!request.title().isBlank())lab.setTitle(request.title().trim());
        lab.setAuthor(author);lab.setStatus(LearningPath.PublicationStatus.DRAFT);return LabDto.fromEntity(labs.save(lab));
    }

    @Transactional
    public void publishPath(String username,UUID id){LearningPath path=ownedPath(username,id);if(path.getLessons().isEmpty())throw new BadRequestException("Cần ít nhất một bài học trước khi xuất bản");path.setStatus(LearningPath.PublicationStatus.PUBLISHED);paths.save(path);}
    @Transactional
    public void publishLab(String username,UUID id){Lab lab=ownedLab(username,id);lab.setStatus(LearningPath.PublicationStatus.PUBLISHED);labs.save(lab);}
    @Transactional
    public void deletePath(String username,UUID id){LearningPath path=ownedPath(username,id);if(path.getStatus()!=LearningPath.PublicationStatus.DRAFT)throw new BadRequestException("Chỉ có thể xoá lộ trình đang ở bản nháp");paths.delete(path);}
    @Transactional
    public void deleteLab(String username,UUID id){Lab lab=ownedLab(username,id);if(lab.getStatus()!=LearningPath.PublicationStatus.DRAFT)throw new BadRequestException("Chỉ có thể xoá challenge đang ở bản nháp");labs.delete(lab);artifacts.deleteArtifact(lab.getArtifactPath());}
    private LearningPath ownedPath(String username,UUID id){User u=users.findByUsername(username);LearningPath p=paths.findById(id).orElseThrow(()->new ResourceNotFoundException("Learning path","id",id));if(p.getAuthor()==null||(!p.getAuthor().getId().equals(u.getId())&&u.getRole()!=User.Role.ADMIN))throw new BadRequestException("Bạn không sở hữu nội dung này");return p;}
    private Lab ownedLab(String username,UUID id){User u=users.findByUsername(username);Lab l=labs.findById(id).orElseThrow(()->new ResourceNotFoundException("Lab","id",id));if(l.getAuthor()==null||(!l.getAuthor().getId().equals(u.getId())&&u.getRole()!=User.Role.ADMIN))throw new BadRequestException("Bạn không sở hữu nội dung này");return l;}
    private LearningPath.Difficulty parseDifficulty(String v){try{return LearningPath.Difficulty.valueOf(v==null?"BEGINNER":v.toUpperCase());}catch(Exception e){throw new BadRequestException("Độ khó không hợp lệ");}}
}
