import React from 'react';
import {
    MessageSquareMore, RefreshCw, Trash2, SendHorizonal,
    Search, FileText, CalendarDays, Tag, Clock3, Filter, AlertCircle
} from 'lucide-react';
import { Card } from './AdminComponents';

// ==================================================================================
// 🔧 유틸 함수
// ==================================================================================

function formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function getStatusStyle(status) {
    const s = String(status || '').trim();
    if (s.includes('완료')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (s.includes('진행')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (s.includes('반려') || s.includes('거절')) return 'bg-rose-50 text-rose-600 border-rose-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
}

// ==================================================================================
// 🖥️ 뷰 컴포넌트
// ==================================================================================

export default function AdminInquiryManageView({
    list,
    filteredList,
    selectedId,
    setSelectedId,
    detail,
    isLoadingList,
    isLoadingDetail,
    isSaving,
    isDeleting,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    answerText,
    setAnswerText,
    fetchList,
    handleSaveAnswer,
    handleDeleteInquiry,
    waitingCount,
    answeredCount,
    adminName
}) {
    return (
        <Card>
            {/* ── 상단 헤더 영역 ── */}
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg mb-1">
                        <MessageSquareMore size={20} className="text-blue-600" /> 문의 답변 관리
                    </h3>
                    <p className="text-sm text-slate-500">
                        답변 대기 문의를 확인하고 처리하는 관리자 전용 큐(Queue)입니다.
                    </p>
                </div>
                <button 
                    onClick={fetchList}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2 transition-colors"
                >
                    <RefreshCw size={16} /> 새로고침
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── 왼쪽: 문의 목록 패널 (col-span-4) ── */}
                <section className="col-span-1 lg:col-span-4 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white h-[700px]">
                    
                    {/* 왼쪽 패널 헤더 & 검색/필터 */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
                        {/* 통계 요약 (가로 정렬로 찌그러짐 방지) */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-sm">
                                <div className="text-[10px] font-bold text-slate-500 mb-0.5">전체</div>
                                <div className="text-lg font-black text-slate-800">{list.length}</div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-center shadow-sm">
                                <div className="text-[10px] font-bold text-amber-600 mb-0.5">대기</div>
                                <div className="text-lg font-black text-amber-700">{waitingCount}</div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center shadow-sm">
                                <div className="text-[10px] font-bold text-emerald-600 mb-0.5">완료</div>
                                <div className="text-lg font-black text-emerald-700">{answeredCount}</div>
                            </div>
                        </div>

                        {/* 검색바 */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                value={searchKeyword} 
                                onChange={e => setSearchKeyword(e.target.value)}
                                placeholder="제목, 유형 검색..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                            />
                        </div>

                        {/* 상태 탭 필터 (Segmented Control 스타일) */}
                        <div className="flex bg-slate-200/50 p-1 rounded-lg">
                            {[{ label: '전체', value: 'ALL' }, { label: '대기', value: '대기' }, { label: '완료', value: '답변완료' }].map(tab => (
                                <button 
                                    key={tab.value} 
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        statusFilter === tab.value 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 목록 리스트 영역 */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/30">
                        {isLoadingList ? (
                            <div className="p-6 text-center text-sm font-bold text-slate-400">목록을 불러오는 중...</div>
                        ) : filteredList.length === 0 ? (
                            <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                                <AlertCircle size={32} className="mb-2 opacity-20" />
                                <span className="text-sm font-bold">문의 내역이 없습니다.</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredList.map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => setSelectedId(item.id)}
                                        className={`w-full text-left px-4 py-3 transition-colors ${
                                            selectedId === item.id
                                                ? 'bg-blue-50/50 border-l-4 border-l-blue-600'
                                                : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(item.status)}`}>
                                                {item.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-0.5 line-clamp-1">{item.type}</div>
                                        <div className="text-sm font-bold text-slate-800 line-clamp-1 mb-2">{item.title}</div>
                                        <div className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── 오른쪽: 작업 패널 (col-span-8) ── */}
                <section className="col-span-1 lg:col-span-8 flex flex-col gap-6">
                    
                    {/* 상단: 상세 정보 표출 영역 */}
                    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" /> 상세 내용
                            </h4>
                            {detail?.status && (
                                <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusStyle(detail.status)}`}>
                                    상태: {detail.status}
                                </span>
                            )}
                        </div>

                        <div className="p-5">
                            {!selectedId ? (
                                <div className="py-10 text-center text-sm font-bold text-slate-400">목록에서 문의를 선택해주세요.</div>
                            ) : isLoadingDetail ? (
                                <div className="py-10 text-center text-sm font-bold text-slate-400">상세 정보를 불러오는 중...</div>
                            ) : !detail ? (
                                <div className="py-10 text-center text-sm font-bold text-rose-400">정보를 불러오지 못했습니다.</div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1"><Tag size={12}/> 문의 유형</div>
                                            <div className="text-sm font-bold text-slate-800">{detail.type}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1"><CalendarDays size={12}/> 작성일</div>
                                            <div className="text-sm font-bold text-slate-800">{formatDateTime(detail.createdAt)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1"><Clock3 size={12}/> 답변일</div>
                                            <div className="text-sm font-bold text-slate-800">{formatDateTime(detail.answeredAt)}</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 mb-3">{detail.title}</h2>
                                        <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed min-h-[100px] p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            {detail.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 하단: 답변 작성 영역 */}
                    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex-1">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-700">관리자 답변 작성</h4>
                            <div className="text-xs text-slate-500 font-medium">
                                담당자: <span className="font-bold text-slate-800">{detail?.answeredBy || adminName || '관리자'}</span>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col h-full">
                            {!selectedId || !detail ? (
                                <div className="py-10 text-center text-sm font-bold text-slate-400 flex-1 flex items-center justify-center">
                                    답변을 작성할 문의를 선택해주세요.
                                </div>
                            ) : (
                                <>
                                    <textarea 
                                        value={answerText} 
                                        onChange={e => setAnswerText(e.target.value)}
                                        placeholder="이곳에 관리자 답변을 작성해주세요. 작성 후 저장 시 '답변완료' 처리됩니다."
                                        className="w-full flex-1 min-h-[220px] p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-colors mb-4" 
                                    />
                                    <div className="flex items-center justify-between mt-auto">
                                        <button 
                                            onClick={handleDeleteInquiry} 
                                            disabled={isDeleting}
                                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 disabled:opacity-50 flex items-center gap-2 transition-colors border border-rose-100"
                                        >
                                            <Trash2 size={16} /> {isDeleting ? '삭제 중...' : '문의 삭제'}
                                        </button>
                                        <button 
                                            onClick={handleSaveAnswer} 
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                                        >
                                            <SendHorizonal size={16} /> {isSaving ? '저장 중...' : '답변 저장'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </section>
            </div>
        </Card>
    );
}