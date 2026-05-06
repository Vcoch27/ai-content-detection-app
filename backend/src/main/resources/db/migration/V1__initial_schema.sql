CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NULL,
    password_hash VARCHAR(255) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE IF NOT EXISTS detections (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_bucket VARCHAR(255) NULL,
    storage_key VARCHAR(512) NULL,
    prediction VARCHAR(64) NOT NULL,
    confidence DECIMAL(6,2) NOT NULL,
    ai_probability DECIMAL(6,2) NULL,
    real_probability DECIMAL(6,2) NULL,
    ai_service_message TEXT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'AI_SERVICE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_detections_user_id (user_id),
    KEY idx_detections_created_at (created_at),
    CONSTRAINT fk_detections_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT NOT NULL AUTO_INCREMENT,
    detection_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    is_correct BOOLEAN NOT NULL,
    message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_feedback_detection_id (detection_id),
    KEY idx_feedback_user_id (user_id),
    CONSTRAINT fk_feedback_detection FOREIGN KEY (detection_id) REFERENCES detections (id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
