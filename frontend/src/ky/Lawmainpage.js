import { useState } from "react";
import Sidebar from './lawpage/Sidebar';

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";
const BLUE = "#1D4ED8";

const stats = [
    { label: "해결한 사건", sub: "해결된 사건 수", value: "0건", color: BLUE },
    { label: "상담 요청 건수", sub: "요청원 건수", value: "0건", color: "#f97316" },
];

const consultations = [
    { name: "홍길동", category: "교통사고", status: "상담중", statusColor: "#f97316", date: "2026-02-03" },
    { name: "김길동", category: "교통사고", status: "소송 진행중", statusColor: BLUE, date: "2026-01-03" },
];

const reviews = [
    { name: "홍길동님", stars: 5, text: "어떻게 해결해야할지 모를 문제를 해결해주셨습니다. 정말 감사합니다." },
    { name: "최길동님", stars: 5, text: "정말 친절하시는데 변호사님 덕분에 쉽게 해결해서 놀라고 좋던데..." },
    { name: "김길동님", stars: 5, text: "정말 친절하시고 저희의 억울함을 풀어주시려고 열정적으로 하시는분 입니다..." },
];

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// 공통 카드 스타일
const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
};

function Calendar() {
    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(0);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const monthName = `${year}년 ${month + 1}월`;

    return (
        <div style={{ fontSize: 13, fontFamily: FONT }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>‹</button>
                <span style={{ fontWeight: 700, color: "#111827" }}>{monthName}</span>
                <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: 2 }}>
                {DAYS.map((d, i) => (
                    <div key={d} style={{ fontWeight: 700, fontSize: 11, color: i === 0 ? "#ef4444" : i === 6 ? BLUE : "#9ca3af", padding: "4px 0" }}>{d}</div>
                ))}
                {cells.map((d, i) => {
                    const col = i % 7;
                    const isSun = col === 0;
                    const isSat = col === 6;
                    return (
                        <div key={i} style={{
                            padding: "4px 0",
                            borderRadius: 6,
                            color: !d ? "transparent" : isSun ? "#ef4444" : isSat ? BLUE : "#374151",
                            fontWeight: d ? 500 : 400,
                            cursor: d ? "pointer" : "default",
                        }}>
                            {d || ""}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Stars({ count }) {
    return (
        <span style={{ color: "#facc15", fontSize: 14 }}>
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
    );
}

export default function LawyerDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: FONT }}>
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <div style={{
                flex: 1,
                background: "#F9FAFB",
                padding: "32px",
                boxSizing: "border-box",
                overflowY: "auto",
            }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                    안녕하세요, 김구역 변호사님!
                </h2>
                <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 400, color: "#6b7280" }}>
                    현재 처리해야 할 긴급 상담 건이 <span style={{ color: BLUE, fontWeight: 700 }}>0건</span> 있습니다.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                {stats.map((s) => (
                    <div key={s.label} style={{
                        ...cardStyle,
                        borderTop: `3px solid ${s.color}`,
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginBottom: 12 }}>{s.sub}</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>{s.value}</div>
                    </div>
                ))}

                {/* Rating */}
                <div style={{
                    ...cardStyle,
                    borderTop: "3px solid #10b981",
                }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>평점</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginBottom: 12 }}>리뷰 평점</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>4.5 <span style={{ fontSize: 16, fontWeight: 400, color: "#9ca3af" }}>/ 5.0</span></div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                {/* Left column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Consultation Table */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>최근 상담 요청 현황</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: BLUE, cursor: "pointer" }}>전체 보기</span>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                            <tr style={{ background: "#F9FAFB" }}>
                                {["상담자", "카테고리", "상태", "접수된 날짜"].map(h => (
                                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 700, fontSize: 12 }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {consultations.map((c, i) => (
                                <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "10px 12px", color: "#111827", fontWeight: 500 }}>{c.name}</td>
                                    <td style={{ padding: "10px 12px", color: BLUE, fontWeight: 600 }}>{c.category}</td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span style={{ color: c.statusColor, fontWeight: 700 }}>{c.status}</span>
                                    </td>
                                    <td style={{ padding: "10px 12px", color: "#9ca3af", fontWeight: 400 }}>{c.date}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Calendar */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>재판 일정 관리</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: BLUE, cursor: "pointer" }}>전체 보기</span>
                        </div>
                        <Calendar />
                    </div>
                </div>

                {/* Right column - Reviews */}
                <div style={cardStyle}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 16 }}>최근 의뢰인 후기</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {reviews.map((r, i) => (
                            <div key={i} style={{ paddingBottom: 16, borderBottom: i < reviews.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{r.name}</span>
                                    <Stars count={r.stars} />
                                </div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 400, color: "#6b7280", lineHeight: 1.6 }}>{r.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}
