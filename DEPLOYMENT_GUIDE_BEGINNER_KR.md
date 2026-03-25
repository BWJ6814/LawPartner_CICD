# LawPartner — 도커 이미지부터 EC2 배포까지 (초보자용 전체 과정)

> 이 문서는 **CI/CD를 처음 접하는 사람**도 따라갈 수 있게, **과정 이름 → 무슨 뜻인지 → 예시 → 이 프로젝트에서 쓰는 실제 명령** 순으로 적었습니다.  
> **CI/CD**란 보통 “코드가 저장소에 올라가면 **자동으로** 테스트·빌드·서버 배포까지 이어지는 흐름”을 말합니다. 이 레포는 **GitHub에서 자동 테스트(CI)** 는 있지만, **EC2에 자동 배포(CD)** 는 없고 **사람이 SSH로 서버에 접속해 명령**하는 방식입니다.

---

## 큰 그림 (한 번만 읽기)

**비유:**  
- **GitHub** = 도면과 재료가 보관된 창고(코드 저장소).  
- **Docker 이미지** = 그 도면으로 만든 **배달 가능한 밀키트**(실행에 필요한 프로그램·라이브러리·앱이 한 덩어리).  
- **EC2(리눅스 서버)** = 밀키트를 **가열해서 식사로 제공하는 주방**(실제로 사용자 요청을 처리하는 컴퓨터).  
- **SSH** = 그 주방에 들어가서 조리(명령 실행)하는 **출입 통로**.

이 프로젝트에서는 **주방(EC2) 안에서** Git으로 최신 도면을 받고(`git pull`), **도커로 이미지를 만들고**(`docker compose build`), **컨테이너를 켠다**(`docker compose up`).

---

## 과정 0 — AWS에서 서버(EC2) 준비

| 항목 | 설명 |
|------|------|
| **무엇인가** | AWS **EC2**는 **인터넷에 있는 리눅스(또는 Windows) 가상 PC 한 대**입니다. 여기에 도커를 깔고 앱을 돌립니다. |
| **예시** | “우리 서비스는 `ap-northeast-2`(서울) 리전의 t3.small 인스턴스 한 대에서 돌아간다.” |
| **중요** | **보안 그룹**에서 SSH(22), HTTP(80), HTTPS(443) 등 **필요한 포트만** 열었는지, **키 페어(.pem)** 는 분실하지 않았는지 확인합니다. |

*(EC2 생성·키 다운로드·보안 그룹은 AWS 콘솔 작업이라 여기서는 생략합니다.)*

---

## 과정 1 — 내 PC에서 서버에 접속하기 (SSH)

| 항목 | 설명 |
|------|------|
| **무엇인가** | **SSH**는 **원격 리눅스에 터미널로 접속**하는 방법입니다. 비밀번호 대신 **개인키 파일(.pem)** 으로 본인임을 증명합니다. |
| **예시** | 집 PC에서 “서울에 있는 회사 서버 터미널”을 한 창으로 여는 것과 같습니다. |
| **실제 명령 (Windows PowerShell 예시)** | 키 파일과 주소는 본인 것으로 바꿉니다. |

```text
ssh -i "D:\ssh\lawpartner-key.pem" ec2-user@ec2-3-38-99-50.ap-northeast-2.compute.amazonaws.com
```

- `-i "경로\파일.pem"` : SSH에 쓸 **개인키**  
- `ec2-user@...` : **사용자이름@서버주소** (Amazon Linux는 보통 `ec2-user`, Ubuntu는 `ubuntu`)

접속에 성공하면 프롬프트가 `ec2-user@ip-... ~]$` 처럼 바뀝니다.

---

## 과정 2 — “Git 저장소”가 있는 폴더으로 이동하기

| 항목 | 설명 |
|------|------|
| **무엇인가** | `git pull` 등 Git 명령은 **`.git` 폴더가 있는 디렉터리**에서만 동작합니다. **홈 폴더(`~`)** 에서 실행하면 **저장소가 아니라서** 오류가 납니다. |
| **자주 나는 오류** | `fatal: not a git repository` → **프로젝트 폴더로 먼저 들어가야 함.** |
| **실제 명령** | 처음 한 번은 클론, 이미 클론했다면 `cd` 후 `pull`만 하면 됩니다. |

**처음 서버에 코드를 받을 때:**

```bash
cd ~
git clone https://github.com/BWJ6814/LawPartner_CICD.git
cd LawPartner_CICD
```

**이미 `LawPartner_CICD`를 받아 둔 경우 (매 배포 시):**

```bash
cd ~/LawPartner_CICD
git pull origin main
```

> **핵심:** `git pull`은 **반드시** `~/LawPartner_CICD` 안에서 실행합니다.

---

## 과정 3 — 환경 변수 파일 (`.env.prod`)

| 항목 | 설명 |
|------|------|
| **무엇인가** | DB 주소, 비밀번호, JWT, API URL처럼 **환경마다 다른 값**은 이미지에 박지 않고 **실행할 때 주입**합니다. 이 레포는 **`--env-file .env.prod`** 로 읽습니다. |
| **예시** | 같은 도커 이미지라도 “개발 DB”와 “운영 RDS”를 바꿀 수 있습니다. |
| **실제 작업** | 서버에만 `.env.prod`를 두고, Git에는 **올리지 않습니다** (`.env.prod.example`만 참고). |

```bash
cd ~/LawPartner_CICD
nano .env.prod
```

*(내용은 `DEPLOY_CHECKLIST.md`의 환경 변수 절을 따릅니다.)*

---

## 과정 4 — 도커(Docker)가 뭔지, 왜 쓰는지

| 항목 | 설명 |
|------|------|
| **이미지** | 앱 실행에 필요한 **파일·OS·런타임**을 묶은 **읽기 전용 템플릿** (설계도). |
| **컨테이너** | 그 이미지를 **실행한 프로세스** (실제로 돌아가는 박스). 이미지 하나로 컨테이너 여러 개를 띄울 수도 있습니다. |
| **Dockerfile** | “이 이미지를 **어떻게 만들지**” 적은 레시피. 이 프로젝트에는 `frontend/Dockerfile`, `Backend-main/Dockerfile`, `backend-ai/Dockerfile` 가 있습니다. |
| **docker compose** | 여러 서비스(프론트·백엔드·AI)를 **한 번에** 정의·빌드·실행하는 파일. 여기서는 `docker-compose.prod.yml` 입니다. |

**비유:** Dockerfile = 밀키트 레시피, `docker compose build` = 밀키트 제조, `docker compose up` = 가열해서 상차림.

---

## 과정 5 — 도커 이미지 **생성** (빌드)

| 항목 | 설명 |
|------|------|
| **무엇인가** | `docker compose ... build` 는 각 폴더의 **Dockerfile을 읽어서 이미지를 컴파일**합니다. 프론트는 Node로 `npm run build` 후 nginx 이미지에 넣고, 백엔드는 Maven으로 JAR 만든 뒤 JRE 이미지에 넣습니다. |
| **시간** | EC2 사양이 낮으면 **프론트 빌드만 10~30분** 걸릴 수 있습니다. (레포에서 소스맵 끄기·메모리 설정 등으로 완화) |
| **실제 명령 (프로젝트 루트에서)** | |

```bash
cd ~/LawPartner_CICD
docker compose -f docker-compose.prod.yml --env-file .env.prod build
```

**프론트만 다시 빌드할 때:**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache frontend
```

- `-f docker-compose.prod.yml` : 사용할 compose 파일 지정  
- `--env-file .env.prod` : 빌드 시 `REACT_APP_API_URL` 등 주입  
- `--no-cache` : 캐시 없이 처음부터 빌드 (문제 있을 때)

---

## 과정 6 — 컨테이너 **실행** (기동)

| 항목 | 설명 |
|------|------|
| **무엇인가** | 만들어진 이미지를 **백그라운드에서 켜서** 포트를 열고 서비스를 시작합니다. `-d`는 detached(백그라운드). |
| **실제 명령** | |

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**코드만 갱신하고 이미지 다시 만들며 기동까지 한 번에 (자주 쓰는 패턴):**

```bash
cd ~/LawPartner_CICD
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

## 과정 7 — 잘 떴는지 확인

| 항목 | 설명 |
|------|------|
| **상태** | 컨테이너가 Running 인지 확인합니다. |
| **실제 명령** | |

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=80
```

---

## 과정 8 — (선택) 최초 1회 — EC2에 Docker 설치

Docker가 없으면 위 명령이 동작하지 않습니다. Amazon Linux / Ubuntu 등은 배포판마다 설치법이 다릅니다. `DEPLOY_CHECKLIST.md` **부록 A-1**에 apt 기준 예시가 있습니다.

---

## 이 프로젝트에서 포트 정리 (compose 기준)

| 서버(EC2)에서 연 포트 | 컨테이너 | 역할 |
|----------------------|----------|------|
| 3000 | 프론트(nginx) | 웹 화면 |
| 8080 | Spring Boot | API |
| 8000 | FastAPI | AI |

앞에 **도메인·HTTPS**를 쓰려면 보통 **리버스 프록시(nginx/Caddy) 또는 로드밸런서**가 443 → 위 포트로 넘깁니다.

---

## “CI”는 어디 있나? (GitHub Actions)

| 항목 | 설명 |
|------|------|
| **무엇인가** | `.github/workflows/ci.yml` 은 **GitHub에 push/PR 할 때** Maven·npm·Python 검사를 **자동 실행**합니다. |
| **이 배포와 관계** | CI가 통과해도 **EC2는 자동으로 안 바뀝니다.** 서버에서 `git pull` + `docker compose` 를 **직접** 해야 반영됩니다. |

---

## 한 페이지 요약 — 순서대로 할 일 (EC2 안에서)

1. `ssh -i "키.pem" ec2-user@서버주소`  
2. `cd ~/LawPartner_CICD`  ← **여기서 `git pull` (홈에서 하면 안 됨)**  
3. `git pull origin main`  
4. `docker compose -f docker-compose.prod.yml --env-file .env.prod build`  
5. `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d`  
6. `docker compose -f docker-compose.prod.yml ps` 로 확인  

---

## 부록: 리눅스·터미널 명령어 한 줄 설명

배포 과정에서 나오는 명령을 **처음 볼 때** 기준으로만 정리했습니다.

### 권한·사용자

| 표현 | 설명 |
|------|------|
| **`sudo`** | **“관리자 권한으로 이 명령 실행”** (Super User DO). 패키지 설치, 시스템 폴더 수정처럼 일반 사용자는 못 하는 일을 할 때 앞에 붙입니다. 비밀번호를 물을 수 있음(설정에 따라). |
| **`root`** | 리눅스 **최고 관리자 계정**. `sudo`로 잠깐 root 권한을 빌리는 식으로 씀. |
| **`ec2-user` / `ubuntu`** | EC2에 기본으로 있는 **일반 사용자 이름**. SSH로 접속했을 때 보통 이 이름으로 들어옴. |

### 위치·폴더 이동

| 명령 | 설명 |
|------|------|
| **`cd`** | **Change Directory** — 폴더 들어가기. `cd ~/LawPartner_CICD` = 홈 아래 그 폴더로 이동. |
| **`~`** | **현재 사용자의 홈 디렉터리** 약속 기호. 보통 `/home/ec2-user` 같은 경로. |
| **`pwd`** | **Print Working Directory** — 지금 터미널이 **어느 폴더 안인지** 전체 경로 출력. |
| **`ls`** | **List** — 현재 폴더 **파일·폴더 목록** 보기. `ls -la` 는 숨김 파일까지 자세히. |
| **`.` / `..`** | `.` = 지금 폴더, `..` = **한 단계 위** 부모 폴더. `cd ..` = 상위로 이동. |

### 파일 보기·편집

| 명령 | 설명 |
|------|------|
| **`cat 파일`** | 파일 내용을 **터미널에 한 번에** 출력 (짧은 파일 확인용). |
| **`less 파일`** | 파일을 **위아래 스크롤하며** 읽기. `q` 누르면 종료. 긴 문서에 적합. |
| **`nano 파일`** | 터미널 안 **간단한 메모장**으로 열기. 저장 `Ctrl+O`, 나가기 `Ctrl+X`. `.env` 수정할 때 자주 씀. |

### Git (코드 받기)

| 명령 | 설명 |
|------|------|
| **`git clone URL`** | GitHub 등에 있는 저장소를 **현재 폴더에 복사**해 로컬 Git 프로젝트로 만듦. 처음 한 번. |
| **`git pull origin main`** | 원격(GitHub)의 **`main` 브랜치 최신 커밋**을 **지금 폴더 프로젝트에 반영**. 이미 clone 해 둔 뒤 “최신 코드 받기”. |
| **`origin`** | 보통 **원격 저장소(GitHub 주소)의 별칭** 이름. |

### Docker / Compose (이 프로젝트)

| 부분 | 설명 |
|------|------|
| **`docker compose`** | `docker-compose.prod.yml`에 적힌 **여러 서비스**를 한 번에 빌드·실행하는 명령. |
| **`-f docker-compose.prod.yml`** | **어떤 설정 파일**을 쓸지 지정 (`-f` = file). |
| **`--env-file .env.prod`** | **환경 변수**를 `.env.prod`에서 읽어 compose에 넘김 (DB 주소, API URL 등). |
| **`build`** | Dockerfile 기준으로 **이미지 만들기**. |
| **`up -d`** | 컨테이너 **실행**. `-d` = **detached**, 터미널을 붙잡지 않고 **백그라운드**로 돌림. |
| **`ps`** | 지금 **떠 있는 컨테이너 목록·상태** 확인. |
| **`logs`** | 컨테이너 **로그 출력**. `--tail=80` = 마지막 80줄만. |

### 패키지 설치 (Ubuntu/Debian 계열, DEPLOY_CHECKLIST 부록)

| 명령 | 설명 |
|------|------|
| **`apt-get`** | Debian/Ubuntu 계열에서 **패키지 설치·업데이트**하는 도구. |
| **`sudo apt-get update`** | 패키지 **목록을 최신 정보로 갱신** (실제 프로그램 업그레이드는 `upgrade`와 다름). |
| **`sudo apt-get install -y 패키지`** | 패키지 **설치**. `-y` = 질문 없이 진행. |
| **`curl`** | URL에서 **파일 다운로드**하거나 **HTTP 요청**할 때 쓰는 명령. Docker 설치 스크립트 받을 때 등에 사용. |

### SSH (PC → 서버 접속)

| 부분 | 설명 |
|------|------|
| **`ssh -i "키.pem" 사용자@서버주소`** | **Secure Shell** — 원격 리눅스에 **암호화된 터미널 연결**. `-i` = **identity file**, 그 **개인키(.pem)** 로 본인 인증. |

### 자주 헷갈리는 것

| 표현 | 설명 |
|------|------|
| **`/` 로 시작하는 경로** | **루트(최상위)** 부터 가는 **절대 경로**. 예: `/home/ec2-user/LawPartner_CICD`. |
| **상대 경로** | 지금 위치 기준. `cd LawPartner_CICD` = 지금 폴더 안의 그 이름으로 들어감. |
| **명령이 안 먹을 때** | (1) **`pwd`**로 지금 어느 폴더인지 확인, (2) **`sudo`**가 필요한지, (3) 오타·경로 오류인지 확인. |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `docker-compose.prod.yml` | 서비스 정의·포트·볼륨 |
| `frontend/Dockerfile` 등 | 이미지 빌드 방법 |
| `.env.prod` (서버 전용) | 비밀·DB URL 등 |
| `DEPLOY_CHECKLIST.md` | 배포 전 점검·부록 명령 |
| `DEPLOYMENT_GUIDE_BEGINNER_KR.md` | 본 문서 (초보자용 전체 흐름) |
