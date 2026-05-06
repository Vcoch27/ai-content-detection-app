package com.aicontentdetection.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface S3StorageService {
    StoredObject upload(MultipartFile file, String objectKeyPrefix);

    record StoredObject(String bucket, String key, String eTag) {
    }
}
