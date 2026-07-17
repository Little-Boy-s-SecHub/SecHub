package com.sechub.controller;
import com.sechub.dto.*;import com.sechub.service.GrowthService;
import org.springframework.http.ResponseEntity;import org.springframework.security.core.annotation.AuthenticationPrincipal;import org.springframework.security.core.userdetails.UserDetails;import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/growth")
public class GrowthController{
 private final GrowthService service;public GrowthController(GrowthService service){this.service=service;}
 @GetMapping public ResponseEntity<ApiResponse<GrowthOverviewDto>> overview(@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.overview(u.getUsername())));}
 @PostMapping("/assessment") public ResponseEntity<ApiResponse<GrowthOverviewDto>> assess(@RequestBody AssessmentRequest r,@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.assess(u.getUsername(),r)));}
 @PostMapping("/weekly-lab") public ResponseEntity<ApiResponse<LabDto>> weekly(@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.weeklyLab(u.getUsername())));}
 @PostMapping("/harder/{attemptId}") public ResponseEntity<ApiResponse<LabDto>> harder(@PathVariable UUID attemptId,@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.harderVariant(u.getUsername(),attemptId)));}
 @GetMapping("/public/{username}") public ResponseEntity<ApiResponse<PublicProfileDto>> profile(@PathVariable String username){return ResponseEntity.ok(ApiResponse.success(service.publicProfile(username)));}
 @GetMapping("/leaderboard") public ResponseEntity<ApiResponse<List<LeaderboardEntryDto>>> board(@RequestParam(required=false) String track){return ResponseEntity.ok(ApiResponse.success(service.leaderboard(track)));}
}
