package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.entity.AppUser;
import com.aicontentdetection.backend.service.AuthService;
import com.aicontentdetection.backend.service.DetectionRecordService;
import com.aicontentdetection.backend.service.AiGatewayService;
import com.aicontentdetection.backend.service.S3StorageService;
import com.aicontentdetection.backend.service.S3StorageService.StoredObject;
import com.aicontentdetection.backend.util.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller for AI prediction API endpoint.
 * Exposes POST /api/predict for image analysis via FastAPI gateway.
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class AiPredictController {

    private final AiGatewayService aiGatewayService;
    private final DetectionRecordService detectionRecordService;
    private final S3StorageService s3StorageService;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    private static final String[] ALLOWED_IMAGE_TYPES = {
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/bmp",
            "image/x-windows-bmp"
    };
    private static final String[] ALLOWED_VIDEO_TYPES = {
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska",
            "video/webm"
    };

    public AiPredictController(AiGatewayService aiGatewayService,
                               DetectionRecordService detectionRecordService,
                               S3StorageService s3StorageService,
                               AuthService authService,
                               JwtTokenProvider jwtTokenProvider) {
        this.aiGatewayService = aiGatewayService;
        this.detectionRecordService = detectionRecordService;
        this.s3StorageService = s3StorageService;
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
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
        if (!isAllowedImageType(contentType)) {
            log.warn("Invalid file type: {}. Allowed types: JPEG, PNG, BMP", contentType);
            throw new IllegalArgumentException(
                    "Invalid file type: " + contentType + ". Allowed types: JPEG, PNG, BMP"
            );
        }

        AppUser currentUser = resolveAuthenticatedUser(authHeader);

        StoredObject storedObject = s3StorageService.upload(file, "detections/" + currentUser.getId() + "/images");

        // Call AI Gateway Service to get prediction
        AiPredictResponseDto prediction = aiGatewayService.predictImage(file);

        detectionRecordService.savePrediction(currentUser.getId(), file, prediction, storedObject);

        log.info("Prediction completed for file: {}. Result: {}",
                file.getOriginalFilename(), prediction.getPrediction());

        return ResponseEntity.ok(prediction);
    }

    /**
     * Analyze a video and get AI prediction.
     * Only returns the prediction without saving to database as requested.
     */
    @PostMapping("/predict-video")
    public ResponseEntity<AiPredictResponseDto> predictVideo(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {

        log.info("Received video prediction request for file: {} (size: {} bytes)",
                file.getOriginalFilename(), file.getSize());

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 100MB");
        }

        String contentType = file.getContentType();
        if (!isAllowedVideoType(contentType)) {
            log.warn("Invalid video type: {}", contentType);
            throw new IllegalArgumentException("Invalid video type. Supported: MP4, MPEG, MOV, AVI, MKV, WEBM");
        }

        // We still resolve user for auth check but won't save to DB
        AppUser currentUser = resolveAuthenticatedUser(authHeader);

        // Upload Video to S3
        StoredObject videoObject = s3StorageService.upload(file, "detections/" + currentUser.getId() + "/videos");

        // Call AI Gateway Service (FastAPI)
        AiPredictResponseDto prediction = aiGatewayService.predictVideo(file);

        // Save Record to History
        detectionRecordService.saveVideoPrediction(currentUser.getId(), file, prediction, videoObject);

        return ResponseEntity.ok(prediction);
    }

    /**
     * Check if content type is allowed for image prediction.
     */
    private boolean isAllowedImageType(String contentType) {
        if (contentType == null) {
            return false;
        }
        for (String allowed : ALLOWED_IMAGE_TYPES) {
            if (contentType.equalsIgnoreCase(allowed)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if content type is allowed for video prediction.
     */
    private boolean isAllowedVideoType(String contentType) {
        if (contentType == null) {
            return false;
        }
        for (String allowed : ALLOWED_VIDEO_TYPES) {
            if (contentType.equalsIgnoreCase(allowed)) {
                return true;
            }
        }
        return false;
    }

    private AppUser resolveAuthenticatedUser(String authHeader) {
        String token = jwtTokenProvider.extractTokenFromHeader(authHeader);
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header is required");
        }

        AppUser currentUser = authService.getUserByToken(token);
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        return currentUser;
    }
}
