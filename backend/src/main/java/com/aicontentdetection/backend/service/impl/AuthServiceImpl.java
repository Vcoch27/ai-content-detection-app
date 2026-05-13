package com.aicontentdetection.backend.service.impl;

import com.aicontentdetection.backend.entity.AppUser;
import com.aicontentdetection.backend.repository.AppUserRepository;
import com.aicontentdetection.backend.service.AuthService;
import com.aicontentdetection.backend.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Service implementation for authentication operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_AVATAR_BUCKET = "ai-detect-images";
    private static final String DEFAULT_AVATAR_KEY = "defaultAvt.jpg";
    private static final String DEFAULT_AVATAR_URL = "https://ai-detect-images.s3.us-east-1.amazonaws.com/defaultAvt.jpg";

    private final AppUserRepository appUserRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${storage.quota.default-bytes:104857600}")
    private long defaultStorageQuotaBytes;

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
    public AppUser register(String email, String password, String displayName) {
        try {
            String normalizedEmail = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
            if (normalizedEmail == null || normalizedEmail.isEmpty() || password == null || password.isEmpty()) {
                return null;
            }

            if (appUserRepository.findByEmail(normalizedEmail).isPresent()) {
                log.warn("Registration failed: Email already exists: {}", normalizedEmail);
                return null;
            }

            String resolvedDisplayName = displayName;
            if (resolvedDisplayName == null || resolvedDisplayName.isBlank()) {
                int atIndex = normalizedEmail.indexOf('@');
                resolvedDisplayName = atIndex > 0 ? normalizedEmail.substring(0, atIndex) : normalizedEmail;
            }

            AppUser user = AppUser.builder()
                    .email(normalizedEmail)
                    .displayName(resolvedDisplayName)
                    .passwordHash(password)
                    .avatarBucket(DEFAULT_AVATAR_BUCKET)
                    .avatarKey(DEFAULT_AVATAR_KEY)
                    .storageQuotaBytes(defaultStorageQuotaBytes)
                    .role("USER")
                    .build();

            return appUserRepository.save(user);
        } catch (Exception ex) {
            log.error("Registration error: {}", ex.getMessage(), ex);
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

        String avatarBucket = user.getAvatarBucket();
        String avatarKey = user.getAvatarKey();
        String avatar = buildAvatarUrl(avatarBucket, avatarKey);

        return new AuthService.UserDto(
            user.getId(),
            user.getEmail(),
            createdAt,
            avatarBucket,
            avatarKey,
            avatar
        );
    }

    private String buildAvatarUrl(String avatarBucket, String avatarKey) {
        if (avatarKey == null || avatarKey.isBlank()) {
            return DEFAULT_AVATAR_URL;
        }

        String normalizedKey = avatarKey.trim();
        if (normalizedKey.startsWith("http://") || normalizedKey.startsWith("https://")) {
            return normalizedKey;
        }

        String bucket = (avatarBucket == null || avatarBucket.isBlank())
            ? DEFAULT_AVATAR_BUCKET
            : avatarBucket.trim();

        return String.format("https://%s.s3.us-east-1.amazonaws.com/%s", bucket, normalizedKey);
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
