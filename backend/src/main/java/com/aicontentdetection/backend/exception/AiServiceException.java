package com.aicontentdetection.backend.exception;

/**
 * Custom exception for AI service related errors.
 * Used when calling FastAPI AI service encounters issues.
 */
public class AiServiceException extends RuntimeException {

    private final int httpStatus;
    private final String errorReason;

    /**
     * Constructor with message and HTTP status
     */
    public AiServiceException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorReason = message;
    }

    /**
     * Constructor with message, HTTP status, and detailed reason
     */
    public AiServiceException(String message, int httpStatus, String errorReason) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorReason = errorReason;
    }

    /**
     * Constructor with message, HTTP status, and cause
     */
    public AiServiceException(String message, int httpStatus, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
        this.errorReason = message;
    }

    /**
     * Constructor with message, HTTP status, detailed reason, and cause
     */
    public AiServiceException(String message, int httpStatus, String errorReason, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
        this.errorReason = errorReason;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getErrorReason() {
        return errorReason;
    }
}
