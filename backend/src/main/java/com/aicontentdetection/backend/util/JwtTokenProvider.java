package com.aicontentdetection.backend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class for JWT token generation, validation, and parsing.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret:your-secret-key-change-in-production-must-be-at-least-256-bits}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 hours in milliseconds
    private long jwtExpirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generate JWT token for a user
     * @param userId User ID
     * @return JWT token string
     */
    public String generateToken(Long userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Get User ID from JWT token
     * @param token JWT token
     * @return User ID
     */
    public Long getUserIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return Long.parseLong(claims.getSubject());
        } catch (Exception ex) {
            log.error("Failed to extract user ID from token: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Validate JWT token
     * @param token JWT token
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token);

            return true;
        } catch (Exception ex) {
            log.error("JWT token validation failed: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Extract token from Authorization header
     * @param authHeader Authorization header value (e.g., "Bearer <token>")
     * @return Token string or null if invalid format
     */
    public String extractTokenFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7); // Remove "Bearer " prefix
    }
}
