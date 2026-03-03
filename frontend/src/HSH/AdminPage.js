import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  LayoutDashboard, Users, ShieldAlert, FileText, Settings, 
  LogOut, Search, Download, Eye, EyeOff, CheckCircle, XCircle, 
  AlertTriangle, Lock, Unlock, Filter, Calendar, Terminal,
  UserCheck, Ban, Trash2, FileSearch, ShieldCheck, ChevronRight,
  Activity, RotateCcw
} from 'lucide-react';
import { 
  AreaChart, Area, 
  LineChart, Line, 
  BarChart, Bar, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import axios from 'axios';

// =================================================================
// 🔗 Axios 기본 설정 (JWT 토큰 자동 포함)
// =================================================================
const api = axios.create({
  baseURL: 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =================================================================
// 🎨 공통 UI 컴포넌트
// =================================================================
const Card = ({ title, children, className = "", rightElement = null }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <span className="font-bold text-slate-800">{title}</span>
        {rightElement && <div>{rightElement}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Badge = ({ variant = "blue", children }) => {
  const styles = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
    gray: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-indigo-100 text-indigo-700"
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

const getRoleDisplayName = (roleCode) => {
  switch (roleCode) {
    case 'ROLE_SUPER_ADMIN': return '슈퍼 관리자';
    case 'ROLE_ADMIN': return '일반 관리자';
    case 'ROLE_OPERATOR': return '운영자';
    default: return '관리자';
  }
};

// =================================================================
// 🚀 메인 애플리케이션 컴포넌트
// =================================================================
export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  
  // 차트 캡처용 Ref
  const chartRef = useRef(null);
  
  // 백엔드 연동 State
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [threatLogs, setThreatLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ★ 현재 사용자 권한 가져오기
  const currentRole = localStorage.getItem('userRole');

  // ★ 권한 체크 유틸리티 함수
  const hasPermission = (allowedRoles) => {
    if (!currentRole) return false;
    return allowedRoles.includes(currentRole);
  };

    // 검색 조건 상태 관리 (여기 있는 값들이 Input에 표시됨)
    // 검색 버튼을 눌러도 setFunction을 호출하지 않으므로 값은 계속 '유지'처리.
  const [searchParams, setSearchParams] = useState({
    startDate: '', endDate: '', keywordType: 'IP', keyword: '', statusType: 'ALL'
  });

  // 검색 실행 핸들러
  const handleSearch = () => {
    // 1. 현재 입력된 값들로 검색 요청을 보냅니다.
    fetchAuditLogs(searchParams);
    
    // 2. [비우기] API 요청 직후, 화면의 상태를 업데이트합니다.
    // ...prev : 날짜, 조건(IP), 상태 등은 그대로 유지하고
    // keyword: '' : 오직 검색어만 빈 문자열로 덮어씁니다.
    setSearchParams(prev => ({
      ...prev,
      keyword: '' 
    }));
  };
  
  // 리셋..
  const handleReset = () => {
    // 1. UI 상태 초기화
    setSearchParams({
      startDate: '', endDate: '', keywordType: 'IP', keyword: '', statusType: 'ALL'
    });
    // 2. 전체 데이터 다시 로드 (파라미터 없이 호출)
    fetchAuditLogs({}); 
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  
  // =================================================================
  // 🔄 데이터 호출 로직
  // =================================================================
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userRes = await api.get('/api/admin/users');
      if (userRes.data.success) setUsers(userRes.data.data);
      
      const summaryRes = await api.get('/api/admin/summary');
      if (summaryRes.data.success) setSummary(summaryRes.data.data);

      const statsRes = await api.get('/api/admin/status/daily');
      if (statsRes.data.success) {
        const sortedStats = statsRes.data.data.sort((a, b) => a.date.localeCompare(b.date));
        setDailyStats(sortedStats);
      }

      const threatRes = await api.get('/api/admin/logs/threats');
      if (threatRes.data.success) setThreatLogs(threatRes.data.data);
    } catch (error) {
      console.error("데이터 연동 실패:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("권한이 없습니다. 다시 로그인해주세요.");
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // [수정] params를 받아서 axios에 정확히 태워 보내는 코드
  const fetchAuditLogs = async (searchParams = {}) => {
    try {
      // 1. 기본값(page, size)과 검색 조건(searchParams)을 합칩니다.
      const requestConfig = {
        params: {
          page: 0,
          size: 50,
          // searchParams가 없으면 빈 객체가 들어가므로 안전합니다.
          startDate: searchParams.startDate || '',
          endDate: searchParams.endDate || '',
          keywordType: searchParams.keywordType || '',
          keyword: searchParams.keyword || '',
          statusType: searchParams.statusType || 'ALL'
        }
      };

      // 2. ★ 핵심: 두 번째 인자에 { params: ... } 형태로 넣어야 쿼리스트링(?key=value)으로 날아갑니다.
      // (기존 코드에서 이 구조가 깨졌을 수 있습니다)
      const logRes = await api.get('/api/admin/logs', requestConfig);
      
      if (logRes.data.success && logRes.data.data.content) {
        setLogs(logRes.data.data.content);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("로그 연동 실패:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [showOnlyErrors]);

  // =================================================================
  // ⚡ 주요 액션 핸들러 (다운로드 & 상태변경)
  // =================================================================
  
  // [차트 이미지 다운로드] - 대시보드용
  const handleDownloadChart = async () => {
    if(!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {backgroundColor: '#ffffff'});
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `대시보드_접속트렌드_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      console.error("차트 캡처 실패:", error);
      alert("차트 다운로드 중 오류가 발생했습니다.");
    }
  };

  // [회원 상태 변경]
  const handleUserStatusChange = async (userId, statusCode) => {
    const actionNm = statusCode === 'S02' ? '승인' : statusCode === 'S01' ? '승인/복구' : '정지';
    if (!window.confirm(`해당 회원을 ${actionNm} 처리하시겠습니까?`)) return;
    
    // 사유 강제 입력 (백엔드 AOP 연동)
    const reason = prompt(`${actionNm} 사유를 입력해주세요 (감사 로그 필수):`);
    if (!reason || reason.trim() === '') return alert("사유 입력은 필수입니다.");

    try {
      const res = await api.put('/api/admin/user/status', { userId, statusCode, reason });
      if (res.data.success) {
        alert(`성공적으로 ${actionNm} 되었습니다.`);
        fetchDashboardData();
        setShowModal(false);
      } else {
        alert(res.data.message);
      }
    } catch (e) {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  // [엑셀 다운로드] - 감사로그용
  const handleExcelDownload = async () => {
    
    const reason = prompt("다운로드 사유를 입력해주세요 (보안 규정):");
    if (!reason || reason.trim() === '') return alert("사유 입력은 필수입니다.");

    try {
      const response = await api.get(`/api/admin/logs/download?reason=${encodeURIComponent(reason)}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Security_Audit_Log_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("다운로드 권한이 없거나 오류가 발생했습니다.");
    }
  };

  // 관리자 권한 변경 핸들러
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`해당 회원의 권한을 [${newRole}]로 변경하시겠습니까?`)) return;
    
    // 권한 변경은 보안상 매우 중요하므로 사유 입력 필수
    const reason = prompt("권한 변경 사유를 입력해주세요:");
    if (!reason || reason.trim() === '') return alert("사유 입력은 필수입니다.");

    try {
      // 백엔드 API 호출 (AdminController에 해당 API가 있다고 가정)
      // 만약 API가 없다면 백엔드에 @PutMapping("/user/role") 추가 필요
      const res = await api.put('/api/admin/user/role', { userId, roleCode: newRole, reason });
      if (res.data.success) {
        alert("권한이 변경되었습니다.");
        fetchDashboardData(); // 목록 갱신
        setShowModal(false);  // 모달 닫기
      } else {
        alert(res.data.message);
      }
    } catch (e) {
      alert("권한 변경 중 오류가 발생했습니다.");
    }
  };


  // =================================================================
  // 🖥️ 개별 화면 렌더링 뷰
  // =================================================================
  
  // 1. 대시보드 화면
  // 1. 대시보드 화면
  function DashboardView() {
    // 기간 선택 상태 (기본값 7일)
    const [period, setPeriod] = useState(7);
    const [dailyStats, setDailyStats] = useState([]);

    // 데이터 로딩 함수 (period가 바뀔 때마다 실행)
    useEffect(() => {
      fetchDailyStats(period);
    }, [period]);

    const fetchDailyStats = async (days) => {
      try {
        // API 호출 시 days 파라미터 전달
        const res = await api.get(`/api/admin/status/daily?days=${days}`);
        if (res.data.success) {
          setDailyStats(res.data.data);
        }
      } catch (e) {
        console.error("통계 로드 실패", e);
      }
    };

    const chartData = useMemo(() => {
      // 1. 데이터가 아예 없으면 빈 배열 반환
      if (!dailyStats || dailyStats.length === 0) return [];
      
      // 2. 기본 데이터 매핑 (MM-DD 포맷팅)
      let processedData = dailyStats.map(stat => ({
        name: stat.date.substring(5), // YYYY-MM-DD -> MM-DD
        visitors: stat.visitors !== undefined ? stat.visitors : (stat.count || 0), // 백엔드 호환
        users: stat.users || 0 
      }));

      // ★★★ [방어 로직] ★★★
      // '오늘'을 눌렀는데 백엔드에서 1개만 줄 경우, 선을 그리기 위해 어제 날짜(0명)를 강제로 앞에 끼워넣음
      if (period === 2 && processedData.length === 1) {
        const todayStr = dailyStats[0].date;
        const todayObj = new Date(todayStr);
        todayObj.setDate(todayObj.getDate() - 1); // 하루 전으로 세팅
        
        const dummyYesterday = `${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
        
        // 배열의 맨 앞에 어제(0) 데이터를 추가!
        processedData = [
          { name: dummyYesterday, visitors: 0, users: 0 },
          processedData[0]
        ];
      }
      
      return processedData;
    }, [dailyStats, period]);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="총 회원 수" value={summary.totalUsers || 0} growth={`${summary.totalUsersGrowth || '+0%'} 전일 대비`} icon={<Users className="text-blue-600" />} />
          <StatCard title="오늘 신규 가입" value={summary.newUsersToday || 0} growth={`${summary.newUsersGrowth || '+0%'} 전일 대비`} icon={<UserCheck className="text-emerald-600" />} color="emerald" />
          <StatCard title="승인 대기 (변호사)" value={summary.pendingLawyers || 0} growth="확인 필요" icon={<ShieldCheck className="text-amber-600" />} color="amber" />
          <StatCard title="오늘 접속자 수" value={summary.todayVisitors || 0} growth={`${summary.visitorsGrowth || '+0%'} 전일 대비`} icon={<Eye className="text-purple-600" />} color="purple" />
          <StatCard title="오늘의 보안 위협" value={summary.securityThreats || 0} growth={`${summary.threatsGrowth || '0%'} 전일 대비`} icon={<ShieldAlert className="text-red-600" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 가입자 추이 그래프 카드 */}
          {/* 가입자 추이 그래프 카드 */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={20} className="text-blue-600"/> 
                가입자 및 방문자 추이
              </h3>
              
              {/* 🕹️ 기간 선택 버튼 그룹 (오늘 value=2 유지) */}
              <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                {[
                  { label: '오늘', value: 2 },
                  { label: '1주일', value: 7 },
                  { label: '1개월', value: 30 }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      period === opt.value 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="w-full">
              {/* 캡처를 위한 ref 추가 */}
              <div className="h-64 w-full bg-white" ref={chartRef}>
                 <ResponsiveContainer width="100%" height="100%">
                   {/* ★ 수정 1: left 마진을 -15로 줘서 우측으로 쏠린 차트를 왼쪽으로(정중앙으로) 당김 */}
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 12, fill: '#64748b'}} 
                       dy={10}
                     />
                     {/* ★ 수정 2: Y축이 낭비하던 기본 60px 공간을 30px로 확 줄임 */}
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 12, fill: '#64748b'}} 
                       width={30}
                     />
                     <Tooltip 
                       contentStyle={{
                         backgroundColor: '#fff', 
                         borderRadius: '12px', 
                         border: 'none', 
                         boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                       }} 
                     />
                     
                     <Area 
                       type="monotone" 
                       dataKey="users" 
                       name="신규 가입" 
                       stroke="#2563eb" 
                       fillOpacity={1} 
                       fill="url(#colorUsers)" 
                       strokeWidth={3} 
                       activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                     
                     <Area 
                       type="monotone" 
                       dataKey="visitors" 
                       name="방문자" 
                       stroke="#8b5cf6" 
                       fillOpacity={1} 
                       fill="url(#colorVisitors)" 
                       strokeWidth={3} 
                       activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>

              {/* ★ 핵심: 차트 밖으로 빼서 Flex로 묶어 완벽한 수평(평행) 달성! */}
              <div className="flex justify-between items-center mt-2 px-2">
                
                {/* 좌측: 직접 만든 커스텀 범례 (어긋남 방지) */}
                <div className="flex items-center gap-4 text-xs font-bold text-[#64748b]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span> 신규 가입
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span> 방문자
                  </div>
                </div>

                {/* 우측: 다운로드 버튼 (data-html2canvas-ignore="true"로 캡처 방지) */}
                {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR']) && (
                  <button 
                    onClick={handleDownloadChart} 
                    data-html2canvas-ignore="true"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors text-xs border border-blue-100 shadow-sm"
                  >
                    <Download size={14} /> 차트 캡처
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card title="최근 보안 위협 로그 (전체)">
            <div className="space-y-4">
              {threatLogs && threatLogs.length > 0 ? (
                threatLogs.map(log => (
                  <div key={log.logNo} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertTriangle size={18} /></div>
                      <div>
                        <div className="text-sm font-bold text-red-900">{log.reqIp}</div>
                        <div className="text-xs text-red-700 truncate w-48">{log.reqUri}</div>
                      </div>
                    </div>
                    <div className="text-xs text-red-500 font-mono font-bold">{log.statusCode}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 font-bold">감지된 보안 위협이 없습니다.</div>
              )}
              <button onClick={() => setActiveMenu('audit-log')} className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                전체 로그 보러가기
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 2. 회원 관리 화면
  function UserManagementView() {
    return (
      <Card title="일반 회원 관리 (전체 명부)">
        <div className="overflow-x-auto mt-4 w-full">
          <table className="w-full text-left min-w-[1000px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3 w-16">No</th>
                <th className="px-4 py-3">아이디</th>
                <th className="px-4 py-3">이름 (닉네임)</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">권한</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map(user => (
                <tr key={user.userNo} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-slate-400 font-mono">{user.userNo}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{user.userId}</td>
                  <td className="px-4 py-4">{user.userNm} <span className="text-xs text-slate-400">({user.nickNm||'-'})</span></td>
                  <td className="px-4 py-4 text-slate-500">{new Date(user.joinDt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    {user.roleCode === 'ROLE_SUPER_ADMIN' ? <Badge variant="amber">슈퍼 관리자</Badge> :
                     user.roleCode === 'ROLE_ADMIN' ? <Badge variant="blue">관리자</Badge> :
                     user.roleCode === 'ROLE_OPERATOR' ? <Badge variant="green">운영자</Badge> :
                     user.roleCode === 'ROLE_LAWYER' ? <Badge variant="purple">변호사</Badge> :
                     user.roleCode === 'ROLE_ASSOCIATE' ? <Badge variant="amber">준회원 (승인대기)</Badge> :
                     <Badge variant="gray">일반 회원</Badge>}
                  </td>
                  <td className="px-4 py-4">
                    {user.statusCode === 'S03' ? <Badge variant="red">정지</Badge> : 
                     user.statusCode === 'S02' ? <Badge variant="amber">승인 대기</Badge> : 
                     // 혹시 모르니 DB 연동이 안 될 시, 처리 예방..
                     user.statusCode === 'S99' ? <Badge variant="orange">회원 탈퇴</Badge> : 
                     <Badge variant="green">활동중</Badge>}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => {setSelectedItem(user); setShowModal(true);}} className="text-blue-600 hover:underline font-bold">상세</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // 3. 변호사 승인 화면
  function LawyerApprovalView() {
    const applicants = users.filter(u => u.statusCode === 'S02' || u.roleCode === 'ROLE_ASSOCIATE');
    return (
      <Card title="변호사 자격 승인 처리 (워크플로우)">
        <div className="space-y-4 mt-4">
          {applicants.map(user => (
            <div key={user.userNo} className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-300 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Users size={24} /></div>
                <div>
                  <div className="font-bold text-slate-800">{user.userNm} (승인 대기자)</div>
                  <div className="text-xs text-slate-500">ID: {user.userId} | 가입일: {new Date(user.joinDt).toLocaleDateString()}</div>
                </div>
              </div>
              <button onClick={() => handleUserStatusChange(user.userId, 'S01')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                자격 검증 및 승인 (S01)
              </button>
            </div>
          ))}
          {applicants.length === 0 && <div className="text-center py-8 text-slate-400 font-bold">대기 중인 승인 요청이 없습니다.</div>}
        </div>
      </Card>
    );
  }

  // 4. 보안 감사 로그 화면
  // [수정] function -> const renderAuditLogView 변경
  // (이제 컴포넌트가 아니라 AdminPage의 일부인 '화면 그리는 함수'가 됩니다)
  const renderAuditLogView = () => {
    return (
      <Card>
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-end">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
               <Terminal size={20} className="text-blue-600" /> 통합 로그 검색 시스템
             </h3>
             {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
                <button onClick={handleExcelDownload} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm">
                  <FileText size={16} /> 결과 엑셀 저장
                </button>
             )}
          </div>
          
          {/* 🔍 검색 컨트롤 패널 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">기간</label>
              <div className="flex gap-2">
                {/* 상위 state인 searchParams를 직접 연결 */}
                <input type="date" className="px-2 py-2 border rounded-lg text-sm" value={searchParams.startDate} onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})} />
                <input type="date" className="px-2 py-2 border rounded-lg text-sm" value={searchParams.endDate} onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})} />
              </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">조건</label>
               <div className="flex gap-2">
                <select className="px-2 py-2 border rounded-lg text-sm" value={searchParams.keywordType} onChange={(e) => setSearchParams({...searchParams, keywordType: e.target.value})}>
                  <option value="IP">IP 주소</option>
                  <option value="TRACE_ID">Trace ID</option>
                  <option value="URI">요청 URI</option>
                  <option value="USER_NO">회원 번호</option>
                </select>
                <input type="text" placeholder="검색어" className="px-3 py-2 border rounded-lg text-sm w-32" value={searchParams.keyword} onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})} onKeyDown={handleKeyDown} />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">상태</label>
               <select className="px-2 py-2 border rounded-lg text-sm" value={searchParams.statusType} onChange={(e) => setSearchParams({...searchParams, statusType: e.target.value})}>
                  <option value="ALL">전체</option>
                  <option value="ERROR">에러(4xx~)</option>
               </select>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-2">
              <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors">
                 <Search size={16} /> 검색
              </button>
              <button onClick={handleReset} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-300 flex items-center gap-2 transition-colors" title="조건 초기화">
                 <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 테이블 영역 (여기는 기존 코드 그대로 두셔도 됩니다) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm font-mono">
            <thead className="bg-slate-800 text-slate-300 text-left">
              <tr>
                <th className="px-4 py-3">Trace ID</th>
                <th className="px-4 py-3">시간</th>
                <th className="px-4 py-3 text-center">발생자</th>
                <th className="px-4 py-3">IP / URI</th>
                <th className="px-4 py-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isError = log.statusCode >= 400;
                return (
                  <tr key={log.logNo} className={`border-b border-slate-50 hover:bg-slate-100 ${isError ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 text-xs text-slate-400" title={log.userAgent}>{log.traceId}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.regDt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-xs">
                       {log.userNo ? <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">No.{log.userNo}</span> : <span className="text-slate-400">비회원</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-bold text-slate-700">{log.reqIp}</div>
                      <div className={`truncate max-w-xs ${isError ? 'text-red-600' : 'text-blue-600'}`}>{log.reqUri}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                       <span className={`px-2 py-1 rounded text-[10px] font-black border ${isError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`} title={log.errorMsg}>
                         {log.statusCode}
                       </span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && <tr><td colSpan="5" className="py-10 text-center text-slate-400">검색된 로그가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

    

  function BlacklistView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다.</div>; }
  function SecurityPolicyView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다.</div>; }
  function ContentSecurityView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다.</div>; }

  const renderContent = () => {
    if (loading) return <div className="p-10 font-bold text-slate-500">DB 데이터를 동기화 중입니다...</div>;
    switch (activeMenu) {
      case 'dashboard': return <DashboardView />;
      case 'user-manage': return <UserManagementView />;
      case 'lawyer-approve': return <LawyerApprovalView />;
      case 'audit-log': return renderAuditLogView();
      case 'blacklist': return <BlacklistView />;
      case 'security-policy': return <SecurityPolicyView />;
      case 'content-security': return <ContentSecurityView />;
      default: return <DashboardView />;
    }
  };

  // =================================================================
  // 5. 사이드바 및 공통 렌더링 영역
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`bg-[#0f172a] text-white transition-all duration-300 flex-shrink-0 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div 
          className="p-6 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.location.href = '/'} 
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">AI</div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter">LAW ADMIN</span>}
        </div>
        <nav className="flex-grow px-3 py-4 space-y-1">
          <MenuSection title="Main" isOpen={isSidebarOpen} />
          <MenuItem icon={<LayoutDashboard size={20} />} label="대시보드" active={activeMenu==='dashboard'} onClick={()=>setActiveMenu('dashboard')} isOpen={isSidebarOpen} />
          
          <MenuSection title="User Management" isOpen={isSidebarOpen} />
          <MenuItem icon={<Users size={20} />} label="회원 정보 통합 관리" active={activeMenu==='user-manage'} onClick={()=>setActiveMenu('user-manage')} isOpen={isSidebarOpen} />
          
          {/* 오퍼레이터 숨김 처리 */}
          {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
            <>
              <MenuItem icon={<UserCheck size={20} />} label="변호사 자격 승인" active={activeMenu==='lawyer-approve'} onClick={()=>setActiveMenu('lawyer-approve')} isOpen={isSidebarOpen} />
              <MenuItem icon={<Ban size={20} />} label="블랙리스트 관리" active={activeMenu==='blacklist'} onClick={()=>setActiveMenu('blacklist')} isOpen={isSidebarOpen} />
            </>
          )}
          
          <MenuSection title="Security Center" isOpen={isSidebarOpen} highlight />
          <MenuItem icon={<Terminal size={20} />} label="시스템 감사 로그" active={activeMenu==='audit-log'} onClick={()=>setActiveMenu('audit-log')} isOpen={isSidebarOpen} />
          <MenuItem icon={<ShieldCheck size={20} />} label="보안 정책 설정" active={activeMenu==='security-policy'} onClick={()=>setActiveMenu('security-policy')} isOpen={isSidebarOpen} />
          <MenuItem icon={<FileSearch size={20} />} label="콘텐츠 보안 관리" active={activeMenu==='content-security'} onClick={()=>setActiveMenu('content-security')} isOpen={isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-bold">로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col max-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronRight className={`transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <h2 className="font-black text-xl text-slate-800 uppercase tracking-tight">{activeMenu.replace('-', ' ')}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <ShieldAlert size={16} />
            </div>
            <div className="text-sm flex items-center">
              <span className="font-bold text-slate-800">{localStorage.getItem('userNm') || '알 수 없음'}</span>
              <span className="ml-1 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {getRoleDisplayName(currentRole)}
              </span>
              <span className="text-emerald-500 ml-3 font-bold text-xs flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                접속됨
              </span>
            </div>
          </div>
        </header>

        <div className="flex-grow p-8 overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* User Detail Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-xl text-slate-800">회원 상세 정보</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            <div className="p-8 space-y-6">
              {/* 상단 프로필 영역 (기존 유지) */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300"><Users size={40} /></div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">{selectedItem.userNm}</h4>
                  <p className="text-slate-500 font-medium">@{selectedItem.userId}</p>
                  {/* 현재 권한 표시 배지 추가 */}
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded">
                    현재: {getRoleDisplayName(selectedItem.roleCode)}
                  </span>
                </div>
              </div>

              {/* 보안 경고 박스 (기존 유지) */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-2"><Lock size={16} /> 개인정보 조회는 AOP 로그에 기록됩니다.</p>
              </div>
              
              {/* ▼▼▼ [핵심 수정] 권한 및 상태 관리 통합 패널 ▼▼▼ */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h5 className="font-bold text-sm text-slate-600 mb-3 flex items-center gap-2">
                  <Settings size={14} /> 관리자 권한 및 상태 설정
                </h5>
                
                <div className="space-y-3">
                   {/* 1. 권한 변경 (슈퍼 관리자만 가능) */}
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500">부여할 권한</span>
                     <select 
                        className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[150px]"
                        value={selectedItem.roleCode}
                        onChange={(e) => handleRoleChange(selectedItem.userId, e.target.value)}
                        disabled={!hasPermission(['ROLE_SUPER_ADMIN'])} // 슈퍼 관리자만 활성화
                     >
                        <option value="ROLE_USER">일반 회원</option>
                        <option value="ROLE_LAWYER">변호사</option>
                        <option value="ROLE_OPERATOR">운영자 (Operator)</option>
                        <option value="ROLE_ADMIN">관리자 (Admin)</option>
                        <option value="ROLE_SUPER_ADMIN">슈퍼 관리자</option>
                     </select>
                   </div>

                   {/* 2. 블랙리스트 처리 (관리자 이상 가능) */}
                   {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
                     <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                       <span className="text-xs font-bold text-slate-500">계정 상태 제어</span>
                       <div className="flex gap-2">
                         {/* 정지 버튼 */}
                         <button 
                           onClick={() => handleUserStatusChange(selectedItem.userId, 'S03')}
                           className="px-3 py-1.5 bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-200 flex items-center gap-1"
                         >
                           <Ban size={12} /> 블랙리스트(정지)
                         </button>
                         {/* 복구 버튼 (정지된 회원일 때만 보임) */}
                         {selectedItem.statusCode === 'S03' && (
                           <button 
                             onClick={() => handleUserStatusChange(selectedItem.userId, 'S01')}
                             className="px-3 py-1.5 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1"
                           >
                             <CheckCircle size={12} /> 정상 복구
                           </button>
                         )}
                       </div>
                     </div>
                   )}
                </div>
              </div>
              {/* ▲▲▲ [수정 끝] ▲▲▲ */}

              {/* 하단 닫기 버튼 */}
              <button onClick={() => setShowModal(false)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-lg shadow-slate-200 transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MenuSection({ title, isOpen, highlight = false }) {
  if (!isOpen) return <div className="h-px bg-slate-800 my-4" />;
  return <div className={`px-4 pt-6 pb-2 text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-blue-400' : 'text-slate-600'}`}>{title}</div>;
}

function MenuItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
      <div className={active ? 'scale-110 duration-200' : ''}>{icon}</div>
      {isOpen && <span className="text-sm">{label}</span>}
      {active && isOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}

function StatCard({ title, value, growth, icon, color = "blue" }) {
    const colorMap = {
      blue: "bg-blue-50 text-blue-600",
      emerald: "bg-emerald-50 text-emerald-600",
      purple: "bg-purple-50 text-purple-600",
      red: "bg-red-50 text-red-600",
      amber: "bg-amber-50 text-amber-600"
    };

    // 성장률 색상 로직 개선 (보안 위협은 낮을수록 좋음)
    const isNegative = growth && growth.startsWith('-');
    let growthClass = "text-slate-400"; // 기본
    
    if (title === "오늘의 보안 위협") {
        // 위협: 감소(-) = 초록(Good), 증가(+) = 빨강(Bad)
        growthClass = isNegative ? 'text-emerald-500' : 'text-rose-500';
    } else {
        // 일반: 감소(-) = 빨강(Bad), 증가(+) = 초록(Good)
        growthClass = isNegative ? 'text-rose-500' : 'text-emerald-500';
    }


    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-sm font-bold text-slate-400 mb-2">{title}</p>
          <div className="text-3xl font-black text-slate-800">
            {typeof value === 'number' ? value.toLocaleString() : value} 
          </div>
          <div className={`mt-2 text-xs font-bold ${growthClass}`}>
            {growth}
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
      </div>
    );
}