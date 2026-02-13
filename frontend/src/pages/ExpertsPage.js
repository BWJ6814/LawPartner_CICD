import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Gavel, Car, Home, Key,
    HandCoins, CircleDollarSign, Calculator,
    Scale, HeartCrack, GitFork, Briefcase,
    Building2, Copyright,
    TrendingDown, FileText, MoreHorizontal, Sparkles
} from 'lucide-react';

/*
  ExpertsPage (MVP)
  - 원본 디자인(네이비/라운드/카드) 유지
  - 추천 섹션: 메인 상단 (CARD-06 대체: 후기/평점 기반)
  - 카테고리 그리드: ALL 포함 (CARD-03)
  - 키워드 검색 (CARD-04)
  - 카드형 프로필 + 후기/평점 (CARD-05)
  - 직군 탭(변호사만 활성) (CARD-02)
*/

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


const SORTS = [
    { key: "RECOMMEND", label: "추천순" },
    { key: "RATING", label: "평점순" },
    { key: "REVIEWS", label: "후기순" },
    { key: "CAREER", label: "경력순" },
];

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function containsKoreanInsensitive(haystack, needle) {
    if (!needle) return true;
    return (haystack || "").toLowerCase().includes(needle.toLowerCase());
}

// ✅ 추천 점수(더미용): CARD-06의 “후기·평점 반영”을 UX로 충족
function recommendScore(expert) {
    const rating = Number(expert.rating || 0);
    const reviews = Number(expert.reviewCount || 0);
    const responseRate = Number(expert.responseRate || 0);

    // log 스케일로 후기 수 과대 영향 방지
    const logReviews = Math.log10(reviews + 1); // 0~2.3 정도

    // 가중치: 평점 중심 + 후기 + 응답률(보여주기용 설득력)
    return rating * 0.55 + logReviews * 0.30 + (responseRate / 100) * 0.15;
}

// ✅ 더미데이터(24명 이상) — DB 연결 전 “서비스처럼 보이는” 수준
const DUMMY_EXPERTS = [
    {
        id: 1,
        role: "LAWYER",
        name: "김민지",
        mainCategory: "형사",
        tags: ["음주운전", "사기", "보이스피싱"],
        rating: 5.0,
        reviewCount: 128,
        careerYears: 11,
        responseRate: 98,
        image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
        id: 2,
        role: "LAWYER",
        name: "이준호",
        mainCategory: "민사",
        tags: ["손해배상", "계약", "임대차"],
        rating: 4.7,
        reviewCount: 94,
        careerYears: 8,
        responseRate: 93,
        image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        id: 3,
        role: "LAWYER",
        name: "박서연",
        mainCategory: "부동산",
        tags: ["전세", "명도", "등기"],
        rating: 4.9,
        reviewCount: 76,
        careerYears: 9,
        responseRate: 95,
        image: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
        id: 4,
        role: "LAWYER",
        name: "최현우",
        mainCategory: "이혼/상속",
        tags: ["재산분할", "양육권", "상속분쟁"],
        rating: 4.6,
        reviewCount: 51,
        careerYears: 7,
        responseRate: 90,
        image: "https://randomuser.me/api/portraits/men/52.jpg",
    },
    {
        id: 5,
        role: "LAWYER",
        name: "정하늘",
        mainCategory: "기업/노동",
        tags: ["부당해고", "임금체불", "직장내괴롭힘"],
        rating: 4.8,
        reviewCount: 133,
        careerYears: 10,
        responseRate: 97,
        image: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    {
        id: 6,
        role: "LAWYER",
        name: "윤지훈",
        mainCategory: "교통사고",
        tags: ["합의", "보험", "휴업손해"],
        rating: 4.7,
        reviewCount: 168,
        careerYears: 12,
        responseRate: 96,
        image: "https://randomuser.me/api/portraits/men/19.jpg",
    },
    {
        id: 7,
        role: "LAWYER",
        name: "한소연",
        mainCategory: "금전/채무",
        tags: ["개인회생", "파산", "대여금"],
        rating: 4.5,
        reviewCount: 62,
        careerYears: 6,
        responseRate: 88,
        image: "https://randomuser.me/api/portraits/women/36.jpg",
    },
    {
        id: 8,
        role: "LAWYER",
        name: "오상민",
        mainCategory: "행정",
        tags: ["처분취소", "행정심판", "정보공개"],
        rating: 4.6,
        reviewCount: 41,
        careerYears: 9,
        responseRate: 91,
        image: "https://randomuser.me/api/portraits/men/74.jpg",
    },
    {
        id: 9,
        role: "LAWYER",
        name: "배지은",
        mainCategory: "지식재산",
        tags: ["상표", "특허", "저작권"],
        rating: 4.9,
        reviewCount: 89,
        careerYears: 8,
        responseRate: 94,
        image: "https://randomuser.me/api/portraits/women/50.jpg",
    },
    {
        id: 10,
        role: "LAWYER",
        name: "김태환",
        mainCategory: "세무/회계",
        tags: ["세무조사", "증여", "법인세"],
        rating: 4.6,
        reviewCount: 57,
        careerYears: 13,
        responseRate: 92,
        image: "https://randomuser.me/api/portraits/men/41.jpg",
    },
    {
        id: 11,
        role: "LAWYER",
        name: "문지윤",
        mainCategory: "의료",
        tags: ["의료사고", "과실", "손해배상"],
        rating: 4.8,
        reviewCount: 34,
        careerYears: 11,
        responseRate: 90,
        image: "https://randomuser.me/api/portraits/women/12.jpg",
    },
    {
        id: 12,
        role: "LAWYER",
        name: "장혁",
        mainCategory: "건설",
        tags: ["하자", "공사대금", "지체상금"],
        rating: 4.4,
        reviewCount: 29,
        careerYears: 10,
        responseRate: 85,
        image: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
        id: 13,
        role: "LAWYER",
        name: "서민경",
        mainCategory: "국제",
        tags: ["비자", "국제계약", "해외송금"],
        rating: 4.7,
        reviewCount: 38,
        careerYears: 9,
        responseRate: 89,
        image: "https://randomuser.me/api/portraits/women/9.jpg",
    },
    {
        id: 14,
        role: "LAWYER",
        name: "신동현",
        mainCategory: "스타트업",
        tags: ["투자계약", "주주간계약", "지분분쟁"],
        rating: 4.8,
        reviewCount: 72,
        careerYears: 7,
        responseRate: 95,
        image: "https://randomuser.me/api/portraits/men/66.jpg",
    },
    {
        id: 15,
        role: "LAWYER",
        name: "권다은",
        mainCategory: "사이버",
        tags: ["명예훼손", "해킹", "개인정보"],
        rating: 4.6,
        reviewCount: 66,
        careerYears: 6,
        responseRate: 93,
        image: "https://randomuser.me/api/portraits/women/77.jpg",
    },
    {
        id: 16,
        role: "LAWYER",
        name: "강지호",
        mainCategory: "기타",
        tags: ["내용증명", "합의서", "계약검토"],
        rating: 4.5,
        reviewCount: 25,
        careerYears: 5,
        responseRate: 87,
        image: "https://randomuser.me/api/portraits/men/13.jpg",
    },
    // 주요 카테고리 추가 인원(분산)
    {
        id: 17,
        role: "LAWYER",
        name: "조하연",
        mainCategory: "형사",
        tags: ["성범죄", "마약", "구속영장"],
        rating: 4.9,
        reviewCount: 201,
        careerYears: 14,
        responseRate: 97,
        image: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
        id: 18,
        role: "LAWYER",
        name: "임성우",
        mainCategory: "민사",
        tags: ["가압류", "가처분", "채권추심"],
        rating: 4.6,
        reviewCount: 112,
        careerYears: 9,
        responseRate: 92,
        image: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    {
        id: 19,
        role: "LAWYER",
        name: "유나리",
        mainCategory: "부동산",
        tags: ["재개발", "분양", "임대차"],
        rating: 4.7,
        reviewCount: 83,
        careerYears: 8,
        responseRate: 91,
        image: "https://randomuser.me/api/portraits/women/58.jpg",
    },
    {
        id: 20,
        role: "LAWYER",
        name: "백승호",
        mainCategory: "기업/노동",
        tags: ["산재", "노동위원회", "취업규칙"],
        rating: 4.8,
        reviewCount: 59,
        careerYears: 12,
        responseRate: 94,
        image: "https://randomuser.me/api/portraits/men/47.jpg",
    },
    {
        id: 21,
        role: "LAWYER",
        name: "홍예린",
        mainCategory: "교통사고",
        tags: ["형사합의", "진단서", "벌점"],
        rating: 4.5,
        reviewCount: 44,
        careerYears: 6,
        responseRate: 90,
        image: "https://randomuser.me/api/portraits/women/27.jpg",
    },
    {
        id: 22,
        role: "LAWYER",
        name: "남도현",
        mainCategory: "금전/채무",
        tags: ["보증", "대출", "채무불이행"],
        rating: 4.4,
        reviewCount: 31,
        careerYears: 7,
        responseRate: 86,
        image: "https://randomuser.me/api/portraits/men/58.jpg",
    },
    {
        id: 23,
        role: "LAWYER",
        name: "송가은",
        mainCategory: "이혼/상속",
        tags: ["유류분", "상속세", "협의이혼"],
        rating: 4.8,
        reviewCount: 97,
        careerYears: 10,
        responseRate: 96,
        image: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    {
        id: 24,
        role: "LAWYER",
        name: "차민석",
        mainCategory: "행정",
        tags: ["운전면허", "영업정지", "이의신청"],
        rating: 4.6,
        reviewCount: 53,
        careerYears: 8,
        responseRate: 90,
        image: "https://randomuser.me/api/portraits/men/35.jpg",
    },
];

const ExpertsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialCategory = searchParams.get("category") || "ALL";
    const initialRole = searchParams.get("role") || "LAWYER";

    const [selectedRole, setSelectedRole] = useState(initialRole);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [keyword, setKeyword] = useState(searchParams.get("q") || "");
    const [sortKey, setSortKey] = useState(searchParams.get("sort") || "RECOMMEND");

    const isLoggedIn = () => !!localStorage.getItem("accessToken");

    const syncParams = (next) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(next).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") params.delete(k);
            else params.set(k, String(v));
        });
        setSearchParams(params, { replace: true });
    };

    // ✅ 필터 + 검색
    const filtered = useMemo(() => {
        const roleFiltered = DUMMY_EXPERTS.filter((e) => e.role === selectedRole);

        const categoryFiltered =
            selectedCategory === "ALL"
                ? roleFiltered
                : roleFiltered.filter((e) => e.mainCategory === selectedCategory);

        const q = keyword.trim();
        if (!q) return categoryFiltered;

        return categoryFiltered.filter((e) => {
            const hay = [
                e.name,
                e.mainCategory,
                (e.tags || []).join(" "),
                `${e.careerYears}년`,
            ].join(" ");
            return containsKoreanInsensitive(hay, q);
        });
    }, [selectedRole, selectedCategory, keyword]);

    // ✅ 정렬
    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortKey) {
            case "RATING":
                arr.sort((a, b) => b.rating - a.rating);
                break;
            case "REVIEWS":
                arr.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
            case "CAREER":
                arr.sort((a, b) => b.careerYears - a.careerYears);
                break;
            case "RECOMMEND":
            default:
                arr.sort((a, b) => recommendScore(b) - recommendScore(a));
                break;
        }
        return arr;
    }, [filtered, sortKey]);

    // ✅ 추천(메인 상단): 현재 필터 조건 기준 Top 3
    const topRecommended = useMemo(() => {
        const candidates = [...filtered].sort((a, b) => recommendScore(b) - recommendScore(a));
        return candidates.slice(0, 3);
    }, [filtered]);


    const handleCategoryClick = (catKey) => {
        setSelectedCategory(catKey);
        syncParams({ category: catKey });
    };

    const handleProfile = (id) => {
        navigate(`/experts/${id}`);
    };

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
            {/* 제목 */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900">분야별 전문가 찾기</h2>
                <p className="mt-2 text-sm text-slate-500 font-semibold">
                    카테고리/키워드로 전문가를 찾아보세요
                </p>
            </div>



            {/* 카테고리 그리드 (ALL 포함) */}
            {/* 카테고리 그리드 (컴팩트 버전) */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3 mb-8">
                {CATEGORY_GRID.map((c) => {
                    const active = selectedCategory === c.key;

                    return (
                        <button
                            key={c.key}
                            onClick={() => handleCategoryClick(c.key)}
                            className={[
                                "bg-white rounded-xl border px-3 py-3 text-center shadow-sm transition",
                                active
                                    ? "border-slate-900 shadow-md"
                                    : "border-gray-200 hover:shadow-md hover:border-gray-300",
                            ].join(" ")}
                        >
                            <div className="text-lg mb-1">{c.icon}</div>

                            <div className="text-sm font-semibold">
                                {c.label}
                            </div>
                        </button>
                    );
                })}
            </div>


            {/* 검색 + 정렬 */}
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
                            <option key={s.key} value={s.key}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ✅ 추천 섹션: 메인 상단 (CARD-06 - 후기/평점 기반) */}
            <div className="mb-10">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {topRecommended.map((e) => (
                            <div
                                key={e.id}
                                className="bg-white rounded-3xl shadow-lg p-7 border border-gray-100 hover:shadow-2xl transition"
                            >
                                <div className="flex items-center space-x-4 mb-5">
                                    <div
                                        className="w-16 h-16 rounded-full overflow-hidden border-4 border-gray-100 shadow cursor-pointer"
                                        onClick={() => handleProfile(e.id)}
                                    >
                                        <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4
                                            className={`text-lg font-black text-slate-900 cursor-pointer hover:text-[${NAVY}] truncate`}
                                            onClick={() => handleProfile(e.id)}
                                        >
                                            {e.name} 변호사
                                        </h4>
                                        <p className="text-sm text-slate-500 font-semibold">
                                            전문분야: {e.mainCategory} · 경력 {e.careerYears}년 · 응답률 {e.responseRate}%
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center mb-5">
                                    <div className="text-yellow-400 mr-2 text-lg">★★★★★</div>
                                    <span className="font-bold text-slate-800 mr-2">{e.rating.toFixed(1)}</span>
                                    <span className="text-gray-400 text-sm">(후기 {e.reviewCount}건)</span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {(e.tags || []).slice(0, 3).map((t) => (
                                        <span
                                            key={t}
                                            className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200`}
                                        >
                      #{t}
                    </span>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleProfile(e.id)}
                                        className={`flex-1 border border-[${NAVY}] text-[${NAVY}] py-3 rounded-xl font-bold hover:bg-gray-100 transition`}
                                    >
                                        프로필 보기
                                    </button>
                                    <button
                                        onClick={() => handleConsult(e.id)}
                                        className={`flex-1 bg-[${NAVY}] text-white py-3 rounded-xl font-bold hover:bg-[#1e293b] transition`}
                                    >
                                        상담 요청하기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 결과 카드 리스트 (CARD-05) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sorted.map((e) => (
                    <div
                        key={e.id}
                        className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition"
                    >
                        <div className="flex items-center space-x-5 mb-6">
                            <div
                                className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow cursor-pointer"
                                onClick={() => handleProfile(e.id)}
                            >
                                <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="min-w-0">
                                <h3
                                    className={`text-xl font-black text-slate-900 cursor-pointer hover:text-[${NAVY}] truncate`}
                                    onClick={() => handleProfile(e.id)}
                                >
                                    {e.name} 변호사
                                </h3>
                                <p className="text-sm text-slate-500 font-semibold">
                                    전문분야: {e.mainCategory}
                                </p>
                                <p className="text-xs text-slate-400 font-bold mt-1">
                                    경력 {e.careerYears}년 · 응답률 {e.responseRate}%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <div className="text-yellow-400 mr-2 text-lg">★★★★★</div>
                            <span className="font-bold text-slate-800 mr-2">{e.rating.toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">(후기 {e.reviewCount}건)</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-7">
                            {(e.tags || []).slice(0, 3).map((t) => (
                                <span
                                    key={t}
                                    className="text-xs font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200"
                                >
                  #{t}
                </span>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleProfile(e.id)}
                                className={`flex-1 border border-[${NAVY}] text-[${NAVY}] py-3 rounded-xl font-bold hover:bg-gray-100 transition`}
                            >
                                프로필 보기
                            </button>

                            <button
                                onClick={() => handleConsult(e.id)}
                                className={`flex-1 bg-[${NAVY}] text-white py-3 rounded-xl font-bold hover:bg-[#1e293b] transition`}
                            >
                                상담 요청하기
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 결과 없음 */}
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
};

export default ExpertsPage;
