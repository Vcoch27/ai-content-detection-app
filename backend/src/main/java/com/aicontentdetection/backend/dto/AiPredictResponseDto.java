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
     * Probability that the image is AI-generated, reported by the upstream AI service.
     */
    @JsonProperty("ai_probability")
    private Double aiProbability;

    /**
     * Probability that the image is real, reported by the upstream AI service.
     */
    @JsonProperty("real_probability")
    private Double realProbability;

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

    /**
     * Normalize an upstream AI service response into the frontend-facing contract.
     * Keeps the backend stable even if the Python service uses slightly different labels.
     */
    public static AiPredictResponseDto normalizeFromUpstream(AiPredictResponseDto upstream) {
        if (upstream == null) {
            return null;
        }

        String normalizedPrediction = normalizePrediction(upstream.getPrediction());
        String normalizedConfidence = normalizeConfidence(upstream, normalizedPrediction);

        return AiPredictResponseDto.builder()
                .status(upstream.getStatus())
                .prediction(normalizedPrediction)
                .confidence(normalizedConfidence)
                .message(upstream.getMessage())
                .aiProbability(upstream.getAiProbability())
                .realProbability(upstream.getRealProbability())
                .build();
    }

    private static String normalizePrediction(String upstreamPrediction) {
        if (upstreamPrediction == null || upstreamPrediction.isBlank()) {
            return upstreamPrediction;
        }

        String normalized = upstreamPrediction.trim().toUpperCase().replace('_', '-');
        if (normalized.contains("AI")) {
            return "AI-GENERATED";
        }
        if (normalized.contains("REAL")) {
            return "REAL-IMAGE";
        }

        return normalized;
    }

    private static String normalizeConfidence(AiPredictResponseDto upstream, String normalizedPrediction) {
        Double confidenceValue = upstream.getConfidenceAsDouble();
        if (confidenceValue < 0) {
            if ("AI-GENERATED".equalsIgnoreCase(normalizedPrediction) && upstream.getAiProbability() != null) {
                confidenceValue = upstream.getAiProbability();
            } else if ("REAL-IMAGE".equalsIgnoreCase(normalizedPrediction) && upstream.getRealProbability() != null) {
                confidenceValue = upstream.getRealProbability();
            }
        }

        if (confidenceValue < 0) {
            return upstream.getConfidence();
        }

        return String.format("%.2f%%", confidenceValue);
    }
}
