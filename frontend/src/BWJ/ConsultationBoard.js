import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Menu, User, Scale, Gavel, Car, Home, Key,
    HandCoins, CircleDollarSign, Calculator, HeartCrack,
    GitFork, Briefcase, Building2, Copyright,
    TrendingDown, FileText, MoreHorizontal, Plus, ChevronDown, ChevronUp, Filter,
    ChevronLeft, ChevronRight, MessageSquare
} from 'lucide-react';

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

const FilterSection = ({ selectedCategory, setSelectedCategory, selectedSort, setSelectedSort }) => {
    // 리액트의 useState 개념: 화면의 특정 영역(탭)이 열려있는지 닫혀있는지 상태를 기억하는 변수입니다.
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

                {/* 카테고리 탭이 열려있을 때 */}
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

                {/* [추가됨] 정렬 탭이 열려있을 때 보이는 버튼들 */}
                {activeTab === 'sort' && (
                    <div className="flex flex-wrap gap-3 animate-fadeIn p-4 bg-gray-50 rounded-lg border border-gray-100">
                        {['최신순', '오래된 순', '댓글 많은 순', '댓글 적은 순'].map(sort => (
                            <button
                                key={sort}
                                onClick={() => {
                                    setSelectedSort(sort); // 선택한 정렬방식으로 상태 업데이트
                                    setActiveTab(null); // 버튼 클릭 시 탭 닫기
                                }}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm ${selectedSort === sort ? 'bg-[#1a2b4b] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            >
                                {sort}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const WriteQuestionCard = ({ onClick }) => (
    <div onClick={onClick} className="group h-full min-h-[220px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
        <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            <Plus size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">질문 등록하기</h3>
        <p className="text-blue-100 text-sm text-center px-6">복잡한 법률 고민,<br/>전문가와 AI에게 물어보세요.</p>
    </div>
);

const PostCard = ({ post, onClick }) => (
    <div onClick={onClick} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[220px]">
        <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{post.title}</h3>
        </div>
        <div className="flex-grow mb-4">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{post.content}</p>
        </div>
        <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{post.date}</span>
                <span className="flex items-center gap-2">
                    {/* [추가됨] 카드 하단에 댓글 수 표시 아이콘 추가 */}
                    <span className="flex items-center gap-1 text-gray-500"><MessageSquare size={12} /> {post.replyCnt}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {post.categories && post.categories.map((tag, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-medium">#{tag}</span>
                ))}
            </div>
        </div>
    </div>
);

const ConsultationBoard = () => {
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [userRole, setUserRole] = useState((localStorage.getItem('userRole') || 'GENERAL').toUpperCase());
    const [currentPage, setCurrentPage] = useState(1);

    // 이 상태들이 바뀌면 화면(리스트)이 다시 렌더링 됩니다.
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        const currentRole = localStorage.getItem('userRole');
        if (currentRole) {
            setUserRole(currentRole.toUpperCase());
        }
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/boards');

            const mappedData = response.data.map(board => ({
                id: board.boardNo,
                title: board.title,
                content: board.content,
                author: board.nicknameVisibleYn === 'Y' ? (board.nickNm || '익명') : '익명',
                date: board.regDt ? board.regDt.substring(0, 10) : '',
                // [추가됨] 정렬을 위해 밀리초 단위까지 있는 원본 시간도 가져옵니다.
                fullDate: board.regDt ? board.regDt : '',
                // [추가됨] 댓글 수를 가져옵니다.
                replyCnt: board.replyCnt || 0,
                categories: board.categoryCode ? board.categoryCode.split(',') : []
            }));
            setPosts(mappedData);
        } catch (error) {
            console.error("게시글 불러오기 실패:", error);
        }
    };

    // [핵심 변경] 검색과 정렬을 처리하는 함수
    // 리액트의 배열 다루기 개념: 원본 배열(posts)은 건드리지 않고, 사본을 만들어 가공한 뒤 화면에 뿌려줍니다.
    const getFilteredPosts = () => {
        let filtered = [...posts]; // 배열 복사

        // 1. 검색어 필터링
        if (searchKeyword.trim() !== '') {
            filtered = filtered.filter(post => post.title.toLowerCase().includes(searchKeyword.toLowerCase()));
        }

        // 2. 카테고리 필터링
        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter(post => post.categories.includes(selectedCategory));
        }

        // 3. 정렬 처리 (.sort() 함수 사용)
        filtered.sort((a, b) => {
            if (selectedSort === '최신순') {
                return new Date(b.fullDate) - new Date(a.fullDate); // 날짜 내림차순
            } else if (selectedSort === '오래된 순') {
                return new Date(a.fullDate) - new Date(b.fullDate); // 날짜 오름차순
            } else if (selectedSort === '댓글 많은 순') {
                return b.replyCnt - a.replyCnt; // 숫자 내림차순
            } else if (selectedSort === '댓글 적은 순') {
                return a.replyCnt - b.replyCnt; // 숫자 오름차순
            }
            return 0;
        });

        return filtered;
    };

    const filteredPosts = getFilteredPosts();
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

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
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

                    {isGeneral && currentPage === 1 && (
                        <WriteQuestionCard onClick={() => navigate('/write')} />
                    )}

                    {currentPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onClick={() => navigate(`/consultation/${post.id}`)}
                        />
                    ))}

                    {filteredPosts.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-20 flex flex-col items-center">
                            <Search size={48} className="text-gray-300 mb-4" />
                            <p className="text-lg font-bold">검색 결과가 없습니다.</p>
                            <p className="text-sm">다른 검색어나 카테고리를 선택해 보세요.</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-8 mt-12">
                    {/* [기존] 페이지네이션 버튼 영역 */}
                    {totalPages > 0 && (
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
                    )}

                    {/* [추가됨] 검색창 디자인 (페이지 번호 바로 아래 배치) */}
                    <div className="relative w-full max-w-lg mt-4 shadow-sm">
                        <input
                            type="text"
                            placeholder="찾고 싶은 고민의 제목을 검색해 보세요"
                            value={searchKeyword}
                            // 사용자가 키보드를 칠 때마다 searchKeyword 변수 값을 바꿔줍니다.
                            // 리액트는 이 값이 바뀔 때마다 자동으로 화면을 새로 그려 필터링을 실시간으로 적용합니다.
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                        />
                        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ConsultationBoard;