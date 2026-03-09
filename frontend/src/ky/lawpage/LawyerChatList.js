import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api, { API_BASE_URL } from '../../common/api/axiosConfig';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";

const STATUS_LABELS = {
    ST01: '접수대기',
    ST02: '상담중',
    ST03: '소장작성',
    ST04: '소송중',
    ST05: '종료',
};
const STATUS_COLORS = {
    ST01: { bg: '#fff7ed', text: '#f97316' },
    ST02: { bg: '#eff6ff', text: '#1D4ED8' },
    ST03: { bg: '#f5f3ff', text: '#7c3aed' },
    ST04: { bg: '#faf5ff', text: '#9333ea' },
    ST05: { bg: '#f0fdf4', text: '#16a34a' },
};

const LawyerChatList = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
        () => localStorage.getItem('lawyerSidebarCollapsed') === 'true'
    );
    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [currentRoomStatus, setCurrentRoomStatus] = useState(null);
    const [targetName, setTargetName] = useState('의뢰인');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [roomPage, setRoomPage] = useState(0);
    const PAGE_SIZE = 7;

    const stompClient = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const userNo = Number(localStorage.getItem('userNo'));
    const [isUploading, setIsUploading] = useState(false);

    // 채팅방 목록 불러오기
    useEffect(() => {
        api.get('/api/chat/rooms')
            .then(res => setRooms(res.data.data || []))
            .catch(() => setRooms([]));
    }, []);

    // 선택된 방 정보 갱신
    useEffect(() => {
        if (!roomId || rooms.length === 0) return;
        const selected = rooms.find(r => String(r.roomId) === String(roomId));
        if (selected) {
            setCurrentRoomStatus(selected.progressCode);
            // 변호사 입장: 상대방은 의뢰인(userNm)
            setTargetName(selected.userNm || '의뢰인');
        }
    }, [roomId, rooms]);

    // 채팅 내역 + 웹소켓 연결
    useEffect(() => {
        if (!roomId) return;
        setChatLog([]);

        // 메시지 읽음 처리 (unreadCount 초기화)
        api.post(`/api/chat/room/${roomId}/read`).catch(() => {});

        api.get(`/api/chat/history/${roomId}`)
            .then(res => setChatLog(res.data.data || []))
            .catch(() => setChatLog([]));

        const socket = new SockJS(`${API_BASE_URL}/ws-stomp`);
        const client = Stomp.over(socket);
        const token = localStorage.getItem('accessToken');

        client.connect({ Authorization: `Bearer ${token}` }, () => {
            client.subscribe(`/sub/chat/room/${roomId}`, (response) => {
                const newMsg = JSON.parse(response.body);
                setChatLog(prev => [...prev, newMsg]);

                // SYS 메시지로 수락 신호 오면 즉시 상태 업데이트
                if (newMsg.msgType === 'SYS' && newMsg.progressCode) {
                    setCurrentRoomStatus(newMsg.progressCode);
                    setRooms(prev =>
                        prev.map(r => r.roomId === newMsg.roomId
                            ? { ...r, progressCode: newMsg.progressCode }
                            : r)
                    );
                }
            });
        }, (err) => console.error('웹소켓 연결 실패:', err));

        stompClient.current = client;
        return () => { if (stompClient.current) stompClient.current.disconnect(); };
    }, [roomId]);

    // 스크롤 맨 아래
    useEffect(() => {
        if (chatContainerRef.current) {
            const el = chatContainerRef.current;
            el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: 'smooth' });
        }
    }, [chatLog]);

    const handleAccept = async () => {
        try {
            await api.put(`/api/chat/room/accept/${roomId}`);
            setCurrentRoomStatus('ST02');
            setRooms(prev =>
                prev.map(r => r.roomId === roomId ? { ...r, progressCode: 'ST02' } : r)
            );
        } catch (e) {
            alert('수락 처리 중 오류가 발생했습니다.');
        }
    };

    const ALLOWED_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('지원하지 않는 파일 형식입니다.\n이미지(JPG/PNG/GIF), PDF, Word, Excel 파일만 업로드 가능합니다.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) { alert('10MB 이하 파일만 업로드 가능합니다.'); return; }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);
        try {
            const res = await api.post('/api/chat/files', formData);
            const fileUrl = res.data.fileUrl || res.data;
            stompClient.current.send('/pub/chat/message', {}, JSON.stringify({
                roomId, senderNo: userNo, message: file.name, msgType: 'FILE', fileUrl,
            }));
        } catch {
            alert('파일 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = () => {
        if (!message.trim() || !stompClient.current) return;
        stompClient.current.send('/pub/chat/message', {}, JSON.stringify({
            roomId, senderNo: userNo, message, msgType: 'TEXT',
        }));
        setMessage('');
    };

    const filteredRooms = rooms.filter(room => {
        const matchStatus = filterStatus === 'ALL' || room.progressCode === filterStatus;

        // 변호사 입장: 상대방은 의뢰인(userNm)
        const opponentName = Number(room.userNo) === Number(userNo) ? (room.lawyerName || '') : (room.userNm || '');
        const matchSearch = opponentName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden', fontFamily: FONT }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => {
                    const next = !isSidebarCollapsed;
                    setIsSidebarCollapsed(next);
                    localStorage.setItem('lawyerSidebarCollapsed', next);
                }}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9', minWidth: 0 }}>
                {/* 헤더 */}
                <div style={{ height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                    <button
                        onClick={() => navigate('/lawyer-dashboard')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16, color: '#94a3b8', fontSize: 16 }}
                    >
                        ←
                    </button>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>1:1 상담 채팅</h2>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* 채팅방 목록 */}
                    <div style={{ width: 300, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                        {/* 검색 + 필터 */}
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            <input
                                type="text"
                                placeholder="의뢰인 이름 검색..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setRoomPage(0); }}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: FONT }}
                            />
                            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                                {['ALL', 'ST01', 'ST02', 'ST05'].map(code => (
                                    <button
                                        key={code}
                                        onClick={() => { setFilterStatus(code); setRoomPage(0); }}
                                        style={{
                                            flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                                            fontSize: 11, fontWeight: 700, fontFamily: FONT,
                                            background: filterStatus === code ? '#1D4ED8' : '#f1f5f9',
                                            color: filterStatus === code ? '#fff' : '#64748b',
                                        }}
                                    >
                                        {code === 'ALL' ? '전체' : STATUS_LABELS[code]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 방 목록 */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {filteredRooms.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                    채팅방이 없습니다.
                                </div>
                            ) : filteredRooms.slice(roomPage * PAGE_SIZE, roomPage * PAGE_SIZE + PAGE_SIZE).map(room => {
                                const opponentName = Number(room.userNo) === Number(userNo)
                                    ? (room.lawyerName || '변호사') : (room.userNm || '의뢰인');
                                const isSelected = String(roomId) === String(room.roomId);
                                const sc = STATUS_COLORS[room.progressCode] || { bg: '#f1f5f9', text: '#64748b' };

                                return (
                                    <Link
                                        to={`/lawyer-chat/${room.roomId}`}
                                        key={room.roomId}
                                        style={{
                                            display: 'block', padding: '14px 16px',
                                            borderBottom: '1px solid #f8fafc', textDecoration: 'none',
                                            background: isSelected ? '#eff6ff' : '#fff',
                                            borderLeft: isSelected ? '3px solid #1D4ED8' : '3px solid transparent',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                                                {opponentName}
                                            </span>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.text }}>
                                                {STATUS_LABELS[room.progressCode] || room.progressCode}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {room.lastMessage || '클릭해서 대화를 시작하세요'}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* 페이징 */}
                        {filteredRooms.length > PAGE_SIZE && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, padding: '10px 8px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                                <button
                                    onClick={() => setRoomPage(p => Math.max(0, p - 1))}
                                    disabled={roomPage === 0}
                                    style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: roomPage === 0 ? 'not-allowed' : 'pointer', background: roomPage === 0 ? '#f8fafc' : '#fff', color: roomPage === 0 ? '#cbd5e1' : '#374151' }}
                                >‹</button>
                                {Array.from({ length: Math.ceil(filteredRooms.length / PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setRoomPage(i)}
                                        style={{ border: '1px solid', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', borderColor: roomPage === i ? '#1D4ED8' : '#e2e8f0', background: roomPage === i ? '#1D4ED8' : '#fff', color: roomPage === i ? '#fff' : '#374151', fontWeight: roomPage === i ? 700 : 400 }}
                                    >{i + 1}</button>
                                ))}
                                <button
                                    onClick={() => setRoomPage(p => Math.min(Math.ceil(filteredRooms.length / PAGE_SIZE) - 1, p + 1))}
                                    disabled={roomPage >= Math.ceil(filteredRooms.length / PAGE_SIZE) - 1}
                                    style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: roomPage >= Math.ceil(filteredRooms.length / PAGE_SIZE) - 1 ? 'not-allowed' : 'pointer', background: roomPage >= Math.ceil(filteredRooms.length / PAGE_SIZE) - 1 ? '#f8fafc' : '#fff', color: roomPage >= Math.ceil(filteredRooms.length / PAGE_SIZE) - 1 ? '#cbd5e1' : '#374151' }}
                                >›</button>
                            </div>
                        )}
                    </div>

                    {/* 채팅창 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0 }}>
                        {!roomId ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                                    <p style={{ fontWeight: 700, fontSize: 15 }}>좌측 목록에서 채팅방을 선택해주세요.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* 채팅 상태 배너 */}
                                {currentRoomStatus === 'ST01' && (
                                    <div style={{ background: '#fff7ed', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '1px solid #fed7aa', color: '#f97316', fontSize: 13, fontWeight: 700 }}>
                                        <span>⚠ 아직 수락하지 않은 상담입니다. 의뢰인의 사전 질문을 확인하세요.</span>
                                        <button
                                            onClick={handleAccept}
                                            style={{
                                                background: '#f97316', color: '#fff', border: 'none',
                                                borderRadius: 8, padding: '6px 18px', fontSize: 13,
                                                fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                                                flexShrink: 0,
                                            }}
                                        >
                                            수락하기
                                        </button>
                                    </div>
                                )}

                                {/* 메시지 영역 */}
                                <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {chatLog.map((msg, i) => {
                                        const isMine = Number(msg.senderNo) === Number(userNo);
                                        return (
                                            <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                                                {!isMine && (
                                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0 }}>
                                                        {(targetName || '?').charAt(0)}
                                                    </div>
                                                )}
                                                <div style={{ maxWidth: '60%' }}>
                                                    <p style={{ margin: '0 0 4px', fontSize: 10, color: '#94a3b8', textAlign: isMine ? 'right' : 'left' }}>
                                                        {isMine ? '나' : (msg.senderName || targetName)}
                                                    </p>
                                                    <div style={{
                                                        padding: '10px 14px', borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                                        background: isMine ? '#1D4ED8' : '#fff',
                                                        color: isMine ? '#fff' : '#1e293b',
                                                        fontSize: 13, lineHeight: 1.6,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                                        border: isMine ? 'none' : '1px solid #e2e8f0',
                                                    }}>
                                                        {msg.msgType === 'FILE' ? (
                                                            <a
                                                                href={msg.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: isMine ? '#fff' : '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, textDecoration: 'underline' }}
                                                            >
                                                                📎 {msg.message}
                                                            </a>
                                                        ) : msg.message}
                                                    </div>
                                                </div>
                                                {isMine && (
                                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                        나
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 입력창 */}
                                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: '#f8fafc', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={currentRoomStatus === 'ST05' || isUploading}
                                            title="파일 첨부"
                                            style={{
                                                background: 'none', border: 'none', cursor: currentRoomStatus === 'ST05' ? 'not-allowed' : 'pointer',
                                                color: isUploading ? '#cbd5e1' : '#94a3b8', fontSize: 18, padding: '4px', flexShrink: 0,
                                            }}
                                        >
                                            {isUploading ? '⏳' : '📎'}
                                        </button>
                                        <textarea
                                            placeholder={currentRoomStatus === 'ST05' ? '종료된 상담입니다.' : '메시지를 입력하세요...'}
                                            disabled={currentRoomStatus === 'ST05'}
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                            rows={2}
                                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: 13, fontFamily: FONT, color: '#1e293b' }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={currentRoomStatus === 'ST05' || !message.trim()}
                                            style={{
                                                background: currentRoomStatus === 'ST05' || !message.trim() ? '#cbd5e1' : '#1D4ED8',
                                                color: '#fff', border: 'none', borderRadius: 8,
                                                padding: '8px 20px', fontSize: 13, fontWeight: 700,
                                                cursor: currentRoomStatus === 'ST05' || !message.trim() ? 'not-allowed' : 'pointer',
                                                fontFamily: FONT, flexShrink: 0,
                                            }}
                                        >
                                            전송
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerChatList;
