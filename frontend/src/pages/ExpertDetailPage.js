import React from "react";
import { useNavigate,useParams } from "react-router-dom";

/*
  id 기반으로 변호사 데이터 조회
*/

const dummyLawyers = [
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
        intro: "형사사건 11년 경력. 구속영장, 성범죄, 사기 전문.",
        careers: ["서울대 법학과", "사법연수원", "前 중앙지법 국선변호인"],
        office: "서울 서초구 법원로 15",
        phone: "02-1111-1111"
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
        intro: "민사소송 및 계약 분쟁 전문.",
        careers: ["고려대 법학과", "민사전문 로펌"],
        office: "서울 강남구 테헤란로 120",
        phone: "02-2222-2222"
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
        intro: "전세보증금·명도소송 전문.",
        careers: ["연세대 법학과", "부동산 전문 9년"],
        office: "서울 송파구 올림픽로 240",
        phone: "02-3333-3333"
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
        intro: "이혼·상속 전문.",
        careers: ["성균관대 법학과", "가사 전문 7년"],
        office: "서울 마포구 월드컵북로 10",
        phone: "02-4444-4444"
    },

    // ───────────── 아래는 형식 동일하게 반복 ─────────────

    { id: 5, role:"LAWYER", name:"정하늘", mainCategory:"기업/노동", tags:["부당해고","임금체불"], rating:4.8, reviewCount:133, careerYears:10, responseRate:97, image:"https://randomuser.me/api/portraits/women/21.jpg", intro:"노동사건 전문.", careers:["한양대 법학과","노동전문 10년"], office:"서울 여의도동", phone:"02-5555-5555"},
    { id: 6, role:"LAWYER", name:"윤지훈", mainCategory:"교통사고", tags:["합의","보험"], rating:4.7, reviewCount:168, careerYears:12, responseRate:96, image:"https://randomuser.me/api/portraits/men/19.jpg", intro:"교통사고 손해배상 전문.", careers:["부산대 법학과","보험분쟁 12년"], office:"서울 강서구", phone:"02-6666-6666"},
    { id: 7, role:"LAWYER", name:"한소연", mainCategory:"금전/채무", tags:["회생","파산"], rating:4.5, reviewCount:62, careerYears:6, responseRate:88, image:"https://randomuser.me/api/portraits/women/36.jpg", intro:"개인회생 전문.", careers:["경희대 법학과"], office:"서울 강동구", phone:"02-7777-7777"},
    { id: 8, role:"LAWYER", name:"오상민", mainCategory:"행정", tags:["행정심판","정보공개"], rating:4.6, reviewCount:41, careerYears:9, responseRate:91, image:"https://randomuser.me/api/portraits/men/74.jpg", intro:"행정소송 전문.", careers:["건국대 법학과"], office:"서울 종로구", phone:"02-8888-8888"},
    { id: 9, role:"LAWYER", name:"배지은", mainCategory:"지식재산", tags:["상표","특허"], rating:4.9, reviewCount:89, careerYears:8, responseRate:94, image:"https://randomuser.me/api/portraits/women/50.jpg", intro:"IP 전문 변호사.", careers:["이화여대 법학과"], office:"서울 성동구", phone:"02-9999-0001"},
    { id:10, role:"LAWYER", name:"김태환", mainCategory:"세무/회계", tags:["세무조사","증여"], rating:4.6, reviewCount:57, careerYears:13, responseRate:92, image:"https://randomuser.me/api/portraits/men/41.jpg", intro:"조세소송 전문.", careers:["동국대 법학과"], office:"서울 중구", phone:"02-9999-0002"},
    { id:11, role:"LAWYER", name:"문지윤", mainCategory:"의료", tags:["의료사고"], rating:4.8, reviewCount:34, careerYears:11, responseRate:90, image:"https://randomuser.me/api/portraits/women/12.jpg", intro:"의료소송 전문.", careers:["서울여대 법학과"], office:"서울 광진구", phone:"02-9999-0003"},
    { id:12, role:"LAWYER", name:"장혁", mainCategory:"건설", tags:["하자","공사대금"], rating:4.4, reviewCount:29, careerYears:10, responseRate:85, image:"https://randomuser.me/api/portraits/men/5.jpg", intro:"건설 분쟁 전문.", careers:["전북대 법학과"], office:"서울 금천구", phone:"02-9999-0004"},
    { id:13, role:"LAWYER", name:"서민경", mainCategory:"국제", tags:["비자","해외계약"], rating:4.7, reviewCount:38, careerYears:9, responseRate:89, image:"https://randomuser.me/api/portraits/women/9.jpg", intro:"국제계약 전문.", careers:["외대 법학과"], office:"서울 용산구", phone:"02-9999-0005"},
    { id:14, role:"LAWYER", name:"신동현", mainCategory:"스타트업", tags:["투자계약"], rating:4.8, reviewCount:72, careerYears:7, responseRate:95, image:"https://randomuser.me/api/portraits/men/66.jpg", intro:"스타트업 전문.", careers:["KAIST 출신"], office:"서울 판교", phone:"02-9999-0006"},
    { id:15, role:"LAWYER", name:"권다은", mainCategory:"사이버", tags:["해킹","명예훼손"], rating:4.6, reviewCount:66, careerYears:6, responseRate:93, image:"https://randomuser.me/api/portraits/women/77.jpg", intro:"사이버 범죄 전문.", careers:["숙명여대 법학과"], office:"서울 관악구", phone:"02-9999-0007"},
    { id:16, role:"LAWYER", name:"강지호", mainCategory:"기타", tags:["계약검토"], rating:4.5, reviewCount:25, careerYears:5, responseRate:87, image:"https://randomuser.me/api/portraits/men/13.jpg", intro:"계약 검토 전문.", careers:["한림대 법학과"], office:"서울 은평구", phone:"02-9999-0008"},
    { id:17, role:"LAWYER", name:"조하연", mainCategory:"형사", tags:["성범죄","마약"], rating:4.9, reviewCount:201, careerYears:14, responseRate:97, image:"https://randomuser.me/api/portraits/women/68.jpg", intro:"중대형 형사사건 전문.", careers:["서울대"], office:"서울 서초구", phone:"02-9999-0009"},
    { id:18, role:"LAWYER", name:"임성우", mainCategory:"민사", tags:["가압류"], rating:4.6, reviewCount:112, careerYears:9, responseRate:92, image:"https://randomuser.me/api/portraits/men/22.jpg", intro:"집행 전문.", careers:["경북대"], office:"서울 강남구", phone:"02-9999-0010"},
    { id:19, role:"LAWYER", name:"유나리", mainCategory:"부동산", tags:["재개발"], rating:4.7, reviewCount:83, careerYears:8, responseRate:91, image:"https://randomuser.me/api/portraits/women/58.jpg", intro:"재개발 분쟁 전문.", careers:["고려대"], office:"서울 송파구", phone:"02-9999-0011"},
    { id:20, role:"LAWYER", name:"백승호", mainCategory:"기업/노동", tags:["산재"], rating:4.8, reviewCount:59, careerYears:12, responseRate:94, image:"https://randomuser.me/api/portraits/men/47.jpg", intro:"노동위원회 전문.", careers:["부산대"], office:"서울 영등포구", phone:"02-9999-0012"},
    { id:21, role:"LAWYER", name:"홍예린", mainCategory:"교통사고", tags:["형사합의"], rating:4.5, reviewCount:44, careerYears:6, responseRate:90, image:"https://randomuser.me/api/portraits/women/27.jpg", intro:"교통 형사 전문.", careers:["단국대"], office:"서울 동대문", phone:"02-9999-0013"},
    { id:22, role:"LAWYER", name:"남도현", mainCategory:"금전/채무", tags:["보증"], rating:4.4, reviewCount:31, careerYears:7, responseRate:86, image:"https://randomuser.me/api/portraits/men/58.jpg", intro:"채무 분쟁 전문.", careers:["세종대"], office:"서울 구로구", phone:"02-9999-0014"},
    { id:23, role:"LAWYER", name:"송가은", mainCategory:"이혼/상속", tags:["유류분"], rating:4.8, reviewCount:97, careerYears:10, responseRate:96, image:"https://randomuser.me/api/portraits/women/32.jpg", intro:"상속세 분쟁 전문.", careers:["전남대"], office:"서울 마포구", phone:"02-9999-0015"},
    { id:24, role:"LAWYER", name:"차민석", mainCategory:"행정", tags:["운전면허"], rating:4.6, reviewCount:53, careerYears:8, responseRate:90, image:"https://randomuser.me/api/portraits/men/35.jpg", intro:"면허취소 전문.", careers:["강원대"], office:"서울 종로구", phone:"02-9999-0016"},
];

const ExpertDetailPage = () => {

    const { id } = useParams();
    const navigate = useNavigate();


    // 🔵 문자열 id를 숫자로 변환
    const lawyer = dummyLawyers.find(
        (item) => item.id === Number(id)
    );
    const isLoggedIn = () => !!localStorage.getItem("accessToken");

    const handleChat = () => {
        if (!isLoggedIn()) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        navigate(`/chat?lawyerId=${lawyer.id}`);
    };


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
                            전문분야: {lawyer.mainCategory}
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

};

export default ExpertDetailPage;
