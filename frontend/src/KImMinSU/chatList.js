import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../common/components/DashboardSidebar'; // ★ 공용 사이드바 import

const ChatList = () => {
  const [message, setMessage] = useState('');
  
  // 1. 사이드바 열림/닫힘 상태 (우측 패널 너비 조절용)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatLog, setChatLog] = useState([
    { id: 1, sender: 'CLIENT', name: '홍길동', time: '14:15', text: '변호사님, 안녕하세요. 지난주 계약이 끝났는데 임대인이 연락을 피하고 보증금을 안 주네요. 제가 미리 보낸 계약서 사진 보시고 승소 가능성이 있는지 궁금합니다.' },
    { id: 2, sender: 'LAWYER', name: '김신드', time: '14:18', text: '안녕하세요. 보내주신 계약서 확인했습니다. 특약 사항에 "보증금 즉시 반환" 문구가 있어 유리한 상황입니다. 우선 내용증명을 보내는 것이 좋겠습니다. AI 분석 결과도 함께 보여드릴게요.' }
  ]);

  const chatContainerRef = useRef(null);

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

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: chatLog.length + 1,
      sender: 'LAWYER',
      name: '김신드',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: message
    };
    setChatLog([...chatLog, newMessage]);
    setMessage('');
  };

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
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <div className="p-5 border-b border-slate-50 list-item-active cursor-pointer transition relative">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-black text-slate-900 text-sm tracking-tight flex items-center">
                    홍길동 <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  </span>
                  <span className="text-[10px] text-red-500 font-black">방금 전</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-black border border-blue-100">부동산</span>
                </div>
                <p className="text-xs text-slate-600 truncate font-medium">"계약서 사진 보냈습니다. 확인 부탁..."</p>
              </div>

              <div className="p-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-black text-slate-900 text-sm tracking-tight">최박사</span>
                </div>
                <p className="text-xs text-slate-400 truncate font-medium ">"방금 고소장이 접수되었다는 연락..."</p>
              </div>
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

                {chatLog.map((msg) => (
                <div key={msg.id} className={`flex items-start space-x-3 ${msg.sender === 'LAWYER' ? 'justify-end' : ''}`}>
                    {msg.sender === 'CLIENT' && (
                    <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-black shadow-inner flex-shrink-0">홍</div>
                    )}
                    <div className={`space-y-1 ${msg.sender === 'LAWYER' ? 'flex flex-col items-end' : ''}`}>
                    <p className="text-[10px] font-black text-slate-400 ml-1 ">
                        {msg.sender === 'CLIENT' ? `의뢰인 ${msg.name}` : `PRO ${msg.name} 변호사`} 
                        <span className="text-slate-300 ml-1 font-normal">{msg.time}</span>
                    </p>
                    <div className={`p-4 rounded-2xl text-sm font-medium max-w-md shadow-sm border leading-relaxed ${msg.sender === 'LAWYER' ? 'bg-navy-main text-white rounded-tr-none border-navy-main' : 'bg-white text-slate-800 rounded-tl-none border-slate-100'}`}>
                        {msg.text}
                    </div>
                    </div>
                    {msg.sender === 'LAWYER' && (
                    <div className="w-9 h-9 rounded-xl bg-navy-main flex items-center justify-center text-white text-xs font-black shadow-lg flex-shrink-0">김</div>
                    )}
                </div>
                ))}
            </div>

            {/* 입력창 */}
            <div className="p-6 border-t border-slate-100 bg-white z-10">
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 hover:bg-blue-100 transition whitespace-nowrap"># 법적고지 전송</button>
                <button className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg border border-slate-200 hover:bg-slate-200 transition whitespace-nowrap"># 수임절차 가이드</button>
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