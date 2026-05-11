# Frontend Contract Guide

This file maps the current frontend screens to the backend contract in `backend/API_CONTRACT.md`.

## Shared Rules

- Auth token is stored in localStorage under `token`.
- Protected pages require `Authorization: Bearer <token>`.
- History/profile data are refreshed from backend, not localStorage-only state.
- Detect from URL is currently disabled in the UI because the backend contract only supports multipart file upload.

## Login

Screen: `src/pages/LoginPage.jsx`

Backend call:

- `POST /api/auth/login`

Request:

```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

Frontend behavior:

- Save `token` and `user` from response
- Redirect to `/detect`

## Detect

Screen: `src/pages/DetectPage.jsx`

Backend call:

- `POST /api/predict`

Request:

- multipart form-data
- field name: `file`

Frontend behavior:

- Validate image type and size before sending
- Show result card using `status`, `prediction`, `confidence`, `message`, `ai_probability`, `real_probability`
- URL tab stays as coming soon

## History

Screen: `src/pages/HistoryPage.jsx`

Backend call:

- `GET /api/history?page=1&limit=10`

Frontend behavior:

- Render `filename`, `prediction`, `confidence`, `timestamp`
- Build preview URL from `storageBucket` + `storageKey`
- Use history item ID to prefill feedback form

## Feedback

Screen: `src/pages/FeedbackPage.jsx`

Backend call:

- `POST /api/feedback`

Request:

```json
{
  "imageId": 12,
  "isCorrect": true,
  "message": "Result looks accurate"
}
```

Frontend behavior:

- Require numeric detection ID
- Prefill `imageId` from the selected history item when available

## Profile

Screen: `src/pages/ProfilePage.jsx`

Backend call:

- `GET /api/profile`

Frontend behavior:

- Read-only profile view
- Show `displayName`, `role`, `createdAt`, and detection stats

## Logout

Backend call:

- `POST /api/auth/logout`

Frontend behavior:

- Always clear local storage
- Redirect to `/login`
