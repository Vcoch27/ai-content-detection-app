package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.dto.CvFeatureAnalysisDto;
import com.aicontentdetection.backend.dto.DetectionHistoryItemDto;
import com.aicontentdetection.backend.entity.DetectionRecord;
import com.aicontentdetection.backend.repository.AppUserRepository;
import com.aicontentdetection.backend.repository.DetectionRecordRepository;
import com.aicontentdetection.backend.service.S3StorageService;
import com.aicontentdetection.backend.service.S3StorageService.StoredObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DetectionRecordServiceImplTest {

    @Mock
    private DetectionRecordRepository detectionRecordRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private S3StorageService s3StorageService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private DetectionRecordServiceImpl detectionRecordService;

    @BeforeEach
    void setUp() {
        detectionRecordService = new DetectionRecordServiceImpl(
                detectionRecordRepository,
                appUserRepository,
                s3StorageService,
                objectMapper
        );
    }

    @Test
    void savePredictionStoresImageCvAnalysisInMetadata() throws Exception {
        when(detectionRecordRepository.save(any(DetectionRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                new byte[]{1, 2, 3}
        );
        CvFeatureAnalysisDto feature = CvFeatureAnalysisDto.builder()
                .featureName("Texture_Correlation")
                .category("Texture")
                .impactScore(18.99)
                .description("Surface texture is over-smoothed")
                .build();
        AiPredictResponseDto prediction = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI-GENERATED")
                .confidence("76.38%")
                .aiProbability(76.38)
                .realProbability(23.62)
                .cvAnalysis(List.of(feature))
                .build();

        DetectionRecord record = detectionRecordService.savePrediction(
                1L,
                file,
                prediction,
                new StoredObject("ai-detect-images", "detections/1/images/test.png", "etag")
        );

        assertEquals("IMAGE", record.getDetectionType());
        assertEquals(76.38, record.getConfidence());
        assertNotNull(record.getMetadata());

        JsonNode metadata = objectMapper.readTree(record.getMetadata());
        assertEquals(
                "Texture_Correlation",
                metadata.path("cv_analysis").get(0).path("feature_name").asText()
        );
    }

    @Test
    void getHistoryReturnsParsedMetadataAndNormalizedLegacyVideoConfidence() {
        DetectionRecord record = DetectionRecord.builder()
                .id(48L)
                .userId(1L)
                .originalFilename("clip.webm")
                .contentType("video/webm")
                .fileSize(1423309L)
                .storageBucket("ai-detect-images")
                .storageKey("detections/1/videos/clip.webm")
                .prediction("AI-GENERATED")
                .confidence(0.64)
                .source("AI_SERVICE")
                .detectionType("VIDEO")
                .metadata("""
                        {"cv_analysis":[{"feature_name":"Texture_Correlation","category":"Texture","impact_score":18.99,"description":"Over-smoothed texture"}],"votes":{"AI":19,"REAL":1},"consistency":95.0}
                        """)
                .build();

        when(detectionRecordRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(record)));

        DetectionHistoryItemDto item = detectionRecordService.getHistory(1L, 1, 10).getData().get(0);

        assertEquals(64.0, item.getConfidence());
        assertNotNull(item.getMetadata());
        assertEquals(95.0, ((Number) item.getMetadata().get("consistency")).doubleValue());
    }
}
