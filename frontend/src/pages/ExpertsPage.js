import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/*
  ExpertsPage - 변호사 전용
  ✔ 프로필 사진 포함
  ✔ 네이비 톤 버튼 적용
  ✔ 카테고리 필터 유지
  ✔ 프로필 상세 페이지 연동
*/

const ExpertsPage = () => {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get("category") || "ALL";

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);

    // 더미 데이터 (사진 유지)
    const dummyLawyers = [
        {
            id: 1,
            name: "김민지",
            category: "형사",
            rating: 5.0,
            reviewCount: 128,
            image: "https://randomuser.me/api/portraits/women/44.jpg"
        },
        {
            id: 2,
            name: "이준호",
            category: "민사",
            rating: 4.7,
            reviewCount: 94,
            image: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
            id: 3,
            name: "박서연",
            category: "부동산",
            rating: 4.9,
            reviewCount: 76,
            image: "https://randomuser.me/api/portraits/women/65.jpg"
        },
        {
            id: 4,
            name: "최현우",
            category: "이혼/상속",
            rating: 4.6,
            reviewCount: 51,
            image: "https://randomuser.me/api/portraits/men/52.jpg"
        },
    ];

    const categories = ["ALL", "형사", "민사", "부동산", "이혼/상속"];

    const filteredLawyers =
        selectedCategory === "ALL"
            ? dummyLawyers
            : dummyLawyers.filter(l => l.category === selectedCategory);

    // 프로필 이동
    const handleProfile = (id) => {
        navigate(`/experts/${id}`);
    };

    // 상담 요청
    const handleConsult = (id) => {
        const isLoggedIn = !!localStorage.getItem("accessToken");

        if (!isLoggedIn) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        // 나중에 상담 페이지 연결
        navigate(`/consultation?lawyerId=${id}`);
    };

    return (
        <div className="max-w-7xl mx-auto py-16 px-4">

            {/* 제목 */}
            <h2 className="text-3xl font-black mb-10 text-center text-slate-900">
                분야별 변호사 찾기
            </h2>

            {/* 카테고리 */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2 rounded-full border font-bold transition
              ${
                            selectedCategory === cat
                                ? "bg-[#0f172a] text-white border-[#0f172a]"
                                : "bg-white text-slate-700 border-gray-300 hover:bg-gray-100"
                        }
            `}
                    >
                        {cat === "ALL" ? "전체" : cat}
                    </button>
                ))}
            </div>

            {/* 카드 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {filteredLawyers.map(lawyer => (
                    <div
                        key={lawyer.id}
                        className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition"
                    >

                        {/* 프로필 영역 */}
                        <div className="flex items-center space-x-5 mb-6">
                            <div
                                className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow cursor-pointer"
                                onClick={() => handleProfile(lawyer.id)}
                            >
                                <img
                                    src={lawyer.image}
                                    alt={lawyer.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div>
                                <h3
                                    className="text-xl font-black text-slate-900 cursor-pointer hover:text-[#0f172a]"
                                    onClick={() => handleProfile(lawyer.id)}
                                >
                                    {lawyer.name} 변호사
                                </h3>
                                <p className="text-sm text-slate-500 font-semibold">
                                    전문분야: {lawyer.category}
                                </p>
                            </div>
                        </div>

                        {/* 평점 */}
                        <div className="flex items-center mb-6">
                            <div className="text-yellow-400 mr-2 text-lg">★★★★★</div>
                            <span className="font-bold text-slate-800 mr-2">
                {lawyer.rating}
              </span>
                            <span className="text-gray-400 text-sm">
                (후기 {lawyer.reviewCount}건)
              </span>
                        </div>

                        {/* 버튼 2개 */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleProfile(lawyer.id)}
                                className="flex-1 border border-[#0f172a] text-[#0f172a] py-3 rounded-xl font-bold hover:bg-gray-100 transition"
                            >
                                프로필 보기
                            </button>

                            <button
                                onClick={() => handleConsult(lawyer.id)}
                                className="flex-1 bg-[#0f172a] text-white py-3 rounded-xl font-bold hover:bg-[#1e293b] transition"
                            >
                                상담 요청하기
                            </button>
                        </div>

                    </div>
                ))}

            </div>
        </div>
    );
};

export default ExpertsPage;
