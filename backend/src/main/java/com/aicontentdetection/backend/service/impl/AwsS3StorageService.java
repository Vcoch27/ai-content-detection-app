package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AwsS3StorageService implements S3StorageService {

    private final S3Client s3Client;

    @Value("${aws.bucket-name}")
    private String bucketName;

    @Override
    public StoredObject upload(MultipartFile file, String objectKeyPrefix) {
        String cleanFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String datePrefix = LocalDate.now().toString();
        String key = String.format("%s/%s/%s-%s",
                objectKeyPrefix == null ? "uploads" : objectKeyPrefix,
                datePrefix,
                UUID.randomUUID(),
                cleanFilename);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        try {
            PutObjectResponse response = s3Client.putObject(request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return new StoredObject(bucketName, key, response.eTag());
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to upload file to S3", ex);
        }
    }
    @Override
    public StoredObject uploadBytes(byte[] bytes, String filename, String contentType, String objectKeyPrefix) {
        String cleanFilename = StringUtils.cleanPath(filename == null ? "upload" : filename);
        String datePrefix = LocalDate.now().toString();
        String key = String.format("%s/%s/%s-%s",
                objectKeyPrefix == null ? "uploads" : objectKeyPrefix,
                datePrefix,
                UUID.randomUUID(),
                cleanFilename);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectResponse response = s3Client.putObject(request, RequestBody.fromBytes(bytes));
        return new StoredObject(bucketName, key, response.eTag());
    }

    @Override
    public void deleteObject(String bucket, String key) {
        if (!StringUtils.hasText(bucket) || !StringUtils.hasText(key)) {
            return;
        }

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        s3Client.deleteObject(request);
    }
}
