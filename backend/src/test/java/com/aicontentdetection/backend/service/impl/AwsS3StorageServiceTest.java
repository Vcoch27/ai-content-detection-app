package com.aicontentdetection.backend.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for S3 connectivity.
 * Requires AWS credentials in environment variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_BUCKET_NAME
 */
@SpringBootTest
@ActiveProfiles("test")
class AwsS3StorageServiceTest {

    @Autowired(required = false)
    private AwsS3StorageService s3StorageService;

    @Autowired(required = false)
    private S3Client s3Client;

    @BeforeEach
    void setUp() {
        if (s3StorageService == null || s3Client == null) {
            System.out.println("⚠️ S3 beans not initialized. Skipping S3 integration test.");
            System.out.println("Ensure AWS credentials are set in environment variables.");
        }
    }

    @Test
    void testS3ClientConnectivity() {
        if (s3Client == null) {
            System.out.println("✗ S3Client bean not initialized. Skipping connectivity test.");
            return;
        }

        try {
            // Try to list objects in the bucket to verify connectivity
            String bucketName = System.getenv("AWS_BUCKET_NAME");
            if (bucketName == null || bucketName.isEmpty()) {
                System.out.println("⚠️ AWS_BUCKET_NAME not set. Skipping S3 connectivity test.");
                return;
            }

            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .maxKeys(1)
                    .build();

            ListObjectsV2Response response = s3Client.listObjectsV2(request);
            assertNotNull(response);
            System.out.println("✓ S3 connectivity test passed!");
            System.out.println("  Bucket: " + bucketName);
            System.out.println("  Objects found: " + response.keyCount());
        } catch (Exception ex) {
            System.err.println("✗ S3 connectivity test failed: " + ex.getMessage());
            fail("S3 connectivity failed: " + ex.getMessage());
        }
    }

    @Test
    void testS3FileUpload() {
        if (s3StorageService == null) {
            System.out.println("⚠️ AwsS3StorageService bean not initialized. Skipping upload test.");
            return;
        }

        try {
            String bucketName = System.getenv("AWS_BUCKET_NAME");
            if (bucketName == null || bucketName.isEmpty()) {
                System.out.println("⚠️ AWS_BUCKET_NAME not set. Skipping S3 upload test.");
                return;
            }

            // Create a test file
            String testContent = "This is a test file for S3 connectivity verification";
            MultipartFile testFile = new MockMultipartFile(
                    "testFile",
                    "s3-test.txt",
                    "text/plain",
                    testContent.getBytes()
            );

            // Upload the file
            var storedObject = s3StorageService.upload(testFile, "test-connectivity");

            assertNotNull(storedObject);
            assertNotNull(storedObject.key());
            assertNotNull(storedObject.eTag());
            assertEquals(bucketName, storedObject.bucket());
            assertTrue(storedObject.key().contains("test-connectivity"));
            assertTrue(storedObject.key().contains("s3-test.txt"));

            System.out.println("✓ S3 file upload test passed!");
            System.out.println("  Bucket: " + storedObject.bucket());
            System.out.println("  Object Key: " + storedObject.key());
            System.out.println("  ETag: " + storedObject.eTag());
        } catch (Exception ex) {
            System.err.println("✗ S3 file upload test failed: " + ex.getMessage());
            fail("S3 file upload failed: " + ex.getMessage());
        }
    }
}
