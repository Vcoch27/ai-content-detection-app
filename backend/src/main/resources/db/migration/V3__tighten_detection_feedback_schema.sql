-- Tighten schema for the current MVP flow.
--
-- Goals:
-- - Prevent duplicate feedback submissions for the same detection and user.
-- - Speed up user-scoped history/profile queries.
-- - Enforce uniqueness for stored S3 object keys.

ALTER TABLE detections
    ADD UNIQUE KEY uk_detections_storage_key (storage_key),
    ADD INDEX idx_detections_user_created_at (user_id, created_at),
    ADD INDEX idx_detections_user_prediction (user_id, prediction),
    ADD INDEX idx_detections_storage_bucket (storage_bucket);

ALTER TABLE feedback
    ADD UNIQUE KEY uk_feedback_detection_user (detection_id, user_id);
