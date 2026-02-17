import React, { useState } from 'react';
import Sidebar from './lawpage/Sidebar';

const Lawmainpage = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(0); // 0 = January 2026

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // 달력 데이터 생성 (2026년 1월)
    const generateCalendar = () => {
        const year = 2026;
        const month = currentMonth;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const days = [];

        // 이전 달 날짜 (회색)
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, isCurrentMonth: false, isPrev: true });
        }

        // 현재 달 날짜
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, isPrev: false });
        }

        // 다음 달 날짜 (회색)
        const remainingDays = 42 - days.length; // 6주 표시
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ day: i, isCurrentMonth: false, isPrev: false });
        }

        return days;
    };

    const calendarDays = generateCalendar();
    const highlightedDates = [11, 18, 20, 25, 29]; // 빨간색 강조 날짜

    // 최근 상담 요청 현황
    const consultations = [
        {
            name: '홍길동',
            category: '교통사고',
            status: '상담중',
            date: '2026-02-03',
            statusColor: 'yellow'
        },
        {
            name: '김철호',
            category: '교통사고',
            status: '소송 전행중',
            date: '2026-01-03',
            statusColor: 'blue'
        }
    ];

    // 리뷰 데이터
    const reviews = [
        {
            lawFirm: '종로법무법인',
            rating: 5,
            review: '이렇게 빠릿빠릿하게 모든 문제를 해결해주실거라 상상도 못했습니다.'
        },
        {
            lawFirm: '최강법무법인',
            rating: 5,
            review: '당황 예방하려던 본정식나 관문과 성과 예방하지마 장애물없는 준비가...'
        },
        {
            lawFirm: '검한법무법인',
            rating: 5,
            review: '정말 친절하시고 저의 사건을 해결해주실 수준으로써 많은 걱정이 없어서...'
        }
    ];

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
            {/* Sidebar */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <div className="p-6 max-w-7xl mx-auto w-full">
                    {/* 헤더 - 스크롤 시 고정 */}
                    <div className="sticky top-0 z-40 mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">안녕하세요, 김구역 변호사님!</h1>
                        <p className="text-blue-100 text-base">
                            현재 처리해야 할 긴급 상담 건이 <span className="text-yellow-300 font-bold text-xl">0건</span> 있습니다.
                        </p>
                    </div>

                    {/* 통계 카드 섹션 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* 해결한 사건 */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-blue-100 hover:shadow-lg transition-all duration-300">
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-600 mb-1">해결한 사건</p>
                                <p className="text-xs text-gray-500 mb-3">해결한 건수 수</p>
                                <div className="flex items-end gap-1">
                                    <p className="text-5xl font-bold text-gray-900">0</p>
                                    <p className="text-2xl font-medium text-gray-600 mb-1">건</p>
                                </div>
                            </div>
                        </div>

                        {/* 상담 요청 건 수 */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-orange-100 hover:shadow-lg transition-all duration-300">
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-600 mb-1">상담 요청 건 수</p>
                                <p className="text-xs text-gray-500 mb-3">상담한 건수</p>
                                <div className="flex items-end gap-1">
                                    <p className="text-5xl font-bold text-gray-900">0</p>
                                    <p className="text-2xl font-medium text-gray-600 mb-1">건</p>
                                </div>
                            </div>
                        </div>

                        {/* 평점 */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-green-100 hover:shadow-lg transition-all duration-300">
                            <div className="flex flex-col">
                                <p className="text-sm text-gray-600 mb-1">평점</p>
                                <p className="text-xs text-gray-500 mb-3">리뷰 평점</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-5xl font-bold text-gray-900">4.5</p>
                                    <p className="text-2xl font-medium text-gray-500 mb-1">/ 5.0</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 하단 섹션 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 최근 상담 요청 현황 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">최근 상담 요청 현황</h2>
                                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                    전체 보기
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {consultations.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                            <div className="space-y-3">
                                                {/* 첫 번째 줄 */}
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">상담자</span>
                                                        <span className="font-semibold text-gray-900">{item.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">카테고리</span>
                                                        <span className="font-semibold text-gray-900">{item.category}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">상태</span>
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                                            item.statusColor === 'yellow'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* 두 번째 줄 */}
                                                <div className="text-sm">
                                                    <span className="text-gray-500">접수일 날짜</span>
                                                    <span className="ml-2 font-semibold text-gray-900">{item.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 재판 일정 관리 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">재판 일정 관리</h2>
                                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                    전체 보기
                                </button>
                            </div>
                            <div className="p-6">
                                {/* 월 선택 */}
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <button
                                        onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        &lt;
                                    </button>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-900">2026년 {monthNames[currentMonth]}</div>
                                    </div>
                                    <button
                                        onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        &gt;
                                    </button>
                                </div>

                                {/* 달력 */}
                                <div className="mb-4">
                                    {/* 요일 헤더 */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => (
                                            <div
                                                key={day}
                                                className={`text-center text-xs font-semibold py-2 ${
                                                    index === 0 ? 'text-red-600' :
                                                        index === 6 ? 'text-blue-600' :
                                                            'text-gray-600'
                                                }`}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    {/* 날짜 */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((item, index) => {
                                            const isHighlighted = item.isCurrentMonth && highlightedDates.includes(item.day);
                                            const isSunday = index % 7 === 0;
                                            const isSaturday = index % 7 === 6;

                                            return (
                                                <button
                                                    key={index}
                                                    className={`
                                                        aspect-square flex items-center justify-center text-sm rounded-lg
                                                        transition-all duration-200
                                                        ${!item.isCurrentMonth ? 'text-gray-300' : ''}
                                                        ${isHighlighted ? 'bg-red-500 text-white font-bold hover:bg-red-600' : ''}
                                                        ${item.isCurrentMonth && !isHighlighted ? 'text-gray-700 hover:bg-blue-50' : ''}
                                                        ${isSunday && item.isCurrentMonth && !isHighlighted ? 'text-red-500' : ''}
                                                        ${isSaturday && item.isCurrentMonth && !isHighlighted ? 'text-blue-500' : ''}
                                                    `}
                                                >
                                                    {item.day || ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 최근 의뢰인 후기 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900">최근 의뢰인 후기</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                    {reviews.map((review, index) => (
                                        <div key={index} className="border-l-4 border-yellow-400 bg-blue-50 rounded-r-xl p-4 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-blue-900">{review.lawFirm}</h3>
                                                <div className="flex gap-0.5">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <span key={i} className="text-yellow-400 text-sm">★</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {review.review}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Lawmainpage;