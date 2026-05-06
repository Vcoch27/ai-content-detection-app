package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.entity.AppUser;
import com.aicontentdetection.backend.repository.AppUserRepository;
import com.aicontentdetection.backend.service.AuthService;
import com.aicontentdetection.backend.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * Service implementation for authentication operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AppUserRepository appUserRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public AppUser authenticate(String email, String password) {
        try {
            AppUser user = appUserRepository.findByEmail(email)
                    .orElse(null);

            if (user == null) {
                log.warn("Authentication failed: User not found with email: {}", email);
                return null;
            }

            // Simple password comparison (MVP - plaintext)
            // In production, use BCryptPasswordEncoder
            if (!user.getPasswordHash().equals(password)) {
                log.warn("Authentication failed: Invalid password for email: {}", email);
                return null;
            }

            log.info("User authenticated successfully: {}", email);
            return user;
        } catch (Exception ex) {
            log.error("Authentication error: {}", ex.getMessage(), ex);
            return null;
        }
    }

    @Override
    public AppUser getUserByToken(String token) {
        try {
            if (!jwtTokenProvider.validateToken(token)) {
                log.warn("Invalid token");
                return null;
            }

            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            if (userId == null) {
                log.warn("Failed to extract user ID from token");
                return null;
            }

            return appUserRepository.findById(userId)
                    .orElse(null);
        } catch (Exception ex) {
            log.error("Error getting user from token: {}", ex.getMessage(), ex);
            return null;
        }
    }

    /**
     * Helper method to convert AppUser to UserDto
     */
    public AuthService.UserDto toUserDto(AppUser user) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        String createdAt = user.getCreatedAt() != null
            ? user.getCreatedAt().format(formatter)
            : null;

        return new AuthService.UserDto(
            user.getId(),
            user.getEmail(),
            createdAt
        );
    }

    /**
     * Helper method to generate login response
     */
    public AuthService.LoginResponse generateLoginResponse(AppUser user) {
        String token = jwtTokenProvider.generateToken(user.getId());
        return new AuthService.LoginResponse(
            token,
            toUserDto(user)
        );
    }
}
