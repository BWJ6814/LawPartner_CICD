import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  LayoutDashboard, Users, ShieldAlert, FileText, Settings, 
  LogOut, Search, Download, Eye, EyeOff, CheckCircle, XCircle, 
  AlertTriangle, Lock, Unlock, Filter, Calendar, Terminal,
  UserCheck, Ban, Trash2, FileSearch, ShieldCheck, ChevronRight
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

  const fetchAuditLogs = async () => {
    try {
      const logType = showOnlyErrors ? 'ERROR' : 'ALL';
      const logRes = await api.get(`/api/admin/logs?page=0&size=50&type=${logType}`);
      
      if (logRes.data.success && logRes.data.data.content) {
        setLogs(logRes.data.data.content);
      } else if (logRes.data.success && Array.isArray(logRes.data.data)) {
        setLogs(logRes.data.data);
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

  // =================================================================
  // 🖥️ 개별 화면 렌더링 뷰
  // =================================================================
  
  // 1. 대시보드 화면
  function DashboardView() {
    const chartData = useMemo(() => {
      return dailyStats.slice(-7).map(stat => ({
        name: stat.date.substring(5),
        visitors: stat.count,
        users: Math.floor(stat.count * 0.15)
      }));
    }, [dailyStats]);

    // ★ S급 디테일: 차트 다운로드 버튼을 Card의 rightElement로 배치
    const chartDownloadBtn = hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR']) ? (
      <button onClick={handleDownloadChart} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors text-sm">
        <Download size={14} /> 차트 캡처
      </button>
    ) : null;

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
          <Card title="가입자 및 방문자 통합 추이 (최근 7일)" rightElement={chartDownloadBtn}>
            {/* ★ 캡처를 위해 차트 영역에 ref 부여 */}
            <div className="h-72 p-2 bg-white" ref={chartRef}>
              <ResponsiveContainer width="100%" height="100%" key={chartData.length}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Area type="monotone" dataKey="users" name="신규 가입자" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="visitors" name="전체 방문자" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
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
  function AuditLogView() {
    return (
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Terminal size={20} className="text-blue-600" /> 실시간 시스템 감사 로그
          </h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg border hover:bg-slate-200 transition-colors">
              <input 
                type="checkbox" 
                checked={showOnlyErrors} 
                onChange={(e) => setShowOnlyErrors(e.target.checked)}
                className="accent-red-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-600">위협 로그(4xx, 5xx)만 보기</span>
            </label>
            
            {/* 엑셀 다운로드는 슈퍼관리자/관리자만 가능 */}
            {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
              <button onClick={handleExcelDownload} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm">
                <FileText size={16} /> 엑셀 다운로드
              </button>
            )}
          </div>
        </div>

        {/* ★ w-full 추가로 가로 스크롤 영역 명확화 */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 w-full">
          {/* ★ 레이아웃 방어 핵심: table-fixed, min-w-[1000px], whitespace-nowrap 적용 */}
          <table className="w-full text-sm font-mono table-fixed min-w-[1000px] whitespace-nowrap">
            <thead className="bg-slate-800 text-slate-300 text-left">
              <tr>
                {/* ★ 비율 조정: Trace ID를 10%로 줄이고, 발생 일시를 20%로 늘려서 공간 확보! */}
                <th className="px-4 py-4 font-medium w-[10%]">Trace ID</th>
                <th className="px-4 py-4 font-medium w-[20%]">발생 일시</th>
                <th className="px-4 py-4 font-medium text-center w-[10%]">발생자</th>
                <th className="px-4 py-4 font-medium w-[15%]">요청 IP</th>
                <th className="px-4 py-4 font-medium w-[25%]">URI</th>
                <th className="px-4 py-4 font-medium text-right w-[10%]">응답시간</th>
                <th className="px-4 py-4 font-medium text-center w-[10%]">상태</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isError = log.statusCode >= 400;
                
                // ★ S급 디테일: 날짜를 "YYYY-MM-DD HH:mm:ss" 포맷으로 깔끔하게 변환하는 로직
                const formatDateTime = (dateStr) => {
                  if (!dateStr) return '-';
                  const d = new Date(dateStr);
                  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
                };

                return (
                  <tr key={log.logNo} className={`border-b border-slate-50 hover:bg-slate-100 ${isError ? 'bg-red-50/50' : ''}`}>
                    
                    <td className="px-4 py-3 text-slate-400 text-xs truncate" title={`접속 환경: ${log.userAgent || '알 수 없음'}`}>
                      <span className="border-b border-dashed border-slate-400 cursor-help">{log.traceId || 'SYSTEM'}</span>
                    </td>
                    
                    {/* ★ 수정됨: 깔끔하게 압축된 날짜 포맷 적용 및 툴팁으로 원본 날짜 제공 */}
                    <td className="px-4 py-3 text-slate-600 font-medium text-xs truncate" title={new Date(log.regDt).toLocaleString()}>
                      {formatDateTime(log.regDt)}
                    </td>
                    
                    <td className="px-4 py-3 text-center text-xs truncate">
                      {log.userNo ? (
                        <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-md">No. {log.userNo}</span>
                      ) : (
                        <span className="text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md border border-slate-200">비회원</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 font-bold text-slate-700 text-xs truncate">{log.reqIp}</td>
                    
                    <td className={`px-4 py-3 truncate text-xs ${isError ? 'text-red-600 font-black' : 'text-blue-600 font-medium'}`} title={log.reqUri}>
                      {log.reqUri}
                    </td>
                    
                      <td className="px-4 py-3 text-right text-slate-400 text-xs truncate">{log.execTime}ms</td>
                    
                    <td className="px-4 py-3 text-center truncate">
                      <span 
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black border ${!isError ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm cursor-help'}`}
                        title={isError ? log.errorMsg || '상세 에러 메시지 없음' : '정상 처리'}
                      >
                        {log.statusCode}
                        {isError && <AlertTriangle size={12} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-bold italic">데이터가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function BlacklistView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다.</div>; }
  function SecurityPolicyView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다.</div>; }
  function ContentSecurityView() { return <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border">UI 기획안 확인용 모의 화면입니다.</div>; }

  const renderContent = () => {
    if (loading) return <div className="p-10 font-bold text-slate-500">DB 데이터를 동기화 중입니다...</div>;
    switch (activeMenu) {
      case 'dashboard': return <DashboardView />;
      case 'user-manage': return <UserManagementView />;
      case 'lawyer-approve': return <LawyerApprovalView />;
      case 'audit-log': return <AuditLogView />;
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
                {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
                  <button onClick={() => handleUserStatusChange(selectedItem.userId, 'S03')} className="flex-grow py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-sm">
                    계정 정지 처리
                  </button>
                )}
                {hasPermission(['ROLE_OPERATOR']) && (
                  <button onClick={() => setShowModal(false)} className="flex-grow py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300">
                    닫기
                  </button>
                )}
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
function StatCard({ title, value, growth, icon, color = "blue" }) {
    const colorMap = {
      blue: "bg-blue-50 text-blue-600",
      emerald: "bg-emerald-50 text-emerald-600",
      purple: "bg-purple-50 text-purple-600",
      red: "bg-red-50 text-red-600",
      amber: "bg-amber-50 text-amber-600"
    };
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-sm font-bold text-slate-400 mb-2">{title}</p>
          <div className="text-3xl font-black text-slate-800">
            {typeof value === 'number' ? value.toLocaleString() : value} 
          </div>
          <div className={`mt-2 text-xs font-bold ${growth && growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
            {growth}
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
      </div>
    );
}