import axios from 'axios';

// 공통: 백엔드 주소 (API 호출·WebSocket·이미지 URL 등 한 곳에서 관리)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 1. Axios 인스턴스 생성 (기본 설정)
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. 요청 인터셉터 (Request Interceptor) 설정
// -> 요청을 보내기 직전에 가로채서 토큰을 헤더에 쏙! 넣는 역할
api.interceptors.request.use(
    (config) => {
        // 로컬 스토리지에서 토큰 꺼내기
        const token = localStorage.getItem('accessToken');

        // 토큰이 있으면 헤더에 "Bearer [토큰]" 형식으로 추가
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // FormData 전송 시 Content-Type을 삭제해야 axios가 boundary를 자동으로 설정함
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =================================================================
// 3. 🚀 응답 인터셉터 (Response Interceptor) 설정
// -> 에러가 났을 때 가로채서 토큰 재발급 후 몰래 다시 요청하는 역할
// =================================================================
api.interceptors.response.use(
  (response) => {
    // 정상적인 응답은 건드리지 않고 그대로 화면에 전달합니다.
    return response;
  },
  async (error) => {
    // 에러가 발생한 원래의 통신 요청 정보
    const originalRequest = error.config;

    // 만약 에러 상태가 401(토큰 만료)이고, 아직 재시도를 안 한 요청이라면 작동!
    if (error.response &&
        error.response.status === 401 &&
        !originalRequest._retry) {
      originalRequest._retry = true; // 무한 반복 방지용 도장

      try {
        // 서랍에서 7일짜리 리프레시 토큰 꺼내기
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error("리프레시 토큰이 없습니다.");
        }

        // 백엔드에 새 액세스 토큰 달라고 요청 (api 대신 axios 사용해 인터셉터 재진입 방지)
        const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken: refreshToken
        });

        // 성공적으로 새 토큰을 받았다면?
        if (res.data && res.data.success) {
          const newAccessToken = res.data.data.accessToken;
          const newRefreshToken = res.data.data.refreshToken; // ✅ 리프레시 토큰도 갱신

          // 새로 받은 토큰을 저장소에 업데이트
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken); // ✅ 추가 (Rotation 대응)

          // 방금 실패했던 요청의 헤더를 '새 토큰'으로 교체
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          // 실패했던 요청을 서버로 다시 발사!
          return api(originalRequest);
        }
      } catch (refreshError) {
        // ✅ 400, 401 모두 세션 만료로 처리 (리프레시 토큰 만료 시 400 응답 가능)
        if (refreshError.response && [400, 401].includes(refreshError.response.status)) {
          console.warn("세션이 만료되었습니다. 다시 로그인해 주세요.");
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아닌 일반 에러(404, 500 등)는 그대로 던집니다.
    return Promise.reject(error);
  }
);

export default api;