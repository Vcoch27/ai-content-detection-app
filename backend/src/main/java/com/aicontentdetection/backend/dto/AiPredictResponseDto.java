package com.aicontentdetection.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Locale;
import java.util.Map;

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
     * Base64 encoded string of the heatmap image (.png)
     */
    @JsonProperty("heatmap_base64")
    private String heatmapBase64;

    /**
     * List of computer vision feature analysis results
     */
    @JsonProperty("cv_analysis")
    private List<CvFeatureAnalysisDto> cvAnalysis;

    /**
     * Consistency of the video detection results across frames
     */
    @JsonProperty("consistency")
    private Double consistency;

    /**
     * Vote count for each category in video detection
     */
    @JsonProperty("votes")
    private Map<String, Integer> votes;

    /**
     * Timeline of predictions for each frame in video detection
     */
    @JsonProperty("timeline")
    private List<Object> timeline;

    /**
     * Base64 encoded string of the key frame image
     */
    @JsonProperty("key_frame_base64")
    private String keyFrameBase64;

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
            boolean explicitPercentage = confidence.contains("%");
            String cleanedConfidence = confidence.replaceAll("[^0-9.]", "");
            double confidenceValue = Double.parseDouble(cleanedConfidence);
            return normalizeProbabilityScale(confidenceValue, explicitPercentage);
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
                .heatmapBase64(upstream.getHeatmapBase64())
                .cvAnalysis(upstream.getCvAnalysis())
                .consistency(upstream.getConsistency())
                .votes(upstream.getVotes())
                .timeline(upstream.getTimeline())
                .keyFrameBase64(upstream.getKeyFrameBase64())
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
                confidenceValue = normalizeProbabilityScale(upstream.getAiProbability(), false);
            } else if ("REAL-IMAGE".equalsIgnoreCase(normalizedPrediction) && upstream.getRealProbability() != null) {
                confidenceValue = normalizeProbabilityScale(upstream.getRealProbability(), false);
            }
        }

        if (confidenceValue < 0) {
            return upstream.getConfidence();
        }

        return String.format(Locale.US, "%.2f%%", confidenceValue);
    }

    private static double normalizeProbabilityScale(double value, boolean explicitPercentage) {
        if (!explicitPercentage && value >= 0 && value <= 1) {
            value = value * 100;
        }
        return Math.round(value * 100.0) / 100.0;
    }
}
