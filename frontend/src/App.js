import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // ★ useLocation 추가
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Header from './common/components/Header';
import Footer from './common/components/Footer';
import MainPage from './pages/mainpage';
import ConsultationBoard from './BWJ/ConsultationBoard';
import WriteQuestionPage from './BWJ/WriteQuestionPage';
import ConsultationDetail from './BWJ/ConsultationDetail';
import AIChatPage from "./BWJ/AIChatPage";
import GeneralMyPage from './pages/GeneralMypage';
import ChatList from './KImMinSU/chatList';
import Lawmainpage from './ky/Lawmainpage';
import LoginPage from './HSH/LoginPage';
import SignupPage from './HSH/SignupPage';
import ExpertsPage from './pages/ExpertsPage';
import ExpertDetailPage from './pages/ExpertDetailPage';

import CustomerHomePage from "./pages/CustomerHomePage";
import CustomerWritePage from "./pages/CustomerWritePage";
import CustomerListPage from "./pages/CustomerListPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import CustomerEditPage from "./pages/CustomerEditPage";
import AdminPage from './HSH/admin/AdminPage';

// =====================================================================
// ★ [S급 디테일] 현재 주소를 확인해서 헤더/푸터를 보여줄지 결정하는 내부 컴포넌트
// =====================================================================
const LayoutManager = ({ auth, onLoginUpdate, children }) => {
    const location = useLocation();
    
    // 현재 주소가 '/admin'으로 시작하는지 확인
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isAiChatRoute = location.pathname === '/ai-chat';

    // ai-chat / 채팅 / 일반마이페이지: 고정 높이 + 메인만 스크롤 (카톡·챗GPT 방식)
    const isChatRoute = location.pathname.startsWith('/chatList') || location.pathname.startsWith('/lawyer-chat');
    const isGeneralMypageRoute = location.pathname.startsWith('/general-mypage');
    const isFixedLayout = isAiChatRoute || isChatRoute || isGeneralMypageRoute;

    return (
        <div className={`flex flex-col bg-gray-50 text-slate-900 font-sans ${isFixedLayout ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
            {!isAdminRoute && <Header auth={auth} onLoginUpdate={onLoginUpdate} />}
            <main className={`${isFixedLayout ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : 'flex-grow'}`}>
                {isFixedLayout ? (
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
                        {children}
                    </div>
                ) : children}
            </main>

            {/* admin, ai-chat, 채팅 페이지(chatList/lawyer-chat)에서는 Footer 숨김 */}
            {!isAdminRoute && !isAiChatRoute && !isChatRoute && <Footer />}
        </div>
    );
};

// JWT 만료 여부 확인 (base64url → base64 변환 후 디코딩)
function isTokenExpired(token) {
    try {
        const base64url = token.split('.')[1];
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

// 앱 시작 시 만료된 토큰이면 즉시 정리
(function clearExpiredToken() {
    const token = localStorage.getItem('accessToken');
    if (token && isTokenExpired(token)) {
        localStorage.clear();
    }
})();

function App() {
    const [auth, setAuth] = useState({
        isLoggedIn: !!localStorage.getItem('accessToken'),
        role: localStorage.getItem('userRole')
    });

    const updateAuth = () => {
        setAuth({
            isLoggedIn: !!localStorage.getItem('accessToken'),
            role: localStorage.getItem('userRole')
        });
    };

    // 보안 체크 헬퍼
    const isAdmin = () => {
        const currentRole = localStorage.getItem('userRole'); // ★ State 대신 Storage에서 직접 확인
        const currentToken = localStorage.getItem('accessToken');
        return !!currentToken && ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR'].includes(currentRole);
    }

    return (
        <BrowserRouter>
            <LayoutManager auth={auth} onLoginUpdate={updateAuth}>
                <Routes>
                    {/* 기본 페이지 */}
                    <Route path="/" element={<MainPage />} />

                    <Route
                        path="/mypage"
                        element={
                            auth.isLoggedIn && auth.role === 'ROLE_USER'
                                ? <GeneralMyPage />
                                : <Navigate to="/login" replace />
                        }
                    />

                    {/* ========================================================= */}
                    {/* ⭐ 관리자 전용 라우팅 */}
                    {/* ========================================================= */}
                    <Route 
                        path="/admin/*" 
                        element={
                            isAdmin() 
                                ? <AdminPage /> 
                                : <Navigate to="/login" replace />
                        } 
                    />

                    <Route path="/chatList" element={<ChatList />} />
                    <Route path="/chatList/:roomId" element={<ChatList />} />

                    <Route path="/consultation" element={<ConsultationBoard />} />
                    <Route path="/consultation/:id" element={<ConsultationDetail />} />
                    <Route path="/write" element={<WriteQuestionPage />} />
                    <Route path="/ai-chat" element={<AIChatPage />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    <Route path="/lawyer-dashboard" element={<Lawmainpage />} />
                    <Route path="/lawyer-chat" element={<ChatList />} />
                    <Route path="/lawyer-chat/:roomId" element={<ChatList />} />

                    <Route path="/experts" element={<ExpertsPage />} />
                    <Route path="/experts/:id" element={<ExpertDetailPage />} />

                    {/* 고객센터 */}
                    <Route path="/customer" element={<CustomerHomePage />} />
                    <Route path="/customer/list" element={<CustomerListPage />} />
                    <Route path="/customer/write" element={<CustomerWritePage />} />
                    <Route path="/customer/detail/:id" element={<CustomerDetailPage />} />
                    <Route path="/customer/edit/:id" element={<CustomerEditPage />} />
                    
                    {/**/}
                    
                    {/* 404 */}
                    <Route
                        path="*"
                        element={<div className="text-center p-20 font-bold text-xl text-slate-500">404 Not Found</div>}
                    />
                </Routes>
            </LayoutManager>
        </BrowserRouter>
    );
}

export default App;