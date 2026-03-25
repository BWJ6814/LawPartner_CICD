# 배포 직전 체크리스트 (LawPartner)

> **도커(Dockerfile) 안에 있는 것**: 앱을 **어떻게 빌드·실행할지** (JDK, Node, nginx, 포트 등)  
> **도커 밖에서 꼭 맞춰야 하는 것**: **비밀번호·키·DB 주소·도메인·SSL** — 이건 이미지에 넣지 않고 **환경변수/서버 설정**으로 넣는 게 정상입니다.  
> 아래를 순서대로 체크한 뒤 올리면 됩니다.

---

## 1. 로컬 / Git

- [ ] `git status`로 **비밀번호·API 키가 들어간 파일**이 커밋 대상이 아닌지 확인 (`.env`, `.env.prod` 등은 보통 **커밋 금지**)
- [ ] `.env.prod.example`은 **예시만** 두고, 실제 값은 **서버 전용** `.env.prod` 또는 배포 플랫폼 시크릿에만 둠
- [ ] 이미 실수로 비밀이 올라갔다면 → **DB 비밀번호·JWT·암호화 키 교체(로테이션)** 검토

---

## 2. 환경변수 (서버에 실제로 들어가는 값)

`docker-compose.prod.yml`이 읽는 변수들과 **서버의 `.env` 또는 export**가 일치하는지 확인합니다.

- [ ] `SPRING_DATASOURCE_URL` / `USERNAME` / `PASSWORD` → **운영 RDS(또는 DB) 주소·계정**과 동일
- [ ] `JWT_SECRET` / `ENCRYPTION_AES256_KEY` → **충분히 긴 임의 값**, Git에 없음
- [ ] `APP_CORS_ALLOWED_ORIGINS` → 사용자가 접속하는 **프론트 주소**만 (예: `https://fourjolawpartner.com`, `https://www.…`) — 개발용 `localhost`는 운영에서 빼도 됨
- [ ] `CHAT_FILE_SERVER_URL` → 브라우저가 파일 URL을 열 때 쓰는 **공개 API 베이스** (보통 `https://api.…`)
- [ ] `REACT_APP_API_URL` → 프론트 **빌드 시** 박히므로, **compose 빌드 전**에 올바른 API URL인지 확인
- [ ] `SPRING_PROFILES_ACTIVE=prod`
- [ ] `GOOGLE_API_KEY` → AI 사용 시 **실제 키** (`CHANGE_ME` 아님)
- [ ] `PORTONE_SECRET_KEY` → 실제 결제 시 **운영 키**
- [ ] `RAG_DISABLE` → 운영에서 AI 끄려면 `true`, 켜려면 `false` + 키 필수

---

## 3. 데이터베이스

- [ ] **마이그레이션/스키마** 운영 DB에 반영 완료
- [ ] RDS(또는 DB) **보안 그룹/방화벽**에 **배포 서버 IP**(또는 VPC 내부)만 허용
- [ ] DB 접속 문자열의 DB명·SSL 옵션이 운영 정책과 맞음 (`useSSL` 등)

---

## 4. 서버 · 네트워크 · SSL

- [ ] DNS: `fourjolawpartner.com`, `www`, `api.fourjolawpartner.com` 등 **의도한 서버 IP**로 연결
- [ ] **HTTPS** 인증서 (Let’s Encrypt / 로드밸런서 / CDN) 적용
- [ ] 리버스 프록시(nginx 등)에서 **프론트(3000→80)** / **백엔드(8080)** / **AI(8000)** 로 라우팅이 compose 포트와 맞음
- [ ] 방화벽에서 필요한 포트만 개방 (보통은 80/443만 외부, 나머지는 내부)

---

## 5. 도커 빌드 · 실행

프로젝트 루트에서 (환경 파일 경로는 본인 환경에 맞게):

- [ ] `docker compose -f docker-compose.prod.yml --env-file .env.prod build`
- [ ] `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d`
- [ ] `docker compose -f docker-compose.prod.yml ps` → 컨테이너 **healthy / running**
- [ ] `docker compose -f docker-compose.prod.yml logs backend --tail=100` → **에러 스택 없음**

---

## 6. 배포 직후 스모크 테스트 (필수)

- [ ] 브라우저에서 **프론트 페이지** 정상 로딩
- [ ] **로그인** → 새로고침 후에도 **세션/토큰** 유지되는지 (쿠키·CORS 이슈 확인)
- [ ] API 한두 개 (게시글 목록 등) **200 응답**
- [ ] 채팅/파일 URL이 `CHAT_FILE_SERVER_URL`과 맞게 열리는지
- [ ] AI 기능 켠 경우 → 질의 한 번 호출

---

## 7. 알아두면 좋은 것 (도커만으로 끝나지 않는 이유)

| 구분 | 설명 |
|------|------|
| Dockerfile | “이미지를 어떻게 만드나” |
| `docker-compose` + `.env` | “실행할 때 DB 주소·비밀키·CORS를 무엇으로 넣나” |
| RDS / DNS / SSL | “인터넷에서 어디로 붙나” — 코드와 별개 |
ssh -i "lawpartner-key.pem" ec2-user@ec2-3-38-99-50.ap-northeast-2.compute.amazonaws.com
ssh -i "D:\ssh\lawpartner-key.pem" ec2-user@ec2-3-38-99-50.ap-northeast-2.compute.amazonaws.com
체크리스트를 다 통과하면 **그때** “도커에 올렸고 설정도 맞다”고 보시면 됩니다.

---

## 부록 A) Ubuntu 서버 — 복붙용 배포 명령

> **전제**: SSH로 서버에 접속한 뒤, **프로젝트를 둘 폴더**에서 실행 (아래는 `~/LawPartner_CICD` 예시).
ssh -i "D:\ssh\lawpartner-key.pem" ec2-user@ec2-3-38-99-50.ap-northeast-2.compute.amazonaws.com
ssh -v -i "D:\ssh\lawpartner-key.pem" ec2-user@ec2-3-38-99-50.ap-northeast-2.compute.amazonaws.com
taskkill /F /IM ssh.exe

### A-1. 최초 1회 — Docker 설치 (공식 스크립트)

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
# 로그아웃 후 다시 로그인 (docker 그룹 적용)
```

### A-2. 코드 받기 (처음이면 clone, 이미 있으면 pull)

```bash
cd ~
git clone https://github.com/BWJ6814/LawPartner_CICD.git
cd LawPartner_CICD
```

이미 클론해 둔 경우:

```bash
cd ~/LawPartner_CICD
git pull origin main
```

### A-3. 환경 파일 (서버에만 존재, Git에 안 올림)

```bash
nano .env.prod
```

`.env.prod.example` 내용을 참고해 **RDS·JWT·CORS·REACT_APP_API_URL** 등을 채운 뒤 저장 (`Ctrl+O`, Enter, `Ctrl+X`).

### A-4. FAISS 인덱스 (Git에 없음 — 로컬에서 서버로 복사)

로컬 PC(Windows PowerShell)에서 예시:

```powershell
scp -r D:\LawPartner_CICD\backend-ai\faiss_db ubuntu@서버IP:~/LawPartner_CICD/backend-ai/
```

서버에 폴더만 만들고 나중에 올릴 때:

```bash
mkdir -p ~/LawPartner_CICD/backend-ai/faiss_db
```

### A-5. 빌드 & 기동

```bash
cd ~/LawPartner_CICD
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=80
```

### A-6. 다시 배포할 때 (코드만 갱신)

```bash
cd ~/LawPartner_CICD
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

sudo mkdir -p /usr/local/lib/docker/cli-plugins

sudo curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose

sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

docker compose version


### A-7. 포트 정리 (이 compose 기준)

| 호스트(서버) | 컨테이너 | 용도 |
|-------------|----------|------|
| `3000` | 프론트 nginx `80` | 웹 UI |
| `8080` | Spring Boot | API |
| `8000` | FastAPI AI | AI 서버 |
| `8025` | Mailpit 웹 UI | 메일 테스트(운영에선 외부 막기 권장) |

앞단에 **시스템 nginx / Caddy / ALB**로 `443` → `3000`(또는 원하는 포트) 프록시하면 도메인으로 접속합니다.

### A-8. 방화벽 예시 (ufw)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# compose를 직접 노출할 때만 (프록시 뒤면 보통 불필요)
# sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

### A-9. 루트 EBS 용량 부족 시 — 볼륨 늘리기 (콘솔 + EC2)

Docker 빌드 시 `No space left on device`가 나오면 **루트 볼륨(예: 8 GiB)을 50 GiB 등으로 확장**합니다.

**1) AWS 콘솔 (브라우저)**

1. **EC2** → 왼쪽 **볼륨(Elastic Block Store → 볼륨)**  
2. 인스턴스에 붙은 루트 볼륨 선택 (예: `/dev/xvda`, `In use`)  
3. **작업** → **볼륨 수정**  
4. **크기**를 **50** GiB(또는 원하는 값)로 변경 → **수정**  
5. 상태가 `optimizing` → `completed` 될 때까지 잠시 대기 (보통 수 분)

**2) EC2에 SSH 접속 후 — 파티션·파일시스템 확장**

```bash
# 디스크/파티션 이름 확인
lsblk
df -Th /
```

루트가 **XFS**이면(Amazon Linux에서 흔함):

```bash
# 디바이스 이름은 lsblk에 맞출 것. 예: xvda + 파티션 1
sudo growpart /dev/xvda 1
sudo xfs_growfs -d /
df -h /
```

**NVMe**로 보이면(예: `nvme0n1p1`):

```bash
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs -d /
df -h /
```

루트가 **ext4**이면 `xfs_growfs` 대신:

```bash
sudo resize2fs /dev/xvda1
# 또는: sudo resize2fs $(findmnt -n -o SOURCE /)
```

`growpart`가 없으면:

```bash
sudo yum install -y cloud-utils-growpart
# 또는 Amazon Linux 2023: sudo dnf install -y cloud-utils-growpart
```

확장 후 `df -h /`에서 여유가 늘었는지 확인하고, 다시 `docker compose ... up -d --build` 실행.

---

*마지막 수정: 배포 전 수동 점검용 — CI 통과와 별개로 운영 서버에서 한 번 더 확인하세요.*
