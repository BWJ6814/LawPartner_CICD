import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../common/components/DashboardSidebar';
import api from '../common/api/axiosConfig';
import SockJS from 'sockjs-client';
import {Stomp} from '@stomp/stompjs';

const ChatList = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentRoomStatus, setCurrentRoomStatus] = useState(null);
    const [targetName, setTargetName] = useState('상대방');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const stompClient = useRef(null);
    const chatContainerRef = useRef(null);
    const userNo = Number(localStorage.getItem('userNo'));

    const fileInputRef = useRef(null); // ★ 파일 선택창 띄우기용
    const [isUploading, setIsUploading] = useState(false); // ★ 업로드 중 로딩 표시용

    // ★ [기능 2] STT(음성 인식)용 상태 추가
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const initialMessageRef = useRef('');

    // ========================================================
    // 1. [진짜 API] 내 채팅방 목록 가져오기 (더미 완전 제거)
    // ========================================================
    useEffect(() => {
        api.get('/api/chat/rooms')
            .then(res => {
                setRooms(res.data.data || []);
            })
            .catch(err => {
                console.error("방 목록 로딩 실패:", err);
                setRooms([]); // 에러 나면 빈 배열
            });
    }, []);

    // ========================================================
    // 2. 방 바뀔 때마다 상태 및 이름 갱신
    // ========================================================
    useEffect(() => {
        if (!roomId || rooms.length === 0) return;
        const selectedRoom = rooms.find(r => String(r.roomId) === String(roomId));
        if (selectedRoom) {
            setCurrentRoomStatus(selectedRoom.progressCode);
            setTargetName(selectedRoom.lawyerName || selectedRoom.userNm || '상대방');
        }
    }, [roomId, rooms]);

    // ========================================================
    // 3. [진짜 API] 과거 대화 내역 가져오기 & 웹소켓 연결
    // ========================================================
    useEffect(() => {
        if (!roomId) return;

        // ★ 방 이동 시 화면 백지화
        setChatLog([]);

        // 과거 내역 진짜 API 찌르기
        api.get(`/api/chat/history/${roomId}`)
            .then(res => {
                setChatLog(res.data.data || []);
            })
            .catch(err => {
                console.error("과거 내역 로딩 실패:", err);
                setChatLog([]); // 에러 나면 빈 화면
            });

        // 웹소켓 연결 (이건 그대로 유지)
        const socket = new SockJS('http://localhost:8080/ws-stomp');
        const client = Stomp.over(socket);
        const token = localStorage.getItem('accessToken');

        client.connect({Authorization : `Bearer ${token}`}, () => {
            console.log("웹소켓 연결 성공!");
            client.subscribe(`/sub/chat/room/${roomId}`, (response) => {
                const newMessage = JSON.parse(response.body);
                setChatLog((prev) => [...prev, newMessage]);
            });
        }, (error) => {
            console.error("웹소켓 연결 실패 :" ,error)
        });

        stompClient.current = client;

        return () => {
            if (stompClient.current) stompClient.current.disconnect();

            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [roomId]);

    // 메시지 전송 로직
    const handleSendMessage = () => {
        if (!message.trim() || !stompClient.current) return;
        const chatDTO = {
            roomId: roomId,
            senderNo: userNo,
            message: message,
            msgType: 'TEXT'
        };
        stompClient.current.send("/pub/chat/message", {}, JSON.stringify(chatDTO));
        setMessage('');
    };

    // ★ [기능 1] 파일 업로드 핸들러
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("10MB 이하의 파일만 업로드 가능합니다.");
            return;
        }

        setIsUploading(true);

        // [초심자 핵심] 파일 데이터는 무조건 JSON이 아니라 FormData 객체에 담아야 백엔드 MultipartFile이 인식함.
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomId", roomId); // 백엔드 파라미터에 맞게 roomId 추가 전송

        try {
            const token = localStorage.getItem('accessToken');

            // [초심자 핵심] HTTP POST로 서버에 던지기만 하면 끝.
            // 서버(ChatService)에서 알아서 Z드라이브에 저장하고 웹소켓으로 방에 뿌려주기 때문에 프론트에서 stompClient.send를 또 할 필요 없음! (하면 파일 2개씩 뜸)
            await api.post('/api/chat/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

        } catch (error) {
            console.error("파일 업로드 실패:", error);
            alert("파일 업로드에 실패했습니다.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ★ [기능 2] 음성 인식(STT) 핸들러
    // ★ [기능 2] 음성 인식(STT) 핸들러 (실무형 무한 동력 버전)
    const toggleRecording = () => {
        if (isRecording) {
            // 이미 켜져 있으면 수동으로 끄기
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("현재 브라우저는 음성 인식을 지원하지 않습니다. 크롬(Chrome)을 이용해주세요.");
            return;
        }

        // ★ 마이크 켜기 직전에, 이미 입력창에 적혀있던 텍스트를 백업해둔다!
        initialMessageRef.current = message;

        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = true;

        // ★ [핵심 픽스] 숨 쉬어도 안 꺼짐! 사용자가 직접 버튼 눌러서 끌 때까지 무한 대기!
        recognition.continuous = true;

        recognition.onresult = (event) => {
            // 인식된 모든 문장을 띄어쓰기로 예쁘게 이어 붙임
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join(' ');

            // ★ 기존 텍스트 + 마이크로 말한 텍스트 자연스럽게 합체
            const baseText = initialMessageRef.current ? initialMessageRef.current + ' ' : '';
            setMessage(baseText + transcript);
        };

        recognition.onerror = (event) => {
            console.error("음성 인식 에러 발생:", event.error);

            // ★ [디버깅 & 방어막 추가] 에러 종류에 따라 유저에게 알려주기
            if (event.error === 'no-speech') {
                // 이건 단순히 "말 소리가 안 들린다"는 뜻이니까 끄지 마! (방어막)
                return;
            }
            if (event.error === 'audio-capture') {
                alert("마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.");
            } else if (event.error === 'not-allowed') {
                alert("마이크 사용 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용해주세요.");
            } else {
                alert(`음성 인식 오류: ${event.error}`);
            }

            // 치명적인 에러일 때만 마이크 끄기 상태로 변경
            setIsRecording(false);
        };

        recognition.onend = () => {
            // 엔진이 멈추면 UI 상태도 꺼짐으로 변경
            setIsRecording(false);
        };

        recognition.start();
        setIsRecording(true);
        recognitionRef.current = recognition;
    };

    // 스크롤 맨 아래로
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatLog]);

    // 필터 및 검색 적용 배열
    const filteredRooms = rooms.filter(room => {
        const matchStatus = filterStatus === 'ALL' || room.progressCode === filterStatus;

        // ★ [핵심] 내 번호(userNo)랑 방의 의뢰인 번호(room.userNo)가 같으면
        // 나는 의뢰인이니까 변호사 이름을 찾고, 다르면 나는 변호사니까 의뢰인 이름을 찾는다!
        const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;

        // 검색할 때도 상대방 이름 기준으로 검색하게 세팅
        const searchTarget = opponentName || '';
        const matchSearch = searchTarget.toLowerCase().includes(searchTerm.toLowerCase());

        return matchStatus && matchSearch;
    });

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans text-slate-900">
            <DashboardSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <main className="flex-1 flex flex-col bg-slate-100 h-full min-w-0 relative">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
                    <div className="flex items-center space-x-4">
                        <Link to="/mypage" className="text-slate-400 hover:text-navy-dark transition">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <div><h2 className="text-lg font-black text-navy-dark tracking-tight ">채팅 목록</h2></div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* (1) 좌측: 상담 목록 */}
                    <section className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner shrink-0 hidden lg:flex">
                        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                <input
                                    type="text"
                                    placeholder="이름으로 검색.."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                />
                            </div>
                            <div className="flex p-1 bg-slate-100 rounded-lg">
                                <button onClick={() => setFilterStatus('ALL')} className={`flex-1 py-1.5 text-[14px] font-bold rounded-md transition ${filterStatus === 'ALL' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-400'}`}>전체</button>
                                <button onClick={() => setFilterStatus('ST02')} className={`flex-1 py-1.5 text-[14px] font-bold rounded-md transition ${filterStatus === 'ST02' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-400'}`}>진행중</button>
                                <button onClick={() => setFilterStatus('ST01')} className={`flex-1 py-1.5 text-[14px] font-bold rounded-md transition ${filterStatus === 'ST01' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-400'}`}>대기</button>
                                <button onClick={() => setFilterStatus('ST03')} className={`flex-1 py-1.5 text-[14px] font-bold rounded-md transition ${filterStatus === 'ST03' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-400'}`}>완료</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                            {filteredRooms.length > 0 ? (
                                // ★ 이중 map 제거하고 제대로 된 화살표 함수 문법 적용
                                filteredRooms.map((room) => {
                                    // ★ 내가 변호사인지 의뢰인인지 판별해서 상대방 이름 가져오기
                                    const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;

                                    return (
                                        <Link
                                            to={`/chatList/${room.roomId}`}
                                            key={room.roomId}
                                            className={`p-5 border-b border-slate-50 cursor-pointer transition block ${String(roomId) === String(room.roomId) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-black text-slate-900 text-sm truncate pr-2">
                                                    {/* ★ 여기서 UUID 대신 진짜 상대방 이름 출력! */}
                                                    {opponentName || `상담방 ${String(room.roomId).substring(0, 5)}`}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-black shrink-0 ${
                                                    room.progressCode === 'ST01' ? 'bg-orange-100 text-orange-600' :
                                                        room.progressCode === 'ST02' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {room.progressCode === 'ST01' ? '대기' : room.progressCode === 'ST02' ? '진행중' : '완료'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate font-medium mt-1">
                                                {room.lastMessage || '클릭해서 대화를 시작하세요'}
                                            </p>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="p-10 text-center text-xs text-slate-400 font-bold">
                                    조건에 맞는 방이 없습니다.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* (2) 중앙: 채팅창 */}
                    <section className="flex-1 flex flex-col bg-white min-w-0 relative">
                        {!roomId ? (
                            <div className="flex-1 flex items-center justify-center bg-slate-50">
                                <div className="text-center text-slate-400">
                                    <i className="fas fa-comments text-4xl mb-3 opacity-50"></i>
                                    <p className="font-bold">좌측 목록에서 채팅방을 선택해주세요.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {currentRoomStatus === 'ST01' && (
                                    <div className="bg-orange-50 p-3 text-center border-b border-orange-100 text-orange-600 text-sm font-bold shadow-inner z-20">
                                        <i className="fas fa-exclamation-circle mr-1"></i> 변호사의 수락을 대기 중입니다. 사전 질문을 남겨주세요.
                                    </div>
                                )}

                                <div ref={chatContainerRef} className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6 bg-gray-50/50 scroll-smooth">
                                    {chatLog.map((msg, index) => {
                                        const isMyMessage = Number(msg.senderNo) === Number(userNo);
                                        return (
                                            <div key={index} className={`flex items-start space-x-3 ${isMyMessage ? 'justify-end' : ''}`}>
                                                {!isMyMessage && <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-black shadow-inner flex-shrink-0">상대</div>}
                                                <div className={`space-y-1 ${isMyMessage ? 'flex flex-col items-end' : ''}`}>
                                                    <p className="text-[10px] font-black text-slate-400 ml-1 ">
                                                        {isMyMessage ? '나' : (msg.senderName || targetName)}
                                                    </p>
                                                    <div className={`p-4 rounded-2xl text-sm font-medium max-w-md shadow-sm border leading-relaxed ${isMyMessage ? 'bg-navy-main text-white rounded-tr-none border-navy-main' : 'bg-white text-slate-800 rounded-tl-none border-slate-100'}`}>
                                                        {msg.msgType === 'FILE' ? (
                                                            <div className="flex flex-col space-y-2">
                                                                {/* [초심자 핵심 1] 파일명 문자열 끝을 잘라서 정규식으로 이미지인지 검사하는 로직 */}
                                                                {msg.message && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.message) ? (
                                                                    // [초심자 핵심 2] 이미지면 img 태그로 렌더링. 화면 안 깨지게 max-w-xs (최대너비) 걸어두는 게 팩트 필수!
                                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={msg.fileUrl}
                                                                            alt={msg.message}
                                                                            className="max-w-xs rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    // 일반 파일(PDF 등)은 기존처럼 아이콘이랑 이름만 띄움
                                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline font-bold text-blue-100">
                                                                        <i className="fas fa-file-alt text-lg"></i>
                                                                        <span className="truncate">{msg.message}</span>
                                                                    </a>
                                                                )}

                                                                {/* [초심자 핵심 3] 강제 다운로드 버튼! 백엔드에 만들어둔 isDownload=true 파라미터를 쿼리스트링으로 쏴줌 */}
                                                                <a
                                                                    href={`${msg.fileUrl}?isDownload=true`}
                                                                    className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md w-max hover:bg-slate-200 transition font-black flex items-center gap-1.5 shadow-sm mt-1"
                                                                >
                                                                    <i className="fas fa-download"></i> 저장하기
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            msg.message
                                                        )}
                                                    </div>
                                                </div>
                                                {isMyMessage && <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg flex-shrink-0">나</div>}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white z-10">
                                    <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200">

                                        {isRecording && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-2 rounded-full shadow-lg flex items-center space-x-3 z-50 animate-bounce">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                                </span>
                                                <span className="font-bold text-xs">음성을 듣고 있습니다...</span>
                                            </div>
                                        )}

                                        <textarea
                                            placeholder={currentRoomStatus === 'ST03' ? "상담이 종료되었습니다." : "채팅을 입력해주세요.."}
                                            disabled={currentRoomStatus === 'ST03'}
                                            className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none placeholder:text-slate-300 disabled:opacity-50"
                                            rows="3"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        ></textarea>
                                        <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
                                            <div className="flex space-x-5 text-slate-400">
                                                {/* 숨겨진 파일 인풋 */}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" // 허용 확장자
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current.click()}
                                                    disabled={currentRoomStatus === 'ST03' || isUploading}
                                                    className={`transition ${isUploading ? 'text-gray-300 cursor-wait' : 'hover:text-blue-600'}`}
                                                >
                                                    <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`}></i>
                                                </button>
                                                <button
                                                    onClick={toggleRecording}
                                                    disabled={currentRoomStatus === 'ST03'} // 완료된 방이면 마이크도 막음
                                                    className={`transition ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-blue-600 text-slate-400'}`}
                                                    title="마이크를 눌러 음성으로 입력하세요"
                                                >
                                                    <i className="fa-solid fa-microphone"></i>
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={currentRoomStatus === 'ST03' || !message.trim()}
                                                className="bg-navy-main text-white px-8 py-2.5 rounded-xl text-xs font-black hover:bg-blue-800 transition shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed">
                                                <i className="fas fa-paper-plane mr-2"></i> 전송하기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ChatList;