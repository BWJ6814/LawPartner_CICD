import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [userId, setUserId] = useState('');
    const [userPw, setUserPw] = useState('');
    const navigate = useNavigate();

    /* Login.js 의 handleLogin 성공 로직 수정본 */
    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        try {
            console.log("1. 로그인 버튼 클릭됨 - 입력 아이디:", userId);

            const response = await axios.post('http://localhost:8080/api/auth/login', {
                userId: userId,
                userPw: userPw
            });

            console.log("2. 서버 응답 전체:", response);

            // [수정] 서버 응답의 success 필드를 확인합니다.
            if (response.data.success === true) {
                console.log("4. 로그인 성공 로직 진입!");

                const tokenInfo = response.data.data;
                // 서버 응답 규격에 맞춰 grantType과 accessToken을 합칩니다.
                const fullToken = `${tokenInfo.grantType} ${tokenInfo.accessToken}`;

                // 로컬 스토리지에 확실히 저장
                localStorage.setItem('userToken', fullToken);
                localStorage.setItem('userId', userId);

                // 권한 판별 (아이디에 lawyer가 포함되면 LAWYER, 아니면 GENERAL)
                const role = userId.includes('lawyer') ? 'LAWYER' : 'GENERAL';
                localStorage.setItem('userRole', role);

                console.log("5. 저장 완료! 아이디:", localStorage.getItem('userId'));

                alert('로그인 성공!');
                // 확인을 누르면 메인으로 이동
                window.location.replace('/');
            } else {
                // success가 false인 경우 서버 메시지 출력
                alert(response.data.message || "로그인 정보를 확인해주세요.");
            }
        } catch (error) {
            console.error("7. 에러 발생:", error);
            alert('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-3xl font-black text-blue-900 text-center mb-8 tracking-tighter">로그인</h2>
                {/* [수정] form의 onClick을 제거했습니다. 이게 있으면 입력창만 눌러도 에러가 납니다. */}
                <form className="space-y-5" onSubmit={handleLogin}>
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