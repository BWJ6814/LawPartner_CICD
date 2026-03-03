import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
    Gavel, Car, Home, Key,
    HandCoins, CircleDollarSign, Calculator,
    Scale, HeartCrack, Briefcase,
    Copyright,
    TrendingDown, FileText, MoreHorizontal, Sparkles
} from "lucide-react";

const NAVY = "#0f172a";

const CATEGORY_GRID = [
    { key: "ALL", label: "전체", icon: <Sparkles size={24} /> },
    { key: "형사", label: "형사", icon: <Gavel size={24} /> },
    { key: "교통사고", label: "교통사고", icon: <Car size={24} /> },
    { key: "부동산", label: "부동산", icon: <Home size={24} /> },
    { key: "임대차", label: "임대차", icon: <Key size={24} /> },
    { key: "손해배상", label: "손해배상", icon: <HandCoins size={24} /> },
    { key: "금전/채무", label: "금전/채무", icon: <CircleDollarSign size={24} /> },
    { key: "채권추심", label: "채권추심", icon: <Calculator size={24} /> },
    { key: "이혼/상속", label: "이혼/상속", icon: <HeartCrack size={24} /> },
    { key: "기업/노동", label: "기업/노동", icon: <Briefcase size={24} /> },
    { key: "행정", label: "행정", icon: <Scale size={24} /> },
    { key: "지식재산", label: "지식재산", icon: <Copyright size={24} /> },
    { key: "회생/파산", label: "회생/파산", icon: <TrendingDown size={24} /> },
    { key: "계약서 검토", label: "계약서 검토", icon: <FileText size={24} /> },
    { key: "기타", label: "기타", icon: <MoreHorizontal size={24} /> },
];

const CATEGORY_MAP = {
    형사: ["형사", "성범죄", "마약", "폭행", "사기", "보이스피싱", "구속영장", "형사합의", "명예훼손", "해킹"],
    교통사고: ["교통사고", "음주운전", "보험", "합의", "휴업손해", "벌점", "진단서"],
    부동산: ["부동산", "매매", "재개발", "분양", "등기", "명도"],
    임대차: ["임대차", "전세", "월세"],
    손해배상: ["손해배상", "위자료", "과실"],
    "금전/채무": ["채무", "대여금", "보증", "채무불이행", "대출"],
    채권추심: ["채권추심", "가압류", "가처분"],
    "이혼/상속": ["이혼", "상속", "재산분할", "양육권", "유류분", "상속세", "협의이혼"],
    "기업/노동": ["노동", "부당해고", "임금체불", "산재", "노동위원회", "취업규칙", "직장내괴롭힘"],
    행정: ["행정", "행정소송", "처분취소", "행정심판", "정보공개", "운전면허", "영업정지", "이의신청"],
    지식재산: ["특허", "저작권", "상표"],
    "회생/파산": ["회생", "파산", "개인회생"],
    "계약서 검토": ["계약서", "계약검토", "합의서", "내용증명"],
    기타: []
};

const SORTS = [
    { key: "RECOMMEND", label: "추천순" },
    { key: "RATING", label: "평점순" },
    { key: "REVIEWS", label: "후기순" },
    { key: "CAREER", label: "경력순" },
];

function containsKoreanInsensitive(haystack, needle) {
    if (!needle) return true;
    return (haystack || "").toLowerCase().includes(needle.toLowerCase());
}

function recommendScore(expert) {
    const rating = Number(expert.rating || 0);
    const reviews = Number(expert.reviewCount || 0);
    const responseRate = Number(expert.responseRate || 0);
    const logReviews = Math.log10(reviews + 1);
    return rating * 0.55 + logReviews * 0.30 + (responseRate / 100) * 0.15;
}

function splitTags(specialtyStr) {
    if (!specialtyStr) return [];
    return String(specialtyStr)
        .split(/[,/|]/g)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8);
}

function inferMainCategory(tags) {
    const tagSet = new Set((tags || []).map(t => String(t)));
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (cat === "기타") continue;
        const hit = (keywords || []).some(kw => {
            for (const t of tagSet) {
                if (t.includes(kw) || kw.includes(t)) return true;
            }
            return false;
        });
        if (hit) return cat;
    }
    return "기타";
}

function safeImage(url) {
    const u = (url || "").trim();
    if (u) return u;
    return "https://via.placeholder.com/160?text=LAWYER";
}

/** ✅ 응답이 어떤 형태든 "배열"만 뽑아내는 함수 */
function pickArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    // 흔한 래핑 키들 자동 대응
    const candidates = [payload.data, payload.result, payload.list, payload.content, payload.items];
    for (const c of candidates) {
        if (Array.isArray(c)) return c;
    }
    return [];
}

export default function ExpertsPage() {
    const recommendRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialCategory = searchParams.get("category") || "ALL";
    const initialRole = searchParams.get("role") || "LAWYER";

    const [selectedRole] = useState(initialRole);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [keyword, setKeyword] = useState(searchParams.get("q") || "");
    const [sortKey, setSortKey] = useState(searchParams.get("sort") || "RECOMMEND");

    const [experts, setExperts] = useState([]);
    const [loadMsg, setLoadMsg] = useState(""); // ✅ 실패/원인 1줄 표시

    const isLoggedIn = () => !!localStorage.getItem("accessToken");

    const syncParams = (next) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(next).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") params.delete(k);
            else params.set(k, String(v));
        });
        setSearchParams(params, { replace: true });
    };

    useEffect(() => {
        const fetchLawyers = async () => {
            setLoadMsg("");
            try {
                const res = await axios.get("http://localhost:8080/api/lawyers");
                const list = pickArray(res.data);

                // ✅ 여기서 0건이면 “진짜 0건”인지 “필터 때문에 0건”인지 바로 알 수 있게 메시지 표시
                if (!Array.isArray(list) || list.length === 0) {
                    setExperts([]);
                    setLoadMsg("서버 응답은 왔지만 목록이 0건입니다. (DB에 승인된 변호사 데이터가 없는 경우가 가장 흔함)");
                    return;
                }

                const mapped = list.map((x) => {
                    // ====== 키 이름이 다르면 여기만 바꾸면 됨 ======
                    const userNo = x.userNo ?? x.user_no ?? x.USER_NO;
                    const name = x.name ?? x.userNm ?? x.user_nm ?? x.USER_NM;
                    const specialtyStr = x.specialtyStr ?? x.specialty_str ?? x.SPECIALTY_STR;
                    const imgUrl = x.imgUrl ?? x.img_url ?? x.IMG_URL;
                    const officeName = x.officeName ?? x.office_name ?? x.OFFICE_NAME;
                    const officeAddr = x.officeAddr ?? x.office_addr ?? x.OFFICE_ADDR;
                    const introText = x.introText ?? x.intro_text ?? x.INTRO_TEXT;

                    const rating = Number(x.rating || 0);
                    const reviewCount = Number(x.reviewCount || 0);
                    const careerYears = Number(x.careerYears || 0);
                    const responseRate = Number(x.responseRate || 0);

                    const tags = splitTags(specialtyStr);
                    const mainCategory = inferMainCategory(tags);

                    return {
                        id: userNo,
                        role: "LAWYER",
                        name: name || "변호사",
                        mainCategory,
                        tags,
                        rating,
                        reviewCount,
                        careerYears,
                        responseRate,
                        image: safeImage(imgUrl),
                        officeName: officeName || "",
                        officeAddr: officeAddr || "",
                        introText: introText || "",
                    };
                });

                // id가 undefined면 렌더/라우팅이 다 망가짐 → 원인 표시
                const bad = mapped.filter(m => m.id === undefined || m.id === null);
                if (bad.length > 0) {
                    setLoadMsg("서버 데이터는 왔지만 id(userNo) 매핑이 실패했습니다. /api/lawyers 응답 키 이름이 다릅니다(위 매핑 키를 수정해야 함).");
                }

                setExperts(mapped);
            } catch (e) {
                console.error("Failed to fetch /api/lawyers", e);
                setExperts([]);
                setLoadMsg("API 호출 실패(CORS/포트/서버에러). F12 Console/Network에서 /api/lawyers 상태코드 확인 필요");
            }
        };

        fetchLawyers();
    }, []);

    const filtered = useMemo(() => {
        const roleFiltered = experts.filter((e) => e.role === selectedRole);

        const categoryFiltered =
            selectedCategory === "ALL"
                ? roleFiltered
                : roleFiltered.filter((e) => {
                    const keywords = CATEGORY_MAP[selectedCategory] || [];
                    const inMain = e.mainCategory === selectedCategory;
                    const inTags = e.tags?.some((tag) =>
                        keywords.some((kw) => String(tag).includes(kw))
                    );
                    return inMain || inTags;
                });

        const q = keyword.trim();
        if (!q) return categoryFiltered;

        return categoryFiltered.filter((e) => {
            const hay = [
                e.name,
                e.mainCategory,
                (e.tags || []).join(" "),
                `${e.careerYears || 0}년`,
            ].join(" ");
            return containsKoreanInsensitive(hay, q);
        });
    }, [experts, selectedRole, selectedCategory, keyword]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortKey) {
            case "RATING":
                arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case "REVIEWS":
                arr.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                break;
            case "CAREER":
                arr.sort((a, b) => (b.careerYears || 0) - (a.careerYears || 0));
                break;
            case "RECOMMEND":
            default:
                arr.sort((a, b) => recommendScore(b) - recommendScore(a));
                break;
        }
        return arr;
    }, [filtered, sortKey]);

    const topRecommended = useMemo(() => {
        const candidates = [...filtered].sort((a, b) => recommendScore(b) - recommendScore(a));
        return candidates.slice(0, 3);
    }, [filtered]);

    const handleCategoryClick = (catKey) => {
        setSelectedCategory(catKey);
        syncParams({ category: catKey });
        recommendRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleProfile = (id) => navigate(`/experts/${id}`);

    const handleConsult = (id) => {
        if (!isLoggedIn()) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }
        navigate(`/consultation?lawyerId=${id}`);
    };

    const resultLabel = useMemo(() => {
        const catLabel = selectedCategory === "ALL" ? "전체" : selectedCategory;
        const q = keyword.trim();
        if (q) return `${catLabel} · ‘${q}’ 결과 ${sorted.length}명`;
        return `${catLabel} 결과 ${sorted.length}명`;
    }, [selectedCategory, keyword, sorted.length]);

    return (
        <div className="max-w-7xl mx-auto py-14 px-4">
            {/* ✅ 로딩/오류 안내(1줄) */}
            {loadMsg && (
                <div className="mb-4 bg-white border border-red-200 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600">
                    {loadMsg}
                </div>
            )}

            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900">분야별 전문가 찾기</h2>
                <p className="mt-2 text-sm text-slate-500 font-semibold">
                    카테고리/키워드로 전문가를 찾아보세요
                </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3 mb-8">
                {CATEGORY_GRID.map((c) => {
                    const active = selectedCategory === c.key;
                    return (
                        <button
                            key={c.key}
                            onClick={() => handleCategoryClick(c.key)}
                            className={[
                                "bg-white rounded-xl border px-3 py-3 text-center shadow-sm transition",
                                active ? "border-slate-900 shadow-md" : "border-gray-200 hover:shadow-md hover:border-gray-300",
                            ].join(" ")}
                        >
                            <div className="text-lg mb-1">{c.icon}</div>
                            <div className="text-sm font-semibold">{c.label}</div>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center mb-8">
                <div className="flex-1">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                        <span className="text-slate-400">🔎</span>
                        <input
                            value={keyword}
                            onChange={(e) => {
                                const v = e.target.value;
                                setKeyword(v);
                                syncParams({ q: v });
                            }}
                            className="w-full outline-none text-slate-800 font-semibold placeholder:text-slate-400"
                            placeholder="이름 또는 분야(예: 음주운전, 부당해고)를 검색하세요"
                        />
                        {keyword.trim().length > 0 && (
                            <button
                                onClick={() => {
                                    setKeyword("");
                                    syncParams({ q: "" });
                                }}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                                aria-label="검색어 지우기"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between md:w-56">
                    <span className="text-sm font-bold text-slate-600">정렬</span>
                    <select
                        value={sortKey}
                        onChange={(e) => {
                            setSortKey(e.target.value);
                            syncParams({ sort: e.target.value });
                        }}
                        className="outline-none font-bold text-slate-800 bg-transparent"
                    >
                        {SORTS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div ref={recommendRef} className="mb-10">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">⭐ 추천 전문가</h3>
                        <p className="text-sm text-slate-500 font-semibold mt-1">
                            현재는 후기·평점 기반으로 추천합니다 (상담내용 기반 추천은 준비 중)
                        </p>
                    </div>
                    <div className="text-sm font-bold text-slate-500">{resultLabel}</div>
                </div>

                {topRecommended.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-slate-500 font-semibold">
                        추천할 전문가가 없습니다. (필터/검색 조건을 변경해보세요)
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        {topRecommended.map((e) => (
                            <div key={e.id} className="bg-white rounded-3xl shadow-lg p-7 border border-gray-100 hover:shadow-2xl transition">
                                <div className="flex items-center space-x-4 mb-5">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-gray-100 shadow cursor-pointer" onClick={() => handleProfile(e.id)}>
                                        <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`text-lg font-black text-slate-900 cursor-pointer hover:text-[${NAVY}] truncate`} onClick={() => handleProfile(e.id)}>
                                            {e.name} 변호사
                                        </h4>
                                        <p className="text-sm text-slate-500 font-semibold">
                                            전문분야: {e.mainCategory} · 경력 {e.careerYears || 0}년 · 응답률 {e.responseRate || 0}%
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center mb-5">
                                    <div className="text-yellow-400 mr-2 text-lg">★★★★★</div>
                                    <span className="font-bold text-slate-800 mr-2">{Number(e.rating || 0).toFixed(1)}</span>
                                    <span className="text-gray-400 text-sm">(후기 {e.reviewCount || 0}건)</span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {(e.tags || []).slice(0, 3).map((t) => (
                                        <span key={t} className="text-xs font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                      #{t}
                    </span>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => handleProfile(e.id)} className={`flex-1 border border-[${NAVY}] text-[${NAVY}] py-3 rounded-xl font-bold hover:bg-gray-100 transition`}>
                                        프로필 보기
                                    </button>
                                    <button onClick={() => handleConsult(e.id)} className={`flex-1 bg-[${NAVY}] text-white py-3 rounded-xl font-bold hover:bg-[#1e293b] transition`}>
                                        상담 요청하기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-8">
                {sorted.map((e) => (
                    <div key={e.id} className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
                        <div className="flex items-center space-x-5 mb-6">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow cursor-pointer" onClick={() => handleProfile(e.id)}>
                                <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="min-w-0">
                                <h3 className={`text-xl font-black text-slate-900 cursor-pointer hover:text-[${NAVY}] truncate`} onClick={() => handleProfile(e.id)}>
                                    {e.name} 변호사
                                </h3>
                                <p className="text-sm text-slate-500 font-semibold">전문분야: {e.mainCategory}</p>
                                <p className="text-xs text-slate-400 font-bold mt-1">
                                    경력 {e.careerYears || 0}년 · 응답률 {e.responseRate || 0}%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <div className="text-yellow-400 mr-2 text-lg">★★★★★</div>
                            <span className="font-bold text-slate-800 mr-2">{Number(e.rating || 0).toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">(후기 {e.reviewCount || 0}건)</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-7">
                            {(e.tags || []).slice(0, 3).map((t) => (
                                <span key={t} className="text-xs font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                  #{t}
                </span>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => handleProfile(e.id)} className={`flex-1 border border-[${NAVY}] text-[${NAVY}] py-3 rounded-xl font-bold hover:bg-gray-100 transition`}>
                                프로필 보기
                            </button>

                            <button onClick={() => handleConsult(e.id)} className={`flex-1 bg-[${NAVY}] text-white py-3 rounded-xl font-bold hover:bg-[#1e293b] transition`}>
                                상담 요청하기
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {sorted.length === 0 && (
                <div className="mt-10 bg-white border border-gray-200 rounded-3xl p-10 text-center">
                    <div className="text-2xl mb-2">😵</div>
                    <div className="font-black text-slate-900 mb-1">검색 결과가 없습니다</div>
                    <div className="text-sm text-slate-500 font-semibold">
                        카테고리/키워드 조건을 바꿔서 다시 검색해보세요.
                    </div>
                </div>
            )}
        </div>
    );
}