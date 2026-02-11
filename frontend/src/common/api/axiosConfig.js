import axios from 'axios';

// 1. Axios 인스턴스 생성 (기본 설정)
const api = axios.create({
    baseURL: 'http://localhost:8080', // 백엔드 주소
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
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;