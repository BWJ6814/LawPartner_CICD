import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import DashboardSidebar from '../common/components/DashboardSidebar';

const GeneralMyPage = () => {
  const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. 페이지가 열리자마자 딱 한 번 권한을 체크합니다.
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('userToken');

    if (!token || role !== 'GENERAL') {
      alert("일반 회원만 이용 가능한 페이지입니다.");
      navigate('/'); // 메인으로 쫓아내기
    }
  }, [navigate]); // navigate가 바뀔 때만 실행 (사실상 마운트 시 1회)

  // 로그아웃 핸들러 (이건 그대로 두셔도 됩니다)
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">
      
      {/* 1. 공용 사이드바 */}
      <DashboardSidebar 
              isSidebarOpen={isSidebarOpen} 
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            />
      

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* 콘텐츠 스크롤 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* 환영 문구 */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">안녕하세요, 김길동님!</h1>
            <p className="text-slate-500">현재 처리해야 할 긴급 상담 건이 <span className="text-red-500 font-bold">0건</span> 있습니다.</p>
          </div>

          {/* 통계 카드 (Stats) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#1e3a8a]">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-slate-700">최근 답글</h4>
              </div>
              <p className="text-4xl font-black text-slate-900 text-center py-2">0<span className="text-lg font-medium text-slate-400 ml-1">건</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#f97316]">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-slate-700">최근 받은 상담</h4>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">요청된 건수</span>
              </div>
              <p className="text-4xl font-black text-slate-900 text-center py-2">1<span className="text-lg font-medium text-slate-400 ml-1">건</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#10b981]">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-slate-700">다음 예약</h4>
              </div>
              <div className="text-center py-2">
                <p className="text-sm text-slate-500 font-bold mb-1">다음 상담까지</p>
                <p className="text-xl font-black text-slate-900">3일 남음</p>
              </div>
            </div>
          </div>

          {/* 최근 상담 요청 현황 (Table) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">최근 상담 요청 현황</h3>
              <button className="text-xs text-blue-600 font-bold hover:underline">전체 보기</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">상담자</th>
                    <th className="px-6 py-3">카테고리</th>
                    <th className="px-6 py-3">판결/총결</th>
                    <th className="px-6 py-3">소장 작성</th>
                    <th className="px-6 py-3">사건 접수</th>
                    <th className="px-6 py-3">접수된 날짜</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">홍길동</td>
                    <td className="px-6 py-4 text-blue-600 font-bold">교통사고</td>
                    <td className="px-6 py-4"><span className="text-orange-500 font-bold">진행중</span></td>
                    <td className="px-6 py-4"><span className="text-orange-500 font-bold">진행중</span></td>
                    <td className="px-6 py-4"><span className="text-orange-500 font-bold">상담중</span></td>
                    <td className="px-6 py-4 text-slate-500">2026-02-03</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* 2. 최근 내 게시란 (하단에 배치) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">최근 내 게시판</h3>
                <Link to="/board" className="text-xs text-blue-600 font-bold hover:underline">
                전체 게시판
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* 게시글은 2열로 나열해서 공간 활용 */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-100">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">이혼 소송 절차 문의</span>
                    <span className="text-xs text-slate-400 mt-1">2026-02-01</span>
                </div>
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold">
                    <i className="fas fa-comment-dots mr-1"></i> 답변 2
                </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-100">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">전세 반환 소송비용 질문</span>
                    <span className="text-xs text-slate-400 mt-1">2026-01-28</span>
                </div>
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold">
                    <i className="fas fa-comment-dots mr-1"></i> 답변 1
                </div>
                </div>
            </div>
            </div>

            {/* 1. 내 재판 일정 (상단에 넓게 배치) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">내 재판 일정</h3>
                <button className="text-xs text-blue-600 font-bold hover:underline">전체 보기</button>
            </div>
            
            <div className="calendar-container">
                <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                locale="ko"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                }}
                events={[
                    { title: '교통사고 재판', date: '2026-02-03', color: '#3b82f6' },
                    { title: '의뢰인 상담', date: '2026-02-08', color: '#ef4444' }
                ]}
                // 핵심: 높이를 제한하지 않고 날짜가 다 나오게 설정
                height="auto" 
                contentHeight="auto"
                aspectRatio={2.5} // 가로로 길게 배치해서 시원하게 보이게 함
                />
            </div>
            </div>

            

        </div>
      </main>
    </div>
  );
};

export default GeneralMyPage;