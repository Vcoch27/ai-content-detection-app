package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.AiPredictResponseDto;
import com.aicontentdetection.backend.exception.AiServiceException;
import com.aicontentdetection.backend.exception.GlobalExceptionHandler;
import com.aicontentdetection.backend.service.AiGatewayService;
import com.aicontentdetection.backend.service.DetectionRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for AiPredictController.
 * Tests endpoint behavior for valid uploads, validation errors, and upstream failures.
 */
@ExtendWith(MockitoExtension.class)
public class AiPredictControllerTest {

    @Mock
    private AiGatewayService aiGatewayService;

        @Mock
        private DetectionRecordService detectionRecordService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
                AiPredictController aiPredictController = new AiPredictController(aiGatewayService, detectionRecordService);
                HealthController healthController = new HealthController();
                mockMvc = MockMvcBuilders.standaloneSetup(aiPredictController, healthController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testPredictImage_Success() throws Exception {
        // Arrange
        byte[] imageContent = "fake image content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                imageContent
        );

        AiPredictResponseDto response = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI-GENERATED")
                .confidence("78.02%")
                .build();

        when(aiGatewayService.predictImage(any(MultipartFile.class)))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file)
                .header("Authorization", "Bearer token123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.prediction").value("AI-GENERATED"))
                .andExpect(jsonPath("$.confidence").value("78.02%"));
    }

    @Test
    void testPredictImage_PNG_Success() throws Exception {
        // Arrange
        byte[] imageContent = "fake png content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                MediaType.IMAGE_PNG_VALUE,
                imageContent
        );

        AiPredictResponseDto response = AiPredictResponseDto.builder()
                .status("success")
                .prediction("REAL-IMAGE")
                .confidence("95.00%")
                .build();

        when(aiGatewayService.predictImage(any(MultipartFile.class)))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prediction").value("REAL-IMAGE"));
    }

    @Test
    void testPredictImage_EmptyFile() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[]{}
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status_code").value(400))
                .andExpect(jsonPath("$.message").value("Invalid request"));
    }

    @Test
    void testPredictImage_InvalidFileType() throws Exception {
        // Arrange
        byte[] fileContent = "some text content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                MediaType.TEXT_PLAIN_VALUE,
                fileContent
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status_code").value(400))
                .andExpect(jsonPath("$.message").value("Invalid request"))
                .andExpect(jsonPath("$.reason").value(containsString("Invalid file type")));
    }

    @Test
    void testPredictImage_FileNoType() throws Exception {
        // Arrange
        byte[] imageContent = "fake image content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.unknown",
                null,  // No content type
                imageContent
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status_code").value(400));
    }

    @Test
    void testPredictImage_UpstreamTimeout() throws Exception {
        // Arrange
        byte[] imageContent = "fake image content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                imageContent
        );

        when(aiGatewayService.predictImage(any(MultipartFile.class)))
                .thenThrow(new AiServiceException("Request timed out", 504, "Connection timeout"));

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.status_code").value(504))
                .andExpect(jsonPath("$.error_type").value("AI_SERVICE_ERROR"));
    }

    @Test
    void testPredictImage_UpstreamBadGateway() throws Exception {
        // Arrange
        byte[] imageContent = "fake image content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                imageContent
        );

        when(aiGatewayService.predictImage(any(MultipartFile.class)))
                .thenThrow(new AiServiceException("Connection refused", 502, "Failed to connect"));

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status_code").value(502));
    }

    @Test
    void testHealth_Endpoint() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

        @Test
        void testPredictImage_WithAuthorizationHeader() throws Exception {
        // Arrange
        byte[] imageContent = "fake image content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                imageContent
        );

        AiPredictResponseDto response = AiPredictResponseDto.builder()
                .status("success")
                .prediction("AI-GENERATED")
                .confidence("85.00%")
                .build();

        when(aiGatewayService.predictImage(any(MultipartFile.class)))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(multipart("/api/predict")
                .file(file)
                .header("Authorization", "Bearer eyJhbGc..."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }
}
