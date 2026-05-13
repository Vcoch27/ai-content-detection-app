package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.dto.DetectionHistoryItemDto;
import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import com.aicontentdetection.backend.repository.AppUserRepository;
import com.aicontentdetection.backend.repository.DetectionRecordRepository;
import com.aicontentdetection.backend.service.DetectionRecordService;
import com.aicontentdetection.backend.service.S3StorageService;
import com.aicontentdetection.backend.service.S3StorageService.StoredObject;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DetectionRecordServiceImpl implements DetectionRecordService {

    private final DetectionRecordRepository detectionRecordRepository;
    private final AppUserRepository appUserRepository;
    private final S3StorageService s3StorageService;
    private final ObjectMapper objectMapper;

    @Value("${storage.quota.default-bytes:104857600}")
    private long defaultStorageQuotaBytes;

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
                .detectionType("IMAGE")
                .build();

        return detectionRecordRepository.save(record);
    }

    @Override
    public DetectionRecord saveVideoPrediction(Long userId, MultipartFile file, AiPredictResponseDto prediction, StoredObject videoObject) {
        String metadata = null;
        try {
            java.util.Map<String, Object> metaMap = new java.util.HashMap<>();
            metaMap.put("consistency", prediction.getConsistency());
            metaMap.put("votes", prediction.getVotes());
            metaMap.put("timeline", prediction.getTimeline());
            metaMap.put("cv_analysis", prediction.getCvAnalysis());
            metadata = objectMapper.writeValueAsString(metaMap);
        } catch (Exception e) {
            log.error("Failed to serialize video metadata", e);
        }

        DetectionRecord record = DetectionRecord.builder()
                .userId(userId)
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storageBucket(videoObject != null ? videoObject.bucket() : null)
                .storageKey(videoObject != null ? videoObject.key() : null)
                .prediction(prediction.getPrediction())
                .confidence(prediction.getConfidenceAsDouble() >= 0 ? prediction.getConfidenceAsDouble() : 0.0)
                .aiServiceMessage(prediction.getMessage())
                .source("AI_SERVICE")
                .detectionType("VIDEO")
                .metadata(metadata)
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
                        .detectionType(record.getDetectionType())
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
    public void deleteHistoryItem(Long userId, Long recordId) {
        DetectionRecord record = detectionRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "History item not found"));

        if (!record.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this history item");
        }

        s3StorageService.deleteObject(record.getStorageBucket(), record.getStorageKey());

        detectionRecordRepository.delete(record);
    }

    @Override
    public StorageQuota getStorageQuota(Long userId) {
        long usedBytes = detectionRecordRepository.sumStoredFileSizeByUserId(userId);
        long quotaBytes = resolveUserQuotaBytes(userId);
        return new StorageQuota(usedBytes, quotaBytes);
    }

    @Override
    public DetectionStats getStats(Long userId) {
        long totalDetections = detectionRecordRepository.countByUserId(userId);
        long aiDetections = detectionRecordRepository.countByUserIdAndPredictionIgnoreCase(userId, "AI-GENERATED");
        long realDetections = detectionRecordRepository.countByUserIdAndPredictionIgnoreCase(userId, "REAL-IMAGE");
        long storageUsedBytes = detectionRecordRepository.sumStoredFileSizeByUserId(userId);
        long storageQuotaBytes = resolveUserQuotaBytes(userId);

        return new DetectionStats(totalDetections, aiDetections, realDetections, storageUsedBytes, storageQuotaBytes);
    }

    private long resolveUserQuotaBytes(Long userId) {
        return appUserRepository.findById(userId)
                .map(user -> user.getStorageQuotaBytes() != null ? user.getStorageQuotaBytes() : defaultStorageQuotaBytes)
                .orElse(defaultStorageQuotaBytes);
    }
}
