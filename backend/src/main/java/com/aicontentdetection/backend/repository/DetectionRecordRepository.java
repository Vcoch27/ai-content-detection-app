package com.aicontentdetection.backend.repository;

import com.aicontentdetection.backend.entity.DetectionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DetectionRecordRepository extends JpaRepository<DetectionRecord, Long> {
    Page<DetectionRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<DetectionRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserId(Long userId);

    long countByUserIdAndPredictionIgnoreCase(Long userId, String prediction);

    @Query("SELECT COALESCE(SUM(d.fileSize), 0) FROM DetectionRecord d WHERE d.userId = :userId AND d.storageKey IS NOT NULL")
    long sumStoredFileSizeByUserId(@Param("userId") Long userId);
}
