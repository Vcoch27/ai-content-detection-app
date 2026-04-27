# AI Content Detection App

Project full-stack gom:

- Backend: Spring Boot (Maven)
- Frontend: React + Vite

## Cau truc thu muc

- backend/
- frontend/

## Chay backend

Yeu cau: Java 17+, Maven 3.9+

```bash
cd backend
mvn spring-boot:run
```

Backend chay tai: http://localhost:8080

Test API:

- GET http://localhost:8080/api/health

## Chay frontend

Yeu cau: Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

Frontend chay tai: http://localhost:5173

Frontend da duoc cau hinh proxy:

- /api -> http://localhost:8080

## Goi y phat trien tiep

- Them endpoint API cho bai toan detect noi dung AI
- Ket noi frontend voi endpoint predict
- Them CORS neu frontend/backend deploy khac domain
