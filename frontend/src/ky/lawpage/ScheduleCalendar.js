import { useState } from "react";

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";
const BLUE = "#1D4ED8";
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// 날짜를 "YYYY-MM-DD" 형식으로 변환
function toKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// 대시보드용 미니 캘린더
export function Calendar({ schedules, onDayClick }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

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
                    const isToday = d && year === todayY && month === todayM && d === todayD;
                    const key = d ? toKey(year, month, d) : null;
                    const hasSchedule = key && schedules[key] && schedules[key].length > 0;

                    return (
                        <div key={i}
                             onClick={() => d && onDayClick && onDayClick(year, month, d)}
                             style={{
                                 padding: "4px 0",
                                 borderRadius: 6,
                                 color: !d ? "transparent" : isToday ? "#fff" : isSun ? "#ef4444" : isSat ? BLUE : "#374151",
                                 background: isToday ? BLUE : "transparent",
                                 fontWeight: isToday ? 800 : d ? 500 : 400,
                                 cursor: d ? "pointer" : "default",
                                 position: "relative",
                             }}>
                            {d || ""}
                            {hasSchedule && (
                                <div style={{
                                    position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)",
                                    width: 4, height: 4, borderRadius: "50%",
                                    background: isToday ? "#fff" : "#f97316",
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 일정 관리 모달
export function ScheduleModal({ isOpen, onClose, schedules, setSchedules }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [selectedDate, setSelectedDate] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [newTime, setNewTime] = useState("10:00");
    const [memos, setMemos] = useState([""]);

    if (!isOpen) return null;

    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const monthName = `${year}년 ${month + 1}월`;

    const selectedKey = selectedDate ? toKey(year, month, selectedDate) : null;
    const selectedSchedules = selectedKey && schedules[selectedKey] ? schedules[selectedKey] : [];

    const handleMemoChange = (idx, value) => {
        const updated = [...memos];
        updated[idx] = value;
        setMemos(updated);
    };

    const addMemoField = () => {
        setMemos([...memos, ""]);
    };

    const removeMemoField = (idx) => {
        if (memos.length <= 1) return;
        setMemos(memos.filter((_, i) => i !== idx));
    };

    const handleAdd = () => {
        if (!newTitle.trim() || !selectedKey) return;
        const updated = { ...schedules };
        if (!updated[selectedKey]) updated[selectedKey] = [];
        const filteredMemos = memos.map(m => m.trim()).filter(m => m);
        updated[selectedKey] = [...updated[selectedKey], { title: newTitle, time: newTime, memos: filteredMemos }];
        setSchedules(updated);
        setNewTitle("");
        setNewTime("10:00");
        setMemos([""]);
    };

    const handleDelete = (idx) => {
        const updated = { ...schedules };
        updated[selectedKey] = updated[selectedKey].filter((_, i) => i !== idx);
        if (updated[selectedKey].length === 0) delete updated[selectedKey];
        setSchedules(updated);
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: FONT,
        }}>
            <div style={{
                background: "#fff", borderRadius: 16, width: 720, maxHeight: "85vh",
                overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}>
                {/* 헤더 */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 24px", borderBottom: "1px solid #f3f4f6",
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>재판 일정 관리</h2>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af",
                    }}>✕</button>
                </div>

                <div style={{ display: "flex", height: "calc(85vh - 60px)" }}>
                    {/* 왼쪽: 캘린더 */}
                    <div style={{ width: 320, padding: 20, borderRight: "1px solid #f3f4f6", overflowY: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }}>‹</button>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{monthName}</span>
                            <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }}>›</button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: 2 }}>
                            {DAYS.map((d, i) => (
                                <div key={d} style={{ fontWeight: 700, fontSize: 11, color: i === 0 ? "#ef4444" : i === 6 ? BLUE : "#9ca3af", padding: "6px 0" }}>{d}</div>
                            ))}
                            {cells.map((d, i) => {
                                const col = i % 7;
                                const isSun = col === 0;
                                const isSat = col === 6;
                                const isToday = d && year === todayY && month === todayM && d === todayD;
                                const isSelected = d === selectedDate;
                                const key = d ? toKey(year, month, d) : null;
                                const hasSchedule = key && schedules[key] && schedules[key].length > 0;

                                return (
                                    <div key={i}
                                         onClick={() => d && setSelectedDate(d)}
                                         style={{
                                             padding: "6px 0",
                                             borderRadius: 8,
                                             color: !d ? "transparent" : isSelected ? "#fff" : isToday ? BLUE : isSun ? "#ef4444" : isSat ? BLUE : "#374151",
                                             background: isSelected ? BLUE : isToday ? "#EEF2FF" : "transparent",
                                             fontWeight: isToday || isSelected ? 800 : 500,
                                             cursor: d ? "pointer" : "default",
                                             position: "relative",
                                             transition: "all 0.15s",
                                         }}>
                                        {d || ""}
                                        {hasSchedule && (
                                            <div style={{
                                                position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                                                width: 4, height: 4, borderRadius: "50%",
                                                background: isSelected ? "#fff" : "#f97316",
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 이번 달 일정 요약 */}
                        <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
                            <div style={{ fontWeight: 700, color: "#111827", marginBottom: 6 }}>이번 달 일정</div>
                            {Object.entries(schedules)
                                .filter(([key]) => key.startsWith(toKey(year, month, 1).slice(0, 7)))
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, items]) => (
                                    items.map((item, idx) => (
                                        <div key={`${key}-${idx}`} style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "6px 0", borderBottom: "1px solid #f9fafb",
                                        }}>
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: BLUE, flexShrink: 0 }} />
                                            <span style={{ color: "#374151", fontWeight: 600 }}>{key.slice(8)}일</span>
                                            <span style={{ color: "#6b7280" }}>{item.time} {item.title}</span>
                                        </div>
                                    ))
                                ))
                            }
                            {!Object.keys(schedules).some(k => k.startsWith(toKey(year, month, 1).slice(0, 7))) && (
                                <div style={{ color: "#9ca3af", padding: "8px 0" }}>등록된 일정이 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 일정 입력/목록 */}
                    <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
                        {selectedDate ? (
                            <>
                                <div style={{ marginBottom: 16 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                                        {month + 1}월 {selectedDate}일 일정
                                    </h3>
                                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
                                        {DAYS[new Date(year, month, selectedDate).getDay()]}요일
                                    </p>
                                </div>

                                {/* 기존 일정 목록 */}
                                {selectedSchedules.length > 0 ? (
                                    <div style={{ marginBottom: 20 }}>
                                        {selectedSchedules.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "12px 14px", marginBottom: 8, borderRadius: 10,
                                                background: "#F9FAFB", border: "1px solid #f3f4f6",
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{item.title}</div>
                                                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.time}</div>
                                                    {item.memos && item.memos.length > 0 && (
                                                        <div style={{ marginTop: 6 }}>
                                                            {item.memos.map((m, mi) => (
                                                                <div key={mi} style={{
                                                                    fontSize: 12, color: "#4b5563", padding: "3px 0",
                                                                    display: "flex", alignItems: "center", gap: 6,
                                                                }}>
                                                                    <span style={{ color: BLUE, fontSize: 8 }}>●</span> {m}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.memo && !item.memos && (
                                                        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>| {item.memo}</div>
                                                    )}
                                                </div>
                                                <button onClick={() => handleDelete(idx)} style={{
                                                    background: "none", border: "none", cursor: "pointer",
                                                    color: "#ef4444", fontSize: 13, fontWeight: 700,
                                                }}>삭제</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: "24px 0", textAlign: "center",
                                        color: "#9ca3af", fontSize: 13, marginBottom: 20,
                                    }}>
                                        등록된 일정이 없습니다.
                                    </div>
                                )}

                                {/* 새 일정 입력 */}
                                <div style={{
                                    padding: 16, borderRadius: 12, background: "#F9FAFB",
                                    border: "1px solid #f3f4f6",
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>새 일정 추가</div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>제목 *</label>
                                        <input
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="예: 서울중앙지법 제3호 법정"
                                            style={{
                                                width: "100%", padding: "8px 12px", borderRadius: 8,
                                                border: "1px solid #e5e7eb", fontSize: 13, fontFamily: FONT,
                                                boxSizing: "border-box", outline: "none",
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = BLUE}
                                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>시간</label>
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            style={{
                                                width: "100%", padding: "8px 12px", borderRadius: 8,
                                                border: "1px solid #e5e7eb", fontSize: 13, fontFamily: FONT,
                                                boxSizing: "border-box", outline: "none",
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = BLUE}
                                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>메모</label>
                                            <button onClick={addMemoField} style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                fontSize: 12, fontWeight: 700, color: BLUE, fontFamily: FONT,
                                            }}>+ 메모 추가</button>
                                        </div>
                                        {memos.map((memo, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                                <input
                                                    value={memo}
                                                    onChange={(e) => handleMemoChange(idx, e.target.value)}
                                                    placeholder={idx === 0 ? "예: 홍길동 교통사고 건" : "추가 메모 입력"}
                                                    style={{
                                                        flex: 1, padding: "8px 12px", borderRadius: 8,
                                                        border: "1px solid #e5e7eb", fontSize: 13, fontFamily: FONT,
                                                        boxSizing: "border-box", outline: "none",
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = BLUE}
                                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                                />
                                                {memos.length > 1 && (
                                                    <button onClick={() => removeMemoField(idx)} style={{
                                                        background: "none", border: "1px solid #e5e7eb", borderRadius: 8,
                                                        cursor: "pointer", color: "#ef4444", fontSize: 14,
                                                        width: 34, flexShrink: 0, fontFamily: FONT,
                                                    }}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handleAdd} style={{
                                        width: "100%", padding: "10px 0", borderRadius: 8,
                                        background: BLUE, color: "#fff", border: "none",
                                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        fontFamily: FONT,
                                    }}>
                                        일정 추가
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                height: "100%", color: "#9ca3af", fontSize: 14, textAlign: "center",
                            }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                                <div style={{ fontWeight: 600 }}>날짜를 선택해주세요</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>캘린더에서 날짜를 클릭하면 일정을 추가할 수 있습니다.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
