import api from '../api/axiosConfig';
import { setAccessToken } from '../api/axiosConfig';

export const logout = async () => {
  try {
    await api.delete('/api/auth/logout');
  } finally {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
};
