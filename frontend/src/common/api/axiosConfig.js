import axios from 'axios';

// 공통: 백엔드 주소 (API 호출·WebSocket·이미지 URL 등 한 곳에서 관리)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

let accessToken = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => { accessToken = token; };

const IP_BLOCKED_SESSION_KEY = 'lawpartner_ip_blocked';

/** 클라이언트에 IP 차단 상태가 이미 적용됐는지 (오버레이·요청 차단용) */
export function isIpBlockedClient() {
  try {
    return sessionStorage.getItem(IP_BLOCKED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** 개발/시연: 관리자가 차단 해제 후 사용자가 새로고침 전 테스트용으로만 사용 */
export function clearIpBlockedClientFlag() {
  try {
    sessionStorage.removeItem(IP_BLOCKED_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** IP 블랙리스트(403, code BL-403) 응답 여부 */
export function isIpBlockedResponse(error) {
  if (error?.response?.status !== 403) return false;
  const d = error.response.data;
  if (d && typeof d === 'object' && d.code === 'BL-403') return true;
  if (typeof d === 'string') {
    try {
      const p = JSON.parse(d);
      return p.code === 'BL-403';
    } catch {
      return false;
    }
  }
  return false;
}

/** 세션 정리 + 차단 플래그 + 앱에 오버레이 표시 이벤트 (URL 이동 없음 → 로그인 무한 새로고침 방지) */
export function applyIpBlockedState() {
  setAccessToken(null);
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userNo');
    localStorage.removeItem('userNm');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('nickNm');
  } catch {
    /* ignore */
  }
  try {
    const already = sessionStorage.getItem(IP_BLOCKED_SESSION_KEY) === '1';
    sessionStorage.setItem(IP_BLOCKED_SESSION_KEY, '1');
    if (!already && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lawpartner-ip-blocked'));
    }
  } catch {
    /* ignore */
  }
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // 요청이 장시간 멈출 때 프론트가 무한 로딩 상태에 빠지지 않도록 제한
    timeout: 65000,
    // 🔑 핵심 1: 쿠키(RefreshToken)를 주고받기 위해 반드시 true 설정
    withCredentials: true,
});

// 1. 요청 인터셉터 (AccessToken 부착)
api.interceptors.request.use(
    (config) => {
        if (isIpBlockedClient()) {
            const blockedErr = new Error('IP_BLOCKED');
            blockedErr.config = config;
            blockedErr.response = { status: 403, data: { code: 'BL-403', message: '접근이 원천 차단된 IP입니다.' } };
            return Promise.reject(blockedErr);
        }
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. 응답 인터셉터 (Silent Refresh 로직)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // IP 원천 차단 — 리다이렉트 없이 세션 정리 + 전역 오버레이 (로그인/refresh 루프 방지)
        if (isIpBlockedResponse(error)) {
            applyIpBlockedState();
            return Promise.reject(error);
        }

        // 401(만료) 에러 발생 시 작동
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/api/auth/refresh')
        ) {
            originalRequest._retry = true;

            try {
                // 🔑 핵심 2: 본문에 refreshToken을 담지 않습니다.
                // 쿠키에 담겨 자동으로 날아가기 때문에 빈 객체{}만 보냅니다.
                // 인터셉터가 없는 순수 axios를 사용합니다.
                const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
                    withCredentials: true // 여기서도 쿠키 전송은 필수!
                });

                if (res.data && res.data.success) {
                    const newAccessToken = res.data.data.accessToken;

                    // 새 액세스 토큰만 업데이트 (리프레시 토큰은 백엔드가 Set-Cookie로 갱신해줌)
                    setAccessToken(newAccessToken);

                    // 원래 실패했던 요청 재시도
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                if (isIpBlockedResponse(refreshError)) {
                    applyIpBlockedState();
                    return Promise.reject(refreshError);
                }
                // ✅ 백엔드가 실제로 400/401 응답한 경우만 세션 만료 처리
                // 네트워크 단절, 서버 다운 등의 에러는 로그아웃하지 않음
                if (refreshError.response) {
                    console.warn("🚨 세션이 만료되었습니다. 다시 로그인해 주세요.");
                    setAccessToken(null);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userNo');
                    localStorage.removeItem('userNm');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('nickNm');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

/**
 * axios 에러에서 백엔드 ResultVO.message(또는 유사 형태)를 안전히 추출합니다.
 * - data가 문자열(JSON/평문)이거나, 중첩된 경우까지 보완
 */
export function getApiErrorMessage(error, fallback = '요청 처리 중 오류가 발생했습니다.') {
  const res = error?.response;
  if (!res || res.data === undefined || res.data === null || res.data === '') {
    return fallback;
  }
  const d = res.data;
  if (typeof d === 'string') {
    const t = d.trim();
    if (!t || t === 'FAIL') return fallback;
    try {
      const parsed = JSON.parse(t);
      if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      // JSON이 아니면 본문 일부를 그대로(너무 길면 fallback)
    }
    return t.length <= 2000 ? t : fallback;
  }
  if (typeof d === 'object' && d !== null) {
    if (typeof d.message === 'string' && d.message.trim()) {
      return d.message.trim();
    }
    if (d.data && typeof d.data === 'object' && typeof d.data.message === 'string' && d.data.message.trim()) {
      return d.data.message.trim();
    }
    if (typeof d.error === 'string' && d.error.trim()) {
      return d.error.trim();
    }
    if (d.code === 'BANNED_WORD') {
      return '금지어가 포함된 내용입니다. 입력 내용을 수정해 주세요.';
    }
  }
  return fallback;
}

export const initAuth = async () => {
  try {
    const response = await axios.post(API_BASE_URL + '/api/auth/refresh', {}, { withCredentials: true });
    const token = response.data?.data?.accessToken;
    if (token) {
      setAccessToken(token);
      const role = response.data?.data?.role;
      if (role) localStorage.setItem('userRole', role);
    }
  } catch (e) {
    if (isIpBlockedResponse(e)) {
      applyIpBlockedState();
      return;
    }
    // 비로그인 상태 → 조용히 종료
  }
};