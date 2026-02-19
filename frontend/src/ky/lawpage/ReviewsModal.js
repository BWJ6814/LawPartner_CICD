import { useState } from "react";

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";
const BLUE = "#1D4ED8";

function Stars({ count }) {
    return (
        <span style={{ color: "#facc15", fontSize: 14 }}>
            {"★".repeat(count)}{"☆".repeat(5 - count)}
        </span>
    );
}
//데이터 구조(name, stars, text, date, category)만 맞추면 작동
export { Stars };

export default function ReviewsModal({ isOpen, onClose, reviews }) {
    const [filter, setFilter] = useState("all");

    if (!isOpen) return null;

    const filteredReviews = filter === "all"
        ? reviews
        : reviews.filter(r => r.stars === Number(filter));

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
        : "0.0";

    const starCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.stars === star).length,
    }));

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: FONT,
        }}>
            <div style={{
                background: "#fff", borderRadius: 16, width: 640, maxHeight: "85vh",
                overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}>
                {/* 헤더 */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 24px", borderBottom: "1px solid #f3f4f6",
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>의뢰인 후기</h2>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af",
                    }}>✕</button>
                </div>

                <div style={{ padding: 24, overflowY: "auto", maxHeight: "calc(85vh - 60px)" }}>
                    {/* 평점 요약 */}
                    <div style={{
                        display: "flex", gap: 24, padding: 20, borderRadius: 12,
                        background: "#F9FAFB", marginBottom: 20,
                    }}>
                        <div style={{ textAlign: "center", minWidth: 100 }}>
                            <div style={{ fontSize: 40, fontWeight: 800, color: "#111827" }}>{avgRating}</div>
                            <Stars count={Math.round(Number(avgRating))} />
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>총 {reviews.length}개 후기</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            {starCounts.map(({ star, count }) => (
                                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", width: 20 }}>{star}점</span>
                                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e7eb" }}>
                                        <div style={{
                                            height: "100%", borderRadius: 4, background: "#facc15",
                                            width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%",
                                            transition: "width 0.3s",
                                        }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: "#9ca3af", width: 24, textAlign: "right" }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 필터 */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {["all", "5", "4", "3", "2", "1"].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                border: "none", cursor: "pointer", fontFamily: FONT,
                                background: filter === f ? BLUE : "#f3f4f6",
                                color: filter === f ? "#fff" : "#6b7280",
                                transition: "all 0.2s",
                            }}>
                                {f === "all" ? "전체" : `${f}점`}
                            </button>
                        ))}
                    </div>

                    {/* 후기 목록 */}
                    {filteredReviews.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {filteredReviews.map((r, i) => (
                                <div key={i} style={{
                                    padding: 16, borderRadius: 12, background: "#F9FAFB",
                                    border: "1px solid #f3f4f6",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: "50%", background: BLUE,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff", fontWeight: 700, fontSize: 14,
                                            }}>
                                                {r.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{r.name}</div>
                                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.date || ""}</div>
                                            </div>
                                        </div>
                                        <Stars count={r.stars} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: "#4b5563", lineHeight: 1.7 }}>{r.text}</p>
                                    {r.category && (
                                        <span style={{
                                            display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600,
                                            padding: "3px 10px", borderRadius: 12, background: "#EEF2FF", color: BLUE,
                                        }}>{r.category}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
                            해당 조건의 후기가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
