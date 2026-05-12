package com.aicontentdetection.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String thumbnail;
    private String storageBucket;
    private String storageKey;
    private String detectionType;
}
