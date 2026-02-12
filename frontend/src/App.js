import React, {useState} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 1. 외부 부품(컴포넌트)들을 정확한 경로에서 가져오기
import Header from './common/components/Header';
import Footer from './common/components/Footer';
import MainPage from './pages/mainpage';
import ConsultationBoard from './BWJ/ConsultationBoard';
import WriteQuestionPage from './BWJ/WriteQuestionPage';
import GeneralMyPage from './pages/GeneralMypage'
import ChatList from './KImMinSU/chatList'
import Lawmainpage from './ky/Lawmainpage';
import Profiles from './ky/profiles';
import LoginPage from './HSH/LoginPage';
import SignupPage from './HSH/SignupPage'; // ★ [추가 1] 회원가입 페이지 가져오기
import ExpertsPage from './pages/ExpertsPage'; // ★ [추가 3] 전문가 찾기 페이지
import ExpertDetailPage from './pages/ExpertDetailPage'; // 디테일

// 2. 로그인 페이지가 아직 없다면 일단 임시 컴포넌트로 대체
//const LoginPage = () => <div className="p-20 text-center">로그인 페이지 준비중</div>;

function App() {

  // 1. 로그인 상태를 App 수준에서 관리해요.
  const [auth, setAuth] = useState({
    isLoggedIn: !!localStorage.getItem('accessToken'),
    role: localStorage.getItem('userRole')
  });

  // 2. 로그인 상태를 업데이트하는 함수
  const updateAuth = () => {
    setAuth({
      isLoggedIn: !!localStorage.getItem('accessToken'),
      role: localStorage.getItem('userRole')
    });
  };

    return (
        <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-gray-50 text-slate-900 font-sans">
            {/* 모든 페이지 상단에 고정 */}
            <Header auth={auth} onLoginUpdate={updateAuth} />

            {/* 주소(URL)에 따라 바뀌는 메인 컨텐츠 영역 */}
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route
                      path="/mypage"
                      element={
                        auth.isLoggedIn && auth.role === 'ROLE_USER'
                        ? <GeneralMyPage />
                        : <Navigate to="/login" replace  /> // 권한 없으면 로그인창으로 강제 이동
                      }
                    />
                    <Route path="/chatList" element={<ChatList />} />
                    <Route path="/consultation" element={<ConsultationBoard />} />
                    <Route path="/write" element={<WriteQuestionPage />} />

                    {/* 로그인 페이지 */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* ★ [추가 2] 회원가입 페이지 라우트 설정 */}
                    <Route path="/signup" element={<SignupPage />} />

                    <Route path="/lawyer-dashboard" element={<Lawmainpage />} />
                    <Route path="/profiles" element={<Profiles />} />

                    <Route path="/experts" element={<ExpertsPage />} />

                    <Route path="/experts/:id" element={<ExpertDetailPage />} />



                    {/* (기존 코드에 /login이 중복되어 있어서 하나는 제거했습니다) */}

                    <Route path="*" element={<div className="text-center p-20">404 Not Found</div>} />
                </Routes>
            </main>

            {/* 모든 페이지 하단에 고정 */}
            <Footer />
        </div>
        </BrowserRouter>
    );
}

export default App;