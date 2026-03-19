===========================================================
프로젝트명: AI 기반 법률 상담 서비스 (AI-Law)
===========================================================

1. 프로젝트 개요 ⚖️
-----------------------------------------------------------
- 사용자의 질문을 AI가 분석하여 관련 법률 정보와 추천 변호사를 매칭해주는 서비스입니다. [cite: 2026-02-03]
- 복잡한 법률 상담의 진입장벽을 낮추고 효율적인 매칭 시스템을 제공하는 것을 목표로 합니다. [cite: 2026-02-03]

2. 기술 스택 (Tech Stack) 💻
-----------------------------------------------------------
- Frontend: React.js (사용자 UI 및 인터페이스 담당) 
- Backend: Spring Boot (비즈니스 로직 및 데이터 관리) 
- AI Server: FastAPI / Python (AI 모델 추론 및 자연어 처리) 
- Database: Oracle (사용자, 상담, 변호사 데이터 저장) 

3. 프로젝트 구조 (Directory Structure) 📂
-----------------------------------------------------------
Ai-Law/
├── Backend-main/    # 스프링 부트 백엔드 소스 
├── backend-ai/      # 파이썬 FastAPI AI 서버 
├── frontend/        # 리액트 프론트엔드 소스 
├── setup.bat        # 통합 환경 설치 스크립트 (Windows용)
└── .gitignore       # Git 제외 설정 파일 

4. 시작하기 (Quick Start) 🚀
-----------------------------------------------------------
팀원들은 코드를 Clone 받은 후 아래 순서대로 진행하세요. 

git 저장 안전하게 하기 아침에 오시면 무조건 받아주세요

git stash (내 작업 잠시 보관)

git pull --rebase (서버 내용 깔끔하게 가져오기)

git stash pop (내 작업 다시 합치기)
이렇게 항상 받아주시고
올리실때는 
git status (확인)

git add . (담기)

git commit -m "메시지" (포장)

git pull --rebase origin main (최신 상태 동기화 - 핵심!)

git push origin main (발송)



Node.js https://nodejs.org/ko/download 다운로드를 받으시고 마지막 체크는 하지 마시고 완료하세요

1) 라이브러리 통합 설치:
   - 최상위 폴더의 'setup.bat' 파일을 실행합니다. 
   - Maven, Pip, NPM 라이브러리가 자동으로 설치됩니다.

2) 서버 실행 포트 확인:
   - React (Frontend): http://localhost:3000 
   - Spring Boot (Backend): http://localhost:8080 
   - FastAPI (AI Server): http://localhost:8000

3) 파이썬 라이브러리 설치 전
   - D:\AI-Law\backend-ai
   - python -m venv venv
   - .\venv\Scripts\activate
   - pip install fastapi uvicorn pydantic
  
4) 파이썬 서버 실행
   - run.bat 실행
   
5) 리액트 실행 
   - npm start

6) 리액트 라우터 설치
   - 터미널에 npm install react-router-dom
  
7) 테일윈드 설치
   - npm install -D tailwindcss@3.4.17 postcss autoprefixer
   - postcss.config.js
      // postcss.config.js
   module.exports = {
     plugins: {
       tailwindcss: {}, // 👈 '@tailwindcss/postcss' 대신 이걸로 복구!
       autoprefixer: {},
        },
      }
   
   - tailwind.config.js
     /** @type {import('tailwindcss').Config} */
      module.exports = {
        prefix: 'tw-',
        content: [
          "./src/**/*.{js,jsx,ts,tsx}",
        ],
        theme: {
          extend: {},
        },
        plugins: [],
      }

     
5. 담당 역할 👥
-----------------------------------------------------------
- 김민수: AI 서버 구축, 메인 페이지 개발, 1:1 채팅 기능 구현, 일반 마이페이지 구현, 1:1 채팅시 헤더 알림 기능 구현
- 홍승현: 공통 API 객체, 보안, AOP 설정. 로그인/회원가입(백/프) 개발, 관리자 페이지 구축
- (추가 팀원 정보 기입 필요)
