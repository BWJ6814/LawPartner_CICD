import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import DashboardSidebar from '../common/components/DashboardSidebar';
import axios from 'axios'; // ★ axios import 필수

const GeneralMyPage = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ★ 1. 데이터를 저장할 State 생성 (초기값 null 또는 기본 구조)
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. 데이터 가져오기 (API 호출)
    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('accessToken');
            const role = localStorage.getItem('userRole');

            if (!token || role !== 'ROLE_USER') {
                alert("일반 회원만 이용 가능한 페이지입니다.");
                navigate('/login');
                return;
            }

            try {
                // ★ 백엔드 API 호출 (포트번호 확인 필요)
                const response = await axios.get('http://localhost:8080/api/mypage/general', {
                    headers: {
                        Authorization: `Bearer ${token}` // JWT 토큰 전송
                    }
                });

                setDashboardData(response.data); // 받아온 데이터 저장
                setLoading(false);

            } catch (error) {
                console.error("대시보드 데이터 로딩 실패:", error);
                // 에러 처리 (로그아웃 시키거나 에러 메시지 표시)
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        alert("로그아웃 되었습니다.");
        navigate('/');
    };

    // ★ 로딩 중일 때 보여줄 화면
    if (loading) {
        return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
    }

    // 데이터가 없을 경우 방어 코드
    if (!dashboardData) return null;

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">

            <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* 환영 문구 - 데이터 바인딩 */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                            안녕하세요, {dashboardData.userName}님!
                        </h1>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#1e3a8a]">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-700">최근 답글</h4>
                            </div>
                            <p className="text-4xl font-black text-slate-900 text-center py-2">
                                {dashboardData.recentReplyCount}<span className="text-lg font-medium text-slate-400 ml-1">건</span>
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#f97316]">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-700">최근 상담 요청</h4>
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">요청된 건수</span>
                            </div>
                            <p className="text-4xl font-black text-slate-900 text-center py-2">
                                {dashboardData.requestCount}<span className="text-lg font-medium text-slate-400 ml-1">건</span>
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#10b981]">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-700">다음 예약</h4>
                            </div>
                            <div className="text-center py-2">
                                <p className="text-sm text-slate-500 font-bold mb-1">다음 상담까지</p>
                                <p className="text-xl font-black text-slate-900">
                                    {dashboardData.daysLeft !== null ? `${dashboardData.daysLeft}일 남음` : '예약 없음'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 최근 상담 요청 현황 (Table) - map 사용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-lg">최근 상담 요청 현황</h3>
                            <button className="text-xs text-blue-600 font-bold hover:underline">전체 보기</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">상담 변호사</th>
                                    <th className="px-6 py-3">카테고리</th>
                                    <th className="px-6 py-3">진행 상태</th>
                                    <th className="px-6 py-3">접수 날짜</th>
                                </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100 font-medium">
                                {/* ★ 데이터 매핑 */}
                                {dashboardData.recentConsultations && dashboardData.recentConsultations.length > 0 ? (
                                    dashboardData.recentConsultations.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.lawyerName}</td>
                                            <td className="px-6 py-4 text-blue-600 font-bold">{item.category}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-orange-500 font-bold">{item.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{item.regDate}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center">상담 내역이 없습니다.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 최근 내 게시글 - map 사용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">최근 내 게시판</h3>
                            <Link to="/consultation" className="text-xs text-blue-600 font-bold hover:underline">
                                전체 게시판
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dashboardData.recentPosts && dashboardData.recentPosts.length > 0 ? (
                                dashboardData.recentPosts.map((post) => (
                                    <Link to={`/consultation/${post.boardNo}`} key={post.boardNo} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{post.title}</span>
                                            <span className="text-xs text-slate-400 mt-1">{post.regDate}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold">
                                            <i className="fas fa-comment-dots mr-1"></i> 답변 {post.replyCount}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center w-full col-span-2 text-slate-400">작성한 게시글이 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 캘린더 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">내 재판/상담 일정</h3>
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
                                // ★ 서버 데이터 연결
                                events={dashboardData.calendarEvents || []}
                                height="auto"
                                contentHeight="auto"
                                aspectRatio={2.5}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default GeneralMyPage;