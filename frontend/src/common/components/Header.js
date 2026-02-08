import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ✅ 실무 필수: 라우터 링크 임포트

// 실무(Jitsumu): 네비게이션 항목
const NAV_ITEMS = [
  { label: 'AI 법률상담', href: '/ai-chat' }, // href를 실제 라우터 경로로 가정하고 수정
  { label: '상담게시판 가기', href: '/board' },
  { label: '전문가 찾기', href: '/experts' },
  { label: 'Q&A 게시판', href: '/qna' },
];

const Header = () => {
  // 현실(Genjitsu): 실제로는 리덕스(Redux)나 Context API로 전역 관리하는 로그인 상태입니다.
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 기본값은 false(비로그인)가 맞습니다.
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 스크롤 감지 및 초기 로그인 상태 확인
  useEffect(() => {
    // 1. 스크롤 핸들러
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // 2. 로그인 상태 체크 (새로고침 시 유지)
    const checkLoginStatus = () => {
      const token = localStorage.getItem('userToken'); // 실무: 저장된 토큰 확인
      if (token) {
        setIsLoggedIn(true);
      }
    };
    checkLoginStatus();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ 공통 스타일: 인라인 스타일로 밑줄을 강제로 찍어 누릅니다.
  const noUnderlineStyle = { textDecoration: 'none', outline: 'none' };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('userToken'); // 토큰 삭제
    setIsLoggedIn(false);
    alert("로그아웃 되었습니다.");
    window.location.href = '/'; // 메인으로 리다이렉트
  };

  // [테스트용] 강제 로그인 시뮬레이션 (우측 하단 버튼용)
  const simulateLogin = () => {
    localStorage.setItem('userToken', 'fake-token'); // 가짜 토큰 저장
    setIsLoggedIn(true);
    alert("로그인 성공! (실제 로그인 페이지 로직 시뮬레이션)");
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white w-full transition-all duration-300 ${
          isScrolled ? 'border-b border-gray-200 shadow-sm' : 'border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            {/* 1. 좌측: 로고 및 GNB */}
            <div className="flex items-center space-x-8">
              {/* ✅ a -> Link 교체, href -> to 교체 */}
              <Link to="/"
                 style={noUnderlineStyle} 
                 className="flex items-center gap-2 group decoration-0 no-underline">
                <span className="text-2xl">⚖️</span>
                <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tighter group-hover:opacity-80 transition whitespace-nowrap">
                  LAW PARTNER
                </h1>
              </Link>

              {/* 데스크탑 메뉴 */}
              <div className="hidden lg:flex space-x-6 text-gray-700 font-bold text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href} // ✅ href -> to
                    style={{ textDecoration: 'none' }}
                    className="hover:text-blue-900 transition-colors relative group no-underline"
                  >
                    {item.label}
                    <span className="absolute bottom-[-6px] left-0 w-0 h-0.5 bg-blue-900 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2. 우측: 로그인 상태에 따른 조건부 렌더링 */}
            <div className="hidden lg:flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <button className="relative p-2 text-gray-500 hover:text-blue-900 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>

                  <Link to="/mypage"
                     style={noUnderlineStyle}
                     className="bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition shadow-md whitespace-nowrap no-underline">
                    마이페이지
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-red-500 transition ml-2 whitespace-nowrap"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  {/* ✅ 수정됨: 여기서 onClick을 제거하고 순수하게 페이지 이동만 담당하게 변경 */}
                  <Link to="/login"
                     style={noUnderlineStyle}
                     className="text-sm font-medium text-gray-500 hover:text-gray-700 transition no-underline whitespace-nowrap">
                    로그인
                  </Link>
                  <Link to="/signup"
                     style={noUnderlineStyle}
                     className="bg-blue-900 text-white px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-blue-900/20 active:scale-95 transform no-underline whitespace-nowrap">
                    회원가입
                  </Link>
                </>
              )}
            </div>

            {/* 3. 모바일 메뉴 버튼 */}
            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-blue-900 transition p-2">
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        <div className={`lg:hidden absolute w-full bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out z-40 ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
          <div className="px-4 pt-2 pb-6 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} to={item.href} style={noUnderlineStyle} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-blue-900 hover:bg-blue-50 transition no-underline">
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2 pt-4 space-y-3">
              {isLoggedIn ? (
                <>
                  <Link to="/mypage" style={noUnderlineStyle} className="block px-3 py-3 text-center text-sm font-bold bg-blue-900 text-white rounded-xl shadow-md no-underline">마이페이지</Link>
                  <button onClick={handleLogout} className="block w-full px-3 py-2 text-center text-sm font-bold text-gray-500 hover:text-red-500">로그아웃</button>
                </>
              ) : (
                <>
                  {/* ✅ 모바일 메뉴에서도 Link로 변경하여 페이지 이동만 수행 */}
                  <Link to="/login" style={noUnderlineStyle} className="block w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-900 no-underline text-center">로그인</Link>
                  <Link to="/signup" style={noUnderlineStyle} className="block px-3 py-3 text-center text-sm font-bold bg-blue-900 text-white rounded-xl shadow-md no-underline">회원가입</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* [개발자용 테스트 컨트롤] - 실제 배포 시 삭제 */}
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-xl shadow-2xl z-[100] opacity-90 hover:opacity-100 transition">
        <p className="text-xs font-bold mb-2 text-gray-400 uppercase">Developer Tools</p>
        <div className="flex items-center gap-3">
          <span className="text-sm">현재 상태: <span className={isLoggedIn ? "text-green-400 font-bold" : "text-gray-400 font-bold"}>{isLoggedIn ? "로그인 됨" : "비로그인"}</span></span>
          <button 
            onClick={isLoggedIn ? handleLogout : simulateLogin}
            className={`px-3 py-1 rounded text-xs font-bold transition ${isLoggedIn ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {isLoggedIn ? '강제 로그아웃' : '강제 로그인 (시뮬레이션)'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;