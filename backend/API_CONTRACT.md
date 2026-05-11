# Backend API Contract

This document describes the current backend endpoints, request inputs, response outputs, and persistence behavior for the AI content detection MVP.

## Common Rules

- All user-scoped endpoints require `Authorization: Bearer <token>`.
- Image uploads use `multipart/form-data` with a `file` field.
- Detection images are stored in S3 with the key pattern:

```text
 detections/{userId}/{yyyy-MM-dd}/{uuid}-{originalName}
```

- Detection history and feedback are stored in MySQL.

## 1. Login

### `POST /api/auth/login`

Request body:

```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

Success response `200 OK`:

```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "email": "demo@example.com",
    "createdAt": "2026-05-11T10:00:00"
  }
}
```

Common errors:

- `400 Bad Request` if email or password is missing
- `401 Unauthorized` if credentials are invalid
- `500 Internal Server Error` for unexpected failures

## 2. Detect Image

### `POST /api/predict`

Headers:

```text
Authorization: Bearer <token>
```

Request:

- `Content-Type: multipart/form-data`
- field `file`: image file (`image/jpeg`, `image/png`, `image/bmp`)

Example form upload:

```bash
curl -X POST http://localhost:8080/api/predict \
  -H "Authorization: Bearer <token>" \
  -F "file=@sample.jpg"
```

Behavior:

- Validates file type and size
- Resolves current user from JWT
- Uploads image to S3
- Calls the AI service `/predict`
- Saves detection result to `detections`
- Returns the AI prediction to the client

Success response `200 OK`:

```json
{
  "status": "success",
  "prediction": "AI-GENERATED",
  "confidence": "78.02%",
  "message": null,
  "ai_probability": 78.02,
  "real_probability": 21.98
}
```

Error responses:

- `400 Bad Request` for empty file, invalid type, or oversized file
- `401 Unauthorized` if token is missing or invalid
- `502 Bad Gateway` if the AI service returns an upstream error
- `504 Gateway Timeout` if the AI service times out

Persisted detection fields:

- `user_id`
- `original_filename`
- `content_type`
- `file_size`
- `storage_bucket`
- `storage_key`
- `prediction`
- `confidence`
- `ai_probability`
- `real_probability`
- `ai_service_message`
- `source`

## 3. Detection History

### `GET /api/history?page=1&limit=10`

Headers:

```text
Authorization: Bearer <token>
```

Behavior:

- Returns only the current user's detections
- Results are sorted by `createdAt` descending

Success response `200 OK`:

```json
{
  "data": [
    {
      "id": 12,
      "filename": "sample.jpg",
      "prediction": "AI-GENERATED",
      "confidence": 78.02,
      "timestamp": "2026-05-11T10:15:00",
      "thumbnail": "detections/1/2026-05-11/uuid-sample.jpg",
      "storageBucket": "ai-detect-images",
      "storageKey": "detections/1/2026-05-11/uuid-sample.jpg"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

Error responses:

- `401 Unauthorized` if token is missing or invalid

## 4. Submit Feedback

### `POST /api/feedback`

Headers:

```text
Authorization: Bearer <token>
```

Request body:

```json
{
  "imageId": 12,
  "isCorrect": true,
  "message": "Result looks accurate"
}
```

Behavior:

- Validates the detection exists
- Ensures the detection belongs to the current user
- Creates or updates the user's feedback for that detection

Success response `200 OK`:

```json
{
  "success": true,
  "message": "Feedback saved successfully"
}
```

Error responses:

- `400 Bad Request` for missing required fields
- `401 Unauthorized` if token is missing or invalid
- `403 Forbidden` if the detection belongs to another user
- `404 Not Found` if the detection does not exist

Persisted feedback fields:

- `detection_id`
- `user_id`
- `is_correct`
- `message`

## 5. Profile

### `GET /api/auth/profile`

Headers:

```text
Authorization: Bearer <token>
```

Success response `200 OK`:

```json
{
  "id": 1,
  "email": "demo@example.com",
  "displayName": "Demo User",
  "role": "USER",
  "createdAt": "2026-05-11T10:00:00",
  "totalDetections": 8,
  "aiDetections": 5,
  "realDetections": 3
}
```

Error responses:

- `401 Unauthorized` if token is missing or invalid

## 6. Register

### `POST /api/auth/register`

Request body:

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "displayName": "New User"
}
```

Success response `201 Created`:

```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "createdAt": "2026-05-11T10:00:00"
  }
}
```

Common errors:

- `400 Bad Request` if email/password missing or passwords do not match
- `409 Conflict` if email already exists
- `500 Internal Server Error` for unexpected failures

## 7. Health Check

### `GET /api/health`

Success response `200 OK`:

```text
API is healthy
```

## Notes for Frontend

- The predict response is returned immediately after the AI service reply.
- The history screen should read `storageKey` or `thumbnail` if it needs to render the uploaded image reference.
- The profile screen can use the detection stats directly from `/api/profile`.
