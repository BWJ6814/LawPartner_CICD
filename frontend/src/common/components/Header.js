import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({auth, onLoginUpdate}) => {
  const navigate = useNavigate();
  // 1. 로그인 여부를 기억해요 (true : 로그인 됨, false : 안됨)
  /*
    const [상태_변수명, 상태_변경_함수명] = useState(초기값);

    userType(상태 변수) : 현재 데이터 값을 담고 있는 상자입니다. 여기서는 'GENERAL'이 들어있겠죠.
    setUserType(상태 변경 함수): 이 상자 안의 내용물을 바꿀 수 있는 유일환 열쇠입니다.
    useState('GENERAL') : 처음 시작할 때 이상자엔 'GENERAL'을 넣어줘라는 뜻입니다.

    setUserType은 React 라이브러리가 제공하는 useState가 실행되면서 자동으로 만들어준 것입니다.

    개발자가 const[abc, setAbc] = useState() 라고 쓰면, React는 내부적으로 abc 라는 변수와 이를 수정할 수 있는 setAbc라는 함수를 세트로 지정
    setUserType 이라는 이름은 개발자가 변수명을 userType으로 정했기 때문에, 관습적으로 그 앞에 set을 붙여서 지어준것

    userType = 'LAWYER' 라고 하면 안되는 이유
    일반 변수처럼 값을 직접 바꾸면, 화면이 바뀌지 않습니다. 
  */
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 2. 사용자가 일반인 ('GENERAL')인지 변호사('LAWYER')인지 구분해요.
  //    기본값을 GENERAL로 설정해둔 상태입니다.
  // const [userType, setUserType] = useState('GENERAL'); // 'GENERAL'(일반) or 'LAWYER'(변호사)
  
  // 알림 관련 상태 (실무 필수)
  // 3. 안 읽은 알림의 숫자를 저장해요 (숫자 0부터 시작)
  const [notificationCount, setNotificationCount] = useState(0); 
  // 4. 알림창(드롭다운)이 지금 열려 있는지(true), 닫혀 있는지(false) 관리해요
  const [showNotifications, setShowNotifications] = useState(false); // 드롭다운 표시 여부
  // 5. 알림 내용들을 배열 형태로 저장해요
  const [notifications, setNotifications] = useState([]); // 알림 데이터 배열
  // 6. 사용자가 스크롤을 내렸는지 확인해요 (헤더 디자인 변경 용)
  const [isScrolled, setIsScrolled] = useState(false);
  // 7. 모바일 화면에서 메뉴 바가 열렸는지 확인해요.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 알림창 외부 클릭 시 닫기 위한 Ref
  const notificationRef = useRef(null);

    // 1. 역할별 아우라 정의 (이게 디자인의 핵심)
    const USER_AURA = {
        ROLE_LAWYER: {
            label: "PRO LAWYER",
            nameSuffix: "변호사",
            bg: "bg-indigo-600",
            text: "text-white",
            border: "border-indigo-400/50",
            shadow: "shadow-[0_0_20px_rgba(79,70,229,0.4)]",
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.75c-2.676 0-5.216-.584-7.499-1.632A12.02 12.02 0 013 12c0-5.335 3.42-9.879 8.188-11.536L12 3l.812-2.536a11.954 11.954 0 018.688 11.536c0 3.513-1.5 6.676-3.89 8.868L12 21.75z" />
                </svg>
            )
        },
        ROLE_ADMIN: {
            label: "SYSTEM OPS",
            nameSuffix: "관리자",
            bg: "bg-slate-900",
            text: "text-cyan-400",
            border: "border-cyan-500/50",
            shadow: "shadow-[0_0_25px_rgba(6,182,212,0.5)]",
            icon: (
                <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        ROLE_SUPER_ADMIN: {
            label: "SUPREME ROOT",
            nameSuffix: "슈퍼관리자",
            bg: "bg-gray-950", 
            text: "text-amber-400", 
            border: "border-amber-500",
            shadow: "shadow-[0_0_25px_rgba(245,158,11,0.6)]",
            icon: (
              <div className="relative flex items-center justify-center">
                {/* 배경 박동 후광 효과 */}
                <div className="absolute inset-0 bg-amber-400 blur-[4px] opacity-40 animate-pulse rounded-full"></div>
                
                {/* 메인 아이콘: 왕관이 씌워진 방패 (권위와 보호의 상징) */}
                <svg className="relative w-4 h-4 text-amber-400 drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" 
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  {/* 왕관 포인트 (상단에 작게 추가) */}
                  <path d="M12 2L13 4H11L12 2Z" fill="currentColor" stroke="none" />
                </svg>
              </div>
            )
          },
        ROLE_USER: {
            label: "CLIENT",
            nameSuffix: "님",
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            shadow: "shadow-sm",
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    };
    const currentAura = USER_AURA[auth.role] || USER_AURA.ROLE_USER;
    const userName = auth.userNm || localStorage.getItem('userNm') || 'User';

  // 헤더 상단 네비게이션 메뉴 객체형 배열로 정리..
  const NAV_ITEMS = [
    { label: 'AI 상담', href: '/ai-chat' },
    { label: '상담게시판', href: '/consultation' },
    { label: '전문가 찾기', href: '/experts' },
    { label: '고객센터', href: '/customer' },
  ];

  useEffect(() => {
    // [기능 A] 스크롤 감지 함수.
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll); // 브라우저에 스크롤 감시자 등록

    // 외부 클릭 감지 (알림창 닫기용)
    // [기능 B] 알림창 바깥쪽 클릭하면 창 닫기
    const handleClickOutside = (event) => {
      // 만약 알림창이 열려있는데, 클릭한 곳이 알림창 안이 아니라면?
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false); // 창을 닫아라.
      }
    };
    document.addEventListener('mousedown', handleClickOutside); // 클릭 감시자 등록

    
    // [정리 단계] 컴포넌트가 사라질 떄, 감시자들을 제거해서 메모리를 아껴요.
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 알림 데이터 가져오기 (시뮬레이션)
  const fetchNotifications = (role) => {
    // 실제로는 백엔드 API에서 받아오는 데이터입니다.
    const dummyData = role === 'LAWYER' ? [
      { id: 1, text: "새로운 상담 요청이 도착했습니다.", time: "방금 전", read: false },
      { id: 2, text: "홍길동님이 상담 후기를 남겼습니다.", time: "1시간 전", read: false },
      { id: 3, text: "이번 달 정산 내역이 생성되었습니다.", time: "어제", read: true },
      { id: 4, text: "AI 판례 분석이 완료되었습니다.", time: "2일 전", read: true },
      { id: 5, text: "시스템 점검 안내", time: "3일 전", read: true },
      // 변호사용 알림들
    ] : [
      { id: 1, text: "변호사님이 답변을 등록했습니다.", time: "방금 전", read: false },
      { id: 2, text: "1:1 상담 예약이 확정되었습니다.", time: "30분 전", read: false },
      { id: 3, text: "회원가입 환영 쿠폰이 지급되었습니다.", time: "1일 전", read: true },
      // 일반 사용자용 알림들
    ];

    setNotifications(dummyData);
    // 읽지 않은 알림 개수 계산
    setNotificationCount(dummyData.filter(n => !n.read).length);
  };

  const noUnderlineStyle = { textDecoration: 'none', outline: 'none' };

  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // 저장소 비우기
    localStorage.removeItem('refreshToken'); // 리프레시 토큰도 같이 삭제
    localStorage.removeItem('userRole');
    localStorage.removeItem('userNm');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userNo');
    localStorage.removeItem('nickNm');
    localStorage.removeItem('savedUserId');
    onLoginUpdate();
    alert("로그아웃 되었습니다.");
    navigate('/');
  };


  // [테스트용] 알림 토글 (새 알림 추가)
  const toggleNotification = () => {
    const newNoti = { id: Date.now(), text: "새로운 시스템 알림입니다.", time: "방금 전", read: false };
    setNotifications(prev => [newNoti, ...prev]);
    setNotificationCount(prev => prev + 1);
  };

  return (
    <nav className={`sticky top-0 z-999 bg-white w-full transition-all duration-300 ${isScrolled ? 'border-b border-gray-200 shadow-sm' : 'border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* 1. 로고 영역 */}
          <div className="flex items-center space-x-8">
            <Link to="/" style={noUnderlineStyle} className="flex items-center gap-2 group decoration-0 no-underline">
              <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tighter group-hover:opacity-80 transition whitespace-nowrap">LAW PARTNER</h1>
            </Link>
            {/* 데스크탑 메뉴 */}
            <div className="hidden lg:flex space-x-6 text-gray-700 font-bold text-sm">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} to={item.href} style={noUnderlineStyle} className="hover:text-blue-900
                    transition-colors relative group no-underline">
                  {item.label}
                  <span className="absolute bottom-[-6px] left-0 w-0 h-0.5 bg-blue-900
                  transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. 우측 메뉴 (로그인/비로그인/권한별 분기) */}
          <div className="hidden lg:flex items-center space-x-4">
            {auth.isLoggedIn ? (
              <>
                  <div className="flex items-center gap-3 mr-4">
                      {/* 아우라 배지 메인 컨테이너 */}
                        <div className={`
                          relative flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg border transition-all duration-500
                          ${currentAura.bg} ${currentAura.text} ${currentAura.border} ${currentAura.shadow}
                          /* 슈퍼 관리자일 때만 특별한 링(이중 테두리) 효과 추가 */
                          ${auth.role === 'ROLE_SUPER_ADMIN' ? 'ring-2 ring-amber-500/40 ring-offset-1 ring-offset-white' : ''}
                          hover:brightness-110 active:scale-95 group
                        `}>
                          {/* 역할 레이블 (작게 상단에 띄움 - 감성 포인트) */}
                          <span className={`
                                absolute -top-2.5 left-2 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest leading-none border shadow-sm
                                ${auth.role === 'ROLE_SUPER_ADMIN' ? 'bg-amber-500 text-black border-amber-600' : // 슈퍼 관리자: 골드
                                  auth.role === 'ROLE_ADMIN' ? 'bg-slate-800 text-cyan-400 border-slate-700' :    // 일반 관리자: 다크 사이언
                                  auth.role === 'ROLE_LAWYER' ? 'bg-white text-indigo-700 border-indigo-200' :    // 변호사: 화이트/블루
                                  'bg-white text-gray-500 border-gray-100'}                                      // 일반 유저
                              `}>
                              {currentAura.label}
                          </span>

                          {/* 아이콘 컨테이너 */}
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white/20 backdrop-blur-md">
                              {currentAura.icon}
                          </div>

                          {/* 이름 표시 */}
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-[13px] font-black whitespace-nowrap">
                              {userName}<span className="text-[11px] opacity-80 ml-0.5 font-normal">{currentAura.nameSuffix}</span>
                            </span>
                          </div>

                          {/* 관리자일 때만 흐르는 광택 효과 (Shimmer) */}
                          {(auth.role === 'ROLE_ADMIN' || auth.role === 'ROLE_SUPER_ADMIN') && (
                            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                              <div className={`
                                absolute inset-0 translate-x-[-100%] animate-shimmer
                                ${auth.role === 'ROLE_SUPER_ADMIN' 
                                  ? 'bg-gradient-to-r from-transparent via-amber-200/40 to-transparent' // 슈퍼 관리자는 금색 광택
                                  : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'}    // 일반 관리자는 흰색 광택
                              `} />
                            </div>
                          )}
                      </div>
                  </div>

                {/* 알림 아이콘 & 드롭다운 (핵심 구현) */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 transition rounded-full ${showNotifications ? 'bg-gray-100 text-blue-900' : 'text-gray-500 hover:text-blue-900 hover:bg-gray-50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    {notificationCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                  </button>

                  {/* 알림 드롭다운 메뉴 */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <span className="text-xs font-black text-gray-700">알림 ({notificationCount})</span>
                        <button className="text-[10px] text-blue-600 font-bold hover:underline">모두 읽음</button>
                      </div>
                      <ul className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((noti) => (
                            <li key={noti.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition cursor-pointer ${!noti.read ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!noti.read ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                <div>
                                  <p className={`text-xs ${!noti.read ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{noti.text}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{noti.time}</p>
                                </div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-8 text-center text-xs text-gray-400">새로운 알림이 없습니다.</li>
                        )}
                      </ul>
                      <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
                        <Link to="/mypage/notifications" className="text-[10px] font-bold text-gray-500 hover:text-blue-900 block w-full py-1">전체 알림 보기</Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* 권한별 마이페이지 분기 */}
                {auth.role === 'ROLE_LAWYER' ? (
                  <Link to="/lawyer-dashboard" style={noUnderlineStyle} className="bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition shadow-md whitespace-nowrap no-underline">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span> 마이페이지
                  </Link>
                ) : (
                  <Link to="/mypage" style={noUnderlineStyle} className="bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition shadow-md whitespace-nowrap no-underline">
                    마이페이지
                  </Link>
                )}

                <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition ml-2 whitespace-nowrap">로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" style={noUnderlineStyle} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition no-underline whitespace-nowrap">로그인</Link>
                <Link to="/signup" style={noUnderlineStyle} className="bg-blue-900 text-white px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-blue-900/20 active:scale-95 transform no-underline whitespace-nowrap">회원가입</Link>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-blue-900 transition p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      <div className={`lg:hidden absolute w-full bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out z-40 ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
        <div className="px-4 pt-2 pb-6 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.href} style={noUnderlineStyle} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition no-underline">{item.label}</Link>
          ))}
          <div className="border-t border-gray-100 my-2 pt-4 space-y-3">
            {auth.isLoggedIn ? (
              <>
                {auth.role === 'ROLE_LAWYER' ? (
                   <Link to="/lawyer-dashboard" style={noUnderlineStyle} className="block px-3 py-3 text-center text-sm font-bold bg-navy-dark text-white rounded-xl shadow-md no-underline">변호사 워크스페이스</Link>
                ) : (
                   <Link to="/mypage" style={noUnderlineStyle} className="block px-3 py-3 text-center text-sm font-bold bg-blue-900 text-white rounded-xl shadow-md no-underline">마이페이지</Link>
                )}
                <button onClick={handleLogout} className="block w-full px-3 py-2 text-center text-sm font-bold text-gray-500 hover:text-red-500">로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" style={noUnderlineStyle} className="block w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-900 no-underline text-center">로그인</Link>
                <Link to="/signup" style={noUnderlineStyle} className="block px-3 py-3 text-center text-sm font-bold bg-blue-900 text-white rounded-xl shadow-md no-underline">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      
    </nav>
  );
};

export default Header;

// {/* [개발자용 테스트 도구] */}
//       <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-xl shadow-2xl z-[100] opacity-90 hover:opacity-100 transition">
//         <p className="text-xs font-bold mb-2 text-gray-400 uppercase">Dev Tools (Auth Check)</p>
//         <div className="flex flex-col gap-2">
//           <div className="flex items-center gap-2">
//             <span className="text-xs w-16">로그인:</span>
//             {!auth.isLoggedIn ? (
//               <>
//                 <button onClick={() => simulateLogin('GENERAL')} className="px-2 py-1 bg-blue-600 rounded text-[10px] font-bold hover:bg-blue-500">일반회원</button>
//                 <button onClick={() => simulateLogin('LAWYER')} className="px-2 py-1 bg-navy-dark border border-slate-600 rounded text-[10px] font-bold hover:bg-slate-700">변호사</button>
//               </>
//             ) : (
//               <button onClick={handleLogout} className="px-2 py-1 bg-red-600 rounded text-[10px] font-bold hover:bg-red-500 w-full">로그아웃</button>
//             )}
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="text-xs w-16">알림({notificationCount}):</span>
//             <button onClick={toggleNotification} className="px-2 py-1 bg-gray-600 rounded text-[10px] font-bold hover:bg-gray-500 w-full">
//               새 알림 추가
//             </button>
//           </div>
//         </div>
//       </div>