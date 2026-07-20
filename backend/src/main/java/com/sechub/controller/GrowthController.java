package com.sechub.controller;
import com.sechub.dto.*;import com.sechub.service.GrowthService;
import org.springframework.http.ResponseEntity;import org.springframework.security.core.annotation.AuthenticationPrincipal;import org.springframework.security.core.userdetails.UserDetails;import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/growth")
public class GrowthController{
 private final GrowthService service;public GrowthController(GrowthService service){this.service=service;}
 @GetMapping({"", "/overview"}) public ResponseEntity<ApiResponse<GrowthOverviewDto>> overview(@AuthenticationPrincipal UserDetails u, @RequestHeader(value = "Accept-Language", required = false) String lang){return ResponseEntity.ok(ApiResponse.success(service.overview(u.getUsername(), lang)));}
 @PostMapping("/assessment") public ResponseEntity<ApiResponse<GrowthOverviewDto>> assess(@RequestBody AssessmentRequest r,@AuthenticationPrincipal UserDetails u, @RequestHeader(value = "Accept-Language", required = false) String lang){return ResponseEntity.ok(ApiResponse.success(service.assess(u.getUsername(),r, lang)));}
 @PostMapping("/weekly-lab") public ResponseEntity<ApiResponse<LabDto>> weekly(@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.weeklyLab(u.getUsername())));}
 @PostMapping("/harder/{attemptId}") public ResponseEntity<ApiResponse<LabDto>> harder(@PathVariable UUID attemptId,@AuthenticationPrincipal UserDetails u){return ResponseEntity.ok(ApiResponse.success(service.harderVariant(u.getUsername(),attemptId)));}
 @GetMapping("/public/{username}") public ResponseEntity<ApiResponse<PublicProfileDto>> profile(@PathVariable String username, @RequestHeader(value = "Accept-Language", required = false) String lang){return ResponseEntity.ok(ApiResponse.success(service.publicProfile(username, lang)));}
 @GetMapping("/public/{username}/activities") public ResponseEntity<ApiResponse<List<com.sechub.dto.UserActivityDto>>> publicActivities(@PathVariable String username){return ResponseEntity.ok(ApiResponse.success(service.publicProfileActivities(username)));}
 @GetMapping("/leaderboard") public ResponseEntity<ApiResponse<List<LeaderboardEntryDto>>> board(@RequestParam(required=false) String track, @RequestHeader(value = "Accept-Language", required = false) String lang){return ResponseEntity.ok(ApiResponse.success(service.leaderboard(track, lang)));}
 @PutMapping("/track") public ResponseEntity<ApiResponse<GrowthOverviewDto>> updateTrack(@RequestBody Map<String, String> body, @AuthenticationPrincipal UserDetails u, @RequestHeader(value = "Accept-Language", required = false) String lang){return ResponseEntity.ok(ApiResponse.success(service.updateTrack(u.getUsername(),body.get("track"), lang)));}
 @PostMapping("/reset-onboarding") public ResponseEntity<ApiResponse<GrowthOverviewDto>> resetOnboarding(@AuthenticationPrincipal UserDetails u, @RequestHeader(value = "Accept-Language", required = false) String lang){return ResponseEntity.ok(ApiResponse.success(service.resetOnboarding(u.getUsername(), lang)));}
}
