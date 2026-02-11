import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../common/api/axiosConfig'; 
import './LoginPage.css'; 

const LoginPage = () => {
    const navigate = useNavigate(); 

    const [userId, setUserId] = useState(''); 
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // 페이지 진입 시 로직 (이미 로그인 체크 + 접속 로그)
    useEffect(() => {
        // 1-1. 이미 로그인된 사용자는 메인으로 돌려보냄
        if (localStorage.getItem('accessToken')) {
            navigate('/');
            return;
        }

        // 1-2. [REQ-SYS-01] 접속 로그 전송
        const logAccess = async () => {
            try {
                // 백엔드에 접속 로그 기록 (주소는 백엔드 설계에 맞게 조절)
                await api.post('/api/logs/access', { 
                    page: 'LOGIN_PAGE' 
                });
            } catch (e) {
                console.error("접속 로그 전송 실패:", e);
            }
        };
        logAccess();
    }, [navigate]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsError(false);
        
        // 활동 정지 시뮬레이션
        if(userId === 'blocked_user'){
            setErrorMsg("활동 정지 회원입니다. 고객센터에 문의하세요.");
            setIsError(true);
            return;
        }

        try {
            const response = await api.post('/api/auth/login', {
                userId: userId,
                userPw: password
            });

            const tokenData = response.data.data; 

            if (tokenData && tokenData.accessToken) {
                // 모든 정보를 로컬 스토리지에 저장 (RBAC 연동의 핵심)
                localStorage.setItem('accessToken', tokenData.accessToken);
                localStorage.setItem('refreshToken', tokenData.refreshToken);
                localStorage.setItem('userNm', tokenData.userNm || "사용자");
                
                // ★ 이 부분이 있어야 Header.js에서 '마이페이지' vs '워크스페이스'를 구분함
                localStorage.setItem('userRole', tokenData.role || 'GENERAL'); 

                alert(`${tokenData.userId}님 환영합니다!`);
                
                //  window.location.href를 사용하여 헤더 상태 강제 동기화
                window.location.href = '/';
            } else {
                throw new Error("토큰 응답 오류");
            }
            
        } catch (error) {
            console.error("로그인 에러:", error);
            setErrorMsg("아이디 또는 비밀번호가 틀렸습니다!"); 
            setIsError(true);
        }
    };

    // 스타일 변수 (다이어트 버전 그대로 유지)
    const inputStyle = "w-full px-4 py-3 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-400";
    const buttonStyle = "w-full bg-blue-900 text-white py-3 rounded-2xl font-black text-base shadow-[0_10px_30px_rgba(30,58,138,0.25)] hover:bg-slate-900 hover:-translate-y-1 active:scale-95 transition-all";
    
    return (
        <main id="login-page" className="w-full flex items-center justify-center py-12 relative overflow-hidden bg-mesh">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-[500px] w-full glass-login rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.12)] p-10 border border-white relative z-10 fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg rotate-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">LEX AI</h2>
                    <p className="text-slate-500 font-medium text-sm">로그인하여 서비스를 시작하세요</p>
                </div>

                {isError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-center shake">
                        <p className="text-sm text-red-600 font-bold">{errorMsg}</p>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleLoginSubmit}>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">USER ID</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="아이디를 입력하세요" 
                            className={inputStyle} 
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">PASSWORD</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="비밀번호를 입력하세요" 
                            className={inputStyle} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer" />
                            <label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer">기억하기</label>
                        </div>
                        <button type="button" className="text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors">비밀번호 찾기</button>
                    </div>

                    <button type="submit" className={buttonStyle}>
                        계정 로그인
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm font-medium">아직 회원이 아니신가요? 
                        <button 
                            onClick={() => navigate('/signup')} 
                            className="ml-2 font-black text-blue-900 hover:underline underline-offset-4"
                        >
                            새 계정 만들기
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;