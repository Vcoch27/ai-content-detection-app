package com.aicontentdetection.backend.repository;

import com.aicontentdetection.backend.entity.FeedbackEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackEntryRepository extends JpaRepository<FeedbackEntry, Long> {
}
