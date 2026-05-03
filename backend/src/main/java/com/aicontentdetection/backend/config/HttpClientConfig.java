package com.aicontentdetection.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for HTTP client used to communicate with FastAPI service.
 */
@Configuration
public class HttpClientConfig {

    @Value("${ai.service.connect-timeout-ms:8080}")
    private long connectTimeoutMs;

    @Value("${ai.service.read-timeout-ms:30000}")
    private long readTimeoutMs;

    /**
     * RestTemplate bean configured with timeouts for AI service communication.
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }
}
