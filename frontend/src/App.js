// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // 부트스트랩 스타일 (필수)
import './App.css';

// 1. 형님이 만든 헤더 부품을 가져옵니다. (경로 확인 필수!)
import Header from './common/components/Header';
import ConsultationBoard from './BWJ/ConsultationBoard';
import WriteQuestionPage from './BWJ/WriteQuestionPage';

function App() {
  return (
    <div className="App">
      {/* 2. 여기에 헤더를 '태그'처럼 씁니다. 이게 화면에 그리는 겁니다. */}
      <Header />
        {/*<CB />*/}
        <ConsultationBoard/>
            <Routes>
                <Route path="/" element={<ConsultationBoard />} />
                <Route path="/write" element={<WriteQuestionPage />} />
            </Routes>
      <main className="container mt-5">
        <h2>형님, 헤더가 잘 보이십니까?</h2>
        <p>여기부터는 본문 영역입니다.</p>

        <div className="tw-bg-amber-400 tw-p-4 tw-text-center tw-font-bold tw-text-red-600">
        이 글자가 노란 배경에 빨간색으로 보이면 테일윈드 성공!
      </div>
      </main>
    </div>
  );
}

export default App;