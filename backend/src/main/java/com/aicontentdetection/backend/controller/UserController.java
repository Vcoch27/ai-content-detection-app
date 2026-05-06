package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.entity.AppUser;
import com.aicontentdetection.backend.service.AuthService;
import com.aicontentdetection.backend.service.impl.AuthServiceImpl;
import com.aicontentdetection.backend.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for user authentication and profile endpoints
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final AuthServiceImpl authService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            if (request.email() == null || request.email().isEmpty() ||
                request.password() == null || request.password().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and password are required"));
            }

            AppUser user = authService.authenticate(request.email(), request.password());

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
            }

            AuthService.LoginResponse response = authService.generateLoginResponse(user);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            log.error("Login error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Login failed"));
        }
    }

    /**
     * Logout endpoint
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // For MVP, logout is simple - client just needs to clear localStorage
            // In production, could implement token blacklisting
            log.info("User logout request");
            return ResponseEntity.ok(Map.of("success", true, "message", "Logout successful"));
        } catch (Exception ex) {
            log.error("Logout error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Logout failed"));
        }
    }

    /**
     * Get user profile endpoint
     * GET /api/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || authHeader.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authorization header is required"));
            }

            String token = jwtTokenProvider.extractTokenFromHeader(authHeader);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid authorization header format"));
            }

            AppUser user = authService.getUserByToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
            }

            AuthService.UserDto userDto = authService.toUserDto(user);
            return ResponseEntity.ok(Map.of(
                "id", userDto.id(),
                "email", userDto.email(),
                "createdAt", userDto.createdAt()
            ));
        } catch (Exception ex) {
            log.error("Get profile error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get profile"));
        }
    }

    /**
     * Login request DTO
     */
    public record LoginRequest(String email, String password) {
    }
}
