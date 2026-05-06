package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.FeedbackRequestDto;
import com.aicontentdetection.backend.dto.FeedbackResponseDto;
import com.aicontentdetection.backend.entity.FeedbackEntry;
import com.aicontentdetection.backend.repository.FeedbackEntryRepository;
import com.aicontentdetection.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackEntryRepository feedbackEntryRepository;

    @Override
    public FeedbackResponseDto submitFeedback(FeedbackRequestDto request) {
        FeedbackEntry entry = FeedbackEntry.builder()
                .detectionId(request.getImageId())
                .isCorrect(request.getIsCorrect())
                .message(request.getMessage())
                .build();

        feedbackEntryRepository.save(entry);

        return FeedbackResponseDto.builder()
                .success(true)
                .message("Feedback saved successfully")
                .build();
    }
}
