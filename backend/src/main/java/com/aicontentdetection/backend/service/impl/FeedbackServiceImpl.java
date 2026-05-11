package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.FeedbackRequestDto;
import com.aicontentdetection.backend.dto.FeedbackResponseDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import com.aicontentdetection.backend.entity.FeedbackEntry;
import com.aicontentdetection.backend.repository.DetectionRecordRepository;
import com.aicontentdetection.backend.repository.FeedbackEntryRepository;
import com.aicontentdetection.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackEntryRepository feedbackEntryRepository;
    private final DetectionRecordRepository detectionRecordRepository;

    @Override
    public FeedbackResponseDto submitFeedback(Long userId, FeedbackRequestDto request) {
        DetectionRecord detectionRecord = detectionRecordRepository.findById(request.getImageId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Detection not found"));

        if (detectionRecord.getUserId() != null && !detectionRecord.getUserId().equals(userId)) {
            throw new ResponseStatusException(FORBIDDEN, "You cannot submit feedback for another user's detection");
        }

        FeedbackEntry entry = feedbackEntryRepository.findByDetectionIdAndUserId(request.getImageId(), userId)
                .map(existing -> {
                    existing.setIsCorrect(request.getIsCorrect());
                    existing.setMessage(request.getMessage());
                    return existing;
                })
                .orElseGet(() -> FeedbackEntry.builder()
                        .detectionId(request.getImageId())
                        .userId(userId)
                        .isCorrect(request.getIsCorrect())
                        .message(request.getMessage())
                        .build());

        feedbackEntryRepository.save(entry);

        return FeedbackResponseDto.builder()
                .success(true)
                .message("Feedback saved successfully")
                .build();
    }
}
