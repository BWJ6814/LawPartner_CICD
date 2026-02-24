import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from datasets import load_dataset
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.docstore.document import Document
from langchain.chains import RetrievalQA

# 환경변수 로드 (GOOGLE_API_KEY 필수)
load_dotenv()

app = FastAPI()

# ==========================================
# 1. 초기화: 데이터셋 다운로드 및 학습
# ==========================================
def initialize_vector_db():
    if os.path.exists("./db"):
        print("💾 기존 학습 데이터를 불러옵니다...")
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        return Chroma(persist_directory="./db", embedding_function=embeddings)

    print("📥 학습 데이터를 다운로드 중입니다... (KLAID)")
    ds = load_dataset("lawcompany/KLAID", split="train[:1000]") # 1000개만 학습

    print("⚙️ 데이터 변환 중...")
    documents = []
    for row in ds:
        combined_text = f"사건: {row['fact']}\n법령: {row['laws_service']}"
        documents.append(Document(page_content=combined_text))

    print(f"📚 {len(documents)}개 판례 학습 시작...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectordb = Chroma.from_documents(documents=documents, embedding=embeddings, persist_directory="./db")
    print("✅ 학습 완료!")
    return vectordb

vectordb = initialize_vector_db()

# Gemini 모델 설정
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectordb.as_retriever(search_kwargs={"k": 3}),
    return_source_documents=True
)

class QueryRequest(BaseModel):
    question: str

# ==========================================
# 2. 채팅 API (스프링이 호출함)
# ==========================================
@app.post("/chat")
async def chat(request: QueryRequest):
    try:
        response = qa_chain.invoke({"query": request.question})
        sources = [doc.page_content[:200] + "..." for doc in response["source_documents"]] # 너무 길면 자름

        return {
            "answer": response["result"],
            "related_cases": sources
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 실행: uvicorn main:app --reload --port 8000