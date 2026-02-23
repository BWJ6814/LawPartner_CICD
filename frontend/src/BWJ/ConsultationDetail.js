import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaretLeft, ChatCircleDots, Star, PencilSimple, Trash, CheckCircle, User, PaperPlaneRight, Siren, X, FileText, DownloadSimple } from '@phosphor-icons/react';

const ConsultationDetail = () => {
    // [개념] useParams: URL에 정의된 :id 값을 가져옵니다. (어떤 글을 보여줄지 결정)
    const { id } = useParams();
    const navigate = useNavigate();

    // [상태관리] 화면에 표시될 모든 데이터와 UI 상태들을 useState 바구니에 담습니다.
    const [post, setPost] = useState(null); // 게시글 정보 (제목, 내용, 파일, 댓글 등)
    const [loading, setLoading] = useState(true); // 로딩 중 여부
    const [replyContent, setReplyContent] = useState(''); // 전문가가 새로 다는 답변 내용

    // 수정 모드 관련 상태
    const [isEditing, setIsEditing] = useState(false); // 수정 중인지 여부
    const [editTitle, setEditTitle] = useState(''); // 수정할 제목
    const [editContent, setEditContent] = useState(''); // 수정할 내용

    // 후기(리뷰) 모달 관련 상태
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedLawyer, setSelectedLawyer] = useState(null); // 리뷰 대상 변호사
    const [rating, setRating] = useState(0); // 별점
    const [reviewContent, setReviewContent] = useState(''); // 리뷰 내용

    // 로컬스토리지에서 로그인 유저 정보 가져오기
    const currentUser = {
        userNo: localStorage.getItem('userNo'),
        role: localStorage.getItem('userRole'),
        name: localStorage.getItem('userNm') || localStorage.getItem('nickNm')
    };

    // [개념] useEffect: 상세 페이지에 들어오자마자 실행되어 백엔드에서 데이터를 가져옵니다.
    useEffect(() => {
        const fetchPost = async () => {
            try {
                // 백엔드 컨트롤러의 @GetMapping("/{id}") 호출
                const res = await axios.get(`http://localhost:8080/api/boards/${id}`);
                setPost(res.data); // 백엔드에서 받은 풀데이터를 post에 저장
                setLoading(false);
            } catch (err) {
                console.error("게시글 로딩 실패", err);
                alert("존재하지 않는 게시글입니다.");
                navigate('/consultation');
            }
        };
        fetchPost();
    }, [id, navigate]);

    // [함수] 파일 다운로드 처리 (나중에 실제 서버 경로 연결 시 수정 가능)
    const handleFileDownload = (fileNo, fileName) => {
        alert(`${fileName} 파일을 다운로드합니다. (서버 다운로드 로직 연결 필요)`);
    };

    // [함수] 게시글 수정 처리
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
            // 수정한 내용으로 화면 갱신
            setPost({ ...post, title: editTitle, content: editContent });
        } catch (err) {
            console.error("수정 실패", err);
            alert("게시글 수정 중 오류가 발생했습니다.");
        }
    };

    // [함수] 게시글 삭제 처리
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

    // [함수] 매칭 완료 처리
    const handleMatchComplete = async () => {
        if (window.confirm("매칭을 완료하시겠습니까? 완료 후에는 더 이상 변호사가 답변을 달 수 없습니다.")) {
            try {
                await axios.put(`http://localhost:8080/api/boards/${id}/match`);
                alert("매칭이 완료되었습니다.");
                window.location.reload(); // 상태 업데이트를 위해 새로고침
            } catch (err) {
                alert("매칭 완료 처리 중 오류가 발생했습니다.");
            }
        }
    };

    // [함수] 후기 등록 처리
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
                replyNo: selectedLawyer.replyNo
            });
            alert("후기가 등록되었습니다.");
            setIsReviewModalOpen(false);
            setRating(0);
            setReviewContent('');
        } catch (err) {
            alert("후기 등록 중 오류가 발생했습니다.");
        }
    };

    // [함수] 변호사의 답변 등록 처리
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

    // 데이터 로딩 중 화면
    if (loading) return <div className="text-center py-20 font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;

    // 본인 글 여부 및 변호사 여부 확인
    const isMyPost = currentUser.role === 'ROLE_USER' && String(post.writerNo) === String(currentUser.userNo);
    const isLawyer = currentUser.role === 'ROLE_LAWYER';

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20 px-4 font-sans text-left">
            <div className="max-w-4xl mx-auto">
                {/* 상단 버튼 */}
                <button onClick={() => navigate('/consultation')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <CaretLeft size={20} /> 목록으로 돌아가기
                </button>

                {/* 메인 질문 카드 영역 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    {/* 상단 섹션: 카테고리, 제목, 작성정보 */}
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

                    {/* 중단 섹션: 본문 내용 및 첨부파일 */}
                    <div className="p-8">
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
                            <>
                                <div className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed mb-10">
                                    {post.content}
                                </div>

                                {/* 첨부파일 표시 영역 (가로 2열 배치) */}
                                {post.files && post.files.length > 0 && (
                                    <div className="mt-10 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                                            <FileText size={20} /> 첨부파일 ({post.files.length})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {post.files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleFileDownload(file.fileNo, file.originName)}
                                                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 cursor-pointer transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                                            <FileText size={20} className="text-blue-500" />
                                                        </div>
                                                        <span className="text-sm text-gray-700 font-medium truncate">{file.originName}</span>
                                                    </div>
                                                    <DownloadSimple size={20} className="text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* 전문가 답변 섹션 */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b-2 border-gray-900 pb-3">
                        전문가 답변 <span className="text-blue-600">{post.replies ? post.replies.length : 0}</span>
                    </h3>

                    {post.replies && post.replies.length > 0 ? (
                        post.replies.map((reply) => (
                            <div key={reply.replyNo} className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
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
                                        <button className="w-full py-3.5 rounded-lg border border-blue-500 text-blue-600 font-bold flex justify-center items-center gap-2 hover:bg-blue-50 transition-all">
                                            <ChatCircleDots size={20} /> 1:1 대화 요청하기
                                        </button>
                                        <button
                                            onClick={() => { setSelectedLawyer(reply); setIsReviewModalOpen(true); }}
                                            className="w-full py-3.5 rounded-lg border border-gray-300 text-gray-700 font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-all"
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

                {/* 하단 매칭 완료 버튼 (의뢰인용) */}
                {isMyPost && post.matchYn !== 'Y' && (
                    <div className="mt-12 flex justify-center">
                        <button onClick={handleMatchComplete} className="bg-[#1c2438] text-white px-12 py-4 rounded-lg font-bold text-lg shadow-md hover:bg-black transition-colors">
                            매칭 완료하기
                        </button>
                    </div>
                )}

                {/* 전문가 답변 등록 영역 (변호사용) */}
                {isLawyer && post.matchYn !== 'Y' && (
                    <div className="mt-10 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none mb-4"
                            placeholder="질문자에게 도움이 되는 법률적인 조언을 남겨주세요."
                        ></textarea>
                        <div className="flex justify-end">
                            <button onClick={handleReplySubmit} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md">
                                <PaperPlaneRight size={18} weight="bold" /> 답변 등록
                            </button>
                        </div>
                    </div>
                )}

                {/* 매칭 완료 후 안내 (변호사용) */}
                {isLawyer && post.matchYn === 'Y' && (
                    <div className="mt-10 p-6 bg-gray-100 text-center rounded-xl text-gray-500 font-bold border border-gray-200">
                        의뢰인이 매칭을 완료하여 더 이상 답변을 등록할 수 없습니다.
                    </div>
                )}
            </div>

            {/* 후기 작성 모달창 (의뢰인 클릭 시 활성화) */}
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

                            {/* 별점 선택 영역 */}
                            <div className="flex justify-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform active:scale-90">
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
                                <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all">
                                    취소
                                </button>
                                <button onClick={handleReviewSubmit} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all">
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