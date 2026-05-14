package com.aicontentdetection.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectionHistoryItemDto {
    private Long id;
    private String filename;
    private String prediction;
    private Double confidence;
    private LocalDateTime timestamp;
    private String storageBucket;
    private String storageKey;
    private String detectionType;
    private Double aiProbability;
    private Double realProbability;
    private Map<String, Object> metadata;
}
