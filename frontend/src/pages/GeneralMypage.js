import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import DashboardSidebar from '../common/components/DashboardSidebar';
import axios from 'axios'; // ★ axios import 필수

const GeneralMyPage = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ★ 1. 데이터를 저장할 State 생성 (초기값 null 또는 기본 구조)
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ============== [ 캘린더 모달 상태 관리 (State)] ===================
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 열림/닫힘
    const [modalMode, setModalMode] = useState('create'); // 'create'(생성)
    const [eventInput, setEventInput] = useState({
        id : '',
        title : '',
        start : '',
        backgroundColor : '#1e3a8a' // 기본 색상 (네이비)
    })

    // ============== [ 상담 전체보기 모달 상태 관리 ] ===================
    const [isAllConsultModalOpen, setIsAllConsultModalOpen] = useState(false);



    // 2. 데이터 가져오기 (API 호출)
    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('accessToken');
            const role = localStorage.getItem('userRole');

            if (!token || role !== 'ROLE_USER') {
                alert("일반 회원만 이용 가능한 페이지입니다.");
                navigate('/login');
                return;
            }

            try {
                // ★ 백엔드 API 호출 (포트번호 확인 필요)
                const response = await axios.get('http://localhost:8080/api/mypage/general', {
                    headers: {
                        Authorization: `Bearer ${token}` // JWT 토큰 전송
                    }
                });

                setDashboardData(response.data.data); // 받아온 데이터 저장
                setLoading(false);

            } catch (error) {
                console.error("대시보드 데이터 로딩 실패:", error);
                // 에러 처리 (로그아웃 시키거나 에러 메시지 표시)
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        alert("로그아웃 되었습니다.");
        navigate('/');
    };

    // =========== [캘린더 이벤트 핸들러] ==============

    // 1. 빈 날짜 클릭 시(새 일정 추가 모드)
    const handleDateClick = (arg) => {
        setModalMode('create');
        setEventInput({
            id : '',
            title : '',
            start : arg.dateStr,
            backgroundColor: '#1e3a8a'
        });
        setIsModalOpen(true);
    };

    // 2. 기존 일정 클릭 시 (일정 수정/삭제 모드)
    const handleEventClick = (arg) => {
        setModalMode('edit');
        setEventInput({
            id : arg.event.id, // 실무에서는 백엔드 PK값이 들어갑니다.
            title : arg.event.title,
            start : arg.event.startStr,
            backgroundColor: arg.event.backgroundColor || '#1e3a8a'
        });
        setIsModalOpen(true);
    };
    const CloseModal = () => {
        setIsModalOpen(false);
        setEventInput({
            id : '',
            title : '',
            start : '',
            backgroundColor : "#1e3a8a"
        });
    };

    // 4. 일정 저장 (추가 또는 수정)
    const handleSaveEvent = async () => {
      if (!eventInput.title.trim()){
          alert('일정 제목을 입력해주세요.')
          return;
      }

      const token = localStorage.getItem('accessToken');

      try {
          if (modalMode === 'create'){
              // HTTP 'POST' 메서드는 서버에 새로운 데이터를 만들어달라고 요청할 때 씁니다.
              // 전송할 데이터로 제목, 날짜, 색상을 객체 형태로 묶어서 보냅니다.
              const response = await axios.post('http://localhost:8080/api/mypage/calendar', {
                  title: eventInput.title,
                  start: eventInput.start,
                  backgroundColor: eventInput.backgroundColor,
                  allDay: true
              },{
                  headers : {
                      Authorization : `Bearer ${token}`
                  }
              });

              const newEvent = {
                  id : response.data.data, // Controller가 리턴한 savedEventNo (ResultVO 구조에 맞춤)
                  title : eventInput.title,
                  start : eventInput.start,
                  backgroundColor : eventInput.backgroundColor,
                  allDay : true
              };

              setDashboardData(prevData => ({
                  ...prevData,
                  calendarEvents : [...prevData.calendarEvents, newEvent]
              }));
              alert('일정이 추가되었습니다.');
          } else {
              // HTTP 'PUT' 또는 'PATCH' 메서드는 '기존 데이터를 수정해달라'고 요청 할 때 씁니다.
              // 어떤 일정을 수정할 지 서버가 알아야 하므로 URL 끝에 해당 일정의 고유 ID를 붙여서 보냅니다.
              await axios.put(`http://localhost:8080/api/mypage/calendar/${eventInput.id}`, {
                  title: eventInput.title,
                  backgroundColor: eventInput.backgroundColor,
                  start: eventInput.start
              },{
                  headers : {
                      Authorization : `Bearer ${token}`
                  }
              });

              // 화면 업데이트
              setDashboardData(prevData => {
                  const updatedEvents = (prevData.calendarEvents || []).map(event =>
                  String(event.id) === String(eventInput.id) ? {
                      ...event,
                      title: eventInput.title,
                      backgroundColor: eventInput.backgroundColor
                  } : event
              );
              return {...prevData, calendarEvents: updatedEvents};
              });
              alert('일정이 수정되었습니다.');
          }

          CloseModal(); // 저장 성공시 모달창 닫기

          } catch (error) {
              // 서버가 죽었거나, 권한이 없거나, 백엔드가 주소가 틀렸을 때
              console.error('일정 저장 실패',error);
              alert('일정 저장에 실패했습니다. 서버 상태를 확인해주세요.');
          }
      };


    // 5. 일정 삭제
    const handleDeleteEvent = async () => {
       if (!window.confirm('일정을 삭제하시겠습니까?')) return;

       const token = localStorage.getItem('accessToken');

       try {
           // HTTP 'DELETE' 메서드는 데이터를 삭제할 때 씁니다.
           // URL에 삭제할 ID만 명시해서 보내면 되기 때문에, 별도의 전송 데이터가 필요없습니다.
           await axios.delete(`http://localhost:8080/api/mypage/calendar/${eventInput.id}`,{
               headers : {
                   Authorization : `Bearer ${token}`
               }
           });

           // 프론트엔드 화면에서 해당 일정 날리기
           setDashboardData(prevData =>({
               ...prevData,
               calendarEvents : (prevData.calendarEvents || []).filter(event => String(event.id) !== String(eventInput.id))
           }));
           alert("일정이 삭제되었습니다.");
           CloseModal();
       } catch (error) {
            console.error('일정 삭제 실패 :',error);
            alert('일정 삭제에 실패했습니다.');
       }

    };


    // ★ 로딩 중일 때 보여줄 화면
    if (loading) {
        return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
    }

    // 데이터가 없을 경우 방어 코드
    if (!dashboardData) return null;

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">

            <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* 환영 문구 - 데이터 바인딩 */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                            안녕하세요, {dashboardData.userName}님!
                        </h1>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#1e3a8a]">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-700">최근 답글</h4>
                            </div>
                            <p className="text-4xl font-black text-slate-900 text-center py-2">
                                {dashboardData.recentReplyCount}<span className="text-lg font-medium text-slate-400 ml-1">건</span>
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#f97316]">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-700">최근 상담 요청</h4>
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">요청된 건수</span>
                            </div>
                            <p className="text-4xl font-black text-slate-900 text-center py-2">
                                {dashboardData.requestCount}<span className="text-lg font-medium text-slate-400 ml-1">건</span>
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm dashboard-card border-t-[#10b981]">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-700">다음 예약</h4>
                            </div>
                            <div className="text-center py-2">
                                <p className="text-sm text-slate-500 font-bold mb-1">다음 상담까지</p>
                                <p className="text-xl font-black text-slate-900">
                                    {dashboardData.daysLeft !== null ? `${dashboardData.daysLeft}일 남음` : '예약 없음'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 최근 상담 요청 현황 (Table) - map 사용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-lg">최근 상담 요청 현황</h3>
                            <button
                                onClick={() => setIsAllConsultModalOpen(true)}
                                className="text-xs text-blue-600 font-bold hover:underline">전체 보기</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">상담 변호사</th>
                                    <th className="px-6 py-3">카테고리</th>
                                    <th className="px-6 py-3">진행 상태</th>
                                    <th className="px-6 py-3">접수 날짜</th>
                                </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100 font-medium">
                                {/* ★ 데이터 매핑 */}
                                {dashboardData.recentConsultations && dashboardData.recentConsultations.length > 0 ? (
                                    dashboardData.recentConsultations.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.lawyerName}</td>
                                            <td className="px-6 py-4 text-blue-600 font-bold">{item.category}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-orange-500 font-bold">{item.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{item.regDate}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center">상담 내역이 없습니다.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 최근 내 게시글 - map 사용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">최근 내 게시판</h3>
                            <Link to="/consultation" className="text-xs text-blue-600 font-bold hover:underline">
                                전체 게시판
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dashboardData.recentPosts && dashboardData.recentPosts.length > 0 ? (
                                dashboardData.recentPosts.map((post) => (
                                    <Link to={`/consultation/${post.boardNo}`} key={post.boardNo} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{post.title}</span>
                                            <span className="text-xs text-slate-400 mt-1">{post.regDate}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold">
                                            <i className="fas fa-comment-dots mr-1"></i> 답변 {post.replyCount}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center w-full col-span-2 text-slate-400">작성한 게시글이 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 캘린더 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">내 재판/상담 일정</h3>
                        </div>

                        <div className="calendar-container">
                            <FullCalendar
                                // 초심자를 위한 핵심: 달력을 눈으로 보기만 하던 dayGridPlugin 옆에,
                                // 클릭이나 드래그 같은 '상호작용'을 담당하는 interactionPlugin을 같이 넣어줘야 작동해!
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale="ko"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: ''
                                }}
                                events={dashboardData.calendarEvents || []}
                                dateClick={handleDateClick}
                                eventClick={handleEventClick}
                                height="auto"
                                contentHeight="auto"
                                aspectRatio={2.5}

                            />
                        </div>
                    </div>

                </div>
            </main>

            {/* ================= [커스텀 모달 UI 영역] ================= */}
            {/* 초심자를 위한 핵심: isModalOpen이 true일 때만 화면에 렌더링되도록 조건부 처리합니다. */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-96 max-w-full m-4 border border-slate-200">
                        <h2 className="text-xl font-black text-slate-800 mb-4 border-b pb-2">
                            {modalMode === 'create' ? '새 일정 추가' : '일정 수정'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-600 mb-1">날짜</label>
                            <input
                                type="text"
                                value={eventInput.start}
                                disabled
                                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-600 mb-1">일정 제목</label>
                            <input
                                type="text"
                                value={eventInput.title}
                                onChange={(e) => setEventInput({...eventInput, title: e.target.value})}
                                placeholder="상담이나 재판 내용을 입력하세요"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-600 mb-2">카테고리 색상</label>
                            <div className="flex gap-2">
                                {/* 색상 선택 버튼들 */}
                                {[
                                    { color: '#1e3a8a', label: '네이비' },
                                    { color: '#f97316', label: '오렌지' },
                                    { color: '#10b981', label: '그린' },
                                    { color: '#ef4444', label: '레드' }
                                ].map(item => (
                                    <button
                                        key={item.color}
                                        onClick={() => setEventInput({...eventInput, backgroundColor: item.color})}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${eventInput.backgroundColor === item.color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'}`}
                                        style={{ backgroundColor: item.color }}
                                        title={item.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                            {/* 초심자를 위한 핵심: 수정 모드일 때만 삭제 버튼이 보입니다. */}
                            {modalMode === 'edit' ? (
                                <button onClick={handleDeleteEvent} className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition">
                                    삭제
                                </button>
                            ) : <div></div> /* 레이아웃 유지를 위한 빈 div */}

                            <div className="flex space-x-2">
                                <button onClick={CloseModal} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                                    취소
                                </button>
                                <button onClick={handleSaveEvent} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= [최근 상담 전체보기 모달 영역] ================= */}
            {isAllConsultModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsAllConsultModalOpen(false)}>
                    {/* 모달 내용물 (클릭 시 안 닫히게 e.stopPropagation() 처리) */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-[800px] max-w-[90%] max-h-[80vh] flex flex-col m-4 border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <h2 className="text-xl font-black text-slate-800">
                                전체 상담 요청 내역
                            </h2>
                            <button onClick={() => setIsAllConsultModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl transition">
                                &times;
                            </button>
                        </div>

                        {/* 스크롤 가능한 테이블 영역 */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">상담 변호사</th>
                                    <th className="px-6 py-3">카테고리</th>
                                    <th className="px-6 py-3">진행 상태</th>
                                    <th className="px-6 py-3">접수 날짜</th>
                                </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100 font-medium">
                                {dashboardData.recentConsultations && dashboardData.recentConsultations.length > 0 ? (
                                    dashboardData.recentConsultations.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.lawyerName}</td>
                                            <td className="px-6 py-4 text-blue-600 font-bold">{item.category}</td>
                                            <td className="px-6 py-4">
                                                {/* 상태에 따라 팩트 있게 색깔 다르게 칠해줌 */}
                                                <span className={`font-bold ${item.status === '대기' ? 'text-orange-500' : item.status === '상담중' ? 'text-blue-500' : 'text-slate-500'}`}>
                                            {item.status}
                                        </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{item.regDate}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center text-slate-400">상담 내역이 없습니다.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setIsAllConsultModalOpen(false)} className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition shadow-md">
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralMyPage;