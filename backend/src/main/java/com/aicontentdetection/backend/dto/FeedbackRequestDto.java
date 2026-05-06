package com.aicontentdetection.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackRequestDto {

    @NotNull
    private Long imageId;

    @NotNull
    private Boolean isCorrect;

    private String message;
}
