import api from '../api/axiosConfig';
import { setAccessToken } from '../api/axiosConfig';

export const logout = async () => {
  try {
    await api.delete('/api/auth/logout');
  } finally {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    // 로그인 시 LoginPage에서 넣는 세션 식별 정보 (savedUserId: 아이디 기억하기는 유지)
    localStorage.removeItem('userNo');
    localStorage.removeItem('userNm');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('nickNm');
    window.location.href = '/login';
  }
};
