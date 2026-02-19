import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-gray-50 text-slate-900 font-sans">
                <Header auth={auth} onLoginUpdate={updateAuth} />

                <main className="flex-grow">
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

                        {/* ==================== */}
                        {/* 고객센터 (충돌 제거) */}
                        {/* ==================== */}

                        <Route path="/customer" element={<CustomerHomePage />} />
                        <Route path="/customer/list" element={<CustomerListPage />} />
                        <Route path="/customer/write" element={<CustomerWritePage />} />
                        <Route path="/customer/detail/:id" element={<CustomerDetailPage />} />
                        <Route path="/customer/edit/:id" element={<CustomerEditPage />} />

                        {/* 404 */}
                        <Route
                            path="*"
                            element={<div className="text-center p-20">404 Not Found</div>}
                        />

                    </Routes>
                </main>

                <Footer />
            </div>
        </BrowserRouter>
    );
}

export default App;
