import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Header from '../common/components/Header'; // 헤더 import

const AIChatPage = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "안녕하세요! 무엇을 도와드릴까요? (판례 기반 AI)", isUser: false }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        // 1. 내 말풍선 추가
        const userMsg = { text: input, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. 스프링 서버로 전송 (스프링 -> 파이썬 -> DB -> 스프링 -> 리액트)
            const userId = localStorage.getItem('userId') || 'GUEST'; // 로그인 ID 가져오기

            const res = await axios.post('http://localhost:8080/api/ai/consult', {
                question: userMsg.text,
                userId: userId
            });

            // 3. AI 응답 말풍선 추가
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

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* 헤더는 App.js에서 공통으로 처리해도 되지만, 여기선 독립 페이지처럼 보이게 함 */}

            <div className="flex justify-center py-10 bg-gray-50 flex-grow">
                <div className="flex flex-col h-[700px] w-full max-w-4xl border rounded-xl shadow-xl bg-white overflow-hidden">

                    {/* 채팅방 헤더 */}
                    <div className="bg-slate-800 text-white p-5 font-bold text-xl flex justify-between items-center">
                        <span>⚖️ AI 법률 상담소</span>
                        <span className="text-xs font-normal opacity-70">운조님 프로젝트</span>
                    </div>

                    {/* 채팅 영역 */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-100">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-base leading-relaxed ${
                                    msg.isUser
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>

                                {/* 관련 판례 보기 (AI 응답일 때만) */}
                                {!msg.isUser && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 w-[80%]">
                                        <details className="group bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                                            <summary className="cursor-pointer p-3 font-semibold text-gray-600 hover:bg-gray-50 flex justify-between items-center list-none">
                                                <span>📚 유사 판례 참고자료 ({msg.sources.length}건)</span>
                                                <span className="group-open:rotate-180 transition-transform">▼</span>
                                            </summary>
                                            <div className="p-4 bg-gray-50 text-gray-600 space-y-3 border-t text-xs">
                                                {msg.sources.map((src, i) => (
                                                    <div key={i} className="border-b last:border-0 pb-2">
                                                        • {src}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-gray-400 text-sm p-2 animate-pulse">
                                판례를 검색하고 답변을 작성 중입니다...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 입력창 */}
                    <div className="p-4 bg-white border-t flex gap-3">
                        <input
                            className="flex-1 border border-gray-300 rounded-lg px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="법률적인 고민을 입력해주세요..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            전송
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;