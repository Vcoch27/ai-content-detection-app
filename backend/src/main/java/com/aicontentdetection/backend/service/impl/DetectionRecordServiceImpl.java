package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.dto.DetectionHistoryItemDto;
import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import com.aicontentdetection.backend.repository.DetectionRecordRepository;
import com.aicontentdetection.backend.service.DetectionRecordService;
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
    public DetectionRecord savePrediction(MultipartFile file, AiPredictResponseDto prediction) {
        DetectionRecord record = DetectionRecord.builder()
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .prediction(prediction.getPrediction())
                .confidence(prediction.getConfidenceAsDouble() >= 0 ? prediction.getConfidenceAsDouble() : null)
                .aiProbability(prediction.getAiProbability())
                .realProbability(prediction.getRealProbability())
                .aiServiceMessage(prediction.getMessage())
                .source("AI_SERVICE")
                .build();

        return detectionRecordRepository.save(record);
    }

    @Override
    public DetectionHistoryResponseDto getHistory(int page, int limit) {
        int normalizedPage = Math.max(page, 1);
        int normalizedLimit = Math.max(limit, 1);
        Pageable pageable = PageRequest.of(normalizedPage - 1, normalizedLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        var pageResult = detectionRecordRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<DetectionHistoryItemDto> items = pageResult.getContent().stream()
                .map(record -> DetectionHistoryItemDto.builder()
                        .id(record.getId())
                        .filename(record.getOriginalFilename())
                        .prediction(record.getPrediction())
                        .confidence(record.getConfidence() != null ? record.getConfidence() : 0.0)
                        .timestamp(record.getCreatedAt())
                        .thumbnail(null)
                        .build())
                .toList();

        return DetectionHistoryResponseDto.builder()
                .data(items)
                .total(pageResult.getTotalElements())
                .page(normalizedPage)
                .limit(normalizedLimit)
                .build();
    }
}
