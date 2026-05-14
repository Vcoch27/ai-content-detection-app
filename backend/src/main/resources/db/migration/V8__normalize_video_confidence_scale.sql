-- Older video detections were stored as raw probabilities (0..1) instead of percentages (0..100).
UPDATE detections
SET confidence = ROUND(confidence * 100, 2)
WHERE detection_type = 'VIDEO'
  AND confidence > 0
  AND confidence <= 1;
