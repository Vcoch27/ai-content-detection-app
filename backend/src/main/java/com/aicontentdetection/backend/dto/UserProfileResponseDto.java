package com.aicontentdetection.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {
    private Long id;
    private String email;
    private String displayName;
    private String avatarBucket;
    private String avatarKey;
    private String avatar;
    private String role;
    private String createdAt;
    private long totalDetections;
    private long aiDetections;
    private long realDetections;
    private long storageUsedBytes;
    private long storageQuotaBytes;
}
