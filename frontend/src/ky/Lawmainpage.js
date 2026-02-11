import React, { useState } from 'react';
import './Lawmainpage.css';
// import PaymentModal from './PaymentModal';

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
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'new-consult', label: '새로운 상담', icon: '✍️', sub: ['1:1 채팅 목록', '전체 보기'] },
    { id: 'my-cases', label: '나의 법률 데이터', icon: '📋' },
    { id: 'ai-chat', label: 'AI 채팅 관리', icon: '🤖' },
    { id: 'trial', label: '재판 일정 관리', icon: '📅' },
    { id: 'profile', label: '프로필 관리', icon: '👤' },
    { id: 'review', label: '리뷰 및 평점', icon: '⭐' },
    { id: 'subscription', label: '구독 신청/해지', icon: '💳' },
];

function StarRating({ rating }) {
    return (
        <div className="lw-stars">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#d1d5db', fontSize: '1rem' }}>★</span>
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
        <div className="lw-calendar">
            <div className="lw-cal-header">
                <button className="lw-cal-nav">‹</button>
                <span className="lw-cal-title">2026년 1월</span>
                <button className="lw-cal-nav">›</button>
            </div>
            <div className="lw-cal-days">
                {days.map(d => <span key={d} className="lw-cal-day-label">{d}</span>)}
            </div>
            {weeks.map((week, wi) => (
                <div key={wi} className="lw-cal-week">
                    {week.map((day, di) => (
                        <div key={di} className={`lw-cal-cell ${day && eventDays.includes(day) ? 'has-event' : ''} ${!day ? 'empty' : ''}`}>
                            {day}
                            {day && eventDays.includes(day) && <div className="lw-cal-dot" />}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function Lawmainpage() {
    const [activePage, setActivePage] = useState('dashboard');
    const [showPayment, setShowPayment] = useState(false);
    const [notifications] = useState(3);
    const { lawyer, recentConsults, recentReviews } = mockData;

    return (
        <div className="lw-root">
            <aside className="lw-sidebar">
                <div className="lw-sidebar-logo">사이트 명</div>
                <nav className="lw-sidebar-nav">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            className={`lw-menu-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => item.id === 'subscription' ? setShowPayment(true) : setActivePage(item.id)}
                        >
                            <span className="lw-menu-icon">{item.icon}</span>
                            <span className="lw-menu-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="lw-sidebar-footer">
                    <div className="lw-sidebar-user">
                        <div className="lw-sidebar-avatar">김</div>
                        <span className="lw-sidebar-username">김구역 변호사</span>
                    </div>
                </div>
            </aside>

            <div className="lw-main">
                <header className="lw-header">
                    <h2 className="lw-header-title">대시보드</h2>
                    <div className="lw-header-right">
                        <button className="lw-notif-btn">
                            🔔
                            {notifications > 0 && <span className="lw-notif-badge">{notifications}</span>}
                        </button>
                        <button className="lw-mypage-btn">마이페이지</button>
                        <button className="lw-logout-btn">로그아웃</button>
                    </div>
                </header>

                <div className="lw-content">
                    <div className="lw-welcome">
                        <h1 className="lw-welcome-title">안녕하세요, {lawyer.name} 변호사님!</h1>
                        <p className="lw-welcome-sub">
                            현재 처리해야 할 긴급 상담 건이 <strong>0건</strong> 있습니다.
                        </p>
                    </div>

                    <div className="lw-stats-row">
                        <div className="lw-stat-card">
                            <div className="lw-stat-label">해결한 사건</div>
                            <div className="lw-stat-sub">해결한 사건 수</div>
                            <div className="lw-stat-num">{lawyer.solvedCases}건</div>
                        </div>
                        <div className="lw-stat-card">
                            <div className="lw-stat-label">상담 요청 건수</div>
                            <div className="lw-stat-sub">요청한 건수</div>
                            <div className="lw-stat-num">{lawyer.pendingConsults}건</div>
                        </div>
                        <div className="lw-stat-card highlight">
                            <div className="lw-stat-label">평점</div>
                            <div className="lw-stat-sub">리뷰 평점</div>
                            <div className="lw-stat-num">{lawyer.rating} <span className="lw-stat-max">/ 5.0</span></div>
                            <StarRating rating={Math.round(lawyer.rating)} />
                        </div>
                    </div>

                    <div className="lw-bottom-grid">
                        <div className="lw-left-col">
                            <div className="lw-card">
                                <div className="lw-card-header">
                                    <h3 className="lw-card-title">최근 상담 요청 현황</h3>
                                    <button className="lw-link-btn">전체 보기</button>
                                </div>
                                <table className="lw-table">
                                    <thead>
                                    <tr>
                                        <th>상담자</th>
                                        <th>카테고리</th>
                                        <th>상태</th>
                                        <th>접수일 날짜</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {recentConsults.map(c => (
                                        <tr key={c.id}>
                                            <td>{c.client}</td>
                                            <td><span className="lw-category-badge">{c.category}</span></td>
                                            <td><span className={`lw-status-badge ${c.status === '상담중' ? 'active' : 'pending'}`}>{c.status}</span></td>
                                            <td>{c.date}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="lw-card">
                                <div className="lw-card-header">
                                    <h3 className="lw-card-title">재판 일정 관리</h3>
                                    <button className="lw-link-btn">전체 보기</button>
                                </div>
                                <CalendarWidget />
                            </div>
                        </div>

                        <div className="lw-right-col">
                            <div className="lw-card">
                                <div className="lw-card-header">
                                    <h3 className="lw-card-title">최근 의뢰인 후기</h3>
                                </div>
                                <div className="lw-reviews">
                                    {recentReviews.map(r => (
                                        <div key={r.id} className="lw-review-item">
                                            <div className="lw-review-top">
                                                <span className="lw-review-name">{r.client}</span>
                                                <StarRating rating={r.rating} />
                                            </div>
                                            <p className="lw-review-text">{r.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

           {/*{*{showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}*!/*/}

        </div>
    );
}