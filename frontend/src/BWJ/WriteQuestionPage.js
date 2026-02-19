import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutGrid, CheckCircle, CloudUpload } from 'lucide-react';

const CATEGORIES = [
    { id: 1, name: '형사범죄' }, { id: 2, name: '교통사고' },
    { id: 3, name: '부동산' }, { id: 4, name: '임대차' },
    { id: 5, name: '손해배상' }, { id: 6, name: '대여금' },
    { id: 7, name: '미수금' }, { id: 8, name: '채권추심' },
    { id: 9, name: '이혼' }, { id: 10, name: '상속/가사' },
    { id: 11, name: '노동' }, { id: 12, name: '기업' },
    { id: 13, name: '지식재산권' }, { id: 14, name: '회생/파산' },
    { id: 15, name: '계약서 검토' }, { id: 16, name: '기타' },
];

const WriteQuestionPage = () => {
    const navigate = useNavigate();

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // [추가됨] 닉네임 공개 여부 상태 관리 (기본값: false = 비공개/익명)
    // 리액트에서 useState를 사용하여 체크박스의 상태를 추적합니다.
    const [isNicknameVisible, setIsNicknameVisible] = useState(false);

    // 파일 관련 (UI만 유지)
    const [files, setFiles] = useState([]);
    const handleFileChange = (e) => { if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]); };
    const removeFile = (index) => { setFiles(files.filter((_, i) => i !== index)); };

    const handleCategoryClick = (catName) => {
        if (selectedCategories.includes(catName)) {
            setSelectedCategories(selectedCategories.filter(c => c !== catName));
        } else {
            if (selectedCategories.length < 3) {
                setSelectedCategories([...selectedCategories, catName]);
            } else {
                alert("카테고리는 최대 3개까지만 선택할 수 있습니다.");
            }
        }
    };

    const handleSubmit = async () => {
        if (selectedCategories.length === 0) return alert("카테고리를 최소 1개 선택해주세요.");
        if (!title.trim()) return alert("제목을 입력해주세요.");
        if (!content.trim()) return alert("내용을 입력해주세요.");

        const userNo = localStorage.getItem('userNo');
        const nickNm = localStorage.getItem('nickNm'); // [추가됨] 로컬스토리지에서 닉네임 가져오기

        if(!userNo){
            alert("로그인 정보가 없습니다. 다시 로그인 해주세요.")
            return navigate("/login");
        }

        try {
            await axios.post('http://localhost:8080/api/boards', {
                title: title,
                content: content,
                categories: selectedCategories,
                userNo: userNo,
                nickNm: nickNm, // [추가됨] 닉네임 데이터
                isNicknameVisible: isNicknameVisible // [추가됨] 체크박스 상태 데이터
            });
            alert("질문이 등록되었습니다.");
            navigate('/consultation');
        } catch (error) {
            console.error("등록 에러:", error);
            alert("등록 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50 font-sans">
            <div className="bg-[#1a2b4b] text-white py-12 text-center">
                <h1 className="text-3xl font-bold mb-2">질문 등록하기</h1>
                <p className="text-blue-200 text-sm">비슷한 사례를 찾아보거나 직접 질문하여 해결책을 얻으세요.</p>
            </div>

            <main className="max-w-4xl mx-auto px-4 mt-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

                    <div className="mb-10 text-left">
                        <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <LayoutGrid className="text-blue-600" size={24} />
                            카테고리 선택 <span className="text-red-500 text-sm font-normal">* 필수 (최대 3개)</span>
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className={`relative px-1 py-3 rounded-lg border text-sm font-medium transition-all duration-200 break-keep
                                    ${selectedCategories.includes(cat.name)
                                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {cat.name}
                                    {selectedCategories.includes(cat.name) && (
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full">
                                            <CheckCircle className="text-blue-600 fill-white" size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-gray-100 my-8" />

                    <div className="space-y-8 text-left">
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                제목 <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                   placeholder="제목을 입력하세요"
                                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                내용 <span className="text-red-500">*</span>
                            </label>
                            <textarea rows="12" value={content} onChange={(e) => setContent(e.target.value)}
                                      placeholder="내용을 입력하세요"
                                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 resize-none" />
                        </div>

                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">파일 첨부</label>
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                                    <CloudUpload className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm text-gray-500">파일 첨부 기능 준비중</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* [수정됨] 하단 버튼 영역에 닉네임 공개 여부 체크박스 추가 */}
                <div className="flex items-center justify-between mt-10 mb-20">
                    <div className="flex items-center gap-2 pl-2">
                        <input
                            type="checkbox"
                            id="nicknameVisible"
                            checked={isNicknameVisible}
                            onChange={(e) => setIsNicknameVisible(e.target.checked)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="nicknameVisible" className="text-gray-700 font-bold cursor-pointer">
                            닉네임 공개
                        </label>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => navigate('/')} className="px-10 py-3.5 rounded-lg border border-gray-300 bg-white font-bold">취소</button>
                        <button onClick={handleSubmit} className="px-10 py-3.5 rounded-lg bg-blue-600 text-white font-bold shadow-lg">질문 등록</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WriteQuestionPage;