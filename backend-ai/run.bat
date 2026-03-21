@echo off
chcp 65001 > nul
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
:: Chroma/ONNX 등 네이티브 라이브러리가 Windows에서 불안정할 때 완화
set OMP_NUM_THREADS=1
set TOKENIZERS_PARALLELISM=false
:: Chroma similarity_search 직후 Uvicorn이 죽는다면 아래 주석 제거(판례 검색 없이 LLM만 사용):
:: set RAG_DISABLE=1
if not exist venv python -m venv venv
call venv\Scripts\activate
python -m pip install -r requirements.txt
:: --reload 는 워커 재시작 시 진행 중인 연결이 끊길 수 있어 상용(서버 상시 구동)에서는 끕니다. 개발 시에는 run-dev.bat 사용.
uvicorn main:app --host 0.0.0.0 --port 8000 --timeout-keep-alive 120
pause