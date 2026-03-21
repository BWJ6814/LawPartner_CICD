@echo off
chcp 65001 > nul
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
if not exist venv python -m venv venv
call venv\Scripts\activate
python -m pip install -r requirements.txt
:: --reload 는 워커 재시작 시 진행 중인 연결이 끊길 수 있어 상용(서버 상시 구동)에서는 끕니다. 개발 시에는 run-dev.bat 사용.
uvicorn main:app --host 0.0.0.0 --port 8000 --timeout-keep-alive 120
pause