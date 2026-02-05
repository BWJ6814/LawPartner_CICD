@echo off
echo [AI-Law] 통합 환경 구축을 시작합니다...

echo.
echo 1. [Backend] 스프링 부트 라이브러리 설치 (Maven)...
cd Backend-main
call mvn clean install -DskipTests
cd ..

echo.
echo 2. [AI Server] 파이썬 가상환경 및 라이브러리 설치...
cd backend-ai
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo 3. [Frontend] 리액트 라이브러리 설치 (NPM)...
cd frontend
call npm install
cd ..

echo.
echo [완료] 모든 라이브러리 설치가 끝났습니다!
pause