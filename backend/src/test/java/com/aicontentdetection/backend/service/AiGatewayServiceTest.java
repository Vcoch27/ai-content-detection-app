package com.aicontentdetection.backend.service;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.exception.AiServiceException;
import com.aicontentdetection.backend.service.impl.AiGatewayServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.SocketTimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AiGatewayService.
 * Tests successful predictions, error handling, and timeout scenarios.
 */
@ExtendWith(MockitoExtension.class)
public class AiGatewayServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private AiGatewayServiceImpl aiGatewayService;

    @BeforeEach
    void setUp() {
        aiGatewayService = new AiGatewayServiceImpl(restTemplate);
        // Set the configuration properties using reflection
                ReflectionTestUtils.setField(aiGatewayService, "aiServiceBaseUrl", "http://127.0.0.1:8000");
        ReflectionTestUtils.setField(aiGatewayService, "predictEndpoint", "/predict");
    }

    @Test
    void testPredictImageBytes_Success() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};
        String filename = "test.jpg";

        AiPredictResponseDto expectedResponse = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI_GENERATED")
                .confidence("78.02")
                .aiProbability(78.02)
                .realProbability(21.98)
                .build();

        when(restTemplate.postForObject(
                eq("http://127.0.0.1:8000/predict"),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenReturn(expectedResponse);

        // Act
        AiPredictResponseDto result = aiGatewayService.predictImageBytes(imageBytes, filename);

        // Assert
        assertNotNull(result);
        assertEquals("success", result.getStatus());
        assertEquals("AI-GENERATED", result.getPrediction());
        assertEquals("78.02%", result.getConfidence());
                assertEquals(78.02, result.getAiProbability());
                assertEquals(21.98, result.getRealProbability());
        assertTrue(result.isSuccess());
    }

    @Test
    void testPredictImageBytes_Real_Image() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};
        String filename = "test.png";

        AiPredictResponseDto expectedResponse = AiPredictResponseDto.builder()
                .status("success")
                .prediction("REAL-IMAGE")
                .confidence("92.50%")
                .build();

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenReturn(expectedResponse);

        // Act
        AiPredictResponseDto result = aiGatewayService.predictImageBytes(imageBytes, filename);

        // Assert
        assertEquals("REAL-IMAGE", result.getPrediction());
        assertEquals(92.50, result.getConfidenceAsDouble());
    }

    @Test
    void testPredictImageBytes_Timeout() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenThrow(new ResourceAccessException("Connection timed out"));

        // Act & Assert
        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> aiGatewayService.predictImageBytes(imageBytes, "test.jpg")
        );

        assertEquals(HttpStatus.GATEWAY_TIMEOUT.value(), exception.getHttpStatus());
        assertTrue(exception.getErrorReason().contains("timeout"));
    }

    @Test
    void testPredictImageBytes_ConnectionRefused() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenThrow(new ResourceAccessException("Connection refused"));

        // Act & Assert
        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> aiGatewayService.predictImageBytes(imageBytes, "test.jpg")
        );

        assertEquals(HttpStatus.BAD_GATEWAY.value(), exception.getHttpStatus());
    }

    @Test
    void testPredictImageBytes_ClientError() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Invalid file format"));

        // Act & Assert
        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> aiGatewayService.predictImageBytes(imageBytes, "test.jpg")
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getHttpStatus());
    }

    @Test
    void testPredictImageBytes_ServerError() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server error"));

        // Act & Assert
        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> aiGatewayService.predictImageBytes(imageBytes, "test.jpg")
        );

        assertEquals(HttpStatus.BAD_GATEWAY.value(), exception.getHttpStatus());
    }

    @Test
    void testPredictImageBytes_NullResponse() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenReturn(null);

        // Act & Assert
        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> aiGatewayService.predictImageBytes(imageBytes, "test.jpg")
        );

        assertEquals(502, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("empty response"));
    }

    @Test
    void testPredictImageBytes_ErrorStatus() {
        // Arrange
        byte[] imageBytes = new byte[]{1, 2, 3, 4, 5};

        AiPredictResponseDto errorResponse = AiPredictResponseDto.builder()
                .status("error")
                .message("Could not read image")
                .build();

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(AiPredictResponseDto.class)
        )).thenReturn(errorResponse);

        // Act & Assert
        AiServiceException exception = assertThrows(
                AiServiceException.class,
                () -> aiGatewayService.predictImageBytes(imageBytes, "test.jpg")
        );

        assertEquals(502, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("error"));
    }

    @Test
    void testGetConfidenceAsDouble_ValidPercentage() {
        // Test confidence parsing
        AiPredictResponseDto response = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI-GENERATED")
                .confidence("85.50%")
                .build();

        assertEquals(85.50, response.getConfidenceAsDouble());
    }

    @Test
    void testGetConfidenceAsDouble_InvalidFormat() {
        // Test confidence parsing with invalid format
        AiPredictResponseDto response = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI-GENERATED")
                .confidence("invalid")
                .build();

        assertEquals(-1, response.getConfidenceAsDouble());
    }

    @Test
    void testGetConfidenceAsDouble_NullConfidence() {
        // Test confidence parsing with null
        AiPredictResponseDto response = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI-GENERATED")
                .confidence(null)
                .build();

        assertEquals(-1, response.getConfidenceAsDouble());
    }
}
