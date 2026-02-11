import React, { useState, useEffect } from 'react';
import axios from 'axios';
// css 파일 입포트..
import './LoginPage.css'; 

const LoginPage = () => {
    // 1. 상태 관리 (HTML의 입력창 값과 에러 메시지를 여기서 관리)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState(''); // 에러 메시지 내용
    const [isError, setIsError] = useState(false); // 에러 발생 여부

    // 2. [REQ-SYS-01] 페이지 진입 시 로그 (useEffect = window.onload 대체)
    useEffect(() => {
        const logAccess = async () => {
            try{
                await axios.post('/api/logs/access',{
                    page: 'LOGING_PAGE',
                    userAgent: navigator.userAgent
                });
            } catch (e) {
                console.error("접속 로그 전송 실패:",e)
            }
        };
        logAccess();
    }, []);

    // 3. 로그인 처리 함수
    const handleLoginSubmit = async (e) => {
        e.preventDefault(); // 새로고침 방지
        setIsError(false); // 에러 초기화

        // [REQ-AUTH-01] 활동 정지 회원 차단 시뮬레이션 (프론트 1차 방어)
        if (email === 'blocked@lexai.com') {
            setErrorMsg("활동 정지 회원입니다. 고객센터에 문의하세요.");
            setIsError(true);
            return;
        }

        try {
            // ★ 여기가 진짜 백엔드(Spring)와 연결되는 부분입니다 ★
            // HTML의 가짜 로직 대신 실제 요청을 보냅니다.
            const response = await axios.post('/api/auth/login', {
                userId: email,
                userPw: password
            });
            
            // reponse.data : Axios가 받은 전체 응답(ResultVO)
            // reponse.data.data : 백엔드에서 담은 실제 TokenDTO
            const tokenData = response.data.data;
            console.log("발행된 토큰:",tokenData.accessToken);
            
            // 토큰 보관하기..
            // 브라우저를 껐다 켜도 로그인 상태를 유지하기 위해 LocalStorage에 저장..! 
            // 토큰 시간은 생명 주기는 30분, 유효 기간은 14일 정도
            localStorage.setItem('accessToken', tokenData.accessToken);
            localStorage.setItem('refreshToken', tokenData.refreshToken);
            localStorage.setItem('userNm', response.data.data.userNm || "사용자");
            
            // 백엔드에서 객체와 함께 메세지를 보내줬기에 동일하게 처리..
            alert(response.data.message);
            
        } catch (error) {
            // 실패 시 로직 (REQ-SEC-01: 메시지 통일)
            console.error("[AUDIT LOG] LOGIN_FAILURE", error);
            
            // 보안을 위해 "아이디가 틀림", "비번이 틀림"을 구분하지 않고 통일합니다.
            setErrorMsg("정보가 일치하지 않습니다."); 
            setIsError(true);
        }
    };

    return (
        <main id="login-page" className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-mesh">
            
            {/* 장식용 배경 요소 */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-[480px] w-full glass-login rounded-[3rem] shadow-[0_20px_50px_rgba(30,58,138,0.12)] p-12 md:p-14 border border-white relative z-10 fade-in">
                
                {/* 로고 영역 */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">여러분들의 사연을</h2>
                    <p className="text-slate-500 font-medium text-sm">획기적인 AI와 함께 해결해보세요</p>
                </div>

                {/* [REQ-SEC-01] 에러 메시지 표시 영역 (조건부 렌더링) */}
                {isError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center shake">
                        <p className="text-xs text-red-600 font-bold">{errorMsg}</p>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleLoginSubmit}>
                    {/* 이메일 입력 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            placeholder="아이디를 입력해주세요." 
                            className="w-full px-6 py-4.5 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                        </div>
                        <input 
                            type="password" 
                            required 
                            placeholder="••••••••" 
                            className="w-full px-6 py-4.5 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    {/* 옵션 (기억하기 / 비번찾기) */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="remember" className="w-4.5 h-4.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer" />
                            <label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer">기억하기</label>
                        </div>
                        <button type="button" className="text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors">비밀번호를 잊으셨나요?</button>
                    </div>

                    {/* 로그인 버튼 */}
                    <button type="submit" className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(30,58,138,0.25)] hover:bg-slate-900 hover:-translate-y-1 active:scale-95 transition-all">
                        계정 로그인
                    </button>
                </form>

                <div className="mt-8">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm font-medium">아직 회원이 아니신가요? 
                            <button onClick={() => alert('회원가입 페이지로 이동')} className="ml-2 font-black text-blue-900 hover:underline underline-offset-4">새 계정 만들기</button>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;