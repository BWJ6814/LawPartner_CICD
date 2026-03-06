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
    const [currentRoom, setCurrentRoom] = useState(null);

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

    // ★ 캘린더 모달 상태
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    // ========================================================
    // 1. [진짜 API] 내 채팅방 목록 가져오기 (더미 완전 제거)
    // ========================================================
    const loadRooms = () => {
        api.get('/api/chat/rooms')
            .then(res => {
                setRooms(res.data.data || []);
            })
            .catch(err => {
                console.error("방 목록 로딩 실패:", err);
                setRooms([]);
            });
    };

    useEffect(() => {
        loadRooms();
    }, []);

    // ========================================================
    // 2. 방 바뀔 때마다 상태 및 이름 갱신
    // ========================================================
    useEffect(() => {
        if (!roomId || rooms.length === 0) return;
        const selectedRoom = rooms.find(r => String(r.roomId) === String(roomId));
        if (selectedRoom) {
            setCurrentRoom(selectedRoom);

            setCurrentRoomStatus(selectedRoom.progressCode);

            // ★ [핵심] 내가 의뢰인이면 변호사 이름을, 아니면 의뢰인 이름을 타겟으로 잡음
            const opponentName = Number(selectedRoom.userNo) === Number(userNo)
                ? selectedRoom.lawyerName
                : selectedRoom.userNm;

            setTargetName(opponentName || '상대방');
        }
    }, [roomId, rooms, userNo]);

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
            console.log("🔥 [채팅방] 웹소켓 연결 성공! roomId:", roomId);
            client.subscribe(`/sub/chat/room/${roomId}`, (response) => {
                const newMessage = JSON.parse(response.body);
                console.log("💌 [실시간 메시지 도착!]:", newMessage); // ★ 화면 안 떠도 로그에 찍히는지 확인
                setChatLog((prev) => [...prev, newMessage]);
            });
        }, (error) => {
            console.error("❌ 웹소켓 연결 실패 :" ,error)
        });

        stompClient.current = client;

        return () => {
            if (stompClient.current) stompClient.current.disconnect();

            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [roomId]);

    // ★ 현재 접속자가 변호사인지 판별
    const isLawyer = currentRoom && Number(currentRoom.lawyerNo) === Number(userNo);

    // ★ 상태 변경 API 호출 (수락 or 종료)
    const handleStatusChange = async (type) => {
        try {
            const endpoint = type === 'ACCEPT' ? `/api/chat/room/accept/${roomId}` : `/api/chat/room/close/${roomId}`;
            const method = type === 'ACCEPT' ? api.put : api.put; // 둘 다 PUT

            await method(endpoint, {}, {
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

    // 메시지 전송 로직
    const handleSendMessage = () => {
        if (!message.trim() || !stompClient.current) return;
        const chatDTO = {
            roomId: roomId,
            senderNo: userNo,
            message: message,
            msgType: 'TEXT'
        };
        console.log("🚀 [메시지 서버로 발송]:", chatDTO); // ★ 보낼 때 로그 찍기
        stompClient.current.send("/pub/chat/message", {}, JSON.stringify(chatDTO));
        setMessage('');
    };

    // ★ 캘린더 제안 발송 (변호사)
    const sendCalendarProposal = () => {
        if (!selectedDate) {
            alert("날짜와 시간을 선택해주세요.");
            return;
        }
        handleSendMessage('CALENDAR', selectedDate);
        setIsCalendarOpen(false);
    };

    // ★ 캘린더 제안 수락 (의뢰인)
    const acceptCalendarProposal = async (dateStr) => {
        if (!window.confirm(`[${dateStr}] 일정으로 확정하시겠습니까? 양측 캘린더에 추가됩니다.`)) return;

        try {
            await api.post('/api/chat/calendar/confirm', { roomId, date: dateStr }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            // 백엔드 저장 후 챗방에 알림 쏘기
            handleSendMessage('TEXT', `[시스템] ${dateStr} 으로 일정이 확정되었습니다.`);
        } catch (error) {
            alert("일정 확정에 실패했습니다.");
        }
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
            <main className="flex-1 flex flex-col bg-slate-100 min-w-0 relative">
            {/* 헤더 */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
                <h2 className="text-lg font-black text-navy-dark tracking-tight ">채팅 목록</h2>

                {/* [초심자 핵심] 변호사 전용 컨트롤 패널 */}
                {isLawyer && roomId && (
                    <div className="flex gap-2">
                        {currentRoomStatus === 'ST01' && (
                            <button onClick={() => handleStatusChange('ACCEPT')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition">상담 수락하기</button>
                        )}
                        {currentRoomStatus === 'ST02' && (
                            <button onClick={() => handleStatusChange('CLOSE')} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-900 transition">상담 완료(종료)</button>
                        )}
                    </div>
                )}
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
                                filteredRooms.map((room) => {
                                    // 내가 의뢰인이면 변호사 이름을, 내가 변호사면 의뢰인 이름을 타겟으로 잡음
                                    const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;

                                    return (
                                        <Link
                                            to={`/chatList/${room.roomId}`}
                                            key={room.roomId}
                                            // [초심자 핵심] p-5였던 패딩을 p-3으로 줄여서 상하 여백을 깎고, flex items-center로 프로필과 글자를 가로 정렬함
                                            className={`p-3 border-b border-slate-100 cursor-pointer transition flex items-center gap-3 ${String(roomId) === String(room.roomId) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                        >
                                            {/* [초심자 핵심] 카톡처럼 동그란 프로필 사진(Avatar) 영역. shrink-0을 줘야 글자가 길어져도 동그라미가 안 찌그러짐! */}
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black shrink-0 shadow-sm text-sm">
                                                {/* 이름의 첫 글자만 따서 프로필에 박아줌 */}
                                                {opponentName ? opponentName.substring(0, 1) : '상'}
                                            </div>

                                            {/* [초심자 핵심] 텍스트 영역. flex-1로 남은 공간을 다 먹게 하고, min-w-0을 무조건 줘야 자식의 truncate(말줄임표)가 먹힘 */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-slate-800 text-[13px] truncate pr-2">
                            {opponentName || `상담방 ${String(room.roomId).substring(0, 5)}`}
                        </span>
                                                    {/* 뱃지도 컴팩트하게 패딩과 글자 크기를 줄임 */}
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                                                        room.progressCode === 'ST01' ? 'bg-orange-100 text-orange-600' :
                                                            room.progressCode === 'ST02' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                            {room.progressCode === 'ST01' ? '대기' : room.progressCode === 'ST02' ? '진행' : '완료'}
                        </span>
                                                </div>
                                                {/* 최신 메시지 한 줄 처리 */}
                                                <p className="text-[11px] text-slate-400 truncate font-medium mt-0.5">
                                                    {room.lastMessage || '대화를 시작하세요...'}
                                                </p>
                                            </div>
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

                    {/* 중앙 채팅창 */}
                    <section className="flex-1 flex flex-col bg-white min-w-0 relative">
                        {!roomId ? (
                            <div className="flex-1 flex items-center justify-center bg-slate-50 font-bold text-slate-400">방을 선택해주세요.</div>
                        ) : (
                            <>
                                {/* 상태 경고창 */}
                                {currentRoomStatus === 'ST01' && <div className="bg-orange-50 p-2 text-center text-orange-600 text-sm font-bold">대기 중입니다.</div>}
                                {currentRoomStatus === 'ST05' && <div className="bg-slate-200 p-2 text-center text-slate-600 text-sm font-bold">종료된 상담입니다.</div>}

                                <div ref={chatContainerRef} className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                                    {chatLog.map((msg, index) => {
                                        const isMyMessage = Number(msg.senderNo) === Number(userNo);

                                        // [초심자 핵심] 백엔드에서 프사 URL을 보내주면 받고, 없으면 null 처리
                                        const profileImg = msg.profileUrl || (currentRoom && !isMyMessage ? currentRoom.targetProfileImg : null);

                                        return (
                                            <div key={index} className={`flex items-start space-x-3 mb-6 ${isMyMessage ? 'justify-end' : ''}`}>

                                                {/* 상대방 프로필 렌더링 (내 메시지 아닐 때만) */}
                                                {!isMyMessage && (
                                                    profileImg ? (
                                                        // 1. 진짜 프사가 있을 때
                                                        <img src={profileImg} alt="profile" className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0 border border-slate-200" />
                                                    ) : (
                                                        // 2. 프사가 없을 때 (기본 첫 글자 아바타)
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 text-[13px] font-black shadow-sm shrink-0">
                                                            {targetName ? targetName.substring(0, 1) : '상'}
                                                        </div>
                                                    )
                                                )}

                                                <div className={`space-y-1 ${isMyMessage ? 'flex flex-col items-end' : ''}`}>

                                                    {/* 내 이름은 숨기고, 상대방일 때만 이름 띄움 */}
                                                    {!isMyMessage && (
                                                        <p className="text-[11px] font-bold text-slate-500 px-1">{msg.senderName || targetName}</p>
                                                    )}

                                                    <div className={`p-3.5 rounded-2xl text-[13px] font-medium shadow-sm border ${isMyMessage ? 'bg-navy-main text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>

                                                        {/* 메시지 타입별 렌더링 분기 */}
                                                        {msg.msgType === 'CALENDAR' ? (
                                                            <div className="flex flex-col items-center bg-blue-50 text-slate-800 p-3 rounded-lg border border-blue-100">
                                                                <i className="fas fa-calendar-check text-2xl text-blue-500 mb-2"></i>
                                                                <p className="font-bold text-center">일정 제안: {msg.message}</p>
                                                                {!isLawyer && !isMyMessage && currentRoomStatus === 'ST02' && (
                                                                    <button onClick={() => acceptCalendarProposal(msg.message)} className="mt-3 bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700">예, 확정합니다</button>
                                                                )}
                                                            </div>
                                                        ) : msg.msgType === 'FILE' ? (
                                                            <div className="flex flex-col space-y-2">
                                                                {msg.message && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.message) ? (
                                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                        <img src={msg.fileUrl} alt={msg.message} className="max-w-xs rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition" />
                                                                    </a>
                                                                ) : (
                                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline font-bold text-blue-500">
                                                                        <i className="fas fa-file-alt text-lg"></i> <span className="truncate">{msg.message}</span>
                                                                    </a>
                                                                )}
                                                                <a href={`${msg.fileUrl}?isDownload=true`} className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md w-max hover:bg-slate-200 transition font-black flex items-center gap-1.5 shadow-sm mt-1">
                                                                    <i className="fas fa-download"></i> 저장하기
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            msg.message
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 입력창 영역 (사라졌던 버튼들 완벽 복구) */}
                                <div className="p-6 border-t border-slate-100 bg-white">
                                    <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                        <textarea
                                            disabled={currentRoomStatus === 'ST05'}
                                            placeholder={currentRoomStatus === 'ST05' ? "상담이 종료되어 채팅할 수 없습니다." : "메시지를 입력하세요."}
                                            className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none disabled:opacity-50"
                                            rows="2" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        />
                                        <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
                                            <div className="flex space-x-5 text-slate-400">

                                                {/* 1. 파일 첨부 버튼 */}
                                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                                <button onClick={() => fileInputRef.current.click()} disabled={currentRoomStatus === 'ST05' || isUploading} className={`transition ${isUploading ? 'text-gray-300 cursor-wait' : 'hover:text-blue-600'}`}>
                                                    <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`}></i>
                                                </button>

                                                {/* 2. STT 마이크 버튼 */}
                                                <button onClick={toggleRecording} disabled={currentRoomStatus === 'ST05'} className={`transition ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-blue-600 text-slate-400'}`}>
                                                    <i className="fa-solid fa-microphone"></i>
                                                </button>

                                                {/* 3. [핵심] 캘린더 호출 버튼 (isLawyer 조건 추가!) */}
                                                {isLawyer && (
                                                    <button onClick={() => setIsCalendarOpen(true)} disabled={currentRoomStatus === 'ST05'} className="hover:text-blue-600">
                                                        <i className="fas fa-calendar-alt text-lg"></i>
                                                    </button>
                                                )}

                                            </div>
                                            <button onClick={() => handleSendMessage()} disabled={currentRoomStatus === 'ST05' || !message.trim()} className="bg-navy-main text-white px-6 py-2 rounded-xl text-xs font-black disabled:bg-slate-300">전송</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>

            {/* ★ 캘린더 제안 모달창 */}
            {isCalendarOpen && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl">
                        <h3 className="font-black text-lg mb-4 text-slate-800">🗓 일정 제안하기</h3>
                        <input
                            type="datetime-local"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg mb-4 text-sm font-bold"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsCalendarOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">취소</button>
                            <button onClick={sendCalendarProposal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">상대방에게 제안</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
    );
};

export default ChatList;