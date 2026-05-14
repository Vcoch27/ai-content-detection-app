package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.exception.AiServiceException;
import com.aicontentdetection.backend.service.AiGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Implementation of AiGatewayService.
 * Handles HTTP communication with FastAPI /predict endpoint.
 */
@Slf4j
@Service
public class AiGatewayServiceImpl implements AiGatewayService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    @Value("${ai.service.predict-endpoint}")
    private String predictEndpoint;

    @Value("${ai.service.predict-video-endpoint}")
    private String predictVideoEndpoint;

    public AiGatewayServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send image file to FastAPI /predict endpoint.
     * Converts MultipartFile to byte array and delegates to predictImageBytes.
     */
    @Override
    public AiPredictResponseDto predictImage(MultipartFile imageFile) {
        try {
            byte[] imageBytes = imageFile.getBytes();
            String filename = imageFile.getOriginalFilename();
            return predictImageBytes(imageBytes, filename);
        } catch (IOException e) {
            log.error("Failed to read image file bytes: {}", e.getMessage());
            throw new AiServiceException(
                    "Failed to process image file",
                    500,
                    "IOException while reading file: " + e.getMessage(),
                    e
            );
        }
    }

    @Override
    public AiPredictResponseDto predictVideo(MultipartFile videoFile) {
        try {
            byte[] videoBytes = videoFile.getBytes();
            String filename = videoFile.getOriginalFilename();
            return callAiService(videoBytes, filename, predictVideoEndpoint);
        } catch (IOException e) {
            log.error("Failed to read video file bytes: {}", e.getMessage());
            throw new AiServiceException(
                    "Failed to process video file",
                    500,
                    "IOException while reading file: " + e.getMessage(),
                    e
            );
        }
    }

    /**
     * Internal method to call AI service with generic endpoint.
     */
    private AiPredictResponseDto callAiService(byte[] fileBytes, String filename, String endpoint) {
        String url = aiServiceBaseUrl + endpoint;
        log.debug("Calling AI service: POST {} with file: {}", url, filename);

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            body.add("file", resource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            AiPredictResponseDto response = restTemplate.postForObject(
                    url,
                    requestEntity,
                    AiPredictResponseDto.class
            );

            if (response == null) {
                log.error("AI service returned null response");
                throw new AiServiceException(
                        "AI service returned empty response",
                        502,
                        "Unexpected null response from upstream service"
                );
            }

            log.debug("AI service response: status={}, prediction={}", response.getStatus(), response.getPrediction());

            AiPredictResponseDto normalizedResponse = AiPredictResponseDto.normalizeFromUpstream(response);

            if (!normalizedResponse.isSuccess()) {
                log.warn("AI service returned error status: {}, message: {}", normalizedResponse.getStatus(), normalizedResponse.getMessage());
                throw new AiServiceException(
                        "AI service returned error: " + normalizedResponse.getMessage(),
                        502,
                        normalizedResponse.getMessage()
                );
            }

            return normalizedResponse;
        } catch (HttpClientErrorException e) {
            log.error("AI service client error (HTTP {}): {}", e.getStatusCode(), e.getMessage());
            throw new AiServiceException(
                    "AI service client error: " + e.getMessage(),
                    e.getStatusCode().value(),
                    "HTTP " + e.getStatusCode().value() + ": " + e.getStatusText(),
                    e
            );
        } catch (HttpServerErrorException e) {
            log.error("AI service server error (HTTP {}): {}", e.getStatusCode(), e.getMessage());
            throw new AiServiceException(
                    "AI service server error: " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY.value(),
                    "HTTP " + e.getStatusCode().value() + ": " + e.getStatusText(),
                    e
            );
        } catch (ResourceAccessException e) {
            log.error("AI service connection error: {}", e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("timed out")) {
                throw new AiServiceException(
                        "AI service request timed out",
                        HttpStatus.GATEWAY_TIMEOUT.value(),
                        "Connection timeout to AI service",
                        e
                );
            } else {
                String detail = e.getMessage() != null ? e.getMessage() : "Unknown connection error";
                boolean connectionRefused = detail.toLowerCase().contains("connection refused");
                throw new AiServiceException(
                        connectionRefused ? "AI service is unavailable" : "AI service connection error",
                        HttpStatus.BAD_GATEWAY.value(),
                        connectionRefused
                                ? "FastAPI service is not reachable at " + url
                                : "Failed to connect to AI service: " + detail,
                        e
                );
            }
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calling AI service: {}", e.getMessage(), e);
            throw new AiServiceException(
                    "Unexpected error calling AI service",
                    500,
                    "Exception: " + e.getClass().getSimpleName() + ": " + e.getMessage(),
                    e
            );
        }
    }

    /**
     * Send raw image bytes to FastAPI /predict endpoint as multipart form data.
     * Maps the response to AiPredictResponseDto.
     */
    @Override
    public AiPredictResponseDto predictImageBytes(byte[] imageBytes, String filename) {
        return callAiService(imageBytes, filename, predictEndpoint);
    }

    /**
     * Helper class to create a MultipartFile-like object from bytes for RestTemplate.
     * This is needed because RestTemplate requires a proper Resource or similar object
     * when sending multipart requests.
     */
    private static class ByteArrayMultipartFile {
        private final byte[] content;
        private final String filename;

        public ByteArrayMultipartFile(byte[] content, String filename) {
            this.content = content;
            this.filename = filename;
        }

        public byte[] getContent() {
            return content;
        }

        public String getFilename() {
            return filename;
        }
    }
}
