package com.aicontentdetection.backend.exception;

import com.aicontentdetection.backend.dto.ErrorResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Global exception handler for the application.
 * Catches exceptions and returns standardized error responses.
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle AiServiceException from gateway service.
     * Maps to appropriate HTTP status based on the exception.
     */
    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ErrorResponseDto> handleAiServiceException(AiServiceException ex) {
        log.error("AI Service Exception: {} - {}", ex.getMessage(), ex.getErrorReason());

        ErrorResponseDto errorResponse = ErrorResponseDto.builder()
                .statusCode(ex.getHttpStatus())
                .message(ex.getMessage())
                .reason(ex.getErrorReason())
                .timestamp(java.time.LocalDateTime.now())
                .errorType("AI_SERVICE_ERROR")
                .build();

        HttpStatus httpStatus = HttpStatus.valueOf(ex.getHttpStatus());
        return new ResponseEntity<>(errorResponse, httpStatus);
    }

    /**
     * Handle validation errors (IllegalArgumentException) from controller validation.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDto> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Validation error: {}", ex.getMessage());

        ErrorResponseDto errorResponse = ErrorResponseDto.validationError(
                "Invalid request",
                ex.getMessage()
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle all other unexpected exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGenericException(Exception ex) {
        log.error("Unexpected exception: {}", ex.getMessage(), ex);

        ErrorResponseDto errorResponse = ErrorResponseDto.internalError(
                "Internal server error",
                ex.getClass().getSimpleName() + ": " + ex.getMessage()
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
