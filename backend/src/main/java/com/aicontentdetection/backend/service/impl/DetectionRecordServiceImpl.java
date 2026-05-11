package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.dto.DetectionHistoryItemDto;
import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import com.aicontentdetection.backend.repository.DetectionRecordRepository;
import com.aicontentdetection.backend.service.DetectionRecordService;
import com.aicontentdetection.backend.service.S3StorageService.StoredObject;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DetectionRecordServiceImpl implements DetectionRecordService {

    private final DetectionRecordRepository detectionRecordRepository;

    @Override
    public DetectionRecord savePrediction(Long userId, MultipartFile file, AiPredictResponseDto prediction, StoredObject storedObject) {
        DetectionRecord record = DetectionRecord.builder()
                .userId(userId)
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storageBucket(storedObject != null ? storedObject.bucket() : null)
                .storageKey(storedObject != null ? storedObject.key() : null)
                .prediction(prediction.getPrediction())
                .confidence(prediction.getConfidenceAsDouble() >= 0 ? prediction.getConfidenceAsDouble() : 0.0)
                .aiProbability(prediction.getAiProbability())
                .realProbability(prediction.getRealProbability())
                .aiServiceMessage(prediction.getMessage())
                .source("AI_SERVICE")
                .build();

        return detectionRecordRepository.save(record);
    }

    @Override
    public DetectionHistoryResponseDto getHistory(Long userId, int page, int limit) {
        int normalizedPage = Math.max(page, 1);
        int normalizedLimit = Math.max(limit, 1);
        Pageable pageable = PageRequest.of(normalizedPage - 1, normalizedLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        var pageResult = detectionRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<DetectionHistoryItemDto> items = pageResult.getContent().stream()
                .map(record -> DetectionHistoryItemDto.builder()
                        .id(record.getId())
                        .filename(record.getOriginalFilename())
                        .prediction(record.getPrediction())
                        .confidence(record.getConfidence() != null ? record.getConfidence() : 0.0)
                        .timestamp(record.getCreatedAt())
                        .storageBucket(record.getStorageBucket())
                        .storageKey(record.getStorageKey())
                        .thumbnail(record.getStorageKey())
                        .build())
                .toList();

        return DetectionHistoryResponseDto.builder()
                .data(items)
                .total(pageResult.getTotalElements())
                .page(normalizedPage)
                .limit(normalizedLimit)
                .build();
    }

        @Override
        public DetectionStats getStats(Long userId) {
                long totalDetections = detectionRecordRepository.countByUserId(userId);
                long aiDetections = detectionRecordRepository.countByUserIdAndPredictionIgnoreCase(userId, "AI-GENERATED");
                long realDetections = detectionRecordRepository.countByUserIdAndPredictionIgnoreCase(userId, "REAL-IMAGE");

                return new DetectionStats(totalDetections, aiDetections, realDetections);
        }
}
