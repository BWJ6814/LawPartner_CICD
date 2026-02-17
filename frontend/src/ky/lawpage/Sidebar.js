import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileCard from './ProfileCard';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            icon: 'fas fa-home',
            label: '홈',
            path: '/lawyer-dashboard'
        },
        {
            icon: 'fas fa-robot',
            label: 'AI 상담',
            path: '/ai-chat'
        },
        {
            icon: 'fas fa-comments',
            label: '상담게시판',
            path: '/consultation'
        },
        {
            icon: 'fas fa-user-tie',
            label: '전문가 찾기',
            path: '/experts'
        },
        {
            icon: 'fas fa-headset',
            label: '고객센터',
            path: '/customer'
        }
    ];

    // 내부 메뉴 아이템 컴포넌트
    const SidebarItem = ({ icon, label, path }) => {
        const isActive = location.pathname === path;

        return (
            <button
                onClick={() => navigate(path)}
                className={`
                    relative flex items-center h-12 mb-2 rounded-xl transition-all duration-300 ease-in-out group w-full
                    ${isCollapsed ? 'px-0 mx-2 justify-center' : 'px-4 mx-2'}
                    ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}
                `}
            >
                {/* 아이콘 */}
                <div className={`flex items-center justify-center text-lg transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}>
                    <i className={icon}></i>
                </div>

                {/* 텍스트 */}
                <span
                    className={`
                        font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}
                    `}
                >
                    {label}
                </span>

                {/* 툴팁: 사이드바가 닫혔을 때만 우측에 표시 */}
                {isCollapsed && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none whitespace-nowrap">
                        {label}
                    </div>
                )}
            </button>
        );
    };

    return (
        <aside
            className={`
                relative h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 ease-in-out flex-shrink-0
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* 중앙 토글 버튼 */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center hover:text-blue-600 hover:border-blue-600 transition-all shadow-md z-50 focus:outline-none"
            >
                <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'} text-[10px]`}></i>
            </button>

            {/* 로고 영역 */}
            <div className="h-16 flex items-center justify-center border-b border-gray-200 relative overflow-hidden shrink-0">
                <h1
                    className={`
                        text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300
                        ${isCollapsed ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
                    `}
                >
                    법률 플랫폼
                </h1>
                <span
                    className={`
                        text-xl font-black text-blue-600 absolute transition-all duration-300
                        ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                    `}
                >
                    LP
                </span>
            </div>

            {/* 메뉴 영역 */}
            <nav className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
                    <div className={`text-[10px] font-bold text-gray-500 uppercase mb-2 px-6 tracking-wider transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        Main Menu
                    </div>
                    {menuItems.map((item, index) => (
                        <SidebarItem
                            key={index}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                        />
                    ))}
                </div>
            </nav>

            {/* 프로필 영역 */}
            {!isCollapsed && (
                <div className="border-t border-gray-200 p-3 shrink-0">
                    <ProfileCard />
                </div>
            )}

            {/* 프로필 아이콘만 (접혔을 때) */}
            {isCollapsed && (
                <div className="p-4 border-t border-gray-200 shrink-0">
                    <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mx-auto cursor-pointer hover:bg-blue-600 transition-colors">
                        김
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
