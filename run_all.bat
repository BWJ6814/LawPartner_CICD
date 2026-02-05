@echo off
echo [AI-Law] 모든 서버를 기동합니다...

:: 1. React 실행 (새 창에서)
echo React 프론트엔드 시작 중...
start cmd /k "cd frontend && npm start"

:: 2. FastAPI 실행 (새 창에서)
echo FastAPI AI 서버 시작 중...
start cmd /k "cd backend-ai && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 3. Spring Boot 실행 (현재 창에서)
echo Spring Boot 백엔드 시작 중...
cd Backend-main
mvn spring-boot:run