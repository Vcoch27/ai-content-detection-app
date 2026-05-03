package com.aicontentdetection.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard error response DTO for API error responses.
 * Ensures consistent error format across the backend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponseDto {

    /**
     * HTTP status code
     */
    @JsonProperty("status_code")
    private int statusCode;

    /**
     * Error message
     */
    @JsonProperty("message")
    private String message;

    /**
     * Detailed error reason (e.g. "Connection timeout to AI service", "Invalid file format")
     */
    @JsonProperty("reason")
    private String reason;

    /**
     * Timestamp when error occurred
     */
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    /**
     * Error type or code for categorization
     */
    @JsonProperty("error_type")
    private String errorType;

    /**
     * Factory method for validation errors
     */
    public static ErrorResponseDto validationError(String message, String reason) {
        return ErrorResponseDto.builder()
                .statusCode(400)
                .message(message)
                .reason(reason)
                .timestamp(LocalDateTime.now())
                .errorType("VALIDATION_ERROR")
                .build();
    }

    /**
     * Factory method for upstream service errors
     */
    public static ErrorResponseDto upstreamError(String message, String reason, int statusCode) {
        return ErrorResponseDto.builder()
                .statusCode(statusCode)
                .message(message)
                .reason(reason)
                .timestamp(LocalDateTime.now())
                .errorType("UPSTREAM_ERROR")
                .build();
    }

    /**
     * Factory method for timeout errors
     */
    public static ErrorResponseDto timeoutError(String message) {
        return ErrorResponseDto.builder()
                .statusCode(504)
                .message(message)
                .reason("AI service request timed out")
                .timestamp(LocalDateTime.now())
                .errorType("TIMEOUT_ERROR")
                .build();
    }

    /**
     * Factory method for internal server errors
     */
    public static ErrorResponseDto internalError(String message, String reason) {
        return ErrorResponseDto.builder()
                .statusCode(500)
                .message(message)
                .reason(reason)
                .timestamp(LocalDateTime.now())
                .errorType("INTERNAL_ERROR")
                .build();
    }
}
