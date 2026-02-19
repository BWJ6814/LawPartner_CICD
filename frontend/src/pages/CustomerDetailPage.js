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

function getStatusBadgeStyle(status) {
    const s = String(status || "").trim();

    let bg = "rgba(245, 158, 11, 0.18)";
    let bd = "rgba(245, 158, 11, 0.35)";
    let tx = "#fbbf24";

    if (s.includes("완료") || s.toLowerCase().includes("answered")) {
        bg = "rgba(34, 197, 94, 0.16)";
        bd = "rgba(34, 197, 94, 0.34)";
        tx = "#4ade80";
    } else if (s.includes("반려") || s.includes("거절") || s.toLowerCase().includes("rejected")) {
        bg = "rgba(239, 68, 68, 0.16)";
        bd = "rgba(239, 68, 68, 0.34)";
        tx = "#f87171";
    } else if (s.includes("진행") || s.toLowerCase().includes("progress")) {
        bg = "rgba(59, 130, 246, 0.16)";
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

    function handleDelete() {
        if (!item) return;
        const ok = window.confirm("정말 삭제하시겠습니까?");
        if (!ok) return;

        const list = loadInquiries();
        const updated = list.filter((x) => x.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        alert("삭제되었습니다.");
        navigate("/customer/list");
    }

    function handleEdit() {
        navigate(`/customer/edit/${id}`);
    }

    return (
        <main style={page}>
            <div style={container}>
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
                        <h1 style={pageTitle}>문의 상세</h1>

                        <div style={subject}>{item.title}</div>

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

                        <div style={divider} />

                        <div style={sectionHeader}>
                            <div style={sectionTitle}>문의 내용</div>
                        </div>

                        <div style={contentBox}>{item.content}</div>

                        <div style={footerRow}>
                            <button style={btnDanger} onClick={handleDelete}>
                                삭제
                            </button>

                            <button style={btnPrimaryAction} onClick={handleEdit}>
                                수정
                            </button>

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
   Styles
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
    marginBottom: 14,
};

const subject = {
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 1.15,
    marginBottom: 16,
};

const metaRow = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
};

const badge = {
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
};

const metaDot = {
    opacity: 0.4,
};

const metaText = {
    display: "inline-flex",
    gap: 8,
    fontSize: 14,
};

const metaKey = {
    opacity: 0.75,
};

const metaValue = {
    fontWeight: 800,
};

const divider = {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    marginTop: 22,
    marginBottom: 22,
};

const sectionHeader = {
    marginBottom: 12,
};

const sectionTitle = {
    fontSize: 18,
    fontWeight: 900,
};

const contentBox = {
    background: "#0b1224",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 26,
    lineHeight: 1.9,
    whiteSpace: "pre-wrap",
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
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    marginLeft: 10,
};

const btnDanger = {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(239,68,68,0.5)",
    background: "rgba(239,68,68,0.15)",
    color: "#f87171",
    fontWeight: 800,
    cursor: "pointer",
    marginRight: 10,
};

const btnPrimaryAction = {
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    marginRight: 10,
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
