import React, { useState, useEffect } from 'react';
import api from '../common/api/axiosConfig'; 
import './LoginPage.css'; 

const LoginPage = () => {
    const [userId, setUserId] = useState(''); 
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        // 페이지 진입 로그 (생략)
    }, []);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsError(false);

        if (!userId || !password) {
            setErrorMsg("아이디와 비밀번호를 입력해주세요.");
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
                console.log("★ 토큰 발급 성공:", tokenData.accessToken);
                localStorage.setItem('accessToken', tokenData.accessToken);
                localStorage.setItem('refreshToken', tokenData.refreshToken);
                localStorage.setItem('userNm', tokenData.userNm || "사용자");

                alert(`${tokenData.userNm}님 환영합니다!`);
                // navigate('/dashboard'); 
            } else {
                throw new Error("토큰이 응답에 없습니다.");
            }
            
        } catch (error) {
            console.error("로그인 에러:", error);
            setErrorMsg("정보가 일치하지 않습니다."); 
            setIsError(true);
        }
    };

    // ★ 스타일 조정 (헤더/푸터 공간 고려)
    // 1. py-4 (너무 큼) -> py-3.5 (가장 이상적인 두께감)
    // 2. text-lg -> text-base (16px, 너무 크지도 작지도 않은 표준 크기)
    const inputStyle = "w-full px-5 py-3.5 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-bold text-base text-slate-700 placeholder:text-slate-400";
    
    // 버튼도 입력창과 높이 통일
    const buttonStyle = "w-full bg-blue-900 text-white py-3.5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(30,58,138,0.25)] hover:bg-slate-900 hover:-translate-y-1 active:scale-95 transition-all";

    return (
        /* ★ 핵심 레이아웃 수정 
           min-h-screen 제거 -> 대신 h-full 또는 flex-grow 사용 (부모 컨테이너에 따라 다름)
           여기서는 안전하게 '헤더/푸터 제외한 공간'을 가정하고 여백을 줍니다.
           py-10: 위아래 여백을 줘서 헤더/푸터와 딱 붙지 않게 함
        */
        <main id="login-page" className="w-full flex items-center justify-center py-12 relative overflow-hidden bg-mesh">
            
            {/* 장식용 배경 (그대로 유지) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

            {/* ★ 박스 크기 최적화 (Golden Ratio)
               max-w-[500px]: 가로로 충분히 넓음 (안정감)
               p-10: 내부 여백을 12 -> 10으로 살짝 줄임 (높이 확보)
            */}
            <div className="max-w-[500px] w-full glass-login rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.12)] p-10 border border-white relative z-10 fade-in">
                
                {/* 로고 영역: mb-10 -> mb-8 (간격 다이어트) */}
                <div className="text-center mb-8">
                    {/* 아이콘: w-20 -> w-16 (적당한 크기로 복귀) */}
                    <div className="w-16 h-16 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg rotate-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    {/* 제목: text-4xl -> text-3xl (부담스럽지 않게 큰 크기) */}
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">LEX AI</h2>
                    <p className="text-slate-500 font-medium text-sm">로그인하여 서비스를 시작하세요</p>
                </div>

                {isError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-center shake">
                        <p className="text-sm text-red-600 font-bold">{errorMsg}</p>
                    </div>
                )}

                {/* 폼 간격: space-y-6 -> space-y-5 (오밀조밀하게) */}
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
                        <div className="flex justify-between items-center px-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">PASSWORD</label>
                        </div>
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
                        <button onClick={() => alert('회원가입')} className="ml-2 font-black text-blue-900 hover:underline underline-offset-4">새 계정 만들기</button>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;