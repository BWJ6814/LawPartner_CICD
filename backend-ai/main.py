import os
import shutil
from pydantic import BaseModel
from dotenv import load_dotenv
from datasets import load_dataset
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter # ✨ 판례를 자르기 위해 추가된 도구
from fastapi import FastAPI, HTTPException

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
print("현재 적용된 API 키 앞부분:", api_key[:10] if api_key else "키 없음")

app = FastAPI()

def initialize_vector_db():
    embedding_model = "models/gemini-embedding-001"
    embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)

    db_path = "./db"

    # 만약 이미 폴더가 있다면 불러옵니다.
    # ⚠️ 주의: 코드를 수정한 뒤 '최초 1회'는 기존 db 폴더를 삭제하고 다시 실행해야 잘라진 데이터가 새로 학습됩니다!
    if os.path.exists(db_path):
        print("💾 기존 학습 데이터를 불러옵니다...")
        return Chroma(persist_directory=db_path, embedding_function=embeddings)

    print("📥 학습 데이터를 다운로드 중입니다... (KLAID)")
    ds = load_dataset("lawcompany/KLAID", split="train[:10]")

    print("⚙️ 데이터 변환 및 텍스트 분할 중...")

    # ✨ 거대한 법률 데이터를 800자 단위로 쪼개는 설정
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,   # 최대 800자까지만 한 덩어리로 만듦
        chunk_overlap=100 # 문맥이 끊기지 않게 앞뒤 100자는 겹치게 자름
    )

    documents = []
    for row in ds:
        combined_text = f"사건: {row['fact']}\n법령: {row['laws_service']}"

        # ✨ 하나의 긴 판례를 여러 개의 짧은 조각으로 나눕니다.
        split_texts = text_splitter.split_text(combined_text)
        for text in split_texts:
            documents.append(Document(page_content=text))

    print(f"📚 총 {len(documents)}개의 조각으로 분할 완료! 임베딩 시작...")
    vectordb = Chroma.from_documents(documents=documents, embedding=embeddings, persist_directory=db_path)
    print("✅ 학습 완료!")
    return vectordb

vectordb = initialize_vector_db()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    api_key=api_key
)

# ✨ 무료 티어 안정성을 위해 검색하는 판례 개수를 3개(k=3)에서 2개(k=2)로 임시 조정했습니다.
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectordb.as_retriever(search_kwargs={"k": 2}),
    return_source_documents=True
)

class QueryRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(request: QueryRequest):
    try:
        response = qa_chain.invoke({"query": request.question})
        sources = [doc.page_content[:200] + "..." for doc in response["source_documents"]]

        return {
            "answer": response["result"],
            "related_cases": sources
        }
    except Exception as e:
        print(f"Error detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))