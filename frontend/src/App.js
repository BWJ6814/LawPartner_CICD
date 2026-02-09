import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 1. 외부 부품(컴포넌트)들을 정확한 경로에서 가져오기
import Header from './common/components/Header';
import Footer from './common/components/Footer';
import MainPage from './pages/mainpage';
import ConsultationBoard from './BWJ/ConsultationBoard';
import WriteQuestionPage from './BWJ/WriteQuestionPage';
import GeneralMyPage from './pages/GeneralMypage'

// 2. 로그인 페이지가 아직 없다면 일단 임시 컴포넌트로 대체
const LoginPage = () => <div className="p-20 text-center">로그인 페이지 준비중</div>;

function App() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-slate-900 font-sans">
            {/* 모든 페이지 상단에 고정 */}
            <Header />

            {/* 주소(URL)에 따라 바뀌는 메인 컨텐츠 영역 */}
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/mypage" element={<GeneralMyPage />} />
                    <Route path="/consultation" element={<ConsultationBoard />} />
                    <Route path="/write" element={<WriteQuestionPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<div className="text-center p-20">404 Not Found</div>} />
                </Routes>
            </main>

            {/* 모든 페이지 하단에 고정 */}
            <Footer />
        </div>
    );
}

export default App;