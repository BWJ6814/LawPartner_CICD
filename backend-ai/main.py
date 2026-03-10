import os
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from fastapi import FastAPI, HTTPException

# 1. 환경 변수(.env)에서 구글 API 키를 안전하게 불러옵니다.
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
print("현재 적용된 API 키 앞부분:", api_key[:10] if api_key else "키 없음")

# FastAPI 애플리케이션 객체를 생성합니다. (스프링 부트의 Application 역할)
app = FastAPI()

# 2. 크로마 DB를 불러오는 전용 함수
# 이제 서버가 켜질 때마다 무겁게 데이터를 다운받지 않고, 저장된 폴더만 쏙 읽어옵니다.
def get_vector_db():
    embedding_model = "models/gemini-embedding-001"
    embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)
    db_path = "./db"

    # 만약 db 폴더가 없다면, 크로마 DB가 생성되지 않은 것이므로 에러를 발생시킵니다.
    if not os.path.exists(db_path):
        raise Exception("DB 폴더가 없습니다! 먼저 update_db.py를 실행해서 데이터를 넣어주세요.")

    print("💾 학습된 크로마 DB를 성공적으로 불러왔습니다.")
    return Chroma(persist_directory=db_path, embedding_function=embeddings)

# 서버가 구동될 때 최초 1회만 DB 연결을 수행하여 메모리에 올려둡니다.
vectordb = get_vector_db()

# 3. 답변을 생성할 AI 언어 모델(LLM) 설정
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0, # 0에 가까울수록 창의성보다는 문서 기반의 딱딱하고 정확한 답변을 냅니다. (법률 AI에 적합)
    api_key=api_key
)

# 4. RAG 체인 설정 (질문 -> DB 검색 -> AI 답변 생성의 흐름을 하나로 묶어주는 랭체인 도구)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff", # 검색된 문서들을 질문과 함께 그대로 AI에게 우겨넣는(stuff) 방식
    retriever=vectordb.as_retriever(search_kwargs={"k": 2}), # 가장 관련성 높은 판례 2개를 찾습니다.
    return_source_documents=True # AI가 답변할 때 참고한 원본 판례 데이터도 같이 반환하도록 설정
)

# 5. 프론트엔드(React)에서 보내올 데이터의 형식을 Pydantic으로 정의합니다. (DTO 역할)
class QueryRequest(BaseModel):
    question: str

# 6. 실제 API 엔드포인트
# 리액트에서 axios.post('http://localhost:8000/chat', { question: "..." }) 로 요청하면 여기가 실행됩니다.
@app.post("/chat")
async def chat(request: QueryRequest):
    try:
        # 사용자의 질문을 RAG 체인에 통과시켜 답변을 얻어냅니다.
        response = qa_chain.invoke({"query": request.question})

        # 참고한 판례 원문 전체를 전송 (프론트엔드에서 더보기로 펼쳐서 표시)
        sources = [doc.page_content for doc in response["source_documents"]]

        # 완성된 AI의 답변과 참고 판례 리스트를 JSON 형태로 리액트에게 돌려보냅니다.
        return {
            "answer": response["result"],
            "related_cases": sources
        }
    except Exception as e:
        print(f"Error detail: {e}")
        # 서버 내부에서 에러가 나면 500 상태 코드와 함께 에러 내용을 리액트로 보냅니다.
        raise HTTPException(status_code=500, detail=str(e))