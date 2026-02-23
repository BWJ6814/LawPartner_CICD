import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ShieldAlert, FileText, Settings, 
  LogOut, Search, Download, Eye, EyeOff, CheckCircle, XCircle, 
  AlertTriangle, Lock, Unlock, Filter, Calendar, Terminal,
  UserCheck, Ban, Trash2, FileSearch, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import axios from 'axios';

// =================================================================
// 🔗 Axios 기본 설정 (JWT 토큰 자동 포함)
// =================================================================
const api = axios.create({
  baseURL: 'http://localhost:8080', // 자바 백엔드 주소
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
const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">{title}</div>}
    <div className="p-6">{children}</div>
  </div>
);

// =================================================================
// 🎨 공통 UI 컴포넌트
// =================================================================
const Badge = ({ variant = "blue", children }) => {
  const styles = {
    blue: "bg-blue-100 text-blue-700",       // 관리자
    red: "bg-red-100 text-red-700",         // 정지
    green: "bg-emerald-100 text-emerald-700", // 운영자, 활동중 (에메랄드톤)
    gray: "bg-slate-100 text-slate-700",    // 일반 회원
    amber: "bg-amber-100 text-amber-700",   // 슈퍼 관리자, 승인 대기
    purple: "bg-indigo-100 text-indigo-700" // 변호사 (인디고톤)
  };
  // ★ 파트너님 오리지널 UI 클래스 유지 (높이 안 깨짐)
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

// =================================================================
// 🚀 메인 애플리케이션 컴포넌트
// =================================================================
export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // 백엔드 연동 State
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // [초기 데이터 로드]
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. 회원 목록 조회
      const userRes = await api.get('/api/admin/users');
      if (userRes.data.success) setUsers(userRes.data.data);

      // 2. 보안 감사 로그 조회 (페이징 적용됨)
      const logRes = await api.get('/api/admin/logs?page=0&size=50');
      // 수정: logRes.data.data 자체가 Page 객체이므로, 그 안의 content 배열을 꺼내야 합니다!
      if (logRes.data.success && logRes.data.data.content) {
        setLogs(logRes.data.data.content);
      } else if (logRes.data.success && Array.isArray(logRes.data.data)) {
        // 혹시 몰라서 페이징 없이 리스트로 올 경우의 방어 로직
        setLogs(logRes.data.data);
      }
      // 3. 접속자 통계 조회
      const statsRes = await api.get('/api/admin/status/daily');
      if (statsRes.data.success) {
        const sortedStats = statsRes.data.data.sort((a, b) => a.date.localeCompare(b.date));
        setDailyStats(sortedStats);
      }
    } catch (error) {
      console.error("데이터 연동 실패:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("권한이 없습니다. 다시 로그인해주세요.");
        // window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // [회원 상태 변경 (승인/정지)] -> 백엔드 AOP와 완벽 연동
  const handleUserStatusChange = async (userId, statusCode) => {
    const actionNm = statusCode === 'S02' ? '승인' : '정지';
    if (!window.confirm(`해당 회원을 ${actionNm} 처리하시겠습니까?`)) return;

    // ★ S급 AOP가 낚아챌 '사유(reason)' 입력받기
    const reason = prompt(`${actionNm} 사유를 입력해주세요 (감사 로그 필수):`) || "사유 미입력";

    try {
      const res = await api.put('/api/admin/user/status', { userId, statusCode, reason });
      if (res.data.success) {
        alert(`성공적으로 ${actionNm} 되었습니다.`);
        fetchDashboardData(); // 새로고침
        setShowModal(false);
      } else {
        alert(res.data.message);
      }
    } catch (e) {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  // [엑셀 다운로드] -> SXSSF 및 AOP 연동
  const handleExcelDownload = async () => {
    const reason = prompt("다운로드 사유를 입력해주세요 (보안 규정):");
    if (!reason) return alert("사유 입력은 필수입니다.");

    try {
      const response = await api.get(`/api/admin/logs/download?reason=${encodeURIComponent(reason)}`, {
        responseType: 'blob', // 파일 다운로드를 위한 Blob 처리
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Security_Audit_Log_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("다운로드 실패");
    }
  };

  // 화면 렌더링 스위치
  const renderContent = () => {
    if (loading) return <div className="p-10 font-bold text-slate-500">DB 데이터를 동기화 중입니다...</div>;
    
    switch (activeMenu) {
      case 'dashboard': return <DashboardView />;
      case 'user-manage': return <UserManagementView />;
      case 'lawyer-approve': return <LawyerApprovalView />;
      case 'audit-log': return <AuditLogView />;
      // 아래 메뉴들은 UI만 제공 (백엔드 미구현 MVP 스펙)
      case 'blacklist': return <BlacklistView />;
      case 'security-policy': return <SecurityPolicyView />;
      case 'content-security': return <ContentSecurityView />;
      default: return <DashboardView />;
    }
  };
// =================================================================
  // 1. 대시보드 화면 (통계 및 차트 완벽 연동)
  // =================================================================
  function DashboardView() {
    // 1. 오늘 접속자 수 (데이터가 없으면 0으로 안전하게 처리)
    const todayVisitors = dailyStats && dailyStats.length > 0 ? dailyStats[dailyStats.length - 1].count : 0;
    
    // 2. 보안 위협 감지 수 (400번대, 500번대 에러 상태 코드 개수)
    const errorThreats = logs ? logs.filter(l => l.statusCode >= 400).length : 0;

    // 3. 승인 대기 중인 예비 변호사 수 (S02 상태 또는 ROLE_ASSOCIATE 권한)
    const pendingLawyers = users ? users.filter(u => u.statusCode === 'S02' || u.roleCode === 'ROLE_ASSOCIATE').length : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* 상단 4개 요약 위젯 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="총 회원 수 (DB)" value={users ? users.length : 0} growth="실시간" icon={<Users className="text-blue-600" />} />
          <StatCard title="승인 대기 (변호사)" value={pendingLawyers} growth="확인 필요" icon={<UserCheck className="text-amber-600" />} color="amber" />
          <StatCard title="오늘 접속자 수" value={todayVisitors} growth="실시간" icon={<Eye className="text-purple-600" />} />
          <StatCard title="보안 위협 (4xx,5xx)" value={errorThreats} growth="실시간 감지" icon={<ShieldAlert className="text-red-600" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 7일 접속자 통계 차트 */}
          <Card title="최근 7일 접속자 통계 (DB 연동)">
            <div className="h-64">
              {dailyStats && dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    {/* ★ X축 날짜 형식이 길면 짤릴 수 있어 텍스트 크기 조정 */}
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="방문자 수" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 font-bold">
                  통계 데이터가 충분하지 않습니다.
                </div>
              )}
            </div>
          </Card>

          {/* 실시간 보안 위협 로그 리스트 */}
          <Card title="실시간 보안 위협 로그 (자동 수집)">
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {logs && logs.filter(log => log.statusCode >= 400).length > 0 ? (
                logs.filter(log => log.statusCode >= 400).slice(0, 5).map(log => (
                  <div key={log.logNo} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-red-900">{log.reqIp}</div>
                        {/* URL이 너무 길면 잘리도록 truncate 적용 */}
                        <div className="text-xs text-red-700 truncate w-48">{log.reqUri}</div>
                      </div>
                    </div>
                    <div className="text-xs text-red-500 font-mono font-bold border border-red-200 px-2 py-1 rounded bg-white">
                      {log.statusCode}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-10 font-bold flex flex-col items-center justify-center h-full">
                  <ShieldCheck size={40} className="text-emerald-200 mb-2" />
                  감지된 보안 위협이 없습니다.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =================================================================
  // 2. 회원 관리 화면
  // =================================================================
  function UserManagementView() {
    return (
      <Card title="일반 회원 관리 (전체 명부)">
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3">No (DB)</th>
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
                  
                  {/* ★ 1. 권한 세분화 (ROLE_ASSOCIATE 추가) */}
                  <td className="px-4 py-4">
                    {user.roleCode === 'ROLE_SUPER_ADMIN' ? <Badge variant="amber">슈퍼 관리자</Badge> :
                     user.roleCode === 'ROLE_ADMIN' ? <Badge variant="blue">관리자</Badge> :
                     user.roleCode === 'ROLE_OPERATOR' ? <Badge variant="green">운영자</Badge> :
                     user.roleCode === 'ROLE_LAWYER' ? <Badge variant="purple">변호사</Badge> :
                     user.roleCode === 'ROLE_ASSOCIATE' ? <Badge variant="amber">준회원 (승인대기)</Badge> :
                     <Badge variant="gray">일반 회원</Badge>}
                  </td>

                  {/* ★ 2. 백엔드 상태 코드 완벽 매칭 (S02 = 승인 대기) */}
                  <td className="px-4 py-4">
                    {user.statusCode === 'S03' ? (
                      <Badge variant="red">정지</Badge>
                    ) : user.statusCode === 'S02' ? (
                      <Badge variant="amber">승인 대기</Badge>
                    ) : (
                      <Badge variant="green">활동중</Badge>
                    )}
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

  // =================================================================
  // 3. 변호사 승인 화면
  // =================================================================
  function LawyerApprovalView() {
    const applicants = users.filter(u => u.statusCode === 'S02' || u.roleCode === 'ROLE_ASSOCIATE');
    return (
      <Card title="변호사 자격 승인 처리 (워크플로우)">
        <div className="space-y-4 mt-4">
          {applicants.map(user => (
            <div key={user.userNo} className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-300 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Users size={24} />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{user.userNm} (승인 대기자)</div>
                  <div className="text-xs text-slate-500">ID: {user.userId} | 가입일: {new Date(user.joinDt).toLocaleDateString()}</div>
                </div>
              </div>
              <button 
                onClick={() => handleUserStatusChange(user.userId, 'S01')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
              >
                자격 검증 및 승인 (S02)
              </button>
            </div>
          ))}
          {applicants.length === 0 && <div className="text-center py-8 text-slate-400 font-bold">대기 중인 승인 요청이 없습니다.</div>}
        </div>
      </Card>
    );
  }

  // =================================================================
  // 4. 보안 감사 로그 화면
  // =================================================================
  function AuditLogView() {
    return (
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Terminal size={18} className="text-blue-600" /> 실시간 보안 감사 로그 (AOP 연동)
          </h3>
          <button onClick={handleExcelDownload} className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
            <Download size={16} /> 대용량 엑셀 다운로드 (SXSSF)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead className="bg-slate-800 text-slate-300 text-left">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Trace ID</th>
                <th className="px-4 py-3 font-medium">일시</th>
                <th className="px-4 py-3 font-medium">요청 IP</th>
                <th className="px-4 py-3 font-medium">URI</th>
                <th className="px-4 py-3 font-medium text-right">응답시간</th>
                <th className="px-4 py-3 font-medium text-center rounded-tr-lg">상태</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.logNo} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 text-xs">{log.traceId || 'SYSTEM'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(log.regDt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{log.reqIp}</td>
                  <td className="px-4 py-3 text-blue-600 truncate max-w-xs">{log.reqUri}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{log.execTime}ms</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.statusCode === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {log.statusCode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // (아래 BlacklistView, SecurityPolicyView, ContentSecurityView는 파트너님이 주신 원본 코드와 동일하게 유지 - UI용)
  function BlacklistView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다. (MVP 제외 기능)</div>; }
  function SecurityPolicyView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다. (MVP 제외 기능)</div>; }
  function ContentSecurityView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다. (MVP 제외 기능)</div>; }

  // =================================================================
  // 5. 공통 레이아웃 (사이드바 & 헤더)
  // =================================================================
  function StatCard({ title, value, growth, icon, color = "blue" }) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="text-2xl font-black text-slate-800">{value}</div>
          <div className="mt-2 text-xs font-bold text-slate-400">{growth}</div>
        </div>
        <div className={`p-3 bg-${color}-50 rounded-xl`}>{icon}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`bg-[#0f172a] text-white transition-all duration-300 flex-shrink-0 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">AI</div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter">LAW ADMIN</span>}
        </div>
        <nav className="flex-grow px-3 py-4 space-y-1">
          <MenuSection title="Main" isOpen={isSidebarOpen} />
          <MenuItem icon={<LayoutDashboard size={20} />} label="대시보드" active={activeMenu==='dashboard'} onClick={()=>setActiveMenu('dashboard')} isOpen={isSidebarOpen} />
          
          <MenuSection title="User Management" isOpen={isSidebarOpen} />
          <MenuItem icon={<Users size={20} />} label="회원 정보 통합 관리" active={activeMenu==='user-manage'} onClick={()=>setActiveMenu('user-manage')} isOpen={isSidebarOpen} />
          <MenuItem icon={<UserCheck size={20} />} label="변호사 자격 승인" active={activeMenu==='lawyer-approve'} onClick={()=>setActiveMenu('lawyer-approve')} isOpen={isSidebarOpen} />
          <MenuItem icon={<Ban size={20} />} label="블랙리스트 관리" active={activeMenu==='blacklist'} onClick={()=>setActiveMenu('blacklist')} isOpen={isSidebarOpen} />

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
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><ShieldAlert size={16} /></div>
            <div className="text-sm"><span className="font-bold text-slate-800">System Admin</span><span className="text-emerald-500 ml-2 font-bold text-xs">● 접속됨</span></div>
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
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300"><Users size={40} /></div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">{selectedItem.userNm}</h4>
                  <p className="text-slate-500 font-medium">@{selectedItem.userId}</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-2"><Lock size={16} /> 개인정보 조회는 AOP 로그에 기록됩니다.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUserStatusChange(selectedItem.userId, 'S03')} className="flex-grow py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700">계정 정지 처리</button>
              </div>
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