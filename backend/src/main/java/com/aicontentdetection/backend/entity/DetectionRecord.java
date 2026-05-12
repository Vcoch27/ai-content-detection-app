package com.aicontentdetection.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "detections")
public class DetectionRecord extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_bucket", length = 255)
    private String storageBucket;

    @Column(name = "storage_key", length = 512)
    private String storageKey;

    @Column(nullable = false, length = 64)
    private String prediction;

    @Column(nullable = false)
    private Double confidence;

    @Column(name = "ai_probability")
    private Double aiProbability;

    @Column(name = "real_probability")
    private Double realProbability;

    @Column(name = "ai_service_message", columnDefinition = "TEXT")
    private String aiServiceMessage;

    @Column(nullable = false, length = 50)
    private String source = "AI_SERVICE";

    @Column(name = "detection_type", length = 20)
    private String detectionType = "IMAGE"; // IMAGE, VIDEO

    @Column(name = "metadata", columnDefinition = "LONGTEXT")
    private String metadata; // Stores JSON of extra metrics

    @Column(name = "thumbnail_key", length = 512)
    private String thumbnailKey; // S3 key for the keyframe image
}
