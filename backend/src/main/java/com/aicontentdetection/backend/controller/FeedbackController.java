package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.FeedbackRequestDto;
import com.aicontentdetection.backend.dto.FeedbackResponseDto;
import com.aicontentdetection.backend.entity.AppUser;
import com.aicontentdetection.backend.service.AuthService;
import com.aicontentdetection.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.aicontentdetection.backend.util.JwtTokenProvider;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponseDto> submitFeedback(
            @Valid @RequestBody FeedbackRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AppUser currentUser = resolveAuthenticatedUser(authHeader);
        return ResponseEntity.ok(feedbackService.submitFeedback(currentUser.getId(), request));
    }

    private AppUser resolveAuthenticatedUser(String authHeader) {
        String token = jwtTokenProvider.extractTokenFromHeader(authHeader);
        if (token == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Authorization header is required");
        }

        AppUser currentUser = authService.getUserByToken(token);
        if (currentUser == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid or expired token");
        }

        return currentUser;
    }
}
