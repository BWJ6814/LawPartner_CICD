#!/usr/bin/env bash
# LawPartner_CICD 루트의 .env.prod 필수 키 존재·비어 있지 않음·AES 키 길이 검사
# 사용: ./scripts/check-env-prod.sh
#       ./scripts/check-env-prod.sh /path/to/.env.prod

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-$REPO_ROOT/.env.prod}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail=0

echo "검사 파일: $ENV_FILE"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}FAIL: 파일이 없습니다.${NC}"
  exit 1
fi

# 한 줄: KEY=VALUE (주석·빈 줄 무시). VALUE 앞뒤 따옴표 제거
value_for_key() {
  local key="$1"
  local line=""
  while IFS= read -r raw || [[ -n "$raw" ]]; do
    [[ "$raw" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${raw//[[:space:]]/}" ]] && continue
    if [[ "$raw" =~ ^[[:space:]]*${key}= ]]; then
      line="$raw"
    fi
  done < "$ENV_FILE"
  [[ -z "$line" ]] && { echo ""; return; }
  local v="${line#*=}"
  v="${v%%$'\r'}"
  v="${v#\"}"
  v="${v%\"}"
  v="${v#\'}"
  v="${v%\'}"
  printf '%s' "$v"
}

check_required() {
  local key="$1"
  local val
  val="$(value_for_key "$key")"
  if [[ -z "$val" ]]; then
    echo -e "${RED}MISSING 또는 비어 있음: ${key}${NC}"
    return 1
  fi
  echo -e "${GREEN}OK${NC} $key"
  return 0
}

check_optional() {
  local key="$1"
  local val
  val="$(value_for_key "$key")"
  if [[ -z "$val" ]]; then
    echo -e "${YELLOW}SKIP (없음)${NC} $key — 채팅/결제 사용 시 설정"
    return 0
  fi
  echo -e "${GREEN}OK${NC} $key"
}

echo "=== 필수 ==="
check_required SPRING_DATASOURCE_URL || fail=1
check_required SPRING_DATASOURCE_USERNAME || fail=1
check_required SPRING_DATASOURCE_PASSWORD || fail=1
check_required JWT_SECRET || fail=1

aes="$(value_for_key ENCRYPTION_AES256_KEY)"
if [[ -z "$aes" ]]; then
  echo -e "${RED}MISSING 또는 비어 있음: ENCRYPTION_AES256_KEY${NC}"
  fail=1
else
  len="${#aes}"
  if [[ "$len" -ne 32 ]]; then
    echo -e "${RED}BAD ENCRYPTION_AES256_KEY: 길이=${len} (정확히 32자 필요)${NC}"
    fail=1
  else
    echo -e "${GREEN}OK${NC} ENCRYPTION_AES256_KEY (길이 32)"
  fi
fi

echo ""
echo "=== 선택 (기능 쓸 때만) ==="
check_optional PORTONE_SECRET_KEY
check_optional GOOGLE_API_KEY

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo -e "${RED}검사 실패 — 위 항목을 .env.prod에 채운 뒤 다시 실행하세요.${NC}"
  exit 1
fi
echo -e "${GREEN}필수 항목 검사 통과.${NC}"
exit 0
