package com.aicontentdetection.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for computer vision feature analysis results.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvFeatureAnalysisDto {

    @JsonProperty("feature_name")
    private String featureName;

    @JsonProperty("category")
    private String category;

    @JsonProperty("impact_score")
    private double impactScore;

    @JsonProperty("description")
    private String description;
}
