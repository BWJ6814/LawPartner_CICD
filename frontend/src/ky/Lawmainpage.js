import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from './lawpage/Sidebar';
import { Calendar, ScheduleModal } from './modal/ScheduleCalendar';
import ReviewsModal, { Stars } from './modal/ReviewsModal';
import api from '../common/api/axiosConfig';

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";
const BLUE = "#1D4ED8";

const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
};

// 진행 상태코드 → 색상
function statusColor(code) {
    if (code === "ST04" || code === "ST03") return BLUE;
    if (code === "ST05") return "#10b981";
    return "#f97316";
}

export default function LawyerDashboard() {
    const [isSidebarCollapsed,  setIsSidebarCollapsed]  = useState(
        () => localStorage.getItem('lawyerSidebarCollapsed') === 'true'
    );
    const [isScheduleModalOpen,    setIsScheduleModalOpen]    = useState(false);
    const [calendarInitDate,       setCalendarInitDate]       = useState(null);
    const [isReviewsModalOpen,     setIsReviewsModalOpen]     = useState(false);
    const [isClosedCasesModalOpen, setIsClosedCasesModalOpen] = useState(false);
    const [reviewPage,    setReviewPage]    = useState(0);
    const [consultPage,   setConsultPage]   = useState(0);
    const [closedPage,    setClosedPage]    = useState(0);
    const [closedSearch,  setClosedSearch]  = useState('');
    const [closedFilter,  setClosedFilter]  = useState('ALL');
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editingClosedRoomId, setEditingClosedRoomId] = useState(null);

    // ── API 상태 ──
    const [stats,          setStats]          = useState({ solvedCount: 0, requestCount: 0, avgRating: 0.0 });
    const [consultations,  setConsultations]  = useState([]);
    const [reviews,        setReviews]        = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);

    const fetchCalendar = () => {
        api.get('/api/lawyer/dashboard/calendars')
            .then(res => setCalendarEvents(res.data.data || []))
            .catch(() => {});
    };

    const fetchConsultations = () => {
        api.get('/api/lawyer/dashboard/consultations')
            .then(res => setConsultations(res.data.data || []))
            .catch(() => {});
    };

    useEffect(() => {
        api.get('/api/lawyer/dashboard/stats')
            .then(res => setStats(res.data.data))
            .catch(() => {});

        fetchConsultations();

        api.get('/api/lawyer/dashboard/reviews')
            .then(res => setReviews(res.data.data || []))
            .catch(() => {});

        fetchCalendar();
    }, []);

    // 채팅 읽고 돌아왔을 때 unreadCount 갱신
    useEffect(() => {
        const onFocus = () => fetchConsultations();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const statCards = [
        { label: "상담 종료",     sub: "종료된 상담 ", value: `${stats.solvedCount}건`,  color: BLUE,      filter: 'ST05' },
        { label: "전체 상담 요청 건수", sub: "전체 요청 상담 ", value: `${stats.requestCount}건`, color: "#f97316", filter: 'ALL'  },
    ];

    const handleAccept = (roomId) => {
        api.put(`/api/chat/room/accept/${roomId}`)
            .then(() => {
                setConsultations(prev => prev.map(c =>
                    c.roomId === roomId
                        ? { ...c, progressCode: 'ST02', statusLabel: '상담 진행' }
                        : c
                ));
            })
            .catch(() => alert('수락 처리 중 오류가 발생했습니다.'));
    };

    const navigate = useNavigate();
    const lawyerNm = localStorage.getItem('userNm') || '변호사';

    return (
        <div style={{ display: "flex", minHeight: "100%", fontFamily: FONT }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => {
                    const next = !isSidebarCollapsed;
                    setIsSidebarCollapsed(next);
                    localStorage.setItem('lawyerSidebarCollapsed', next);
                }}
            />

            <div style={{ flex: 1, background: "#F9FAFB", minWidth: 0, display: "flex", flexDirection: "column" }}>

                {/* ── 헤더 바 ── */}
                <div style={{
                    background: "#fff",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "20px 32px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                        안녕하세요, {lawyerNm} 변호사님
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 400, color: "#6b7280" }}>
                        현재 처리해야 할 상담 건이{" "}
                        <span style={{ color: BLUE, fontWeight: 700 }}>{stats.requestCount}건</span> 있습니다.
                    </p>
                </div>

                {/* ── 메인 콘텐츠 ── */}
                <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

                {/* ── 통계 카드 ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                    {statCards.map(s => (
                        <div
                            key={s.label}
                            onClick={() => { setClosedFilter(s.filter); setClosedPage(0); setClosedSearch(''); setIsClosedCasesModalOpen(true); }}
                            style={{ ...cardStyle, borderTop: `3px solid ${s.color}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)'}
                        >
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginBottom: 12 }}>{s.sub}</div>
                            <div style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>{s.value}</div>
                        </div>
                    ))}

                    {/* 평점 */}
                    <div
                        onClick={() => setIsReviewsModalOpen(true)}
                        style={{ ...cardStyle, borderTop: "3px solid #10b981", cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)'}
                    >
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>평점</div>
                        <div style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginBottom: 12 }}>리뷰 평점</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>
                            {Number(stats.avgRating).toFixed(1)}{" "}
                            <span style={{ fontSize: 16, fontWeight: 400, color: "#9ca3af" }}>/ 5.0</span>
                        </div>
                    </div>
                </div>

                {/* ── 메인 2열 ── */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

                    {/* 왼쪽 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* 상담 요청 현황 */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>최근 상담 요청 현황</span>
                                <span
                                    onClick={() => { setIsClosedCasesModalOpen(true); setClosedPage(0); setClosedSearch(''); }}
                                    style={{ fontSize: 12, fontWeight: 600, color: BLUE, cursor: "pointer" }}
                                >
                                    상담 전체 건수
                                </span>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: "#F9FAFB" }}>
                                        {["상담자", "진행 상태", "수락/대기", "접수된 날짜"].map(h => (
                                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 700, fontSize: 12 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultations.filter(c => c.progressCode !== 'ST05').length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: "20px 12px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                                                상담 내역이 없습니다.
                                            </td>
                                        </tr>
                                    ) : consultations.filter(c => c.progressCode !== 'ST05').slice(consultPage * 10, consultPage * 10 + 10).map((c, i) => (
                                        <tr
                                            key={i}
                                            onClick={() => {
                                                api.post(`/api/chat/room/${c.roomId}/read`).catch(() => {});
                                                setConsultations(prev => prev.map(r => r.roomId === c.roomId ? { ...r, unreadCount: 0 } : r));
                                                navigate(`/lawyer-chat/${c.roomId}`);
                                            }}
                                            style={{
                                                borderTop: "1px solid #f3f4f6",
                                                cursor: "pointer",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <td style={{ padding: "10px 12px", color: "#111827", fontWeight: 500 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    {c.clientNm}
                                                    {c.unreadCount > 0 && (
                                                        <span style={{
                                                            background: "#ef4444", color: "#fff",
                                                            borderRadius: 10, fontSize: 10, fontWeight: 700,
                                                            padding: "1px 6px", lineHeight: 1.6,
                                                        }}>
                                                            {c.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                                                {editingRoomId === c.roomId ? (
                                                    // 인라인 select
                                                    <select
                                                        autoFocus
                                                        defaultValue={c.progressCode}
                                                        onBlur={() => setEditingRoomId(null)}
                                                        onChange={e => {
                                                            const newCode = e.target.value;
                                                            api.patch(`/api/lawyer/dashboard/consultations/${c.roomId}/status`, { progressCode: newCode })
                                                                .then(() => {
                                                                    setConsultations(prev => prev.map(r =>
                                                                        r.roomId === c.roomId
                                                                            ? { ...r, progressCode: newCode, statusLabel: { ST01:"상담 대기", ST02:"상담 진행", ST05:"상담 종료" }[newCode] }
                                                                            : r
                                                                    ));
                                                                    setEditingRoomId(null);
                                                                })
                                                                .catch(() => setEditingRoomId(null));
                                                        }}
                                                        style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6, border: `1px solid ${BLUE}`, color: BLUE, fontWeight: 700, cursor: "pointer", outline: "none" }}
                                                    >
                                                        {[["ST01","상담 대기"],["ST02","상담 진행"],["ST05","상담 종료"]].map(([code, label]) => (
                                                            <option key={code} value={code}>{label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    // 배지 클릭 → 수정 모드
                                                    <span
                                                        onClick={() => setEditingRoomId(c.roomId)}
                                                        title="클릭하여 상태 변경"
                                                        style={{ color: statusColor(c.progressCode), fontWeight: 700, cursor: "pointer", borderBottom: `1px dashed ${statusColor(c.progressCode)}` }}
                                                    >
                                                        {c.statusLabel} ✎
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                                                {c.progressCode === 'ST01' && (
                                                    <button
                                                        onClick={() => handleAccept(c.roomId)}
                                                        style={{
                                                            background: "#10b981", color: "#fff", border: "none",
                                                            borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                            padding: "4px 10px", cursor: "pointer",
                                                        }}
                                                    >수락</button>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px 12px", color: "#9ca3af", fontWeight: 400 }}>{c.regDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {consultations.filter(c => c.progressCode !== 'ST05').length > 10 && (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14 }}>
                                    <button
                                        onClick={() => setConsultPage(p => Math.max(0, p - 1))}
                                        disabled={consultPage === 0}
                                        style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: consultPage === 0 ? "not-allowed" : "pointer", background: consultPage === 0 ? "#f9fafb" : "#fff", color: consultPage === 0 ? "#d1d5db" : "#374151" }}
                                    >‹</button>
                                    {Array.from({ length: Math.ceil(consultations.filter(c => c.progressCode !== 'ST05').length / 10) }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setConsultPage(i)}
                                            style={{ border: "1px solid", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", borderColor: consultPage === i ? BLUE : "#e5e7eb", background: consultPage === i ? BLUE : "#fff", color: consultPage === i ? "#fff" : "#374151", fontWeight: consultPage === i ? 700 : 400 }}
                                        >{i + 1}</button>
                                    ))}
                                    <button
                                        onClick={() => setConsultPage(p => Math.min(Math.ceil(consultations.filter(c => c.progressCode !== 'ST05').length / 10) - 1, p + 1))}
                                        disabled={consultPage >= Math.ceil(consultations.filter(c => c.progressCode !== 'ST05').length / 10) - 1}
                                        style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: consultPage >= Math.ceil(consultations.filter(c => c.progressCode !== 'ST05').length / 10) - 1 ? "not-allowed" : "pointer", background: consultPage >= Math.ceil(consultations.filter(c => c.progressCode !== 'ST05').length / 10) - 1 ? "#f9fafb" : "#fff", color: consultPage >= Math.ceil(consultations.filter(c => c.progressCode !== 'ST05').length / 10) - 1 ? "#d1d5db" : "#374151" }}
                                    >›</button>
                                </div>
                            )}
                        </div>

                        {/* 캘린더 */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>재판 일정 관리</span>
                                <span
                                    onClick={() => setIsScheduleModalOpen(true)}
                                    style={{ fontSize: 12, fontWeight: 600, color: BLUE, cursor: "pointer" }}
                                >전체 보기</span>
                            </div>
                            <Calendar
                                    events={calendarEvents}
                                    onDayClick={(y, m, d) => {
                                        setCalendarInitDate({ year: y, month: m, day: d });
                                        setIsScheduleModalOpen(true);
                                    }}
                                />
                        </div>
                    </div>

                    {/* 오른쪽 - 후기 */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
                                최근 의뢰인 후기
                                <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af", marginLeft: 6 }}>
                                    ({reviews.length}건)
                                </span>
                            </span>
                            <span onClick={() => setIsReviewsModalOpen(true)} style={{ fontSize: 12, fontWeight: 600, color: BLUE, cursor: "pointer" }}>전체 보기</span>
                        </div>

                        {/* 후기 목록 (5개씩) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {reviews.length === 0 ? (
                                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>
                                    후기가 없습니다.
                                </div>
                            ) : reviews.slice(reviewPage * 5, reviewPage * 5 + 5).map((r, i) => (
                                <div
                                    key={r.reviewNo ?? i}
                                    onClick={() => r.boardNo && navigate(`/consultation/${r.boardNo}`)}
                                    style={{
                                        padding: "10px 8px",
                                        borderBottom: "1px solid #f3f4f6",
                                        cursor: r.boardNo ? "pointer" : "default",
                                        borderRadius: 8,
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => { if (r.boardNo) e.currentTarget.style.background = "#f0f4ff"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{r.writerNm}</span>
                                        <Stars count={r.stars} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                        {r.content}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* 페이징 버튼 */}
                        {reviews.length > 5 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 }}>
                                <button
                                    onClick={() => setReviewPage(p => Math.max(0, p - 1))}
                                    disabled={reviewPage === 0}
                                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: reviewPage === 0 ? "not-allowed" : "pointer", background: reviewPage === 0 ? "#f9fafb" : "#fff", color: reviewPage === 0 ? "#d1d5db" : "#374151" }}
                                >
                                    ‹
                                </button>
                                {Array.from({ length: Math.ceil(reviews.length / 5) }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setReviewPage(i)}
                                        style={{ border: "1px solid", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", borderColor: reviewPage === i ? BLUE : "#e5e7eb", background: reviewPage === i ? BLUE : "#fff", color: reviewPage === i ? "#fff" : "#374151", fontWeight: reviewPage === i ? 700 : 400 }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setReviewPage(p => Math.min(Math.ceil(reviews.length / 5) - 1, p + 1))}
                                    disabled={reviewPage >= Math.ceil(reviews.length / 5) - 1}
                                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: reviewPage >= Math.ceil(reviews.length / 5) - 1 ? "not-allowed" : "pointer", background: reviewPage >= Math.ceil(reviews.length / 5) - 1 ? "#f9fafb" : "#fff", color: reviewPage >= Math.ceil(reviews.length / 5) - 1 ? "#d1d5db" : "#374151" }}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                </div>{/* 메인 콘텐츠 끝 */}
            </div>

            {/* 일정 모달 */}
            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => { setIsScheduleModalOpen(false); setCalendarInitDate(null); }}
                onRefresh={fetchCalendar}
                initialDate={calendarInitDate}
            />

            {/* 후기 모달 */}
            <ReviewsModal
                isOpen={isReviewsModalOpen}
                onClose={() => setIsReviewsModalOpen(false)}
                reviews={reviews}
            />

            {/* 상담종료된사건 모달 */}
            {isClosedCasesModalOpen && (() => {
                const closedList = consultations.filter(c => {
                    const matchFilter = closedFilter === 'ALL' || c.progressCode === closedFilter;
                    const matchSearch = (c.clientNm || '').toLowerCase().includes(closedSearch.toLowerCase());
                    return matchFilter && matchSearch;
                });
                const totalClosedPages = Math.ceil(closedList.length / 10) || 1;
                const pagedClosed = closedList.slice(closedPage * 10, closedPage * 10 + 10);
                return (
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}
                        onClick={() => setIsClosedCasesModalOpen(false)}
                    >
                        <div
                            style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 20px", width: 660, maxWidth: "90%", height: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 헤더 */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
                                <span style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>
                                    전체 상담
                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af", marginLeft: 8 }}>({closedList.length}건)</span>
                                </span>
                                <button onClick={() => setIsClosedCasesModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>×</button>
                            </div>

                            {/* 필터 탭 */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                                {[['ALL','전체'], ['ST01','접수대기'], ['ST02','상담중'], ['ST05','종료']].map(([code, label]) => (
                                    <button
                                        key={code}
                                        onClick={() => { setClosedFilter(code); setClosedPage(0); }}
                                        style={{
                                            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                            fontSize: 12, fontWeight: 700, fontFamily: FONT,
                                            background: closedFilter === code ? BLUE : '#f1f5f9',
                                            color: closedFilter === code ? '#fff' : '#64748b',
                                        }}
                                    >{label}</button>
                                ))}
                            </div>

                            {/* 검색 */}
                            <div style={{ marginBottom: 14 }}>
                                <input
                                    type="text"
                                    placeholder="의뢰인 이름으로 검색..."
                                    value={closedSearch}
                                    onChange={e => { setClosedSearch(e.target.value); setClosedPage(0); }}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: FONT }}
                                />
                            </div>

                            {/* 테이블 */}
                            <div style={{ overflowY: "auto", flex: 1 }}>
                                {pagedClosed.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "32px 0" }}>
                                        {closedSearch ? "검색 결과가 없습니다." : "상담 내역이 없습니다."}
                                    </div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ background: "#F9FAFB" }}>
                                                {["상담자", "진행 상태", "접수된 날짜"].map(h => (
                                                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "#6b7280", fontWeight: 700, fontSize: 12 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedClosed.map((c, i) => (
                                                <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                                                    <td style={{ padding: "10px 14px", color: "#111827", fontWeight: 500 }}>{c.clientNm}</td>
                                                    <td style={{ padding: "10px 14px" }}>
                                                        {editingClosedRoomId === c.roomId ? (
                                                            <select
                                                                autoFocus
                                                                defaultValue={c.progressCode}
                                                                onBlur={() => setEditingClosedRoomId(null)}
                                                                onChange={e => {
                                                                    const newCode = e.target.value;
                                                                    api.patch(`/api/lawyer/dashboard/consultations/${c.roomId}/status`, { progressCode: newCode })
                                                                        .then(() => {
                                                                            setConsultations(prev => prev.map(r =>
                                                                                r.roomId === c.roomId
                                                                                    ? { ...r, progressCode: newCode, statusLabel: { ST01: "상담 대기", ST02: "상담 진행", ST05: "상담 종료" }[newCode] }
                                                                                    : r
                                                                            ));
                                                                            setEditingClosedRoomId(null);
                                                                        })
                                                                        .catch(() => setEditingClosedRoomId(null));
                                                                }}
                                                                style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6, border: `1px solid ${BLUE}`, color: BLUE, fontWeight: 700, cursor: "pointer", outline: "none" }}
                                                            >
                                                                {[["ST01", "상담 대기"], ["ST02", "상담 진행"], ["ST05", "상담 종료"]].map(([code, label]) => (
                                                                    <option key={code} value={code}>{label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span
                                                                onClick={() => setEditingClosedRoomId(c.roomId)}
                                                                title="클릭하여 상태 변경"
                                                                style={{ color: statusColor(c.progressCode), fontWeight: 700, cursor: "pointer", borderBottom: `1px dashed ${statusColor(c.progressCode)}` }}
                                                            >
                                                                {c.statusLabel} ✎
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "10px 14px", color: "#9ca3af" }}>{c.regDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* 페이징 */}
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14, minHeight: 36, flexShrink: 0 }}>
                                <button
                                    onClick={() => setClosedPage(p => Math.max(0, p - 1))}
                                    disabled={closedPage === 0}
                                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: closedPage === 0 ? "not-allowed" : "pointer", background: closedPage === 0 ? "#f9fafb" : "#fff", color: closedPage === 0 ? "#d1d5db" : "#374151" }}
                                >‹</button>
                                {Array.from({ length: totalClosedPages }, (_, i) => (
                                    <button key={i} onClick={() => setClosedPage(i)}
                                        style={{ border: "1px solid", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", borderColor: closedPage === i ? BLUE : "#e5e7eb", background: closedPage === i ? BLUE : "#fff", color: closedPage === i ? "#fff" : "#374151", fontWeight: closedPage === i ? 700 : 400 }}
                                    >{i + 1}</button>
                                ))}
                                <button
                                    onClick={() => setClosedPage(p => Math.min(totalClosedPages - 1, p + 1))}
                                    disabled={closedPage >= totalClosedPages - 1}
                                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: closedPage >= totalClosedPages - 1 ? "not-allowed" : "pointer", background: closedPage >= totalClosedPages - 1 ? "#f9fafb" : "#fff", color: closedPage >= totalClosedPages - 1 ? "#d1d5db" : "#374151" }}
                                >›</button>
                            </div>

                            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
                                <button onClick={() => setIsClosedCasesModalOpen(false)} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>닫기</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
