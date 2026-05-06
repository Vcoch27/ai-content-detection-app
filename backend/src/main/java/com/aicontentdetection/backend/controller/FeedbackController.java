package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.FeedbackRequestDto;
import com.aicontentdetection.backend.dto.FeedbackResponseDto;
import com.aicontentdetection.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponseDto> submitFeedback(@Valid @RequestBody FeedbackRequestDto request) {
        return ResponseEntity.ok(feedbackService.submitFeedback(request));
    }
}
