import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardSidebar from '../common/components/DashboardSidebar';
import api from '../common/api/axiosConfig'; // ★ 형님이 만든 axios 인스턴스
import SockJS from 'sockjs-client'; // ★ 웹소켓 연결용
import {Stomp} from '@stomp/stompjs'; // ★ 메시징 프로토콜용

const ChatList = () => {
  const { roomId } = useParams(); // ★ URL에서 방 번호 따오기
  const [rooms, setRooms] = useState([]) // 진짜 채팅방 목록
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]); // ★ 초기 데이터는 빈 배열로!
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const stompClient = useRef(null); // ★ 웹소켓 클라이언트를 담아둘 상자
  const chatContainerRef = useRef(null);
  const userNo = Number(localStorage.getItem('userNo')); // ★ 내 번호 (로그인 시 저장했어야 함)

  // 페이지 접속 시 내 채팅방 목록 가져오기
  useEffect(() => {
    api.get('/api/chat/rooms')
        .then(res => {
          setRooms(res.data.data);
        })
        .catch(err => console.error("방 목록이 로딩 되지 않았습니다.", err))
  }, []);


  // 1. 초기 데이터 가져오기 (이전 대화 내역)
  useEffect(() => {
    if (!roomId) return;

    // ★ 초심자를 위한 핵심: 방에 들어오자마자 예전 대화 싹 긁어오는 로직이야
    api.get(`/api/chat/history/${roomId}`)
        .then(res => setChatLog(res.data.data))
        .catch(err => console.error("과거 내역이 로딩 되지 않아씃ㅂ니다.", err));

    // 2. 웹소켓 연결 및 구독 시작
    const socket = new SockJS('http://localhost:8080/ws-stomp');
    const client = Stomp.over(socket);
    const token = localStorage.getItem('accessToken');
    client.connect({Authorization : `Bearer ${token}`}, () => {
      console.log("웹소켓 연결 성공!");

      // ★ 초심자를 위한 핵심: 이 방 주소를 구독해서 남이 보내는 메시지를 실시간으로 낚아채는 거야
      client.subscribe(`/sub/chat/room/${roomId}`, (response) => {
        const newMessage = JSON.parse(response.body);
        setChatLog((prev) => [...prev, newMessage]); // 메시지 오면 리스트에 추가!
      });
    }, (error) => {
      console.error("웹소켓 연결 실패 :" ,error)
    });

    stompClient.current = client;

    // 연결 해제 (청소)
    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [roomId]);

  // 3. 메시지 전송 (서버로 발행)
  const handleSendMessage = () => {
    if (!message.trim() || !stompClient.current) return;

    const chatDTO = {
      roomId: roomId,
      senderNo: userNo,
      message: message,
      msgType: 'TEXT'
    };

    // ★ 초심자를 위한 핵심: HTTP API가 아니라 웹소켓 통로(/pub)로 메시지를 쏘는 거야!
    stompClient.current.send("/pub/chat/message", {}, JSON.stringify(chatDTO));
    setMessage('');
  };

  // 스크롤 함수
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


  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans text-slate-900">
      
      {/* 2. 공용 사이드바 사용 (직접 구현했던 긴 코드 삭제됨) */}
      <DashboardSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* 3. 메인 워크스테이션 */}
      <main className="flex-1 flex flex-col bg-slate-100 h-full min-w-0 relative">
        
        {/* 상단 헤더 */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center space-x-4">
            {/* 뒤로가기 버튼 */}
            <Link to="/mypage" className="text-slate-400 hover:text-navy-dark transition">
                <i className="fas fa-arrow-left"></i>
            </Link>
            <div>
              <h2 className="text-lg font-black text-navy-dark tracking-tight ">채팅 목록</h2>
            </div>
          </div>
          
        </header>

        {/* 2분할 본문 영역 */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* (1) 좌측: 상담 목록 */}
          <section className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner shrink-0 hidden lg:flex">
             {/* 검색 영역 */}
            <div className="p-6 border-b border-slate-100 bg-white space-y-4">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                <input type="text" placeholder="의뢰인 검색..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium" />
              </div>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button className="flex-1 py-1.5 text-[14px] font-black text-blue-900 bg-white rounded-md shadow-sm">진행중</button>
                <button className="flex-1 py-1.5 text-[14px] font-bold text-slate-400 hover:text-slate-600 transition">대기</button>
                <button className="flex-1 py-1.5 text-[14px] font-bold text-slate-400 hover:text-slate-600 transition">완료</button>
              </div>
            </div>

            {/* 목록 영역 */}
            <div className="flex-1 overflow-y-auto bg-white">
              {rooms.length > 0 ? (
                  rooms.map((room) => (
                      <Link
                          to={`/chat/${room.roomId}`}
                          key={room.roomId}
                          className={`p-5 border-b border-slate-50 cursor-pointer transition block ${roomId === room.roomId ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-slate-900 text-sm">
                        {/* ★ 상대방 이름은 나중에 API 보완해서 넣고, 일단 방 ID 뒷자리만 보여주자 */}
                        상담방 {room.roomId.substring(0, 8)}...
                      </span>
                          <span className="text-[10px] text-slate-400">
                        {room.progressCode === 'ST01' ? '대기' : '진행중'}
                      </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-medium">
                          클릭해서 대화를 시작하세요
                        </p>
                      </Link>
                  ))
              ) : (
                  <div className="p-10 text-center text-xs text-slate-400 font-bold">
                    참여 중인 상담이 없습니다.
                  </div>
              )}
            </div>
          </section>

          {/* (2) 중앙: 채팅창 */}
          <section className="flex-1 flex flex-col bg-white min-w-0 relative">
            
            <div 
                ref={chatContainerRef}
                className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6 bg-gray-50/50 scroll-smooth"
            >
                <div className="flex justify-center">
                </div>

              {chatLog.map((msg, index) => {
                // ★ 팩트: msg.senderNo(보낸사람)랑 userNo(내번호)가 같으면 '내가 보낸 거(오른쪽)', 다르면 '남이 보낸 거(왼쪽)'
                const isMyMessage = Number(msg.senderNo) === Number(userNo);

                return (
                    <div key={index} className={`flex items-start space-x-3 ${isMyMessage ? 'justify-end' : ''}`}>

                      {/* 남이 보낸 메시지일 때 프사 표시 (왼쪽) */}
                      {!isMyMessage && (
                          <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-black shadow-inner flex-shrink-0">상대</div>
                      )}

                      <div className={`space-y-1 ${isMyMessage ? 'flex flex-col items-end' : ''}`}>
                        <p className="text-[10px] font-black text-slate-400 ml-1 ">
                          {isMyMessage ? '나' : `상대방 (${msg.senderNo})`}
                          {/* 시간은 지금 백엔드에서 안 주니까 일단 뺐다 */}
                        </p>
                        <div className={`p-4 rounded-2xl text-sm font-medium max-w-md shadow-sm border leading-relaxed ${isMyMessage ? 'bg-navy-main text-white rounded-tr-none border-navy-main' : 'bg-white text-slate-800 rounded-tl-none border-slate-100'}`}>
                          {msg.message}
                        </div>
                      </div>

                      {/* 내가 보낸 메시지일 때 프사 표시 (오른쪽) */}
                      {isMyMessage && (
                          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg flex-shrink-0">나</div>
                      )}
                    </div>
                );
              })}
            </div>

            {/* 입력창 */}
            <div className="p-6 border-t border-slate-100 bg-white z-10">
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              </div>
              <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <textarea 
                  placeholder="법률 자문을 입력하세요..." 
                  className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none placeholder:text-slate-300" 
                  rows="3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                ></textarea>
                <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
                  <div className="flex space-x-5 text-slate-400">
                      <button className="hover:text-blue-600 transition"><i className="fas fa-paperclip"></i></button>
                      <button className="hover:text-blue-600 transition"><i className="fas fa-robot"></i></button>
                  </div>
                  <button onClick={handleSendMessage} className="bg-navy-main text-white px-8 py-2.5 rounded-xl text-xs font-black hover:bg-blue-800 transition shadow-lg">
                    <i className="fas fa-paper-plane mr-2"></i> 전송하기
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ChatList;

// {/* 파일함 */}
//                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
//                   <h3 className="text-sm font-black text-navy-dark mb-4">최근 파일 목록</h3>
//                   <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 transition cursor-pointer group">
//                     <i className="fas fa-file-pdf text-red-500 text-xl mr-3 group-hover:scale-110 transition"></i>
//                     <div className="flex-1 overflow-hidden">
//                       <p className="text-xs font-black text-slate-800 truncate">계약서.pdf</p>
//                       <p className="text-[9px] text-slate-400">1.2MB</p>
//                     </div>
//                   </div>
//                </div>