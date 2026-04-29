package com.aicontentdetection.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for response from FastAPI AI service /predict endpoint.
 * Maps the JSON response from Python AI service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPredictResponseDto {

    /**
     * Status of the prediction: "success" or "error"
     */
    @JsonProperty("status")
    private String status;

    /**
     * Prediction label: "AI-GENERATED" or "REAL-IMAGE"
     */
    @JsonProperty("prediction")
    private String prediction;

    /**
     * Confidence percentage as string with % symbol, e.g. "78.02%"
     */
    @JsonProperty("confidence")
    private String confidence;

    /**
     * Error message (if status is "error")
     */
    @JsonProperty("message")
    private String message;

    /**
     * Check if prediction was successful
     */
    public boolean isSuccess() {
        return "success".equalsIgnoreCase(status);
    }

    /**
     * Extract numeric confidence value from string (remove % and parse as double)
     * Returns -1 if parsing fails
     */
    public double getConfidenceAsDouble() {
        try {
            if (confidence == null) {
                return -1;
            }
            String cleanedConfidence = confidence.replaceAll("[^0-9.]", "");
            return Double.parseDouble(cleanedConfidence);
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}
