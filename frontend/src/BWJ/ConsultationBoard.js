import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Menu, User, Scale, Gavel, Car, Home, Key,
    HandCoins, CircleDollarSign, Calculator, HeartCrack,
    GitFork, Briefcase, Building2, Copyright,
    TrendingDown, FileText, MoreHorizontal, Plus, ChevronDown, ChevronUp, Filter,
    ChevronLeft, ChevronRight
} from 'lucide-react';

// 1. 카테고리 데이터 (기존 유지)
const CATEGORIES = [
    { id: 1, name: '형사범죄', icon: <Gavel size={24} /> },
    { id: 2, name: '교통사고', icon: <Car size={24} /> },
    { id: 3, name: '부동산', icon: <Home size={24} /> },
    { id: 4, name: '임대차', icon: <Key size={24} /> },
    { id: 5, name: '손해배상', icon: <HandCoins size={24} /> },
    { id: 6, name: '대여금', icon: <CircleDollarSign size={24} /> },
    { id: 7, name: '미수금', icon: <Calculator size={24} /> },
    { id: 8, name: '채권추심', icon: <Scale size={24} /> },
    { id: 9, name: '이혼', icon: <HeartCrack size={24} /> },
    { id: 10, name: '상속/가사', icon: <GitFork size={24} /> },
    { id: 11, name: '노동', icon: <Briefcase size={24} /> },
    { id: 12, name: '기업', icon: <Building2 size={24} /> },
    { id: 13, name: '지식재산권', icon: <Copyright size={24} /> },
    { id: 14, name: '회생/파산', icon: <TrendingDown size={24} /> },
    { id: 15, name: '계약서 검토', icon: <FileText size={24} /> },
    { id: 16, name: '기타', icon: <MoreHorizontal size={24} /> },
];

// --- 서브 컴포넌트들 ---

const FilterSection = ({ selectedCategory, setSelectedCategory, selectedSort, setSelectedSort }) => {
    const [activeTab, setActiveTab] = useState('category');
    const toggleTab = (tab) => setActiveTab(activeTab === tab ? null : tab);

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                <div className="flex gap-4 mb-6">
                    <button onClick={() => toggleTab('category')} className={`w-64 flex items-center justify-between px-6 py-3 rounded-lg border transition-all duration-200 shadow-sm ${activeTab === 'category' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 text-gray-700'}`}>
                        <span className="flex items-center gap-2 text-base whitespace-nowrap overflow-hidden">
                            <Menu size={18} />
                            <span className="truncate">{selectedCategory === 'ALL' ? '카테고리 선택' : selectedCategory}</span>
                        </span>
                        {activeTab === 'category' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => toggleTab('sort')} className={`w-48 flex items-center justify-between px-6 py-3 rounded-lg border transition-all duration-200 shadow-sm ${activeTab === 'sort' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 text-gray-700'}`}>
                        <span className="flex items-center gap-2 text-base whitespace-nowrap"><Filter size={18} /> 정렬방식</span>
                        <span className="text-sm font-normal text-gray-500 whitespace-nowrap">{selectedSort}</span>
                    </button>
                </div>
                {activeTab === 'category' && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3 animate-fadeIn">
                        <button onClick={() => setSelectedCategory('ALL')} className={`flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 transition-colors gap-2 ${selectedCategory === 'ALL' ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}>
                            <div className={`p-2 rounded-full ${selectedCategory === 'ALL' ? 'text-blue-600' : 'text-gray-400'}`}><MoreHorizontal size={24} /></div>
                            <span className={`text-sm font-medium ${selectedCategory === 'ALL' ? 'text-blue-700' : 'text-gray-700'}`}>전체보기</span>
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 transition-colors gap-2 group ${selectedCategory === cat.name ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}>
                                <div className={`transition-transform duration-200 p-2 rounded-full ${selectedCategory === cat.name ? 'bg-blue-100 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>{cat.icon}</div>
                                <span className={`text-sm font-medium whitespace-nowrap ${selectedCategory === cat.name ? 'text-blue-700' : 'text-gray-700'}`}>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                )}
                {activeTab === 'sort' && (
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg animate-fadeIn">
                        {['최신순', '답변많은순', '조회수순', '공감순'].map((sort) => (
                            <button key={sort} onClick={() => setSelectedSort(sort)} className={`px-4 py-2 rounded-full text-sm border transition-colors ${selectedSort === sort ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>{sort}</button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const WriteQuestionCard = ({ onClick }) => (
    <div onClick={onClick} className="group h-full min-h-[220px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            <Plus size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">질문 등록하기</h3>
        <p className="text-blue-100 text-sm text-center px-6">복잡한 법률 고민,<br/>전문가와 AI에게 물어보세요.</p>
    </div>
);

const PostCard = ({ post }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[220px]">
        <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{post.title}</h3>
        </div>
        <div className="flex-grow mb-4">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{post.content}</p>
        </div>
        <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{post.date}</span>
                <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {post.categories && post.categories.map((tag, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-medium">#{tag}</span>
                ))}
            </div>
        </div>
    </div>
);

// --- 메인 컴포넌트 ---

const ConsultationBoard = () => {
    const navigate = useNavigate();

    // 1. 상태 선언
    const [posts, setPosts] = useState([]);

    /**
     * [버그 수정 포인트]
     * localStorage에서 꺼낸 값을 바로 .toUpperCase() 처리하여
     * 대소문자 차이로 인한 비교 오류를 원천 차단합니다.
     */
    const [userRole, setUserRole] = useState(
        (localStorage.getItem('userRole') || 'GENERAL').toUpperCase()
    );
    console.log("이펙트전에 set 하고나서(userRole):", userRole);

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchType, setSearchType] = useState('title');

    // 디버깅용: 현재 리액트가 인식하는 권한을 콘솔에 찍습니다. (F12에서 확인 가능)


    useEffect(() => {
        // 컴포넌트 진입 시 다시 한 번 갱신 (확실하게 하기 위해)
        const currentRole = localStorage.getItem('userRole');
        if (currentRole) {
            setUserRole(currentRole.toUpperCase());
        }
        console.log("이펙트에서 set 하고나서(userRole):", userRole);
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/boards');
            const mappedData = response.data.map(board => ({
                id: board.boardNo,
                title: board.title,
                content: board.content,
                author: '익명',
                date: board.regDt ? board.regDt.substring(0, 10) : '',
                categories: board.categoryCode ? board.categoryCode.split(',') : []
            }));
            setPosts(mappedData);
        } catch (error) {
            console.error("게시글 불러오기 실패:", error);
        }
    };

    const getFilteredPosts = () => {
        let filtered = posts;
        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter(post => post.categories.includes(selectedCategory));
        }
        if (searchKeyword) {
            filtered = filtered.filter(post => {
                if (searchType === 'title') return post.title.includes(searchKeyword);
                if (searchType === 'author') return post.author.includes(searchKeyword);
                return false;
            });
        }
        return filtered;
    };

    const filteredPosts = getFilteredPosts();

    /**
     * [분기 처리 로직]
     * isGeneral 변수가 true여야 질문 카드가 보입니다.
     */
    const isGeneral = userRole === 'ROLE_USER';
    const indexOfLastPost = currentPage * 16;
    const indexOfFirstPost = indexOfLastPost - 16;

    let currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    if (isGeneral && currentPage === 1) {
        currentPosts = filteredPosts.slice(0, 15);
    }

    const totalPages = Math.ceil(filteredPosts.length / 16);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    const handleSearch = () => setCurrentPage(1);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="bg-[#1a2b4b] text-white py-12 px-4 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-3">상담 게시판</h1>
                    <p className="text-blue-200">
                        {isGeneral
                            ? "비슷한 사례를 찾아보거나 직접 질문하여 해결책을 얻으세요."
                            : "의뢰인의 고민에 전문적인 답변을 남겨주세요."}
                    </p>
                </div>
            </div>

            <FilterSection
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
            />

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

                    {/* ★ 이 부분이 핵심 분기입니다 ★ */}
                    {isGeneral && currentPage === 1 && (
                        <WriteQuestionCard onClick={() => navigate('/write')} />
                    )}

                    {currentPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}

                    {posts.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-20">
                            등록된 게시글이 없습니다.
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-8 mt-12">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30">
                            <ChevronLeft size={20} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                            <button key={num} onClick={() => handlePageChange(num)} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentPage === num ? 'bg-[#1a2b4b] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                                {num}
                            </button>
                        ))}
                        <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="w-full max-w-xl bg-white rounded-full border border-gray-300 px-6 py-3 flex items-center shadow-sm">
                        <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="bg-transparent text-sm text-gray-700 font-medium outline-none mr-4">
                            <option value="title">제목</option>
                            <option value="author">작성자</option>
                        </select>
                        <div className="h-4 w-px bg-gray-300 mr-4"></div>
                        <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="flex-1 bg-transparent outline-none text-gray-700" placeholder="검색어를 입력하세요" />
                        <button onClick={handleSearch} className="text-gray-400 hover:text-blue-600 p-1"><Search size={20} /></button>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ConsultationBoard;