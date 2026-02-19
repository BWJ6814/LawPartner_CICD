import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaretLeft, ChatCircleDots, Star, PencilSimple, Trash, CheckCircle, User, PaperPlaneRight, Siren, X } from '@phosphor-icons/react';

const ConsultationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewContent, setReviewContent] = useState('');

    const currentUser = {
        userNo: localStorage.getItem('userNo'),
        role: localStorage.getItem('userRole'),
        name: localStorage.getItem('userNm') || localStorage.getItem('nickNm')
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
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

    const handleUpdate = async () => {
        if (!editTitle.trim()) return alert("제목을 입력해주세요.");
        if (!editContent.trim()) return alert("내용을 입력해주세요.");

        try {
            await axios.put(`http://localhost:8080/api/boards/${id}`, {
                title: editTitle,
                content: editContent
            });
            alert("게시글이 성공적으로 수정되었습니다.");
            setIsEditing(false);
            setPost({ ...post, title: editTitle, content: editContent });
        } catch (err) {
            console.error("수정 실패", err);
            alert("게시글 수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (window.confirm("정말 이 게시글을 삭제하시겠습니까? (달린 답변도 모두 삭제됩니다)")) {
            try {
                await axios.delete(`http://localhost:8080/api/boards/${id}`);
                alert("삭제되었습니다.");
                navigate('/consultation');
            } catch (err) {
                console.error("삭제 실패", err);
                alert("게시글 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleMatchComplete = async () => {
        if (window.confirm("매칭을 완료하시겠습니까? 완료 후에는 더 이상 변호사가 답변을 달 수 없습니다.")) {
            try {
                await axios.put(`http://localhost:8080/api/boards/${id}/match`);
                alert("매칭이 완료되었습니다.");
                window.location.reload();
            } catch (err) {
                alert("오류가 발생했습니다.");
            }
        }
    };

    // ==========================================
    // [핵심 변경] 카테고리 제거 & 답변 번호 추가
    // ==========================================
    const handleReviewSubmit = async () => {
        if (rating === 0) return alert("별점을 선택해주세요.");
        if (!reviewContent.trim()) return alert("후기 내용을 입력해주세요.");

        try {
            await axios.post(`http://localhost:8080/api/boards/${id}/reviews`, {
                lawyerNo: selectedLawyer.lawyerNo,
                writerNo: currentUser.userNo,
                writerNm: currentUser.name || "익명",
                stars: rating,
                content: reviewContent,
                // category: post.categoryCode <-- 이 부분 삭제!
                replyNo: selectedLawyer.replyNo // 운조님 요청대로 답변 번호를 같이 보냅니다.
            });
            alert("후기가 등록되었습니다.");
            setIsReviewModalOpen(false);
            setRating(0);
            setReviewContent('');
        } catch (err) {
            alert("후기 등록 중 오류가 발생했습니다.");
        }
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return alert("답변 내용을 입력해주세요.");
        try {
            await axios.post(`http://localhost:8080/api/boards/${id}/replies`, {
                content: replyContent,
                lawyerNo: currentUser.userNo
            });
            alert("답변이 등록되었습니다.");
            window.location.reload();
        } catch (err) {
            alert("답변 등록 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <div className="text-center py-20 font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;

    const isMyPost = currentUser.role === 'ROLE_USER' && String(post.writerNo) === String(currentUser.userNo);
    const isLawyer = currentUser.role === 'ROLE_LAWYER';

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/consultation')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <CaretLeft size={20} /> 목록으로 돌아가기
                </button>

                {/* 질문글 본문 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-5">
                            <span className="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                                {post.categoryCode}
                            </span>

                            {isMyPost && !isEditing && (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <button
                                        onClick={() => {
                                            setEditTitle(post.title);
                                            setEditContent(post.content);
                                            setIsEditing(true);
                                        }}
                                        className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                                    >
                                        <PencilSimple /> 수정
                                    </button>
                                    <button onClick={handleDelete} className="hover:text-red-600 flex items-center gap-1 transition-colors">
                                        <Trash /> 삭제
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-2xl md:text-3xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2 focus:outline-none focus:border-blue-500"
                                placeholder="제목을 입력하세요"
                            />
                        ) : (
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <User weight="fill" className="text-gray-400" />
                            <span className="text-gray-700 font-medium">{post.nickNm}</span>
                            <span>{post.regDt?.substring(0, 10)}</span>
                        </div>
                    </div>

                    <div className="p-8 min-h-[150px]">
                        {isEditing ? (
                            <div>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-lg text-gray-700 leading-relaxed"
                                    placeholder="내용을 입력하세요"
                                ></textarea>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
                                        취소
                                    </button>
                                    <button onClick={handleUpdate} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-colors">
                                        저장 완료
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                                {post.content}
                            </div>
                        )}
                    </div>
                </div>

                {/* 전문가 답변 리스트 */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b-2 border-gray-900 pb-3">
                        전문가 답변 <span className="text-blue-600">{post.replies ? post.replies.length : 0}</span>
                    </h3>

                    {post.replies && post.replies.length > 0 ? (
                        post.replies.map((reply) => (
                            <div key={reply.replyNo} className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                        {reply.lawyerNm ? reply.lawyerNm[0] : '변'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 flex items-center gap-1 text-lg">
                                            {reply.lawyerNm} 변호사
                                            <CheckCircle size={16} className="text-blue-500" weight="fill" />
                                        </div>
                                        <div className="text-sm text-gray-400">{reply.regDt?.substring(0, 10)}</div>
                                    </div>
                                </div>
                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg mb-8">{reply.content}</p>

                                {isMyPost && (
                                    <div className="flex flex-col gap-2">
                                        <button className="w-full py-3.5 rounded-lg border border-blue-500 text-blue-600 font-bold flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors">
                                            <ChatCircleDots size={20} /> 1:1 대화 요청하기
                                        </button>
                                        <button
                                            onClick={() => { setSelectedLawyer(reply); setIsReviewModalOpen(true); }}
                                            className="w-full py-3.5 rounded-lg border border-gray-300 text-gray-700 font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors"
                                        >
                                            <Star size={20} /> 평점 및 후기 입력
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
                            <Siren size={32} className="mx-auto mb-2" />
                            <p>아직 등록된 전문가 답변이 없습니다.</p>
                        </div>
                    )}
                </div>

                {isMyPost && post.matchYn !== 'Y' && (
                    <div className="mt-12 flex justify-center">
                        <button onClick={handleMatchComplete} className="bg-[#1c2438] text-white px-12 py-4 rounded-lg font-bold text-lg shadow-md hover:bg-black transition-colors">
                            매칭 완료하기
                        </button>
                    </div>
                )}

                {isLawyer && post.matchYn !== 'Y' && (
                    <div className="mt-10 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none mb-4"
                            placeholder="질문자에게 도움이 되는 법률적인 조언을 남겨주세요."
                        ></textarea>
                        <div className="flex justify-end">
                            <button onClick={handleReplySubmit} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <PaperPlaneRight size={18} weight="bold" /> 답변 등록
                            </button>
                        </div>
                    </div>
                )}

                {isLawyer && post.matchYn === 'Y' && (
                    <div className="mt-10 p-6 bg-gray-100 text-center rounded-xl text-gray-500 font-bold border border-gray-200">
                        의뢰인이 매칭을 완료하여 더 이상 답변을 등록할 수 없습니다.
                    </div>
                )}
            </div>

            {/* 후기 작성 모달창 */}
            {isReviewModalOpen && selectedLawyer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">후기 작성</h2>
                            <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                                <p className="text-blue-600 text-sm font-bold mb-1">상담 받은 글</p>
                                <p className="text-gray-800 text-sm font-medium truncate">{post.title}</p>
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedLawyer.lawyerNm} 변호사</h3>
                                <p className="text-gray-500 text-sm">전문가의 답변이 도움이 되셨나요?</p>
                            </div>

                            <div className="flex justify-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                                        <Star
                                            size={40}
                                            weight={star <= rating ? "fill" : "regular"}
                                            className={star <= rating ? "text-yellow-400" : "text-gray-300"}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-blue-600 text-sm font-bold mb-6">별점을 선택해주세요</p>

                            <textarea
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                placeholder="솔직한 후기를 남겨주세요."
                                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none mb-6 text-sm"
                            ></textarea>

                            <div className="flex gap-3">
                                <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">
                                    취소
                                </button>
                                <button onClick={handleReviewSubmit} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md">
                                    등록하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationDetail;