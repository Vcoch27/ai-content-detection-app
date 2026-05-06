package com.aicontentdetection.backend.service;

import com.aicontentdetection.backend.entity.AppUser;

/**
 * Service interface for authentication operations
 */
public interface AuthService {

    /**
     * Authenticate user with email and password
     * @param email User email
     * @param password User password
     * @return AppUser if authentication successful, null otherwise
     */
    AppUser authenticate(String email, String password);

    /**
     * Get user by JWT token
     * @param token JWT token
     * @return AppUser if token is valid and user exists, null otherwise
     */
    AppUser getUserByToken(String token);

    /**
     * DTO for login response
     */
    record LoginResponse(String token, UserDto user) {
    }

    /**
     * DTO for user information
     */
    record UserDto(Long id, String email, String createdAt) {
    }
}
