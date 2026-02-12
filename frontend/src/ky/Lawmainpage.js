import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import PaymentModal from './PaymentModal';

const mockData = {
    lawyer: {
        name: '홍길동',
        specialization: '교통사고',
        rating: 4.5,
        solvedCases: 0,
        pendingConsults: 0,
    },
    recentConsults: [
        { id: 1, client: '홍길동', category: '교통사고', status: '상담중', date: '2026-02-03' },
        { id: 2, client: '김길동', category: '교통사고', status: '소송 전문등', date: '2026-01-03' },
    ],
    recentReviews: [
        { id: 1, client: '홍길동님', rating: 5, content: '어려운 케이스임에도 불구하고 좋은 결과를 얻었습니다. 다음에도 꼭 상담하고 싶어요.' },
        { id: 2, client: '김길동님', rating: 4, content: '항상 친절하게 대해주시고 많은 것을 알아가게 됩니다. 정말 감사합니다.' },
        { id: 3, client: '최길동님', rating: 5, content: '법적인 절차에서 제일전문적으로 도와주셔서 감사합니다.' },
    ],
    trialSchedule: [
        { date: 15, hasEvent: true },
        { date: 20, hasEvent: true },
        { date: 27, hasEvent: true },
    ],
};

const menuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'new-consult', label: '새로운 상담'},
    { id: 'my-cases', label: '나의 법률 데이터' },
    { id: 'ai-chat', label: 'AI 채팅 관리'},
    { id: 'trial', label: '재판 일정 관리' },
    { id: 'profile', label: '프로필 관리'},
    { id: 'review', label: '리뷰 및 평점'},
    { id: 'subscription', label: '구독 신청/해지'},
];

function StarRating({ rating }) {
    return (
        <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`text-base ${i <= rating ? 'text-amber-500' : 'text-gray-300'}`}>★</span>
            ))}
        </div>
    );
}

function CalendarWidget() {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const weeks = [
        [null, null, null, 1, 2, 3, 4],
        [5, 6, 7, 8, 9, 10, 11],
        [12, 13, 14, 15, 16, 17, 18],
        [19, 20, 21, 22, 23, 24, 25],
        [26, 27, 28, 29, 30, 31, null],
    ];
    const eventDays = [15, 20, 27];

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <button className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">‹</button>
                <span className="text-sm font-bold text-slate-900">2026년 1월</span>
                <button className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
                {days.map(d => <span key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</span>)}
            </div>
            {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.map((day, di) => (
                        <div
                            key={di}
                            className={`text-center py-2 text-xs rounded relative cursor-pointer
                                ${!day ? 'text-transparent' : 'text-slate-600 hover:bg-gray-100'}
                                ${day && eventDays.includes(day) ? 'bg-blue-50 text-blue-600 font-bold' : ''}
                            `}
                        >
                            {day}
                            {day && eventDays.includes(day) && (
                                <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-0.5"></div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function Lawmainpage() {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('dashboard');
    const [showPayment, setShowPayment] = useState(false);
    const [notifications] = useState(3);
    const { lawyer, recentConsults, recentReviews } = mockData;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* 사이드바 */}
            <aside className="w-56 bg-slate-800 fixed top-100 left-0 bottom-0 z-40 flex flex-col overflow-y-auto">
                <div className="px-5 py-6 border-b border-white/10">
                    <h1 className="text-lg font-extrabold text-white tracking-wide">사이트 명</h1>
                </div>

                <nav className="flex-1 py-3 px-3 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            // onClick={() => item.id === 'subscription' ? setShowPayment(true) : setActivePage(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                                ${activePage === item.id
                                ? 'bg-indigo-600 text-white border-l-4 border-indigo-400'
                                : 'text-white/60 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                            }
                            `}
                        >
                            <span className="text-base">{item.icon || ''}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            김
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">김구역</div>
                            <div className="text-xs text-white/50">변호사</div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/profiles')}
                        className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        ⚙️ 설정
                    </button>
                </div>
            </aside>

            {/* 메인 */}
            <div className="flex-1 ml-56">
                {/* 헤더 */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">대시보드</h2>
                    <div className="flex items-center gap-3">

                    </div>
                </header>

                {/* 콘텐츠 */}
                <div className="p-8">
                    {/* 환영 메시지 */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-7 mb-6">
                        <h1 className="text-2xl font-extrabold text-white mb-2">
                            안녕하세요, {lawyer.name} 변호사님!
                        </h1>
                        <p className="text-white/70 text-base">
                            현재 처리해야 할 긴급 상담 건이 <strong className="text-amber-400">0건</strong> 있습니다.
                        </p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-3 gap-5 mb-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="text-sm font-bold text-slate-900 mb-1">해결한 사건</div>
                            <div className="text-xs text-slate-400 mb-3">해결한 사건 수</div>
                            <div className="text-3xl font-extrabold text-slate-900">{lawyer.solvedCases}건</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="text-sm font-bold text-slate-900 mb-1">상담 요청 건수</div>
                            <div className="text-xs text-slate-400 mb-3">요청한 건수</div>
                            <div className="text-3xl font-extrabold text-slate-900">{lawyer.pendingConsults}건</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                            <div className="text-sm font-bold text-slate-900 mb-1">평점</div>
                            <div className="text-xs text-slate-500 mb-3">리뷰 평점</div>
                            <div className="text-3xl font-extrabold text-slate-900">
                                {lawyer.rating} <span className="text-base text-slate-400">/ 5.0</span>
                            </div>
                            <StarRating rating={Math.round(lawyer.rating)} />
                        </div>
                    </div>

                    {/* 하단 2컬럼 */}
                    <div className="grid grid-cols-[1fr_380px] gap-5">
                        {/* 왼쪽 */}
                        <div className="space-y-5">
                            {/* 최근 상담 요청 */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-base font-bold text-slate-900">최근 상담 요청 현황</h3>
                                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                        전체 보기
                                    </button>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600">상담자</th>
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600">카테고리</th>
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600">상태</th>
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600">접수일</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {recentConsults.map(c => (
                                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-3 text-slate-700">{c.client}</td>
                                            <td className="py-3 px-3">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                        {c.category}
                                                    </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                    <span className={`px-2.5 py-1 rounded text-xs font-semibold
                                                        ${c.status === '상담중'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-yellow-50 text-yellow-700'
                                                    }
                                                    `}>
                                                        {c.status}
                                                    </span>
                                            </td>
                                            <td className="py-3 px-3 text-slate-600">{c.date}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 재판 일정 */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-base font-bold text-slate-900">재판 일정 관리</h3>
                                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                        전체 보기
                                    </button>
                                </div>
                                <CalendarWidget />
                            </div>
                        </div>

                        {/* 오른쪽 */}
                        <div>
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h3 className="text-base font-bold text-slate-900 mb-4">최근 의뢰인 후기</h3>
                                <div className="space-y-4">
                                    {recentReviews.map(r => (
                                        <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-900">{r.client}</span>
                                                <div className="flex">
                                                    {[...Array(r.rating)].map((_, i) => (
                                                        <span key={i} className="text-amber-500 text-sm">★</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{r.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*{showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}*/}
        </div>
    );
}