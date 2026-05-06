package com.aicontentdetection.backend.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit test for AwsS3StorageService with mocked S3Client.
 * Tests S3 upload functionality without requiring real AWS credentials.
 */
@ExtendWith(MockitoExtension.class)
class AwsS3StorageServiceUnitTest {

    @Mock
    private S3Client mockS3Client;

    private AwsS3StorageService s3StorageService;

    @BeforeEach
    void setUp() {
        s3StorageService = new AwsS3StorageService(mockS3Client);
        ReflectionTestUtils.setField(s3StorageService, "bucketName", "test-bucket");
    }

    @Test
    void testUploadFile() {
        // Arrange
        String testContent = "Test file content";
        MultipartFile testFile = new MockMultipartFile(
                "testFile",
                "test-file.txt",
                "text/plain",
                testContent.getBytes()
        );

        PutObjectResponse mockResponse = PutObjectResponse.builder()
                .eTag("\"test-etag-123\"")
                .build();

        when(mockS3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(mockResponse);

        // Act
        var result = s3StorageService.upload(testFile, "test-prefix");

        // Assert
        assertNotNull(result);
        assertEquals("test-bucket", result.bucket());
        assertTrue(result.key().contains("test-prefix"));
        assertTrue(result.key().contains("test-file.txt"));
        assertEquals("\"test-etag-123\"", result.eTag());

        System.out.println("✓ Upload test passed!");
        System.out.println("  Key: " + result.key());
        System.out.println("  ETag: " + result.eTag());
    }

    @Test
    void testUploadFileWithoutPrefix() {
        // Arrange
        String testContent = "Another test content";
        MultipartFile testFile = new MockMultipartFile(
                "testFile",
                "another-file.pdf",
                "application/pdf",
                testContent.getBytes()
        );

        PutObjectResponse mockResponse = PutObjectResponse.builder()
                .eTag("\"test-etag-456\"")
                .build();

        when(mockS3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(mockResponse);

        // Act
        var result = s3StorageService.upload(testFile, null);

        // Assert
        assertNotNull(result);
        assertEquals("test-bucket", result.bucket());
        assertTrue(result.key().contains("uploads")); // default prefix
        assertTrue(result.key().contains("another-file.pdf"));

        System.out.println("✓ Upload without prefix test passed!");
        System.out.println("  Key: " + result.key());
    }

    @Test
    void testUploadFileCallsS3Client() {
        // Arrange
        MultipartFile testFile = new MockMultipartFile(
                "testFile",
                "verify-call.txt",
                "text/plain",
                "test content".getBytes()
        );

        PutObjectResponse mockResponse = PutObjectResponse.builder()
                .eTag("\"etag\"")
                .build();

        when(mockS3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(mockResponse);

        // Act
        s3StorageService.upload(testFile, "test");

        // Assert - Verify S3Client was called
        verify(mockS3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));

        System.out.println("✓ S3Client invocation test passed!");
    }
}
