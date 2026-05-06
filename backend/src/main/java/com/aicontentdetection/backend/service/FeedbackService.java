package com.aicontentdetection.backend.service;

import com.aicontentdetection.backend.dto.FeedbackRequestDto;
import com.aicontentdetection.backend.dto.FeedbackResponseDto;

public interface FeedbackService {
    FeedbackResponseDto submitFeedback(FeedbackRequestDto request);
}
