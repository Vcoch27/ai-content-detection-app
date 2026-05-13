package com.aicontentdetection.backend.service;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import com.aicontentdetection.backend.service.S3StorageService.StoredObject;
import org.springframework.web.multipart.MultipartFile;

public interface DetectionRecordService {
    DetectionRecord savePrediction(Long userId, MultipartFile file, AiPredictResponseDto prediction, StoredObject storedObject);

    DetectionRecord saveVideoPrediction(Long userId, MultipartFile file, AiPredictResponseDto prediction, StoredObject videoObject);

    DetectionHistoryResponseDto getHistory(Long userId, int page, int limit);

    void deleteHistoryItem(Long userId, Long recordId);

    StorageQuota getStorageQuota(Long userId);

    DetectionStats getStats(Long userId);

    record DetectionStats(long totalDetections, long aiDetections, long realDetections, long storageUsedBytes,
                          long storageQuotaBytes) {
    }

    record StorageQuota(long usedBytes, long quotaBytes) {
        public boolean hasSpaceFor(long incomingBytes) {
            return usedBytes + Math.max(incomingBytes, 0) <= quotaBytes;
        }
    }
}
