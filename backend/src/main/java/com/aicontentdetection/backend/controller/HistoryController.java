package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.entity.AppUser;
import com.aicontentdetection.backend.service.AuthService;
import com.aicontentdetection.backend.service.DetectionRecordService;
import com.aicontentdetection.backend.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HistoryController {

    private final DetectionRecordService detectionRecordService;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/history")
    public DetectionHistoryResponseDto getHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        AppUser currentUser = resolveAuthenticatedUser(authHeader);
        return detectionRecordService.getHistory(currentUser.getId(), page, limit);
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistoryItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        AppUser currentUser = resolveAuthenticatedUser(authHeader);
        detectionRecordService.deleteHistoryItem(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }

    private AppUser resolveAuthenticatedUser(String authHeader) {
        String token = jwtTokenProvider.extractTokenFromHeader(authHeader);
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header is required");
        }

        AppUser currentUser = authService.getUserByToken(token);
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        return currentUser;
    }
}
