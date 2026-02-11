import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const DashboardSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();

  // 내부 메뉴 아이템 컴포넌트
  const SidebarItem = ({ to, icon, label }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link 
        to={to} 
        className={`
          relative flex items-center h-12 mb-2 rounded-xl transition-all duration-300 ease-in-out decoration-0 no-underline group
          ${isSidebarOpen ? 'px-4 mx-2' : 'px-0 mx-2 justify-center'} 
          ${isActive 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
        `}
      >
        {/* 아이콘: 사이드바가 닫히면 중앙 정렬(mx-auto), 열리면 마진 없음 */}
        <div className={`flex items-center justify-center text-lg transition-all duration-300 ${isSidebarOpen ? '' : 'mx-auto'}`}>
           <i className={icon}></i>
        </div>
        
        {/* 텍스트: 너비와 투명도를 조절하여 부드럽게 나타나게 함 (애니메이션 클래스 제거) */}
        <span 
          className={`
            font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0'}
          `}
        >
          {label}
        </span>
        
        {/* 툴팁: 사이드바가 닫혔을 때만 우측에 표시 */}
        {!isSidebarOpen && (
          <div className="absolute left-[calc(100%+10px)] top-1/2 transform -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none whitespace-nowrap border border-slate-700 before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-700">
            {label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside 
      className={`
        relative h-screen bg-[#0f172a] text-slate-400 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-slate-800 flex-shrink-0
        ${isSidebarOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* 1. 중앙 토글 버튼 */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm z-50 focus:outline-none"
      >
         <i className={`fas fa-chevron-${isSidebarOpen ? 'left' : 'right'} text-[10px]`}></i>
      </button>

      {/* 2. 로고 영역 */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800/50 shrink-0 overflow-hidden">
         {/* 로고도 부드럽게 바뀌도록 수정 */}
         <span className={`text-xl font-black text-white italic tracking-tighter whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 hidden'}`}>
             LAW PARTNER
         </span>
         <span className={`text-xl font-black text-white italic absolute transition-all duration-300 ${!isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
             LP
         </span>
      </div>

      {/* 3. 메뉴 영역 */}
      <nav className="flex-1 flex flex-col overflow-hidden">
          
          {/* (A) 상단 메뉴 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-6">
              <div className={`text-[10px] font-bold text-slate-500 uppercase mb-2 px-6 tracking-wider transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  Main Menu
              </div>
              <SidebarItem to="/mypage" icon="fas fa-columns" label="대시보드" />
              <SidebarItem to="/consultation" icon="fas fa-clipboard-list" label="법률 게시판" />
              <SidebarItem to="/chatList" icon="fas fa-comments" label="1:1 채팅 목록" />
          </div>

          {/* (B) 하단 설정 메뉴 */}
          <div className="mt-auto py-4 border-t border-slate-800/50 bg-[#0f172a] shrink-0">
              <div className={`text-[10px] font-bold text-slate-500 uppercase mb-2 px-6 tracking-wider transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  Settings
              </div>
              <SidebarItem to="/profile" icon="fas fa-user-cog" label="프로필 설정" />
          </div>
      </nav>

      {/* 4. 하단 프로필 영역 */}
      <div className="p-4 bg-slate-900/30 border-t border-slate-800 shrink-0">
          <div className={`flex items-center transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black shadow-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                  김
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f172a] rounded-full"></span>
              </div>
              
              <div className={`flex-1 overflow-hidden min-w-0 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                  <p className="text-sm font-bold text-white truncate">김신드 변호사</p>
                  <p className="text-[10px] text-slate-500 truncate">Premium Plan</p>
              </div>
              
              <button className={`text-slate-500 hover:text-white transition ${isSidebarOpen ? 'block' : 'hidden'}`}>
                  <i className="fas fa-sign-out-alt"></i>
              </button>
          </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;