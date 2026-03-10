import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../common/api/axiosConfig';

const AIChatPage = () => {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedSources, setExpandedSources] = useState(new Set()); // "msgIdx-srcIdx" 형태로 저장
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const SOURCE_PREVIEW_LEN = 200; // 더보기 전 표시할 글자 수

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (questionText) => {
        const finalQuestion = typeof questionText === 'string' ? questionText : input;
        if (!finalQuestion.trim()) return;

        const userMsg = { text: finalQuestion, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const userId = localStorage.getItem('userId') || 'GUEST';
            const res = await api.post('/api/ai/consult', {
                question: userMsg.text,
                userId: userId
            });
            const data = res.data?.data ?? res.data;
            const aiMsg = {
                text: data?.answer ?? res.data?.answer,
                isUser: false,
                sources: data?.related_cases ?? res.data?.related_cases ?? []
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: "서버 연결 오류가 발생했습니다.", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 대화 내용을 요약하여 상담게시판 작성 페이지로 이동
    const handleSummarizeAndWrite = () => {
        const summaryTitle = messages.length > 0
            ? (messages.find(m => m.isUser)?.text?.slice(0, 30) || "AI 상담 내용") + (messages.find(m => m.isUser)?.text?.length > 30 ? "..." : "")
            : "AI 상담 내용";
        const summaryContent = messages.map(m =>
            `${m.isUser ? "[나]" : "[LAW PARTNER]"}\n${m.text}`
        ).join("\n\n");
        navigate('/write', { state: { title: summaryTitle, content: summaryContent } });
    };

    const faqList = [
        { icon: "📄", title: "내용증명 작성 가이드" },
        { icon: "🏠", title: "임대차 보호법 해설" },
        { icon: "⚖️", title: "민사 소송 절차" },
        { icon: "📝", title: "계약서 법적 검토" }
    ];

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">

            {/* ⬅️ 왼쪽 사이드바 */}
            <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                {/* 1. 새 상담 시작 */}
                <div className="pt-2.5 px-3 pb-3 border-b border-gray-200">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center gap-2.5 text-gray-600 text-sm py-2 px-3 rounded-lg bg-white/60 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 shadow-sm"
                    >
                        <span className="text-lg">💬</span>
                        <span className="font-medium">새로운 상담 시작</span>
                    </button>
                </div>

                {/* 2. 최근 상담 내역 */}
                <div className="flex-1 overflow-y-auto px-2 py-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-4 pl-2">최근 상담 내역</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="cursor-pointer hover:text-blue-600 truncate pl-2">전세 보증금 반환 소송</li>
                        <li className="cursor-pointer hover:text-blue-600 truncate pl-2">저작권 침해 내용증명</li>
                        <li className="cursor-pointer hover:text-blue-600 truncate pl-2">근로계약서 검토 요청</li>
                    </ul>
                </div>

                {/* 3. 자주 묻는 질문 (사이드바 하단까지) */}
                <div className="shrink-0 px-2 py-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3 pl-2">자주 묻는 질문</h3>
                    <div className="space-y-2">
                        {faqList.map((faq, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(faq.title)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:border hover:border-gray-200 transition flex items-center gap-2"
                            >
                                <span className="text-base">{faq.icon}</span>
                                <span className="truncate">{faq.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* ➡️ 오른쪽 메인 채팅 영역 */}
            <div className="flex-1 flex flex-col relative bg-white overflow-hidden">

                {/* 💬 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                {!msg.isUser && <span className="text-sm font-bold text-gray-700 mb-1">LAW PARTNER</span>}
                                <div className={`px-4 py-3 text-[14px] leading-relaxed rounded-2xl ${
                                    msg.isUser
                                        ? 'bg-blue-50 text-gray-800 rounded-tr-sm'
                                        : 'bg-white text-gray-800'
                                }`}>
                                    <span className="whitespace-pre-wrap">{msg.text}</span>
                                </div>
                                {!msg.isUser && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 w-full border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
                                        <div className="font-bold text-gray-700 mb-2">📚 참고 판례 ({msg.sources.length}건)</div>
                                        {msg.sources.map((src, i) => {
                                            const key = `${idx}-${i}`;
                                            const isExpanded = expandedSources.has(key);
                                            const needsMore = src.length > SOURCE_PREVIEW_LEN;
                                            const displayText = needsMore && !isExpanded
                                                ? src.slice(0, SOURCE_PREVIEW_LEN) + "..."
                                                : src;
                                            return (
                                                <div key={i} className="text-gray-600 mb-3 last:mb-0">
                                                    <div className="whitespace-pre-wrap">• {displayText}</div>
                                                    {needsMore && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedSources(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(key)) next.delete(key);
                                                                else next.add(key);
                                                                return next;
                                                            })}
                                                            className="mt-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                                                        >
                                                            {isExpanded ? "접기" : "더보기"}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 max-w-4xl mx-auto">
                            <div className="text-gray-500 py-2">판례를 분석 중입니다...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ⌨️ 하단 입력창 영역 (플로팅) */}
                <div className="shrink-0 w-full max-w-4xl mx-auto px-6 pb-4 pt-1">
                    {/* 요약 후 작성 / 파일 추가 버튼 */}
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={handleSummarizeAndWrite}
                            disabled={messages.length <= 1}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            📋 상담내용으로 글쓰기
                        </button>
                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        // TODO: 파일 첨부 서버 연동
                                        console.log('첨부 파일:', e.target.files);
                                        alert(`파일 ${e.target.files.length}개가 선택되었습니다. (연동 예정)`);
                                    }
                                    e.target.value = '';
                                }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-1"
                            >
                                📎 파일 추가
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                const url = prompt('URL을 입력하세요');
                                if (url) {
                                    // TODO: URL 첨부 로직
                                    alert('URL 첨부 기능 연동 예정');
                                }
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                        >
                            🔗 URL
                        </button>
                    </div>

                    <div className="relative shadow-lg rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-sm">
                        <textarea
                            className="w-full bg-transparent border-none rounded-2xl px-5 py-3.5 pr-14 text-[14px] resize-none focus:outline-none focus:ring-0"
                            rows="2"
                            placeholder="법률적인 궁금증을 물어보세요..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-50 disabled:bg-gray-300 disabled:hover:bg-gray-300"
                        >
                            ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;
