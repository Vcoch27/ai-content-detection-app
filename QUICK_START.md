# 🚀 Quick Start Guide

Chạy toàn bộ stack: AI Service → Backend → Frontend

## Prerequisites

- Java 21+
- Python 3.8+
- Node.js 18+

---

## 1. AI Service (Python)

```bash
# Từ thư mục ai-generated-content-detection
cd ../ai-generated-content-detection

# Chạy uvicorn server
.\.venv\Scripts\python.exe -m uvicorn api_service:app --host 127.0.0.1 --port 8000 --reload
```

✅ Kiểm tra: http://127.0.0.1:8000/docs

---

## 2. Backend (Java Spring Boot)

```bash
# Từ thư mục dự án gốc
cd ai-content-detection-app/backend

# Chạy JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

✅ Kiểm tra: http://127.0.0.1:8080/api/health

---

## 3. Frontend (React + Vite)

```bash
# Từ thư mục dự án gốc
cd ai-content-detection-app/frontend

# Cài dependencies (lần đầu)
npm install

# Chạy dev server
npm run dev
```

✅ Mở trình duyệt: http://localhost:5173

---

## 📋 Workflow đầy đủ

1. **Terminal 1**: Chạy AI Service (port 8000)
2. **Terminal 2**: Chạy Backend (port 8080)
3. **Terminal 3**: Chạy Frontend (port 5173)
4. Mở http://localhost:5173 → Upload ảnh → Bấm **BẮT ĐẦU KIỂM ĐỊNH**

---

## 🔧 Build Backend (nếu thay đổi code)

```bash
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

---

## 📦 Build Frontend (production)

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## ✅ Expected Flow

```
Frontend (React, port 5173)
    ↓
POST /api/predict (proxied to http://localhost:8080/api/predict)
    ↓
Backend (Spring Boot, port 8080)
    ↓
POST http://127.0.0.1:8000/predict
    ↓
AI Service (Python FastAPI, port 8000)
    ↓
Response: { "status": "success", "prediction": "AI-GENERATED", "confidence": "58.39%" }
```

---

## ⚠️ Troubleshooting

- **Frontend báo lỗi mạng?** → Kiểm tra Backend chạy trên :8080, AI Service chạy trên :8000
- **Backend trả 502?** → Xem logs, kiểm tra `application.properties` có `ai.service.base-url=http://127.0.0.1:8000`
- **Port bị chiếm?** → Thay đổi port trong config, mặc định: AI Service :8000, Backend :8080, Frontend :5173

---

Enjoy! 🎉
oke
