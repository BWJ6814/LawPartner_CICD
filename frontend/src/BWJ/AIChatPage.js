import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../common/api/axiosConfig';
import { AttachedFilesFromAiContext } from '../common/context/AttachedFilesFromAiContext';

const AIChatPage = () => {
    const navigate = useNavigate();
    const { setFilesFromAi } = useContext(AttachedFilesFromAiContext);
    const [searchParams] = useSearchParams();
    const userNo = (() => {
        const v = localStorage.getItem('userNo');
        const n = v ? Number(v) : null;
        return Number.isFinite(n) ? n : null;
    })();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedSources, setExpandedSources] = useState(new Set()); // "msgIdx-srcIdx" 형태로 저장
    const [rooms, setRooms] = useState([]);
    const [currentRoomNo, setCurrentRoomNo] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const SOURCE_PREVIEW_LEN = 200; // 더보기 전 표시할 글자 수

    const getFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

    const removeAttachedFileByKey = (fileKey) => {
        setAttachedFiles(prev => prev.filter(f => getFileKey(f) !== fileKey));
        setMessages(prev => prev.map(m => {
            if (!m?.attachments?.length) return m;
            return { ...m, attachments: m.attachments.filter(a => a.key !== fileKey) };
        }));
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 메인페이지 검색에서 넘어온 question이 있으면 자동으로 한 번만 전송
    const initialQuestionSent = useRef(false);
    useEffect(() => {
                const question = searchParams.get('question');
        if (question?.trim() && !initialQuestionSent.current) {
            initialQuestionSent.current = true;
            sendMessage(question.trim());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 의도적으로 최초 1회만 question 전송
    }, [searchParams]);

    const loadRooms = async () => {
        if (!userNo) return;
        const res = await api.get('/api/ai/rooms', { params: { userNo } });
        setRooms(Array.isArray(res.data) ? res.data : []);
    };

    const loadRoomLogs = async (roomNo) => {
        const res = await api.get(`/api/ai/rooms/${roomNo}/logs`);
        const logs = Array.isArray(res.data) ? res.data : [];
        const mapped = logs.flatMap(l => ([
            { text: l.question, isUser: true },
            {
                text: l.answer,
                isUser: false,
                // 백엔드에서 내려주는 relatedCases(List<String>)를 그대로 사용
                sources: Array.isArray(l.relatedCases) ? l.relatedCases : []
            }
        ]));
        setMessages(mapped.length > 0 ? mapped : [
            { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
        ]);
    };

    // 새로운 상담: DB 저장 없이 빈 채팅창만 열기 (첫 질문 시 방 생성됨)
    const openNewChat = () => {
        setCurrentRoomNo(null);
        setExpandedSources(new Set());
        setMessages([
            { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
        ]);
    };

    useEffect(() => {
        loadRooms().catch(console.error);
    }, []);

    // AI 답변을 한 번에 넣지 않고, 타이핑 애니메이션처럼 조금씩 추가해서 보여주는 함수
    const animateAiMessage = (fullText, sources) => {
        const typingInterval = 15; // ms 단위, 중간 정도 속도
        let index = 0;

        // 우선 빈 AI 메시지를 하나 추가
        setMessages(prev => [
            ...prev,
            {
                text: '',
                isUser: false,
                sources: sources || []
            }
        ]);

        const intervalId = setInterval(() => {
            index += 5; // 한 번에 추가할 글자 수 (중간 속도)
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                const lastMsg = updated[lastIdx];

                // 마지막 메시지가 AI 메시지가 아니면 그대로 둠
                if (!lastMsg || lastMsg.isUser) return prev;

                const nextText = fullText.slice(0, index);
                updated[lastIdx] = {
                    ...lastMsg,
                    text: nextText
                };
                return updated;
            });

            if (index >= fullText.length) {
                clearInterval(intervalId);
            }
        }, typingInterval);
    };

    const sendMessage = async (questionText, options = {}) => {
        const finalQuestion = typeof questionText === 'string' ? questionText : input;
        if (!finalQuestion.trim()) return;

        const userMsg = { text: finalQuestion, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/api/ai/consult', {
                question: userMsg.text,
                userNo: userNo,
                roomNo: currentRoomNo,
                // FAQ 등에서 RAG를 끄고 싶을 때 사용
                disableRag: options.disableRag === true
            });
            const data = res.data?.data ?? res.data;
            const hideSources = options.hideSources === true;
            const fullText = data?.answer ?? res.data?.answer ?? '';
            const sources = hideSources ? [] : (data?.related_cases ?? res.data?.related_cases ?? []);

            // AI 답변을 한 번에 넣지 않고, 아래로 쭉 타이핑되듯이 나타나게 함
            animateAiMessage(fullText, sources);
            // 첫 질문이면 백엔드가 새 방을 만들어 roomNo 반환 → 현재 방으로 지정
            const newRoomNo = data?.roomNo ?? res.data?.roomNo;
            if (newRoomNo != null) setCurrentRoomNo(newRoomNo);
            await loadRooms();
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: "서버 연결 오류가 발생했습니다.", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 상담 내용을 LLM으로 변호사 상담용 양식(제목·사건 개요·현재 상황·변호사님께 드리는 질문·참고 판례)으로 정리 후 글쓰기 페이지로 이동
    const handleSummarizeAndWrite = async () => {
        const payload = {
            messages: messages.map(m => ({
                isUser: m.isUser,
                text: m.text || '',
                sources: m.sources || []
            }))
        };
        setIsSummarizing(true);
        try {
            const res = await api.post('/api/ai/summarize-consult', payload);
            const data = res.data?.data ?? res.data;
            if (!data || typeof data !== 'object') throw new Error('정리된 데이터를 받지 못했습니다.');
            const title = data.title ?? 'AI 법률 상담 내용';
            const content = data.content ?? '';
            // Context + router state 둘 다에 넣어서(레이스/리렌더 타이밍 이슈 방지)
            setFilesFromAi(attachedFiles);
            navigate('/write', { state: { title, content, fromAiChatWithFiles: true, filesFromAi: attachedFiles } });
        } catch (err) {
            console.error(err);
            alert('상담 내용 정리에 실패했습니다. 네트워크와 AI 서버(파이썬)를 확인해주세요.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const faqList = [
        { title: "내용증명 작성 가이드" },
        { title: "임대차 보호법 해설" },
        { title: "민사 소송 절차" },
        // 계약서 업로드가 필요한 항목은 제거하고, 많이 사용할만한 질문으로 교체
        { title: "이혼 절차 및 준비 서류" }
    ];

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">

            {/* ⬅️ 왼쪽 사이드바 */}
            <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                {/* 1. 새 상담 시작 */}
                <div className="pt-2.5 px-3 pb-3 border-b border-gray-200">
                    <button
                        onClick={openNewChat}
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
                        {rooms.length === 0 && (
                            <li className="text-xs text-gray-400 pl-2">최근 상담이 없습니다.</li>
                        )}
                        {rooms.map((r) => (
                            <li
                                key={r.roomNo}
                                onClick={() => {
                                    setCurrentRoomNo(r.roomNo);
                                    setExpandedSources(new Set());
                                    loadRoomLogs(r.roomNo).catch(console.error);
                                }}
                                className={`cursor-pointer hover:text-blue-600 truncate pl-2 ${currentRoomNo === r.roomNo ? 'text-blue-600 font-semibold' : ''}`}
                                title={r.title || r.lastQuestion || ''}
                            >
                                {r.title || r.lastQuestion || `상담 #${r.roomNo}`}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 3. 자주 묻는 질문 (사이드바 하단까지) */}
                <div className="shrink-0 px-2 py-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3 pl-2">자주 묻는 질문</h3>
                    <div className="space-y-2">
                        {faqList.map((faq, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(faq.title, { hideSources: true, disableRag: true })}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:border hover:border-gray-200 transition"
                            >
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
                                {msg.isUser && msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 max-w-[520px]">
                                        {msg.attachments.map((a) => (
                                            <div
                                                key={a.key}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                            >
                                                <span className="font-mono text-gray-400">@</span>
                                                <span className="truncate max-w-[360px]" title={a.name}>{a.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachedFileByKey(a.key)}
                                                    className="ml-1 text-gray-400 hover:text-red-600"
                                                    aria-label="첨부 파일 삭제"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                        <div className="flex gap-3 items-center max-w-4xl mx-auto text-gray-500 py-2">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <div>AI가 답변을 준비하고 있습니다...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ⌨️ 하단 입력창 영역 (플로팅) */}
                <div className="shrink-0 w-full max-w-4xl mx-auto px-6 pb-4 pt-1">
                    {/* 요약 후 작성 / 파일 추가 버튼 */}
                    <div className="mb-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSummarizeAndWrite}
                                disabled={messages.length <= 1 || isSummarizing}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isSummarizing ? '정리 중...' : '📋 상담내용으로 글쓰기'}
                            </button>
                            <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.hwp,.txt,image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        const picked = Array.from(e.target.files);
                                        const withKeys = picked.map(f => ({
                                            key: getFileKey(f),
                                            name: f.name,
                                            file: f
                                        }));
                                        setAttachedFiles(prev => [...prev, ...picked]);
                                        const count = picked.length;
                                        setMessages(prev => ([
                                            ...prev,
                                            {
                                                text: `파일 ${count}개가 추가되었습니다.`,
                                                isUser: true,
                                                attachments: withKeys
                                            }
                                        ]));
                                    }
                                    e.target.value = '';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-1"
                            >
                                {attachedFiles.length > 0 ? `📎 파일 추가 (${attachedFiles.length})` : '📎 파일 추가'}
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
