import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const STORAGE_KEY = "customer_inquiries";

function loadInquiries() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function formatDateTime(iso) {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

// 상태값이 지금 "대기"로만 들어오지만, 나중에 확장해도 깨지지 않게 매핑
function getStatusBadgeStyle(status) {
    const s = String(status || "").trim();

    // 기본값
    let bg = "rgba(245, 158, 11, 0.18)"; // amber
    let bd = "rgba(245, 158, 11, 0.35)";
    let tx = "#fbbf24";

    if (s.includes("완료") || s.toLowerCase().includes("answered")) {
        bg = "rgba(34, 197, 94, 0.16)";  // green
        bd = "rgba(34, 197, 94, 0.34)";
        tx = "#4ade80";
    } else if (s.includes("반려") || s.includes("거절") || s.toLowerCase().includes("rejected")) {
        bg = "rgba(239, 68, 68, 0.16)";  // red
        bd = "rgba(239, 68, 68, 0.34)";
        tx = "#f87171";
    } else if (s.includes("진행") || s.toLowerCase().includes("progress")) {
        bg = "rgba(59, 130, 246, 0.16)"; // blue
        bd = "rgba(59, 130, 246, 0.34)";
        tx = "#60a5fa";
    }

    return {
        ...badge,
        background: bg,
        border: `1px solid ${bd}`,
        color: tx,
    };
}

export default function CustomerDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const item = useMemo(() => {
        const list = loadInquiries();
        return list.find((x) => x.id === id);
    }, [id]);

    return (
        <main style={page}>
            <div style={container}>
                {/* 상단 네비 (버튼처럼 보이지 않게) */}
                <div style={backRow}>
          <span style={backLink} onClick={() => navigate("/customer/list")}>
            ← 문의 목록
          </span>
                </div>

                {!item ? (
                    <section style={panel}>
                        <h1 style={pageTitle}>문의 상세</h1>
                        <div style={emptyState}>
                            <div style={emptyTitle}>해당 문의를 찾을 수 없습니다.</div>
                            <div style={emptyDesc}>목록으로 돌아가서 다른 문의를 선택해주세요.</div>
                            <div style={{ marginTop: 18 }}>
                                <button style={btnPrimary} onClick={() => navigate("/customer/list")}>
                                    목록으로 이동
                                </button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section style={panel}>
                        {/* 페이지 타이틀 */}
                        <h1 style={pageTitle}>문의 상세</h1>

                        {/* 제목 (가장 큰 위계) */}
                        <div style={subject}>{item.title}</div>

                        {/* 메타라인: 상태 배지 + 유형 + 작성일 */}
                        <div style={metaRow}>
                            <span style={getStatusBadgeStyle(item.status)}>{item.status}</span>

                            <span style={metaDot}>•</span>

                            <span style={metaText}>
                <span style={metaKey}>유형</span>
                <span style={metaValue}>{item.type}</span>
              </span>

                            <span style={metaDot}>•</span>

                            <span style={metaText}>
                <span style={metaKey}>작성일</span>
                <span style={metaValue}>{formatDateTime(item.createdAt)}</span>
              </span>
                        </div>

                        {/* 구분선 */}
                        <div style={divider} />

                        {/* 본문 */}
                        <div style={sectionHeader}>
                            <div style={sectionTitle}>문의 내용</div>
                        </div>

                        <div style={contentBox}>{item.content}</div>

                        {/* 하단 네비: 버튼 느낌 줄이고 가벼운 액션만 */}
                        <div style={footerRow}>
                            <button style={btnGhost} onClick={() => navigate("/customer/list")}>
                                목록으로
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

/* =========================
   Styles (서비스형 위계)
========================= */

const page = {
    minHeight: "100vh",
    background: "#0f172a",
    paddingTop: "130px",
    paddingBottom: "120px",
    paddingLeft: 24,
    paddingRight: 24,
};

const container = {
    maxWidth: 1040,
    margin: "0 auto",
};

const backRow = {
    marginBottom: 14,
};

const backLink = {
    display: "inline-block",
    cursor: "pointer",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
};

const panel = {
    background: "#111c34",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 40,
    boxShadow: "0 12px 50px rgba(0,0,0,0.35)",
    color: "#fff",
};

const pageTitle = {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: "-0.3px",
    margin: 0,
    marginBottom: 14,
    color: "rgba(255,255,255,0.9)",
};

const subject = {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.6px",
    lineHeight: 1.15,
    marginBottom: 16,
};

const metaRow = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    color: "rgba(255,255,255,0.75)",
};

const badge = {
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "-0.2px",
};

const metaDot = {
    opacity: 0.4,
};

const metaText = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
};

const metaKey = {
    opacity: 0.75,
};

const metaValue = {
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
};

const divider = {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    marginTop: 22,
    marginBottom: 22,
};

const sectionHeader = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
};

const sectionTitle = {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-0.3px",
};

const contentBox = {
    background: "#0b1224",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 26,
    lineHeight: 1.9,
    fontSize: 15,
    whiteSpace: "pre-wrap",
    color: "rgba(255,255,255,0.92)",
};

const footerRow = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 22,
};

const btnPrimary = {
    padding: "14px 18px",
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
};

const btnGhost = {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 800,
    cursor: "pointer",
};

const emptyState = {
    padding: "34px 0 10px",
    textAlign: "center",
};

const emptyTitle = {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 8,
};

const emptyDesc = {
    fontSize: 14,
    opacity: 0.7,
};
