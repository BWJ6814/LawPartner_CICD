@echo off
REM Avoid chcp 65001 and non-ASCII echo: Korean Windows cmd can mangle UTF-8 and break the next line (e.g. ' is not recognized).
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
if not exist venv python -m venv venv
call venv\Scripts\activate

REM First run only: pip (delete .deps_ok if requirements.txt changed)
if not exist ".deps_ok" (
  echo [backend-ai] First run: pip install -r requirements.txt ...
  python -m pip install -r requirements.txt
  echo ok> .deps_ok
) else (
  echo [backend-ai] pip skipped - .deps_ok exists. Delete .deps_ok to reinstall deps.
)

REM No --reload. Auto-restart on exit.
:loop
echo [backend-ai] Starting Uvicorn 0.0.0.0:8000 ...
uvicorn main:app --host 0.0.0.0 --port 8000
echo [WARN] Uvicorn exited. Restart in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
