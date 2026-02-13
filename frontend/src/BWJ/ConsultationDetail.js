import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaretLeft, ChatCircleDots, Star, PencilSimple, Trash, CheckCircle, User, PaperPlaneRight, Siren } from '@phosphor-icons/react';

const ConsultationDetail = () => {
    const { id } = useParams(); // URL에서 게시글 번호(id)를 가져옵니다.
    const navigate = useNavigate();

    // --- [리액트 개념] 상태 관리(State) ---
    // API로 가져온 게시글 정보를 저장하는 바구니입니다.
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedLawyer, setSelectedLawyer] = useState(null);

    // --- [권한 제어] JWT 토큰 정보 가져오기 ---
    // 로그인 시 저장했던 정보들을 꺼내서 현재 사용자가 누구인지 파악합니다.
    const currentUser = {
        userNo: localStorage.getItem('userNo'),
        role: localStorage.getItem('userRole'), // 'ROLE_USER' 또는 'ROLE_LAWYER'
        name: localStorage.getItem('userNm')
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // 백엔드 BoardController의 상세보기 API 호출
                const res = await axios.get(`http://localhost:8080/api/boards/${id}`);
                setPost(res.data);
                setLoading(false);
            } catch (err) {
                console.error("게시글 로딩 실패", err);
                alert("존재하지 않는 게시글입니다.");
                navigate('/consultation');
            }
        };
        fetchPost();
    }, [id, navigate]);

    // 답변 등록 핸들러 (변호사 전용)
    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return alert("답변 내용을 입력해주세요.");
        try {
            // 답변 데이터 전송
            await axios.post(`http://localhost:8080/api/boards/${id}/replies`, {
                content: replyContent,
                lawyerNo: currentUser.userNo // 현재 로그인한 변호사의 번호
            });
            alert("답변이 등록되었습니다.");
            window.location.reload(); // 새로고침해서 답변 목록 업데이트
        } catch (err) {
            alert("답변 등록 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <div className="text-center py-20 font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;

    // --- [분기 제어 로직] ---
    // 1. 내가 쓴 글인가? (작성자 번호와 로그인한 유저 번호 비교)
    const isMyPost = currentUser.role === 'ROLE_USER' && String(post.writerNo) === String(currentUser.userNo);
    // 2. 현재 사용자가 변호사인가?
    const isLawyer = currentUser.role === 'ROLE_LAWYER';

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/consultation')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <CaretLeft size={20} /> 목록으로 돌아가기
                </button>

                {/* 게시글 본문 영역 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-5">
                            <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">
                                {post.categoryCode}
                            </span>

                            {/* [분기 제어] 작성자 본인에게만 보이는 수정/삭제 버튼 */}
                            {isMyPost && (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <button className="hover:text-blue-600 flex items-center gap-1 transition-colors"><PencilSimple /> 수정</button>
                                    <button className="hover:text-red-600 flex items-center gap-1 transition-colors"><Trash /> 삭제</button>
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <User weight="fill" className="text-gray-400" />
                            <span className="text-gray-700 font-medium">익명 질문자</span>
                            <span>{post.regDt?.substring(0, 10)}</span>
                        </div>
                    </div>
                    <div className="p-8 min-h-[200px] text-gray-700 whitespace-pre-wrap text-lg">
                        {post.content}
                    </div>
                </div>

                {/* 전문가 답변 섹션 */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ChatCircleDots size={24} className="text-blue-600" weight="fill" />
                        전문가 답변 <span className="text-blue-600">{post.replies ? post.replies.length : 0}</span>
                    </h3>

                    {post.replies && post.replies.length > 0 ? (
                        post.replies.map((reply) => (
                            <div key={reply.replyNo} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                            {reply.lawyerNm[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                {reply.lawyerNm} 변호사
                                                <CheckCircle size={16} className="text-blue-500" weight="fill" />
                                            </div>
                                            <div className="text-xs text-gray-500">{reply.regDt?.substring(0, 10)}</div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{reply.content}</p>

                                {/* [분기 제어] 질문자 본인에게만 보이는 상담요청/후기 버튼 */}
                                {isMyPost && (
                                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                                        <button className="flex-1 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-bold text-sm">1:1 상담 요청</button>
                                        <button
                                            onClick={() => { setSelectedLawyer(reply.lawyerNm); setIsReviewModalOpen(true); }}
                                            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-sm"
                                        >후기 작성</button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                            <Siren size={32} className="mx-auto mb-2" />
                            <p>아직 등록된 전문가 답변이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* [분기 제어] 변호사에게만 보이는 답변 작성 창 */}
                {isLawyer && (
                    <div className="mt-10 bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none mb-4"
                            placeholder="질문자에게 도움이 되는 법률적인 조언을 남겨주세요."
                        ></textarea>
                        <div className="flex justify-end">
                            <button onClick={handleReplySubmit} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                                <PaperPlaneRight size={18} weight="bold" /> 답변 등록
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* 후기 모달 생략 (기존 코드 유지) */}
        </div>
    );
};

export default ConsultationDetail;