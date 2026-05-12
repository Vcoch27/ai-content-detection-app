-- Add fields for video detection history with compatible syntax
ALTER TABLE detections ADD COLUMN detection_type VARCHAR(20) DEFAULT 'IMAGE';
ALTER TABLE detections ADD COLUMN metadata LONGTEXT;
ALTER TABLE detections ADD COLUMN thumbnail_key VARCHAR(512);
