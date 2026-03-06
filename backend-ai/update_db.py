import os
from dotenv import load_dotenv
from datasets import load_dataset
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. 환경 변수(.env)에서 구글 API 키를 불러옵니다.
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

def add_more_data_to_db():
    # 2. 임베딩 모델 설정 (문장을 숫자로 바꿔주는 역할)
    embedding_model = "models/gemini-embedding-001"
    embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)

    # 3. 크로마 DB가 저장될 폴더 경로
    db_path = "./db"

    # 4. 기존 DB 폴더가 있는지 확인하고 연결합니다.
    # 이전 코드처럼 return으로 끝내버리는 게 아니라, 변수(vectordb)에 담아둡니다.
    if os.path.exists(db_path):
        print("💾 기존 크로마 DB를 찾았습니다. 여기에 데이터를 추가합니다.")
        vectordb = Chroma(persist_directory=db_path, embedding_function=embeddings)
    else:
        print("🌱 기존 DB가 없습니다. 새로운 DB를 생성합니다.")
        vectordb = Chroma(persist_directory=db_path, embedding_function=embeddings)

    print("📥 허깅페이스에서 KLAID 데이터를 다운로드 중입니다...")
    # ✨ 변경된 부분: 이전에는 split="train[:10]" 이었지만,
    # 이제 유료 결제를 하셨으니 범위를 늘립니다! (예: 10번부터 1000번까지 가져오기)
    # 전체를 다 가져오려면 split="train" 이라고 쓰면 되지만, 처음엔 1000개 정도만 테스트해 보세요.
    ds = load_dataset("lawcompany/KLAID", split="train[90000:100000]")

    print("⚙️ 다운받은 데이터를 800자 크기로 쪼개는 중...")

    # 문맥이 끊기지 않게 800자씩 자르고 100자씩 겹치게 설정
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )

    documents = []
    for row in ds:
        # 판례 사실과 법령을 하나의 텍스트로 합칩니다.
        combined_text = f"사건: {row['fact']}\n법령: {row['laws_service']}"

        # 합친 텍스트를 위에서 설정한 규칙대로 조각냅니다.
        split_texts = text_splitter.split_text(combined_text)

        # 조각난 텍스트들을 랭체인이 좋아하는 Document 객체로 포장해서 리스트에 담습니다.
        for text in split_texts:
            documents.append(Document(page_content=text))

    print(f"📚 총 {len(documents)}개의 조각이 준비되었습니다. 구글 API로 임베딩을 시작합니다... (시간이 조금 걸립니다)")

    # ❌ 기존 코드 (한 번에 다 넣으려다 에러남)
    # vectordb.add_documents(documents)

    # ✅ 수정된 코드 (5,000개씩 잘라서 안전하게 넣기)
    batch_size = 5000
    for i in range(0, len(documents), batch_size):
        # 5000개씩 조각을 덜어냅니다.
        batch = documents[i : i + batch_size]
        # 덜어낸 조각만 DB에 넣습니다. (여기서 구글 API 통신이 일어남)
        vectordb.add_documents(batch)
        print(f"🔄 진행 상황: {min(i + batch_size, len(documents))} / {len(documents)} 개 저장 완료...")

    print("✅ 데이터 추가 및 저장 완료! 이제 메인 서버를 실행하셔도 됩니다.")

    print("✅ 데이터 추가 및 저장 완료! 이제 메인 서버를 실행하셔도 됩니다.")

# 파이썬 파일을 실행하면 위 함수가 작동하도록 설정
if __name__ == "__main__":
    add_more_data_to_db()