## 포트폴리오·상세 문서

**기획·배경·분석·설계·요구사항·화면 설계·ERD·시연 영상·테스트·아키텍처 등 상세 내용은 아래 GitHub Pages 사이트에 정리되어 있습니다.**

👉 **<https://bwj6814.github.io/lawpartner_portfolio/>**

이 저장소의 README는 **클론 후 로컬 실행·배포** 위주 요약입니다. 발표·포트폴리오용 설명은 위 링크를 먼저 보시면 됩니다.

---

## 서비스·기능 요약

- **서비스 목표**: 사용자 사건 맥락에 맞는 법률 상담과 **전문 변호사 매칭·구인**을 한 흐름으로 제공하는 웹 서비스.
- **AI 법률 상담 (RAG)**: 법령·판례 등 신뢰 가능한 데이터를 검색·증강(Retrieval-Augmented Generation)해 LLM 답변의 근거를 보강하고, 참고 판례·출처를 함께 제시.
- **AI → 상담 게시판 연동**: AI 상담 내용을 바탕으로 **상담 요청글이 자동 구성·등록**되어 게시판으로 이어지는 시나리오.
- **법률 상담 게시판**: 게시글 CRUD, 변호사 답변(댓글 형태), 매칭·**1:1 실시간 대화 요청**, 별점·후기 등.
- **백엔드·실시간**: Spring Boot 기반 API·**JWT** 인증, WebSocket(STOMP) 기반 **1:1 채팅·알림** 등 (세부는 포트폴리오 및 코드 참고).
- **AI 서버**: FastAPI + LangChain 등으로 LLM·RAG 파이프라인 처리; 운영 시 Spring이 AI 서버와 HTTP 연동.
- **데이터**: 정형 데이터는 DB(개발 스키마는 Oracle 기준 문서·운영은 **RDS MySQL** 등 환경에 맞게), 벡터 유사도 검색은 **FAISS** 등 병행.
- **배포·협업**: Docker, GitHub Actions, AWS(EC2·RDS), GitHub·Notion·Discord 등.

### 팀 역할 (발췌)

| 팀원 | 담당 |
|------|------|
| 김민수 | 메인·일반 마이페이지, 1:1 채팅, 헤더 알림 |
| 홍승현 | 공통 API·보안·AOP, 로그인/회원가입, 관리자 |
| 변운조(PM) | 상담 게시판(CRUD), RAG 기반 AI 채팅 상담 |
| 김용 | KY·결제·변호사 마이페이지 |
| 임동주 | 변호사 찾기·상세, 고객센터 |

---

## 1. 프로젝트 개요

- 사용자 질문을 AI가 분석하고 관련 법률 정보·변호사 매칭으로 이어지도록 설계했습니다.
- 법률 상담 진입 장벽을 낮추고, AI 1차 상담 후 전문가 연결까지 이어지는 흐름을 목표로 합니다.

## 2. 기술 스택

- **Frontend**: React, Axios, Tailwind 등  
- **Backend**: Spring Boot, JWT, JPA  
- **AI Server**: FastAPI, LangChain  
- **DB**: Oracle(문서/로컬)·운영 RDS MySQL, FAISS(벡터 검색)  
- **CI/CD**: GitHub Actions, Docker, AWS EC2 / RDS  

## 3. 프로젝트 구조

```
LawPartner_CICD/
├── Backend-main/    # Spring Boot
├── backend-ai/      # FastAPI AI 서버
├── frontend/        # React
├── setup.bat        # Windows 통합 설치 스크립트
└── .gitignore
```

## 4. 운영 배포 전 체크

- **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** 를 순서대로 확인하세요. (Docker, 환경변수, DB, DNS, SSL 등)

## 5. 시작하기 (Quick Start)

팀원은 Clone 후 아래 순서로 동기화·실행합니다.

```text
git stash
git pull --rebase
git stash pop
```

올릴 때:

```text
git status
git add .
git commit -m "메시지"
git pull --rebase origin main
git push origin main
```

- Node.js: <https://nodejs.org/ko/download> (설치 마법사 마지막 옵션은 생략 가능)

1. **라이브러리 통합 설치**: 최상위 `setup.bat` 실행 (Maven, pip, npm)

2. **서버 포트**
   - React: `http://localhost:3000`
   - Spring Boot: `http://localhost:8080`
   - FastAPI: `http://localhost:8000`

3. **Python (backend-ai)**  
   - `cd backend-ai` → `python -m venv .venv` → 가상환경 활성화 → `pip install -r requirements.txt` (프로젝트 기준)  
   - 또는 기존 `run.bat` 사용

4. **React**: `cd frontend` → `npm start`

5. **추가 패키지** (프로젝트에 따라 이미 포함됨): `react-router-dom`, Tailwind 등은 `frontend/package.json` 기준

---

*포트폴리오 사이트: [LawPartner 포트폴리오 (GitHub Pages)](https://bwj6814.github.io/lawpartner_portfolio/)*
