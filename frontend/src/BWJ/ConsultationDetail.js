import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaretLeft, ChatCircleDots, Star, PencilSimple, Trash, CheckCircle, User, PaperPlaneRight, Siren } from '@phosphor-icons/react';

// ============================================
// ★ [테스트용 설정] 이 값을 바꿔가며 확인하세요!
// ============================================
const TEST_USER = {
    id: 1,            // 내 ID (게시글 작성자가 1번이라고 가정)
    role: 'USER',     // 'USER' (일반) 또는 'LAWYER' (변호사)
    name: '홍길동'
};

// 1. 내 글 볼 때 (일반회원)  -> id: 1, role: 'USER'
// 2. 남의 글 볼 때 (일반회원) -> id: 2, role: 'USER'
// 3. 변호사가 볼 때          -> id: 3, role: 'LAWYER'
// ============================================

const ConsultationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    // [변호사용] 답변 입력 state
    const [replyContent, setReplyContent] = useState('');

    // [일반회원용] 후기 모달 state
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedLawyer, setSelectedLawyer] = useState(null);

    // 데이터 불러오기
    useEffect(() => {
        const fetchPost = async () => {
            try {
                // 백엔드: GET /api/boards/{id}
                const res = await axios.get(`http://localhost:8080/api/boards/${id}`);
                setPost(res.data);
                setLoading(false);
            } catch (err) {
                console.error("게시글 로딩 실패", err);
                alert("존재하지 않는 게시글입니다.");
                navigate('/');
            }
        };
        fetchPost();
    }, [id, navigate]);

    // [변호사용] 답변 등록 핸들러
    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return alert("답변 내용을 입력해주세요.");
        try {
            // 백엔드: POST /api/boards/{id}/replies
            await axios.post(`http://localhost:8080/api/boards/${id}/replies`, {
                content: replyContent
                // writerNo는 백엔드에서 처리 (현재 3번으로 고정됨)
            });
            alert("답변이 등록되었습니다.");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("답변 등록 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <div className="text-center py-20 font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;

    // --- 권한 체크 (핵심 로직) ---
    const isMyPost = TEST_USER.role === 'USER' && post.writerId === TEST_USER.id; // Case 1: 내 글
    const isLawyer = TEST_USER.role === 'LAWYER'; // Case 3: 변호사

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20 px-4 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* 상단 네비게이션 */}
                <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <CaretLeft size={20} /> 목록으로 돌아가기
                </button>

                {/* 1. 게시글 본문 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8 border-b border-gray-100">
                        {/* 카테고리 & 관리 버튼 */}
                        <div className="flex items-center justify-between mb-5">
                            <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">
                                {post.category}
                            </span>

                            {/* [Case 1] 내 글일 때만 수정/삭제 버튼 노출 */}
                            {isMyPost && (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <button className="hover:text-blue-600 flex items-center gap-1 transition-colors"><PencilSimple /> 수정</button>
                                    <div className="w-px h-3 bg-gray-300"></div>
                                    <button className="hover:text-red-600 flex items-center gap-1 transition-colors"><Trash /> 삭제</button>
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <User weight="fill" className="text-gray-400" />
                                <span className="text-gray-700 font-medium">{post.writerName}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span>{post.date}</span>
                        </div>
                    </div>

                    <div className="p-8 min-h-[200px] text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                        {post.content}
                    </div>
                </div>

                {/* 2. 전문가 답변 리스트 */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ChatCircleDots size={24} className="text-blue-600" weight="fill" />
                            전문가 답변 <span className="text-blue-600">{post.replies ? post.replies.length : 0}</span>
                        </h3>
                    </div>

                    {post.replies && post.replies.length > 0 ? (
                        post.replies.map((reply) => (
                            <div key={reply.replyId} className={`bg-white rounded-xl p-6 border transition-all ${isLawyer && reply.lawyerId === TEST_USER.id ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200 shadow-sm'}`}>

                                {/* 답변 헤더 */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg border border-gray-200">
                                            {reply.lawyerName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                {reply.lawyerName}
                                                <CheckCircle size={16} className="text-blue-500" weight="fill" />
                                                {/* [Case 3] 변호사 본인 댓글 표시 */}
                                                {isLawyer && reply.lawyerId === TEST_USER.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ME</span>}
                                            </div>
                                            <div className="text-xs text-gray-500">{reply.date}</div>
                                        </div>
                                    </div>

                                    {/* [Case 3] 변호사 본인만 수정/삭제 가능 */}
                                    {isLawyer && reply.lawyerId === TEST_USER.id && (
                                        <div className="flex gap-2 text-xs text-gray-400">
                                            <button className="hover:text-blue-600 underline">수정</button>
                                            <button className="hover:text-red-600 underline">삭제</button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6 pl-1">
                                    {reply.content}
                                </p>

                                {/* [Case 1] 내 글일 때만 -> 1:1 대화 & 후기 버튼 보임 */}
                                {isMyPost && (
                                    <div className="flex gap-3 border-t border-gray-100 pt-4 mt-4">
                                        <button className="flex-1 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm">
                                            <ChatCircleDots size={18} weight="bold" /> 1:1 상담 요청
                                        </button>
                                        <button
                                            onClick={() => { setSelectedLawyer(reply.lawyerName); setIsReviewModalOpen(true); }}
                                            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Star size={18} weight="bold" className="text-yellow-400" /> 후기 작성
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 flex flex-col items-center gap-2">
                            <Siren size={32} className="text-gray-300" />
                            <p>아직 등록된 전문가 답변이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* 3. 답변 작성 폼 ([Case 3] 변호사일 때만 보임) */}
                {isLawyer && (
                    <div className="mt-10 bg-white rounded-xl border border-gray-200 shadow-lg p-6 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <PencilSimple size={20} weight="fill"/>
                            </div>
                            <h3 className="font-bold text-gray-800">전문가 답변 작성</h3>
                        </div>

                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500 resize-none mb-4 transition-all"
                            placeholder="질문자에게 도움이 되는 법률적인 조언을 남겨주세요."
                        ></textarea>

                        <div className="flex justify-end">
                            <button
                                onClick={handleReplySubmit}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
                            >
                                <PaperPlaneRight size={18} weight="bold" /> 답변 등록
                            </button>
                        </div>
                    </div>
                )}

                {/* 후기 작성 모달 (isMyPost일 때만 동작) */}
                {isReviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl transform transition-all scale-100">
                            <h3 className="text-lg font-bold mb-4 text-center">
                                <span className="text-blue-600">{selectedLawyer}</span> 변호사님께<br/>후기를 남겨주세요
                            </h3>
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} size={36} weight="fill" className="text-yellow-400 cursor-pointer hover:scale-110 transition-transform" />
                                ))}
                            </div>
                            <textarea className="w-full h-24 border border-gray-300 rounded-lg p-3 mb-4 resize-none focus:outline-none focus:border-blue-500" placeholder="상담 과정은 어떠셨나요? 솔직한 후기를 남겨주세요."></textarea>
                            <div className="flex gap-2">
                                <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold hover:bg-gray-50 transition-colors">취소</button>
                                <button onClick={() => { alert('후기가 등록되었습니다.'); setIsReviewModalOpen(false); }} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">등록하기</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ConsultationDetail;