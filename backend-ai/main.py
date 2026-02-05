from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="AI-Law 프로젝트 API",
    description="법률 상담 서비스의 AI 기능을 담당하는 파이썬 서버입니다.",
    version="1.0.0"
)

# 1. CORS 설정 (리액트와 대화하기 위한 필수 관문) [cite: 2026-01-13]
# 실무에서는 허용할 주소를 명확히 적습니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # 리액트 서버 주소
    allow_credentials=True,
    allow_methods=["*"], # GET, POST, PUT, DELETE 등 모두 허용
    allow_headers=["*"], # 모든 헤더 허용
)

# 2. 데이터 구조 정의 (DTO 역할) [cite: 2025-10-17]
class ChatRequest(BaseModel):
    user_input: str

# 3. 기본 경로 (서버 생존 확인용)
@app.get("/")
def read_root():
    return {"status": "running", "message": "AI-Law 파이썬 서버가 살아있습니다!"}

# 4. 실제 AI 로직이 들어갈 샘플 API
@app.post("/ai/ask")
async def ask_ai(request: ChatRequest):
    # 나중에 여기에 실제 AI 모델 로직을 넣을 겁니다. [cite: 2025-10-17]
    response_text = f"당신의 질문 '{request.user_input}'에 대한 AI의 답변 준비 중입니다."
    return {"answer": response_text}