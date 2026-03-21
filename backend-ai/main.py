import logging
import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from fastapi import FastAPI, HTTPException

# 1. 환경 변수(.env)에서 구글 API 키를 안전하게 불러옵니다.
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
print("API key prefix:", api_key[:10] if api_key else "none")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 애플리케이션 객체를 생성합니다. (스프링 부트의 Application 역할)
app = FastAPI()


@app.get("/health")
def health():
    """Spring·로드밸런서·수동 점검용. 무거운 초기화와 무관하게 빠르게 응답."""
    return {"status": "ok"}

# 2. 크로마 DB를 불러오는 전용 함수
# 이제 서버가 켜질 때마다 무겁게 데이터를 다운받지 않고, 저장된 폴더만 쏙 읽어옵니다.
def get_vector_db():
    embedding_model = "models/gemini-embedding-001"
    embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)
    db_path = "./db"

    # 만약 db 폴더가 없다면, 크로마 DB가 생성되지 않은 것이므로 에러를 발생시킵니다.
    if not os.path.exists(db_path):
        raise Exception("DB 폴더가 없습니다! 먼저 update_db.py를 실행해서 데이터를 넣어주세요.")

    print("Chroma DB loaded successfully.")
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
# 기본 프롬프트 대신, 판례 + 일반 법률 지식을 함께 활용해 실무적인 조언을 하도록 커스터마이징
rag_prompt_template = """
당신은 한국 법률 전문가입니다.
아래에 제공된 판례와 법령 요약은 참고 자료일 뿐이며,
일반적인 법률 지식과 실무 경험도 함께 활용해서 질문에 답변해야 합니다.

반드시 다음 원칙을 지키세요.
1. 질문이 구체적이지 않더라도, 아는 범위 내에서 가능한 한 자세히 설명합니다.
2. '제공된 정보만으로는 답변을 드릴 수 없습니다' 와 같은 문장은 사용하지 마세요.
3. 판례 내용은 예시로 활용하되, 사용자가 지금 어떤 조치를 취해야 하는지
   단계별로 정리해서 안내합니다.
4. 너무 단호하게 결과를 단정하지 말고,
   '일반적으로는 ~할 수 있습니다', '다만 구체적인 사실관계에 따라 달라질 수 있습니다' 처럼 설명하세요.

[참고 판례 및 자료]
{context}

[사용자 질문]
{question}

위 정보를 바탕으로,
1) 현재 상황에서 일반적으로 예상되는 법적 평가
2) 단기적으로 취해야 할 조치 (예: 신고, 증거 확보, 변호사 상담 등)
3) 유의해야 할 점
을 한국어로 자세히 설명하세요.
"""

rag_prompt = PromptTemplate(
    template=rag_prompt_template,
    input_variables=["context", "question"],
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 검색된 문서들을 질문과 함께 그대로 AI에게 우겨넣는(stuff) 방식
    retriever=vectordb.as_retriever(search_kwargs={"k": 2}),  # 가장 관련성 높은 판례 2개를 찾습니다.
    return_source_documents=True,  # AI가 답변할 때 참고한 원본 판례 데이터도 같이 반환하도록 설정
    chain_type_kwargs={"prompt": rag_prompt},
)

# 5. 프론트엔드(React)에서 보내올 데이터의 형식을 Pydantic으로 정의합니다. (DTO 역할)
class QueryRequest(BaseModel):
    question: str
    # 프론트에서 disableRag: true 를 보내면 RAG를 사용하지 않고 순수 LLM으로만 답변
    disable_rag: Optional[bool] = False


class SummarizeMessage(BaseModel):
    isUser: bool
    text: str
    sources: Optional[list[str]] = None


class SummarizeConsultRequest(BaseModel):
    """상담내용으로 글쓰기 시 대화 내역 + 참고 판례를 변호사 상담용 양식으로 정리 요청"""
    messages: list[SummarizeMessage]

# 6. 실제 API 엔드포인트
# 리액트에서 axios.post('http://localhost:8000/chat', { question: "..." }) 로 요청하면 여기가 실행됩니다.
@app.post("/chat")
def chat(request: QueryRequest):
    """동기 def: langchain invoke()가 블로킹이므로 스레드 풀에서 실행되어 이벤트 루프를 막지 않음."""
    logger.info("POST /chat received (question len=%s, disable_rag=%s)", len(request.question or ""), request.disable_rag)
    try:
        # 1) disable_rag 플래그가 true 이면 RAG를 타지 않고 순수 LLM으로만 답변
        if request.disable_rag:
            prompt = (
                "당신은 한국 법률 전문가입니다.\n"
                "질문에 대해 일반적인 법률 지식과 실무 관행을 바탕으로, "
                "특정 판례를 전제로 하지 않고도 이해하기 쉽게 가이드 형태로 자세히 설명하세요.\n\n"
                f"질문: {request.question}"
            )
            llm_resp = llm.invoke(prompt)
            answer_text = getattr(llm_resp, "content", llm_resp)
            return {
                "answer": answer_text,
                "related_cases": []
            }

        # 2) 기본 모드: RAG 체인 사용
        response = qa_chain.invoke({"query": request.question})

        # 참고한 판례 원문 전체를 전송 (프론트엔드에서 더보기로 펼쳐서 표시)
        sources = [doc.page_content for doc in response.get("source_documents", [])]

        # 3) 검색된 판례가 전혀 없으면, RAG 대신 순수 LLM으로 fallback
        if not sources:
            prompt = (
                "당신은 한국 법률 전문가입니다.\n"
                "연결된 판례나 자료가 없더라도, 일반적인 법률 지식을 바탕으로 "
                "질문에 대해 가능한 범위 내에서 구체적이고 실무적인 가이드를 제시하세요.\n\n"
                f"질문: {request.question}"
            )
            llm_resp = llm.invoke(prompt)
            answer_text = getattr(llm_resp, "content", llm_resp)
            return {
                "answer": answer_text,
                "related_cases": []
            }

        # 4) RAG 검색 + 판례 기반 답변
        return {
            "answer": response["result"],
            "related_cases": sources
        }
    except Exception as e:
        print(f"Error detail: {e}")
        # 서버 내부에서 에러가 나면 500 상태 코드와 함께 에러 내용을 리액트로 보냅니다.
        raise HTTPException(status_code=500, detail=str(e))


# 상담내용으로 글쓰기: 대화를 변호사 상담 게시글용 제목·본문으로 정리
SUMMARIZE_CONSULT_PROMPT = """당신은 법률 상담 게시글을 정리하는 전문가입니다.
아래 [상담 원문]은 사용자와 LAW PARTNER AI의 법률 상담 대화입니다.
이를 변호사에게 올리는 상담 게시글 양식으로 정리해주세요.

[상담 원문]
{conversation}

[출력 형식]
반드시 아래 형식만 따르세요. 다른 설명이나 서두 없이 이 형식대로만 출력하세요.

제목: (한 줄 제목. 예: 술자리 내 소지품 절도 사건(피해액 100만 원) 대응 및 법적 절차 문의)

1. 사건 개요
일시 : (상담 내용에서 추론 가능한 일시, 없으면 "상담 시 기재" 등으로 표기)
장소 : (장소가 나오면 구체 기재, 없으면 "[사건이 발생한 장소명 또는 위치 기재]")
피해 사실 : (피해 금액·물품·상황을 한두 문장으로 요약)

2. 현재 상황 및 증거
증거 확보 : (CCTV, 물증 등 확보 여부와 내용)
용의자 특정 : (용의자 특정 여부, 인상착의 등)

3. 변호사님께 드리는 질문
(상담 내용을 바탕으로, 변호사에게 실제로 하고 싶은 질문 2~4개를 구체적으로 번호 없이 나열. 예: 고소 절차, 합의 및 배상, 변호사 선임 필요성 등)
"""


@app.post("/summarize-consult")
def summarize_consult(request: SummarizeConsultRequest):
    """대화 내역을 변호사 상담 게시글용 제목·본문(사건 개요, 현재 상황, 변호사님께 드리는 질문)으로 정리 후 참고 판례를 붙여 반환"""
    try:
        # 인사 메시지 제외한 대화만 사용
        conversation_parts = []
        for m in request.messages:
            if m.isUser:
                conversation_parts.append(f"[질문]\n{m.text or ''}")
            else:
                if not (m.text or "").strip():
                    continue
                conversation_parts.append(f"[LAW PARTNER 답변]\n{(m.text or '').strip()}")
        conversation_text = "\n\n".join(conversation_parts)

        if not conversation_text.strip():
            return {"title": "AI 법률 상담 내용", "content": "상담 내역이 없습니다."}

        prompt = SUMMARIZE_CONSULT_PROMPT.format(conversation=conversation_text)
        llm_resp = llm.invoke(prompt)
        raw = getattr(llm_resp, "content", llm_resp) or ""

        # 제목: 첫 줄에서 "제목:" 뒤 추출
        title = "AI 법률 상담 내용"
        if "제목:" in raw or "제목 :" in raw:
            for sep in ("제목:", "제목 :"):
                if sep in raw:
                    idx = raw.find(sep) + len(sep)
                    end = raw.find("\n", idx)
                    title = (raw[idx:end] if end > idx else raw[idx:]).strip()
                    break

        # 본문: "제목:" 줄 제거한 나머지 (1. 사건 개요 ~)
        content_lines = raw.strip().split("\n")
        content_start = 0
        for i, line in enumerate(content_lines):
            if line.strip().startswith("1.") or line.strip().startswith("1 "):
                content_start = i
                break
            if "사건 개요" in line:
                content_start = i
                break
        content = "\n".join(content_lines[content_start:]).strip()

        # 참고 판례 수집 및 본문 끝에 추가
        all_sources = []
        for m in request.messages:
            if getattr(m, "sources", None):
                all_sources.extend(m.sources)
        if all_sources:
            content += "\n\n📚 참고 판례 (" + str(len(all_sources)) + "건)\n"
            content += "\n".join("• " + s for s in all_sources)

        return {"title": title, "content": content}
    except Exception as e:
        print(f"summarize-consult error: {e}")
        raise HTTPException(status_code=500, detail=str(e))