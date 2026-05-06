-- V2__add_demo_user.sql
-- Insert demo user for testing and MVP purposes

INSERT INTO users (email, display_name, password_hash, role, created_at, updated_at)
VALUES ('demo@example.com', 'Demo User', 'demo123', 'USER', NOW(), NOW())
ON DUPLICATE KEY UPDATE email=email;
