# AI Content Detection Backend

Spring Boot backend gateway service that bridges React frontend and Python FastAPI AI service for AI-generated content detection.

## Architecture

```
React Frontend
     ↓ (POST /api/predict with multipart image)
Spring Boot Backend Gateway
     ↓ (POST /predict with multipart image)
Python FastAPI AI Service
```

## Prerequisites

- Java 17+
- Maven 3.9+
- Spring Boot 3.3.4
- Python FastAPI service running on `http://localhost:8080`

## Project Structure

```
backend/
├── src/main/java/com/aicontentdetection/backend/
│   ├── BackendApplication.java              # Boot entry point
│   ├── controller/
│   │   └── AiPredictController.java          # API endpoint: POST /api/predict
│   ├── service/
│   │   ├── AiGatewayService.java             # Interface for AI gateway
│   │   └── impl/
│   │       └── AiGatewayServiceImpl.java      # HTTP client to FastAPI
│   ├── dto/
│   │   ├── AiPredictResponseDto.java         # FastAPI response mapping
│   │   └── ErrorResponseDto.java             # Standardized error response
│   ├── exception/
│   │   ├── AiServiceException.java           # Custom exception for AI service errors
│   │   └── GlobalExceptionHandler.java       # Global error handler
│   ├── config/
│   │   └── HttpClientConfig.java             # RestTemplate configuration
│   └── resources/
│       └── application.properties             # Configuration
├── src/test/java/com/aicontentdetection/backend/
│   ├── service/
│   │   └── AiGatewayServiceTest.java         # Service unit tests
│   └── controller/
│       └── AiPredictControllerTest.java      # Controller layer tests
└── pom.xml                                    # Maven dependencies
```

## Building & Running

### Development (H2 in-memory database)

```bash
# Build
mvn clean package

# Run
mvn spring-boot:run

# Or directly run JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Server runs on `http://localhost:8080`

### Testing

```bash
# Run all tests
mvn test

# Run specific test class
mvn -Dtest=AiPredictControllerTest test

# Run with coverage (if maven-surefire-plugin configured)
mvn test
```

Test coverage:

- **9 Controller layer tests**: upload validation, error handling, endpoint behavior
- **11 Service unit tests**: HTTP client, response mapping, error scenarios

## Configuration

Edit `application.properties` to change settings:

```properties
# AI Service Configuration
ai.service.base-url=http://localhost:8080          # FastAPI service URL
ai.service.predict-endpoint=/predict               # Endpoint path
ai.service.connect-timeout-ms=8080                 # Connection timeout (ms)
ai.service.read-timeout-ms=30000                   # Read timeout (ms)

# Multipart Upload Limits
spring.servlet.multipart.max-file-size=20MB        # Max single file
spring.servlet.multipart.max-request-size=20MB     # Max total request
```

## API Contract

### Endpoint: POST /api/predict

**Request:**

- Multipart form data with file field `file` (JPEG, PNG, or BMP)
- Optional header: `Authorization: Bearer <token>`

**Example (curl):**

```bash
curl -X POST http://localhost:8080/api/predict \
  -F "file=@test_image.jpg" \
  -H "Authorization: Bearer token123"
```

**Success Response (200 OK):**

```json
{
  "status": "success",
  "prediction": "AI-GENERATED",
  "confidence": "78.02%"
}
```

**Error Response Examples:**

400 Bad Request (invalid file):

```json
{
  "status_code": 400,
  "message": "Invalid request",
  "reason": "Invalid file type: text/plain. Allowed types: JPEG, PNG, BMP",
  "timestamp": "2026-04-29T10:30:00",
  "error_type": "VALIDATION_ERROR"
}
```

502 Bad Gateway (AI service error):

```json
{
  "status_code": 502,
  "message": "AI service returned error: Could not process image",
  "reason": "Could not read image",
  "timestamp": "2026-04-29T10:30:00",
  "error_type": "AI_SERVICE_ERROR"
}
```

504 Gateway Timeout (AI service timeout):

```json
{
  "status_code": 504,
  "message": "AI service request timed out",
  "reason": "Connection timeout to AI service after configured timeout period",
  "timestamp": "2026-04-29T10:30:00",
  "error_type": "AI_SERVICE_ERROR"
}
```

### Endpoint: GET /api/health

**Response (200 OK):**

```
API is healthy
```

## Error Handling

The backend maps errors into standardized HTTP status codes:

| Error              | HTTP Code | Description                           |
| ------------------ | --------- | ------------------------------------- |
| Empty file         | 400       | File size is 0 bytes                  |
| Invalid type       | 400       | File type not JPEG/PNG/BMP            |
| File too large     | 400       | File exceeds 20MB limit               |
| Upstream 4xx       | 502       | FastAPI returned 4xx error            |
| Upstream 5xx       | 502       | FastAPI returned 5xx error            |
| Connection timeout | 504       | FastAPI didn't respond within timeout |
| Connection refused | 502       | FastAPI service unreachable           |
| Unexpected error   | 500       | Internal server error                 |

## Dependencies

### Core

- **spring-boot-starter-web** - REST API
- **spring-boot-starter-validation** - Bean validation
- **jackson-databind** - JSON processing
- **lombok** - Boilerplate reduction

### Testing

- **spring-boot-starter-test** - JUnit 5, Mockito, AssertJ
- **mockwebserver** - Mock upstream API for tests

## Integration with Python AI Service

Expected response from FastAPI `/predict` endpoint:

```json
{
  "status": "success|error",
  "prediction": "AI-GENERATED|REAL-IMAGE",
  "confidence": "78.02%",
  "message": "optional error message if status=error"
}
```

### Timeout Behavior

- Connect timeout: 5 seconds (configurable)
- Read timeout: 30 seconds (configurable)
- If FastAPI takes longer, request returns **504 Gateway Timeout**

## Logging

Default log level: **INFO** for dependencies, **DEBUG** for application code.

Example log output:

```
10:30:45.123 INFO  c.a.b.c.AiPredictController -- Received prediction request for file: photo.jpg (size: 245678 bytes)
10:30:45.456 DEBUG c.a.b.s.i.AiGatewayServiceImpl -- Calling AI service: POST http://localhost:8080/predict
10:30:46.789 INFO  c.a.b.c.AiPredictController -- Prediction completed for file: photo.jpg. Result: AI-GENERATED
```

## Next Steps (Future Versions)

### v2: Persistence

- Add database (Postgres/MySQL) to store prediction history
- Add user authentication with JWT
- Add Flyway database migrations
- Add user/analysis history endpoints

### v3: Advanced Features

- Add async job processing for large file uploads
- Add prediction caching to avoid duplicate analysis
- Add metrics and observability (Prometheus)
- Add rate limiting per user
- Add circuit breaker pattern for AI service resilience

### v4: Production Readiness

- Docker containerization
- Kubernetes deployment config
- Security scanning (OWASP)
- Performance testing
- Load testing

## Troubleshooting

### Issue: 502 Bad Gateway when FastAPI is running

- Check FastAPI service URL in `application.properties`
- Verify FastAPI is running: `curl http://localhost:8080/predict`
- Check firewall/network connectivity
- Review backend logs for specific error

### Issue: File upload fails with 400 error

- Ensure file is image (JPEG, PNG, or BMP)
- Check file size is < 20MB
- Verify multipart form data format

### Issue: Tests fail

- Ensure Java 17+ is installed
- Run `mvn clean` before test
- Check Mockito version compatibility

## Contributing

When modifying the backend:

1. Follow existing code style and package structure
2. Add unit tests for new service methods
3. Add controller tests for new endpoints
4. Ensure all tests pass: `mvn test`
5. Run `mvn clean package` before committing

## License

MIT License - See LICENSE file for details
