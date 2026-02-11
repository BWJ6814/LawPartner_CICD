import React, { useState } from 'react';
/* 1. axios를 직접 import 합니다. (설정 파일 없이 바로 사용) */
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [userId, setUserId] = useState('');
    const [userPw, setUserPw] = useState('');
    const navigate = useNavigate();

    /* 2. 로그인 처리 함수 */
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 서버의 AuthController 주소로 직접 post 요청을 보냅니다.
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                userId: userId,
                userPw: userPw
            });

            // 서버 응답 규격(ResultVO)의 code가 200인 경우
            if (response.data.code === 200) {
                const { accessToken, grantType } = response.data.data;

                // 3. 기존 Header.js에서 사용하는 키값('userToken', 'userRole')에 맞춰 저장합니다.
                localStorage.setItem('userToken', `${grantType} ${accessToken}`);

                // 권한 분리를 위해 아이디나 서버 응답을 기반으로 역할 저장
                // (실제 프로젝트에서는 서버에서 roleCode를 받아오는 것이 좋습니다.)
                const role = userId.includes('lawyer') ? 'LAWYER' : 'GENERAL';
                localStorage.setItem('userRole', role);

                alert('로그인 성공!');
                // 4. 메인으로 이동 후 새로고침하여 헤더의 상태를 동기화합니다.
                navigate('/');
                window.location.reload();
            }
        } catch (error) {
            // 에러 발생 시 서버가 보낸 메시지 혹은 기본 메시지 출력
            alert(error.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-3xl font-black text-blue-900 text-center mb-8 tracking-tighter">로그인</h2>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">아이디</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 transition"
                            placeholder="아이디를 입력하세요"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 transition"
                            placeholder="비밀번호를 입력하세요"
                            value={userPw}
                            onChange={(e) => setUserPw(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition transform active:scale-95 shadow-lg"
                    >
                        로그인하기
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;