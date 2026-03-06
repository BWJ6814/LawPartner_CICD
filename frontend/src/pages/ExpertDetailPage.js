import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function safeImage(url) {
    const u = (url || "").trim();
    if (u) return u;
    return "https://via.placeholder.com/320?text=LAWYER";
}

function splitTags(specialtyStr) {
    if (!specialtyStr) return [];
    return String(specialtyStr)
        .split(/[,/|]/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function ExpertDetailPage() {
    const { id } = useParams(); // id === userNo
    const navigate = useNavigate();

    const [lawyer, setLawyer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadMsg, setLoadMsg] = useState("");

    const isLoggedIn = () => !!localStorage.getItem("accessToken");

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            setLoadMsg("");
            try {
                const res = await axios.get(`http://localhost:8080/api/lawyers/${id}`);
                const d = res.data;

                // ✅ 백엔드 DTO 필드명에 따라 여기만 맞추면 됨
                const userNo = d.userNo ?? d.user_no ?? d.USER_NO ?? Number(id);
                const userNm = d.userNm ?? d.user_nm ?? d.USER_NM ?? d.name ?? "변호사";
                const specialtyStr = d.specialtyStr ?? d.specialty_str ?? d.SPECIALTY_STR ?? "";
                const imgUrl = d.imgUrl ?? d.img_url ?? d.IMG_URL ?? "";
                const introText = d.introText ?? d.intro_text ?? d.INTRO_TEXT ?? "";
                const officeName = d.officeName ?? d.office_name ?? d.OFFICE_NAME ?? "";
                const officeAddr = d.officeAddr ?? d.office_addr ?? d.OFFICE_ADDR ?? "";
                const rating = Number(d.rating || 0);
                const reviewCount = Number(d.reviewCount || 0);

                setLawyer({
                    id: userNo,
                    name: userNm,
                    image: safeImage(imgUrl),
                    specialtyStr,
                    // mainCategory는 DB에 별도 없으니 1차는 “첫 태그”로 임시 처리
                    mainCategory: splitTags(specialtyStr)[0] || "기타",
                    intro: introText || "소개 정보가 없습니다.",
                    careers: Array.isArray(d.careers) ? d.careers : [], // 1차는 비우는 게 정상
                    office: [officeName, officeAddr].filter(Boolean).join(" ") || "사무실 정보가 없습니다.",
                    phone: d.phone ?? "미제공",
                    rating,
                    reviewCount,
                });
            } catch (e) {
                setLoadMsg("상세 데이터를 불러오는 중 오류가 발생했습니다.");
                setLawyer(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const handleChat = () => {
        if (!isLoggedIn()) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }
        // ✅ ExpertsPage와 동일 경로로 통일
        navigate(`/consultation?lawyerId=${id}`);
    };

    const hasCareers = useMemo(() => (lawyer?.careers || []).length > 0, [lawyer]);

    if (isLoading) {
        return <div className="text-center py-20 font-bold text-slate-600">로딩중...</div>;
    }

    if (!lawyer) {
        return <div className="text-center py-20">{loadMsg || "해당 변호사를 찾을 수 없습니다."}</div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-16 px-4">
            <h2 className="text-3xl font-black mb-10">변호사 프로필 상세</h2>

            <div className="bg-white shadow-xl rounded-3xl p-10">
                {/* 기본 정보 */}
                <div className="flex items-center gap-8 mb-10">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg">
                        <img src={lawyer.image} alt={lawyer.name} className="w-full h-full object-cover" />
                    </div>

                    <div>
                        <h3 className="text-2xl font-black mb-2">{lawyer.name} 변호사</h3>
                        <p className="text-slate-600">
                            전문분야: {lawyer.specialtyStr || lawyer.mainCategory}
                        </p>
                        <p className="text-yellow-500 font-bold">
                            평점 {lawyer.rating.toFixed(1)} ({lawyer.reviewCount}건)
                        </p>
                    </div>
                </div>

                {/* 소개 */}
                <section className="mb-8">
                    <h4 className="text-xl font-bold mb-2 border-b pb-2">소개</h4>
                    <p>{lawyer.intro}</p>
                </section>

                {/* 경력 */}
                <section className="mb-8">
                    <h4 className="text-xl font-bold mb-2 border-b pb-2">경력</h4>
                    {hasCareers ? (
                        <ul className="list-disc pl-6 space-y-2">
                            {lawyer.careers.map((c, idx) => (
                                <li key={idx}>{c}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 font-semibold">경력 정보가 없습니다.</p>
                    )}
                </section>

                {/* 사무실 정보 */}
                <section>
                    <h4 className="text-xl font-bold mb-2 border-b pb-2">사무실 정보</h4>
                    <p>주소: {lawyer.office}</p>
                    <p>연락처: {lawyer.phone}</p>
                </section>

                <div className="mt-10">
                    <button
                        onClick={handleChat}
                        className="w-full bg-[#0f172a] text-white py-4 rounded-xl font-bold hover:bg-[#1e293b] transition"
                    >
                        1:1 채팅 시작하기
                    </button>
                </div>
            </div>
        </div>
    );
}