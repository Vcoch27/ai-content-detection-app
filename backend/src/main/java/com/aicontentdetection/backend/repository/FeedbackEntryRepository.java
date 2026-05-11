package com.aicontentdetection.backend.repository;

import com.aicontentdetection.backend.entity.FeedbackEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedbackEntryRepository extends JpaRepository<FeedbackEntry, Long> {
	Optional<FeedbackEntry> findByDetectionIdAndUserId(Long detectionId, Long userId);

	long countByUserId(Long userId);
}
