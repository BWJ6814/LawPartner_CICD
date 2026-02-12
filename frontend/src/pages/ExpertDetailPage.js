import React from "react";
import { useParams } from "react-router-dom";

/*
  id 기반으로 변호사 데이터 조회
*/

const dummyLawyers = [
    {
        id: 1,
        name: "김민지",
        category: "형사",
        rating: 5.0,
        reviewCount: 128,
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        intro: "형사 전문 변호사로 10년 이상 경력을 보유하고 있습니다.",
        careers: [
            "서울대학교 법학과 졸업",
            "사법연수원 수료",
            "前 서울중앙지방법원 국선변호인"
        ],
        office: "서울 서초구 법원로 15",
        phone: "02-1234-5678"
    },
    {
        id: 2,
        name: "이준호",
        category: "민사",
        rating: 4.7,
        reviewCount: 94,
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        intro: "민사소송 전문 변호사입니다.",
        careers: [
            "고려대학교 법학과 졸업",
            "민사 전문 로펌 근무"
        ],
        office: "서울 강남구 테헤란로 120",
        phone: "02-9876-5432"
    },
    {
        id: 3,
        name: "박서연",
        category: "부동산",
        rating: 4.9,
        reviewCount: 76,
        image: "https://randomuser.me/api/portraits/women/65.jpg",
        intro: "부동산 전문 변호사입니다.",
        careers: [
            "연세대학교 법학과 졸업",
            "부동산 전문 변호사 8년"
        ],
        office: "서울 송파구 올림픽로 240",
        phone: "02-5555-3333"
    },
    {
        id: 4,
        name: "최현우",
        category: "이혼/상속",
        rating: 4.6,
        reviewCount: 51,
        image: "https://randomuser.me/api/portraits/men/52.jpg",
        intro: "가사 사건 전문 변호사입니다.",
        careers: [
            "성균관대학교 법학과 졸업",
            "가사 전문 로펌 7년 경력"
        ],
        office: "서울 마포구 월드컵북로 10",
        phone: "02-2222-1111"
    }
];

const ExpertDetailPage = () => {

    const { id } = useParams();

    // 🔵 문자열 id를 숫자로 변환
    const lawyer = dummyLawyers.find(
        (item) => item.id === Number(id)
    );

    if (!lawyer) {
        return <div className="text-center py-20">해당 변호사를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-16 px-4">

            <h2 className="text-3xl font-black mb-10">
                변호사 프로필 상세
            </h2>

            <div className="bg-white shadow-xl rounded-3xl p-10">

                {/* 기본 정보 */}
                <div className="flex items-center gap-8 mb-10">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg">
                        <img
                            src={lawyer.image}
                            alt={lawyer.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div>
                        <h3 className="text-2xl font-black mb-2">
                            {lawyer.name} 변호사
                        </h3>
                        <p className="text-slate-600">
                            전문분야: {lawyer.category}
                        </p>
                        <p className="text-yellow-500 font-bold">
                            평점 {lawyer.rating} ({lawyer.reviewCount}건)
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
                    <ul className="list-disc pl-6 space-y-2">
                        {lawyer.careers.map((c, idx) => (
                            <li key={idx}>{c}</li>
                        ))}
                    </ul>
                </section>

                {/* 사무실 정보 */}
                <section>
                    <h4 className="text-xl font-bold mb-2 border-b pb-2">
                        사무실 정보
                    </h4>
                    <p>주소: {lawyer.office}</p>
                    <p>연락처: {lawyer.phone}</p>
                </section>

            </div>

        </div>
    );
};

export default ExpertDetailPage;
