package com.aicontentdetection.backend.repository;

import com.aicontentdetection.backend.entity.DetectionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetectionRecordRepository extends JpaRepository<DetectionRecord, Long> {
    Page<DetectionRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
