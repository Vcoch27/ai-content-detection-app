package com.aicontentdetection.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface S3StorageService {
    StoredObject upload(MultipartFile file, String objectKeyPrefix);

    StoredObject uploadBytes(byte[] bytes, String filename, String contentType, String objectKeyPrefix);

    void deleteObject(String bucket, String key);

    record StoredObject(String bucket, String key, String eTag) {
    }
}
