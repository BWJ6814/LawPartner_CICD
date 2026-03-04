import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const AIChatPage = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // [리액트 개념: useEffect] 새 메시지가 추가될 때 채팅창 안에서만! 스크롤을 맨 아래로 내립니다.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // [리액트 개념: 매개변수 활용] FAQ 버튼을 눌렀을 때도 이 함수를 재활용하기 위해 questionText를 받습니다.
    const sendMessage = async (questionText) => {
        const finalQuestion = typeof questionText === 'string' ? questionText : input;
        if (!finalQuestion.trim()) return;

        const userMsg = { text: finalQuestion, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const userId = localStorage.getItem('userId') || 'GUEST';
            const res = await axios.post('http://localhost:8080/api/ai/consult', {
                question: userMsg.text,
                userId: userId
            });

            const aiMsg = {
                text: res.data.answer,
                isUser: false,
                sources: res.data.related_cases || []
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: "서버 연결 오류가 발생했습니다.", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 첫 번째 사진에 있는 FAQ 목록입니다.
    const faqList = [
        { icon: "📄", title: "내용증명 작성 가이드" },
        { icon: "🏠", title: "임대차 보호법 해설" },
        { icon: "⚖️", title: "민사 소송 절차" },
        { icon: "📝", title: "계약서 법적 검토" }
    ];

    return (
        // [핵심 해결책] 전체 높이를 100vh(전체 화면)에서 상단 헤더 높이(약 80px)를 뺀 만큼만 차지하게 강제 고정합니다.
        // 그리고 overflow-hidden을 주어 전체 페이지 스크롤을 원천 차단합니다!
        <div className="flex h-[calc(100vh-80px)] bg-white font-sans overflow-hidden">

            {/* ⬅️ 왼쪽 사이드바 영역 (사진과 똑같이 구현) */}
            <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                {/* 1. 사이드바 로고 및 새 상담 버튼 */}
                <div className="p-5">
                    <div className="flex items-center gap-2 font-bold text-blue-600 text-lg mb-6">
                        <span>⚖️ LAW PARTNER</span>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span>+</span> 새로운 상담 시작
                    </button>
                </div>

                {/* 2. 최근 상담 내역 리스트 */}
                <div className="flex-1 overflow-y-auto px-5 py-2">
                    <h3 className="text-xs font-semibold text-gray-400 mb-4">최근 상담 내역</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="cursor-pointer hover:text-blue-600 truncate">💬 전세 보증금 반환 소송</li>
                        <li className="cursor-pointer hover:text-blue-600 truncate">💬 저작권 침해 내용증명</li>
                        <li className="cursor-pointer hover:text-blue-600 truncate">💬 근로계약서 검토 요청</li>
                    </ul>
                </div>

                {/* 3. 유저 정보 (사이드바 하단 고정) */}
                <div className="p-5 border-t border-gray-200 flex items-center gap-3 bg-white">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        U
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-800">User 님</div>
                        <div className="text-xs text-gray-500">Premium Plan</div>
                    </div>
                </div>
            </div>


            {/* ➡️ 오른쪽 메인 채팅 영역 */}
            {/* 부모에 flex-col과 overflow-hidden을 주어야 자식인 채팅방 안에서만 스크롤이 생깁니다. */}
            <div className="flex-1 flex flex-col relative bg-white overflow-hidden">

                {/* 💬 실제 메시지가 보이는 곳 (이 영역만 스크롤 됨!) */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                            {/* AI / 유저 아이콘 */}
                            {!msg.isUser && (
                                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shrink-0">
                                    ✨
                                </div>
                            )}

                            {/* 말풍선 내용 */}
                            <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                {!msg.isUser && <span className="text-sm font-bold text-gray-700 mb-1">LAW PARTNER</span>}
                                <div className={`px-5 py-4 text-[15px] leading-relaxed rounded-2xl ${
                                    msg.isUser
                                        ? 'bg-blue-50 text-gray-800 rounded-tr-sm'
                                        : 'bg-white text-gray-800' // AI는 사진처럼 배경 없이 텍스트만 보이게
                                }`}>
                                    <span className="whitespace-pre-wrap">{msg.text}</span>
                                </div>

                                {/* 판례 소스 (AI일 때만) */}
                                {!msg.isUser && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 w-full border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm">
                                        <div className="font-bold text-gray-700 mb-2">📚 참고 판례 ({msg.sources.length}건)</div>
                                        {msg.sources.map((src, i) => (
                                            <div key={i} className="text-gray-600 mb-1 last:mb-0">• {src}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 로딩 애니메이션 */}
                    {isLoading && (
                        <div className="flex gap-4 max-w-4xl mx-auto">
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shrink-0 animate-pulse">
                                ✨
                            </div>
                            <div className="text-gray-500 py-2">판례를 분석 중입니다...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ⌨️ 하단 입력창 및 FAQ 영역 (항상 화면 아래 고정!) */}
                <div className="shrink-0 w-full max-w-4xl mx-auto px-8 pb-8 pt-2">

                    {/* 사진과 똑같은 4개의 네모난 FAQ 카드 (채팅이 시작되면 숨겨집니다) */}
                    {messages.length === 1 && (
                        <div className="mb-6">
                            <div className="text-sm font-bold text-gray-600 mb-3">💡 자주 묻는 질문</div>
                            <div className="grid grid-cols-4 gap-3">
                                {faqList.map((faq, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => sendMessage(faq.title)}
                                        className="border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 hover:border-gray-300 transition flex flex-col gap-2"
                                    >
                                        <span className="text-xl">{faq.icon}</span>
                                        <span className="text-sm text-gray-700 font-medium">{faq.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 사진과 똑같은 회색 배경의 큰 입력창 */}
                    <div className="relative">
                        <textarea
                            className="w-full bg-gray-100 border-none rounded-2xl px-6 py-5 pr-24 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                            rows="2"
                            placeholder="법률적인 궁금증을 물어보세요..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                // 엔터키 누르면 전송, Shift+Enter 누르면 줄바꿈
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={isLoading}
                        />
                        {/* 우측 하단 전송 화살표 버튼 */}
                        <button
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition disabled:opacity-50"
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