package com.aicontentdetection.backend.service;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for communicating with FastAPI AI service.
 * Acts as a gateway to abstract HTTP communication details.
 */
public interface AiGatewayService {

    /**
     * Send image to FastAPI /predict endpoint and get prediction result.
     *
     * @param imageFile the image file to analyze
     * @return prediction response from AI service
     * @throws com.aicontentdetection.backend.exception.AiServiceException if communication fails
     */
    AiPredictResponseDto predictImage(MultipartFile imageFile);

    /**
     * Send raw image bytes to FastAPI /predict endpoint.
     *
     * @param imageBytes the image bytes
     * @param filename filename for logging/validation
     * @return prediction response from AI service
     * @throws com.aicontentdetection.backend.exception.AiServiceException if communication fails
     */
    AiPredictResponseDto predictImageBytes(byte[] imageBytes, String filename);
}
