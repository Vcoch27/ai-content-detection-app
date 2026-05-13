-- Remove thumbnail_key column as we now display video directly in history
ALTER TABLE detections DROP COLUMN thumbnail_key;
