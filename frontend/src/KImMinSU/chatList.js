import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../common/components/DashboardSidebar';
import api, { API_BASE_URL } from '../common/api/axiosConfig';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const ChatList = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentRoomStatus, setCurrentRoomStatus] = useState(null);
    const [targetName, setTargetName] = useState('상대방');
    const [currentRoom, setCurrentRoom] = useState(null);
    const [wsConnected, setWsConnected] = useState(false); // ★ 연결 상태 표시용

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const stompClient = useRef(null);
    const chatContainerRef = useRef(null);
    const reconnectTimer = useRef(null);
    const currentRoomIdRef = useRef(roomId); // ★ 클로저 문제 방지용
    const chatSubRef = useRef(null);

    const userNo = Number(localStorage.getItem('userNo'));

    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const initialMessageRef = useRef('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');


    // 토스트 알림 상태 추가 (상단 useState 부분에 추가)
    const [toastMsg, setToastMsg] = useState(null);

    // 토스트 표시 함수
    const showNotification = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    }, []);

    // roomId 변경 시 ref 동기화
    useEffect(() => {
        currentRoomIdRef.current = roomId;
    }, [roomId]);

    // 1. 채팅방 목록 불러오기
    const loadRooms = useCallback(() => {
        api.get('/api/chat/rooms')
            .then(res => setRooms(res.data.data || []))
            .catch(() => setRooms([]));
    }, []);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    // 2. 방 선택 시 상태/이름 갱신
    useEffect(() => {
        if (!roomId || rooms.length === 0) return;
        const selectedRoom = rooms.find(r => String(r.roomId) === String(roomId));
        if (selectedRoom) {
            setCurrentRoom(selectedRoom);
            setCurrentRoomStatus(selectedRoom.progressCode);
            const opponentName = Number(selectedRoom.userNo) === Number(userNo)
                ? selectedRoom.lawyerName : selectedRoom.userNm;
            setTargetName(opponentName || '상대방');
        }
    }, [roomId, rooms, userNo]);




    // 4. 방 변경 시 과거 내역 + 웹소켓 연결
    useEffect(() => {
        if (!roomId) return;

        setChatLog([]);
        setWsConnected(false);

        api.get(`/api/chat/history/${roomId}`)
            .then(res => setChatLog(res.data.data || []))
            .catch(() => setChatLog([]));

        api.post(`/api/chat/room/${roomId}/read`).catch(() => {});

        let isMounted = true;
        const socket = new SockJS(`${API_BASE_URL}/ws-stomp`);
        const client = Stomp.over(socket);
        client.debug = () => {};
        const token = localStorage.getItem('accessToken');

        client.connect({ Authorization: `Bearer ${token}` }, () => {
            if (!isMounted) { client.disconnect(); return; }
            setWsConnected(true);

            // ▼▼▼ [핵심] 기존에 걸려있던 유령 구독이 있으면 모가지 비틀기 ▼▼▼
            if (chatSubRef.current) {
                chatSubRef.current.unsubscribe();
            }

            // ▼▼▼ 새 구독을 걸면서 Ref에 저장해둔다 ▼▼▼
            chatSubRef.current = client.subscribe(`/sub/chat/room/${roomId}`, (response) => {
                if (!isMounted) return;
                const newMsg = JSON.parse(response.body);
                if (newMsg.msgType === 'STATUS_CHANGE') {
                    setCurrentRoomStatus(newMsg.message);
                    loadRooms();
                } else {
                    setChatLog(prev => [...prev, newMsg]);
                    loadRooms();
                }
            });

            // (알림 채널은 방이 바뀌어도 계속 유지해야 하니까 냅둔다)
            client.subscribe(`/sub/user/${userNo}/notification`, (response) => {
                if (!isMounted) return;
                const noti = JSON.parse(response.body);
                if (noti.roomId && String(noti.roomId) === String(roomId)) return;
                showNotification({ senderName: noti.title, message: noti.content });
            });

        }, (error) => {
            console.error("❌ WS 연결 실패:", error);
            setWsConnected(false);
        });

        stompClient.current = client;

        return () => {
            isMounted = false;

            // ▼▼▼ 방 나갈 때 구독 찌꺼기 날리기 ▼▼▼
            if (chatSubRef.current) {
                chatSubRef.current.unsubscribe();
                chatSubRef.current = null;
            }

            if (stompClient.current) {
                stompClient.current.disconnect();
                stompClient.current = null;
            }
            if (recognitionRef.current) recognitionRef.current.stop();
            setWsConnected(false);
        };
    }, [roomId]); // ← roomId만! 이게 핵심

    const isLawyer = currentRoom && Number(currentRoom.lawyerNo) === Number(userNo);

    // ★ 상태 변경 API 호출 (수락 or 종료)
    const handleStatusChange = async (type) => {
        try {
            const endpoint = type === 'ACCEPT' ? `/api/chat/room/accept/${roomId}` : `/api/chat/room/close/${roomId}`;
            // 메서드는 둘 다 PUT
            await api.put(endpoint, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });

            alert(type === 'ACCEPT' ? "상담을 수락했습니다." : "상담을 종료했습니다.");

            // 상태 업데이트 및 목록 새로고침
            setCurrentRoomStatus(type === 'ACCEPT' ? 'ST02' : 'ST05');
            loadRooms();
        } catch (error) {
            alert("처리 중 에러가 발생했습니다.");
        }
    };

    // ★ 메시지 전송 (연결 끊겼으면 재연결 후 재시도)
    const handleSendMessage = useCallback((typeOverride, msgOverride) => {
        const msgType = typeOverride || 'TEXT';
        const msgContent = msgOverride !== undefined ? msgOverride : message;
        if (!msgContent.trim()) return;

        if (!stompClient.current?.connected) {
            alert("연결이 불안정합니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        stompClient.current.send("/pub/chat/message", {}, JSON.stringify({ roomId, senderNo: userNo, message: msgContent, msgType }));
        if (msgType === 'TEXT') setMessage('');
    }, [message, roomId, userNo]);

    const sendCalendarProposal = () => {
        if (!selectedDate) { alert("날짜와 시간을 선택해주세요."); return; }
        handleSendMessage('CALENDAR', selectedDate);
        setIsCalendarOpen(false);
        setSelectedDate('');
    };

    const acceptCalendarProposal = async (dateStr) => {
        if (!window.confirm(`[${dateStr}] 일정으로 확정하시겠습니까?`)) return;
        try {
            await api.post('/api/chat/calendar/confirm', { roomId, date: dateStr });
            handleSendMessage('TEXT', `[시스템] ${dateStr} 으로 일정이 확정되었습니다.`);
        } catch { alert("일정 확정에 실패했습니다."); }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert("10MB 이하 파일만 가능합니다."); return; }
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomId", roomId);
        try {
            await api.post('/api/chat/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch { alert("파일 업로드에 실패했습니다."); }
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleRecording = () => {
        if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("크롬 브라우저를 이용해주세요."); return; }
        initialMessageRef.current = message;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
            setMessage((initialMessageRef.current ? initialMessageRef.current + ' ' : '') + transcript);
        };
        recognition.onerror = (e) => {
            if (e.error === 'no-speech') return;
            if (e.error === 'audio-capture') alert("마이크를 찾을 수 없습니다.");
            else if (e.error === 'not-allowed') alert("마이크 권한을 허용해주세요.");
            setIsRecording(false);
        };
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        setIsRecording(true);
        recognitionRef.current = recognition;
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: "smooth" });
        }
    }, [chatLog]);

    const filteredRooms = rooms.filter(room => {
        const matchStatus = filterStatus === 'ALL' || room.progressCode === filterStatus;
        const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;
        return matchStatus && (opponentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans text-slate-900">
            <DashboardSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 flex flex-col bg-slate-100 min-w-0 relative">

                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-navy-dark tracking-tight">채팅 목록</h2>
                        {roomId && (
                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${wsConnected ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                {wsConnected ? '실시간 연결됨' : '연결 중...'}
                            </div>
                        )}
                    </div>
                    {isLawyer && roomId && (
                        <div className="flex gap-2">
                            {currentRoomStatus === 'ST01' && <button onClick={() => handleStatusChange('ACCEPT')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition">상담 수락하기</button>}
                            {currentRoomStatus === 'ST02' && <button onClick={() => handleStatusChange('CLOSE')} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-900 transition">상담 완료(종료)</button>}
                        </div>
                    )}
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <section className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner shrink-0 hidden lg:flex">
                        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                <input type="text" placeholder="이름으로 검색.." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                       className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium" />
                            </div>
                            <div className="flex p-1 bg-slate-100 rounded-lg">
                                {[['ALL','전체'],['ST02','진행중'],['ST01','대기'],['ST03','완료']].map(([code, label]) => (
                                    <button key={code} onClick={() => setFilterStatus(code)}
                                            className={`flex-1 py-1.5 text-[14px] font-bold rounded-md transition ${filterStatus === code ? 'bg-white shadow-sm text-blue-900' : 'text-slate-400'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                            {filteredRooms.length > 0 ? filteredRooms.map((room) => {
                                const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;
                                return (
                                    <Link to={`/chatList/${room.roomId}`} key={room.roomId}
                                          className={`p-3 border-b border-slate-100 cursor-pointer transition flex items-center gap-3 ${String(roomId) === String(room.roomId) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black shrink-0 shadow-sm text-sm">
                                            {opponentName ? opponentName.substring(0, 1) : '상'}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-slate-800 text-[13px] truncate pr-2">{opponentName || `상담방`}</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${room.progressCode === 'ST01' ? 'bg-orange-100 text-orange-600' : room.progressCode === 'ST02' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {room.progressCode === 'ST01' ? '대기' : room.progressCode === 'ST02' ? '진행' : '완료'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate font-medium mt-0.5">{room.lastMessage || '대화를 시작하세요...'}</p>
                                        </div>
                                    </Link>
                                );
                            }) : <div className="p-10 text-center text-xs text-slate-400 font-bold">조건에 맞는 방이 없습니다.</div>}
                        </div>
                    </section>

                    <section className="flex-1 flex flex-col bg-white min-w-0 relative">
                        {!roomId ? (
                            <div className="flex-1 flex items-center justify-center bg-slate-50 font-bold text-slate-400">방을 선택해주세요.</div>
                        ) : (
                            <>
                                {currentRoomStatus === 'ST01' && <div className="bg-orange-50 p-2 text-center text-orange-600 text-sm font-bold">대기 중입니다. 변호사의 수락을 기다려주세요.</div>}
                                {currentRoomStatus === 'ST05' && <div className="bg-slate-200 p-2 text-center text-slate-600 text-sm font-bold">종료된 상담입니다.</div>}

                                <div ref={chatContainerRef} className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                                    {chatLog.map((msg, index) => {
                                        const isMyMessage = Number(msg.senderNo) === Number(userNo);
                                        const profileImg = msg.profileUrl || (currentRoom && !isMyMessage ? currentRoom.targetProfileImg : null);
                                        return (
                                            <div key={index} className={`flex items-start space-x-3 mb-6 ${isMyMessage ? 'justify-end' : ''}`}>
                                                {!isMyMessage && (
                                                    profileImg
                                                        ? <img src={profileImg} alt="profile" className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0 border border-slate-200" />
                                                        : <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 text-[13px] font-black shadow-sm shrink-0">{targetName ? targetName.substring(0, 1) : '상'}</div>
                                                )}
                                                <div className={`space-y-1 ${isMyMessage ? 'flex flex-col items-end' : ''}`}>
                                                    {!isMyMessage && <p className="text-[11px] font-bold text-slate-500 px-1">{msg.senderName || targetName}</p>}
                                                    <div className={`p-3.5 rounded-2xl text-[13px] font-medium shadow-sm border ${isMyMessage ? 'bg-navy-main text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                                                        {msg.msgType === 'CALENDAR' ? (
                                                            <div className="flex flex-col items-center bg-blue-50 text-slate-800 p-3 rounded-lg border border-blue-100">
                                                                <i className="fas fa-calendar-check text-2xl text-blue-500 mb-2"></i>
                                                                <p className="font-bold text-center">📅 일정 제안: {msg.message}</p>
                                                                {!isLawyer && !isMyMessage && currentRoomStatus === 'ST02' && (
                                                                    <button onClick={() => acceptCalendarProposal(msg.message)} className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg shadow hover:bg-blue-700 text-sm font-bold">✅ 예, 확정합니다</button>
                                                                )}
                                                            </div>
                                                        ) : msg.msgType === 'FILE' ? (
                                                            <div className="flex flex-col space-y-2">
                                                                {msg.message && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.message)
                                                                    ? <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"><img src={msg.fileUrl} alt={msg.message} className="max-w-xs rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition" /></a>
                                                                    : <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline font-bold text-blue-500"><i className="fas fa-file-alt text-lg"></i><span className="truncate">{msg.message}</span></a>
                                                                }
                                                                <a href={`${msg.fileUrl}?isDownload=true`} className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md w-max hover:bg-slate-200 transition font-black flex items-center gap-1.5 shadow-sm mt-1"><i className="fas fa-download"></i> 저장하기</a>
                                                            </div>
                                                        ) : msg.message}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white">
                                    <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                        <textarea disabled={currentRoomStatus === 'ST05'}
                                                  placeholder={currentRoomStatus === 'ST05' ? "상담이 종료되어 채팅할 수 없습니다." : "메시지를 입력하세요."}
                                                  className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none disabled:opacity-50"
                                                  rows="2" value={message} onChange={(e) => setMessage(e.target.value)}
                                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                        />
                                        <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
                                            <div className="flex space-x-5 text-slate-400">
                                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                                <button onClick={() => fileInputRef.current.click()} disabled={currentRoomStatus === 'ST05' || isUploading} className={`transition ${isUploading ? 'text-gray-300 cursor-wait' : 'hover:text-blue-600'}`}>
                                                    <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`}></i>
                                                </button>
                                                <button onClick={toggleRecording} disabled={currentRoomStatus === 'ST05'} className={`transition ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-blue-600 text-slate-400'}`}>
                                                    <i className="fa-solid fa-microphone"></i>
                                                </button>
                                                {isLawyer && (
                                                    <button onClick={() => setIsCalendarOpen(true)} disabled={currentRoomStatus === 'ST05'} className="hover:text-blue-600 transition">
                                                        <i className="fas fa-calendar-alt text-lg"></i>
                                                    </button>
                                                )}
                                            </div>
                                            <button onClick={() => handleSendMessage()} disabled={currentRoomStatus === 'ST05' || !message.trim() || !wsConnected}
                                                    className="bg-navy-main text-white px-6 py-2 rounded-xl text-xs font-black disabled:bg-slate-300 transition">전송</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>

                {isCalendarOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl">
                            <h3 className="font-black text-lg mb-2 text-slate-800">🗓 일정 제안하기</h3>
                            <p className="text-xs text-slate-500 mb-4 font-medium">제안할 날짜와 시간을 선택하세요.</p>
                            <input type="datetime-local" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg mb-4 text-sm font-bold" />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setIsCalendarOpen(false); setSelectedDate(''); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200">취소</button>
                                <button onClick={sendCalendarProposal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700">상대방에게 제안</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* 토스트 알림 */}
                {toastMsg && (
                    <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black text-sm shrink-0">
                            {toastMsg.senderName?.substring(0, 1) || '알'}
                        </div>
                        <div>
                            <p className="text-xs font-black">{toastMsg.senderName || '새 메시지'}</p>
                            <p className="text-xs text-slate-300 truncate max-w-[200px]">{toastMsg.message}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatList;