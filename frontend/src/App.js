import React, { useState, useEffect } from 'react'; // ★ useEffect 추가
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // ★ useLocation 추가
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Header from './common/components/Header';
import Footer from './common/components/Footer';
import MainPage from './pages/mainpage';
import ConsultationBoard from './BWJ/ConsultationBoard';
import WriteQuestionPage from './BWJ/WriteQuestionPage';
import ConsultationDetail from './BWJ/ConsultationDetail';
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
import AdminPage from './HSH/AdminPage';

// =====================================================================
// ★ [S급 디테일] 현재 주소를 확인해서 헤더/푸터를 보여줄지 결정하는 내부 컴포넌트
// =====================================================================
const LayoutManager = ({ auth, onLoginUpdate, children }) => {
    const location = useLocation();
    
    // 현재 주소가 '/admin'으로 시작하는지 확인
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-slate-900 font-sans">
            {/* 관리자 페이지가 아닐 때만 헤더 렌더링 */}
            {!isAdminRoute && <Header auth={auth} onLoginUpdate={onLoginUpdate} />}
            
            <main className="flex-grow">
                {children}
            </main>

            {/* 관리자 페이지가 아닐 때만 푸터 렌더링 */}
            {!isAdminRoute && <Footer />}
        </div>
    );
};

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
        const currentRole = localStorage.getItem('userRole'); // ★ State 대신 Storage에서 직접 확인 (강제 이동 방지)
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

                    <Route path="/consultation" element={<ConsultationBoard />} />
                    <Route path="/consultation/:id" element={<ConsultationDetail />} />
                    <Route path="/write" element={<WriteQuestionPage />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                        <Route path="/lawyer-dashboard" element={<Lawmainpage />} />
                        <Route path="/ai-chat" element={<div className="text-center p-20 text-xl text-gray-500">AI 상담 준비 중입니다.</div>} />


                    <Route path="/experts" element={<ExpertsPage />} />
                    <Route path="/experts/:id" element={<ExpertDetailPage />} />

                    {/* 고객센터 */}
                    <Route path="/customer" element={<CustomerHomePage />} />
                    <Route path="/customer/list" element={<CustomerListPage />} />
                    <Route path="/customer/write" element={<CustomerWritePage />} />
                    <Route path="/customer/detail/:id" element={<CustomerDetailPage />} />
                    <Route path="/customer/edit/:id" element={<CustomerEditPage />} />

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