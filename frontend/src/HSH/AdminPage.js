import React, { useState, useEffect, useMemo } from 'react';
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

// --- Mock Data ---
const DASHBOARD_STATS = {
  totalUsers: { value: 12540, growth: '+12%' },
  newUsers: { value: 145, growth: '+5%' },
  dailyVisitors: { value: 3820, growth: '-2%' },
  securityThreats: { value: 24, growth: '+15%' }
};

const USER_DATA = [
  { id: 1, userId: 'user01', name: '김철수', date: '2024-03-20', status: '활동중', email: 'chulsoo@example.com', phone: '010-1234-5678' },
  { id: 2, userId: 'legal_pro', name: '이영희', date: '2024-03-19', status: '정지', email: 'younghee@law.com', phone: '010-9876-5432' },
  { id: 3, userId: 'justice_man', name: '박민수', date: '2024-03-18', status: '활동중', email: 'minsoo@gmail.com', phone: '010-5555-4444' },
];

const AUDIT_LOGS = [
  { id: 101, time: '2024-03-21 14:22:10', ip: '192.168.0.15', url: '/api/v1/user/login', duration: '45ms', status: 200, error: '-' },
  { id: 102, time: '2024-03-21 14:25:05', ip: '210.12.55.102', url: '/api/v1/admin/delete', duration: '120ms', status: 403, error: 'Unauthorized Access' },
  { id: 103, time: '2024-03-21 14:30:45', ip: '45.77.120.3', url: '/api/v1/lawyer/approve', duration: '60ms', status: 200, error: '-' },
];

const FORBIDDEN_WORDS = ['광고', '도박', '욕설', '비방', '스팸'];

// --- Utility Components ---
const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">{title}</div>}
    <div className="p-6">{children}</div>
  </div>
);

const Badge = ({ variant = "blue", children }) => {
  const styles = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-slate-100 text-slate-700",
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

// --- Main App Component ---
export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMasked, setIsMasked] = useState(true);

  // Navigation Logic
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <DashboardView />;
      case 'user-manage': return <UserManagementView />;
      case 'lawyer-approve': return <LawyerApprovalView />;
      case 'blacklist': return <BlacklistView />;
      case 'audit-log': return <AuditLogView />;
      case 'security-policy': return <SecurityPolicyView />;
      case 'content-security': return <ContentSecurityView />;
      default: return <DashboardView />;
    }
  };

  // --- View Components ---
  
  function DashboardView() {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="총 회원 수" value={DASHBOARD_STATS.totalUsers.value} growth={DASHBOARD_STATS.totalUsers.growth} icon={<Users className="text-blue-600" />} />
          <StatCard title="오늘 신규 가입" value={DASHBOARD_STATS.newUsers.value} growth={DASHBOARD_STATS.newUsers.growth} icon={<UserCheck className="text-emerald-600" />} />
          <StatCard title="오늘 접속자 수" value={DASHBOARD_STATS.dailyVisitors.value} growth={DASHBOARD_STATS.dailyVisitors.growth} icon={<Eye className="text-purple-600" />} />
          <StatCard title="보안 위협 감지" value={DASHBOARD_STATS.securityThreats.value} growth={DASHBOARD_STATS.securityThreats.growth} icon={<ShieldAlert className="text-red-600" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="가입자 및 방문자 추이">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  {name: '3/15', users: 400, visitors: 2400},
                  {name: '3/16', users: 300, visitors: 1398},
                  {name: '3/17', users: 200, visitors: 9800},
                  {name: '3/18', users: 278, visitors: 3908},
                  {name: '3/19', users: 189, visitors: 4800},
                  {name: '3/20', users: 239, visitors: 3800},
                  {name: '3/21', users: 349, visitors: 4300},
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="visitors" stroke="#94a3b8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <button className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
              <Download size={16} /> 차트 이미지 저장 (.png)
            </button>
          </Card>

          <Card title="최근 보안 위협 로그 (403 Error)">
            <div className="space-y-4">
              {AUDIT_LOGS.filter(log => log.status === 403).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-red-900">{log.ip}</div>
                      <div className="text-xs text-red-700">{log.url} - {log.error}</div>
                    </div>
                  </div>
                  <div className="text-xs text-red-500 font-mono">{log.time.split(' ')[1]}</div>
                </div>
              ))}
              <button className="w-full py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">전체 로그 보러가기</button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function UserManagementView() {
    return (
      <Card title="회원 관리">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-lg text-sm bg-slate-50">
              <option>ID</option>
              <option>이름</option>
              <option>이메일</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="검색어 입력..." className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">검색</button>
          </div>
          <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Download size={16} /> 엑셀 다운로드
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3">번호</th>
                <th className="px-4 py-3">아이디</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {USER_DATA.map((user, idx) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {setSelectedItem(user); setShowModal(true);}}>
                  <td className="px-4 py-4">{idx + 1}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{user.userId}</td>
                  <td className="px-4 py-4">{user.name}</td>
                  <td className="px-4 py-4 text-slate-500">{user.date}</td>
                  <td className="px-4 py-4">
                    <Badge variant={user.status === '활동중' ? 'green' : 'red'}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-blue-600 hover:underline">상세</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function LawyerApprovalView() {
    return (
      <div className="space-y-4">
        <div className="flex border-b border-slate-200">
          {['전체', '승인 대기', '승인 완료', '반려'].map((tab, idx) => (
            <button key={tab} className={`px-6 py-3 text-sm font-medium transition-colors ${idx === 1 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab}
            </button>
          ))}
        </div>
        <Card>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-300 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">박변호 {i}</div>
                    <div className="text-xs text-slate-500">ID: lawyer_test{i} | 신청일: 2024-03-21</div>
                  </div>
                </div>
                <button 
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-all"
                  onClick={() => {setSelectedItem({ name: `박변호 ${i}` }); setShowModal(true);}}
                >
                  증빙 서류 확인
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function AuditLogView() {
    return (
      <div className="space-y-4">
        <Card title="감사 로그 필터">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">기간 선택</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-slate-50">
                <Calendar size={16} className="text-slate-400" />
                <input type="text" value="2024-03-01 ~ 2024-03-21" className="bg-transparent text-sm outline-none w-full" readOnly />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">로그 타입</label>
              <select className="border rounded-lg px-3 py-2 bg-slate-50 text-sm outline-none">
                <option>전체 로그</option>
                <option>정상 (200 OK)</option>
                <option>에러 (4xx, 5xx)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500">검색어 (IP / URL)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="192.168.0..." className="border rounded-lg px-3 py-2 bg-slate-50 text-sm outline-none flex-grow" />
                <button className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold">조회</button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Terminal size={18} className="text-blue-600" /> 시스템 실시간 로그
            </h3>
            <button className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
              <Download size={16} /> 대용량 엑셀 다운로드 (SXSSF)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">일시</th>
                  <th className="px-4 py-3 font-medium">IP 주소</th>
                  <th className="px-4 py-3 font-medium">요청 URL</th>
                  <th className="px-4 py-3 font-medium text-right">지연시간</th>
                  <th className="px-4 py-3 font-medium text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOGS.map(log => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{log.time}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{log.ip}</td>
                    <td className="px-4 py-3 text-blue-600 truncate max-w-xs">{log.url}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{log.duration}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  function SecurityPolicyView() {
    const [words, setWords] = useState(FORBIDDEN_WORDS);
    const [input, setInput] = useState('');

    const addWord = (e) => {
      if (e.key === 'Enter' && input.trim()) {
        setWords([...new Set([...words, input.trim()])]);
        setInput('');
      }
    };

    return (
      <Card title="보안 정책 설정 (금지어 필터링)">
        <div className="max-w-xl space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">새 금지어 등록</label>
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={addWord}
                placeholder="금지어를 입력하고 Enter를 누르세요" 
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400 transition-all text-sm"
              />
              <button onClick={() => addWord({key: 'Enter'})} className="absolute right-3 top-2.5 bg-blue-600 text-white p-1.5 rounded-lg">
                <CheckCircle size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400">등록된 금지어는 AI 상담 및 게시판 필터링에 즉시 반영됩니다.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">관리 중인 금지어 ({words.length})</label>
            <div className="flex flex-wrap gap-2">
              {words.map(word => (
                <div key={word} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{word}</span>
                  <button onClick={() => setWords(words.filter(w => w !== word))} className="text-slate-400 hover:text-red-500">
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  function BlacklistView() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="IP 차단 등록" className="lg:col-span-1">
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">IP 주소</label>
              <input type="text" placeholder="xxx.xxx.xxx.xxx" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">차단 사유</label>
              <textarea placeholder="반복적인 비정상 접근..." className="w-full px-3 py-2 border rounded-lg text-sm h-24 resize-none"></textarea>
            </div>
            <button className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">차단 등록</button>
          </form>
        </Card>
        
        <Card title="차단된 IP 목록" className="lg:col-span-2">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border text-red-600 shadow-sm">
                    <Ban size={20} />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-800">220.12.{i}.105</div>
                    <div className="text-xs text-slate-500">차단일: 2024-03-21 | 사유: SQL Injection 시도</div>
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-slate-600">해제(삭제)</button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function ContentSecurityView() {
    return (
      <Card title="블라인드 콘텐츠 관리">
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="p-5 border-2 border-slate-50 rounded-2xl space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Badge variant="red">블라인드</Badge>
                  <span className="text-xs text-slate-400">사유: 개인정보 노출 의심</span>
                </div>
                <div className="text-xs text-slate-400">2024-03-21 09:15</div>
              </div>
              
              <div className="p-4 bg-slate-900 rounded-xl relative overflow-hidden group">
                <div className={`text-slate-200 text-sm font-medium leading-relaxed ${isMasked ? 'blur-sm select-none' : ''}`}>
                   {isMasked ? "************************************************************************" : "안녕하세요. 제 전화번호는 010-1234-5678이고 계좌번호는 신한 110-***-**** 입니다. 상담 부탁드립니다."}
                </div>
                {isMasked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={() => {setSelectedItem({ type: 'content' }); setShowModal(true);}}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold transition-all"
                    >
                      <Eye size={16} /> 원문 확인 (보안 인증 필요)
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button className="flex items-center gap-1 text-xs font-bold text-blue-600 px-3 py-1.5 border border-blue-100 rounded-lg hover:bg-blue-50">
                  <Unlock size={14} /> 블라인드 해제
                </button>
                <button className="flex items-center gap-1 text-xs font-bold text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} /> 영구 삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // --- Sub-components ---
  function StatCard({ title, value, growth, icon, color = "blue" }) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="text-2xl font-black text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          <div className={`mt-2 text-xs font-bold ${growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
            {growth} <span className="text-slate-400 font-normal ml-1">전일 대비</span>
          </div>
        </div>
        <div className={`p-3 bg-${color}-50 rounded-xl`}>{icon}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar (LNB) */}
      <aside className={`bg-[#0f172a] text-white transition-all duration-300 flex-shrink-0 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">AI</div>
          {isSidebarOpen && <span className="font-black text-lg tracking-tighter">LAW ADMIN</span>}
        </div>

        <nav className="flex-grow px-3 py-4 space-y-1">
          <MenuSection title="Main" isOpen={isSidebarOpen} />
          <MenuItem 
            icon={<LayoutDashboard size={20} />} 
            label="대시보드" 
            active={activeMenu === 'dashboard'} 
            onClick={() => setActiveMenu('dashboard')} 
            isOpen={isSidebarOpen} 
          />

          <MenuSection title="User Management" isOpen={isSidebarOpen} />
          <MenuItem 
            icon={<Users size={20} />} 
            label="일반 회원 관리" 
            active={activeMenu === 'user-manage'} 
            onClick={() => setActiveMenu('user-manage')} 
            isOpen={isSidebarOpen} 
          />
          <MenuItem 
            icon={<UserCheck size={20} />} 
            label="변호사 승인 관리" 
            active={activeMenu === 'lawyer-approve'} 
            onClick={() => setActiveMenu('lawyer-approve')} 
            isOpen={isSidebarOpen} 
          />
          <MenuItem 
            icon={<Ban size={20} />} 
            label="블랙리스트 (IP)" 
            active={activeMenu === 'blacklist'} 
            onClick={() => setActiveMenu('blacklist')} 
            isOpen={isSidebarOpen} 
          />

          <MenuSection title="Security Center" isOpen={isSidebarOpen} highlight />
          <MenuItem 
            icon={<Terminal size={20} />} 
            label="감사 로그" 
            active={activeMenu === 'audit-log'} 
            onClick={() => setActiveMenu('audit-log')} 
            isOpen={isSidebarOpen} 
          />
          <MenuItem 
            icon={<ShieldCheck size={20} />} 
            label="보안 정책 설정" 
            active={activeMenu === 'security-policy'} 
            onClick={() => setActiveMenu('security-policy')} 
            isOpen={isSidebarOpen} 
          />
          <MenuItem 
            icon={<FileSearch size={20} />} 
            label="콘텐츠 보안 관리" 
            active={activeMenu === 'content-security'} 
            onClick={() => setActiveMenu('content-security')} 
            isOpen={isSidebarOpen} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-bold">로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronRight className={`transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <h2 className="font-black text-xl text-slate-800 uppercase tracking-tight">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldAlert size={16} />
              </div>
              <div className="text-sm">
                <span className="font-bold text-slate-800">Admin_Hong</span>
                <span className="text-slate-400 ml-2">(보안 관제사)</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-grow p-8 overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-xl text-slate-800">관리 상세 정보</h3>
              <button onClick={() => {setShowModal(false); setIsMasked(true);}} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            
            <div className="p-8">
              {selectedItem?.type === 'content' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl flex items-center gap-3 border border-amber-200">
                    <Lock className="text-amber-600" />
                    <p className="text-sm font-bold text-amber-900">본 정보를 확인하려면 관리자 비밀번호가 필요합니다.</p>
                  </div>
                  <input type="password" placeholder="관리자 비밀번호 입력" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-400" />
                  <button onClick={() => {setIsMasked(false); setShowModal(false);}} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">인증 및 원문 확인</button>
                </div>
              ) : selectedItem?.userId ? (
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                        <Users size={40} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800">{selectedItem.name}</h4>
                        <p className="text-slate-500 font-medium">@{selectedItem.userId}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-slate-400 font-bold mb-1">이메일 주소</p>
                       <p className="font-bold text-slate-700">{selectedItem.email}</p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-slate-400 font-bold mb-1">전화번호</p>
                       <p className="font-bold text-slate-700">{selectedItem.phone}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button className="flex-grow py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">비밀번호 초기화</button>
                     <button className="flex-grow py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700">강제 탈퇴 처리</button>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="aspect-[3/4] bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                    <div className="text-center">
                      <FileText size={48} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-400">자격 증명 서류 (PDF/IMG)</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button className="flex-grow py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">최종 승인 (Role 변경)</button>
                    <button className="flex-grow py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100">반려</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Menu Helper Components ---
function MenuSection({ title, isOpen, highlight = false }) {
  if (!isOpen) return <div className="h-px bg-slate-800 my-4" />;
  return (
    <div className={`px-4 pt-6 pb-2 text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-blue-400' : 'text-slate-600'}`}>
      {title}
    </div>
  );
}

function MenuItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }
      `}
    >
      <div className={active ? 'scale-110 duration-200' : ''}>{icon}</div>
      {isOpen && <span className="text-sm">{label}</span>}
      {active && isOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}