package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.service.AiGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for AI prediction API endpoint.
 * Exposes POST /api/predict for image analysis via FastAPI gateway.
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class AiPredictController {

    private final AiGatewayService aiGatewayService;

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    private static final String[] ALLOWED_CONTENT_TYPES = {
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/bmp",
            "image/x-windows-bmp"
    };

    public AiPredictController(AiGatewayService aiGatewayService) {
        this.aiGatewayService = aiGatewayService;
    }

    /**
     * Analyze an image and get AI prediction.
     * Accepts multipart form data with image file.
     *
     * @param file the image file to analyze (form field name: "file")
     * @param authHeader Authorization header (optional, for tracing)
     * @return JSON response with prediction result
     */
    @PostMapping("/predict")
    public ResponseEntity<AiPredictResponseDto> predictImage(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {

        log.info("Received prediction request for file: {} (size: {} bytes)",
                file.getOriginalFilename(), file.getSize());

        // Validate file is not empty
        if (file.isEmpty()) {
            log.warn("Received empty file");
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("File too large: {} bytes (max: {} bytes)", file.getSize(), MAX_FILE_SIZE);
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 20MB");
        }

        // Validate file content type
        String contentType = file.getContentType();
        if (!isAllowedContentType(contentType)) {
            log.warn("Invalid file type: {}. Allowed types: JPEG, PNG, BMP", contentType);
            throw new IllegalArgumentException(
                    "Invalid file type: " + contentType + ". Allowed types: JPEG, PNG, BMP"
            );
        }

        // Call AI Gateway Service to get prediction
        AiPredictResponseDto prediction = aiGatewayService.predictImage(file);

        log.info("Prediction completed for file: {}. Result: {}",
                file.getOriginalFilename(), prediction.getPrediction());

        return ResponseEntity.ok(prediction);
    }

    /**
     * Check if content type is allowed for prediction.
     */
    private boolean isAllowedContentType(String contentType) {
        if (contentType == null) {
            return false;
        }
        for (String allowed : ALLOWED_CONTENT_TYPES) {
            if (contentType.equalsIgnoreCase(allowed)) {
                return true;
            }
        }
        return false;
    }
}
