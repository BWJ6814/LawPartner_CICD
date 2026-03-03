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
                                                        {msg.message}
                                                    </div>
                                                </div>
                                                {isMyMessage && <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg flex-shrink-0">나</div>}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white z-10">
                                    <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200">
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
                                                <button className="hover:text-blue-600 transition"><i className="fas fa-paperclip"></i></button>
                                                <button className="hover:text-blue-600 transition"><i className="fa-solid fa-microphone"></i></button>
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