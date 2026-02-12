@echo off
:: [핵심 1] 한글 깨짐 방지 (UTF-8 모드 변경)
chcp 65001 > nul

echo.
echo =================================================
echo [AI-Law] 모든 서버를 기동합니다...
echo =================================================
echo.

:: 1. React 실행 (새 창에서)
echo [1/3] React 프론트엔드 시작 중...
start "React Frontend" cmd /k "cd frontend && npm start"

:: 2. FastAPI 실행 (새 창에서)
echo [2/3] FastAPI AI 서버 시작 중...
:: 혹시 가상환경 폴더명이 venv가 아니라 .venv라면 아래 venv를 .venv로 수정하세요.
start "FastAPI Server" cmd /k "cd backend-ai && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"
:: 3. Spring Boot 실행 (현재 창에서)
echo [3/3] Spring Boot 백엔드 시작 중...
cd Backend-main

:: ★ [추가] Maven과 Spring Boot에게 UTF-8 인코딩을 강제로 명령합니다.
set MAVEN_OPTS=-Dfile.encoding=UTF-8

:: [핵심 2] 'mvn' 대신 'mvnw' (Maven Wrapper) 사용
:: mvn은 컴퓨터에 설치가 안 되어 있으면 에러가 나지만,
:: mvnw는 프로젝트 안에 포함된 파일이라 설치 없이도 실행됩니다.
if exist mvnw (
    call mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Dfile.encoding=UTF-8"
) else (
    echo [오류] mvnw 파일이 없습니다. Maven이 설치되어 있는지 확인해주세요.
    echo 'mvn' 명령어로 재시도합니다...
    mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dfile.encoding=UTF-8"
)

pause