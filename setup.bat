@echo off
chcp 65001
echo [AI-Law] 통합 환경 구축을 시작합니다...

echo.
echo 1. [Backend] 스프링 부트 라이브러리 설치 (Maven)... 포트 번호 : 8080
cd Backend-main
call mvn clean install -DskipTests
cd ..

echo.
echo 2. [AI Server] 파이썬 가상환경 및 라이브러리 설치... 포트 번호 : 8000
cd backend-ai
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo 3. [Frontend] 리액트 라이브러리 설치 (NPM)... 포트 번호 :3000
cd frontend
call npm install
cd ..

echo.
echo [완료] 모든 라이브러리 설치가 끝났습니다!
pause