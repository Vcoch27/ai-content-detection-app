package com.aicontentdetection.backend.service;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import org.springframework.web.multipart.MultipartFile;

public interface DetectionRecordService {
    DetectionRecord savePrediction(MultipartFile file, AiPredictResponseDto prediction);

    DetectionHistoryResponseDto getHistory(int page, int limit);
}
