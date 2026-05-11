-- Ensure users always have a default avatar bucket/key.
-- Existing rows with null/blank avatar values are backfilled.

SET @avatar_bucket_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'avatar_bucket'
);

SET @add_avatar_bucket_sql := IF(
    @avatar_bucket_exists = 0,
    'ALTER TABLE users ADD COLUMN avatar_bucket VARCHAR(255) NULL',
    'SELECT 1'
);

PREPARE add_avatar_bucket_stmt FROM @add_avatar_bucket_sql;
EXECUTE add_avatar_bucket_stmt;
DEALLOCATE PREPARE add_avatar_bucket_stmt;

SET @avatar_key_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'avatar_key'
);

SET @add_avatar_key_sql := IF(
    @avatar_key_exists = 0,
    'ALTER TABLE users ADD COLUMN avatar_key VARCHAR(512) NULL',
    'SELECT 1'
);

PREPARE add_avatar_key_stmt FROM @add_avatar_key_sql;
EXECUTE add_avatar_key_stmt;
DEALLOCATE PREPARE add_avatar_key_stmt;

UPDATE users
SET avatar_bucket = 'ai-detect-images'
WHERE avatar_bucket IS NULL OR TRIM(avatar_bucket) = '';

UPDATE users
SET avatar_key = 'defaultAvt.jpg'
WHERE avatar_key IS NULL OR TRIM(avatar_key) = '';

ALTER TABLE users
    MODIFY COLUMN avatar_bucket VARCHAR(255) NOT NULL DEFAULT 'ai-detect-images',
    MODIFY COLUMN avatar_key VARCHAR(512) NOT NULL DEFAULT 'defaultAvt.jpg';
