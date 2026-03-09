import React, { useEffect, useMemo, useState } from 'react';
import {
    MessageSquareMore,
    RefreshCw,
    Trash2,
    SendHorizonal,
    Search,
    FileText,
    CalendarDays,
    Tag,
    CheckCircle2,
    Clock3,
    Filter
} from 'lucide-react';
import api from '../../common/api/axiosConfig';

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

    if (s.includes('완료')) {
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
    if (s.includes('진행')) {
        return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    if (s.includes('반려') || s.includes('거절')) {
        return 'bg-rose-100 text-rose-700 border border-rose-200';
    }
    return 'bg-amber-100 text-amber-700 border border-amber-200';
}

function getStatusTabClass(active) {
    return active
        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
}

export default function AdminInquiryManageView() {
    const [list, setList] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);

    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('대기');
    const [answerText, setAnswerText] = useState('');

    const fetchList = async () => {
        try {
            setIsLoadingList(true);
            const res = await api.get('/api/customer/inquiries');
            const data = Array.isArray(res.data) ? res.data : [];
            setList(data);

            if (!selectedId && data.length > 0) {
                const waitingFirst = data.find((item) => String(item.status || '') === '대기');
                setSelectedId(waitingFirst ? waitingFirst.id : data[0].id);
            }
        } catch (e) {
            console.error('문의 목록 조회 실패', e);
            setList([]);
        } finally {
            setIsLoadingList(false);
        }
    };

    const fetchDetail = async (id) => {
        if (!id) return;

        try {
            setIsLoadingDetail(true);
            const res = await api.get(`/api/customer/inquiries/${id}`);
            setDetail(res.data);
            setAnswerText(res.data?.answerContent || '');
        } catch (e) {
            console.error('문의 상세 조회 실패', e);
            setDetail(null);
            setAnswerText('');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    useEffect(() => {
        if (selectedId) fetchDetail(selectedId);
    }, [selectedId]);

    const waitingCount = useMemo(
        () => list.filter((item) => String(item.status || '') === '대기').length,
        [list]
    );

    const answeredCount = useMemo(
        () => list.filter((item) => String(item.status || '').includes('완료')).length,
        [list]
    );

    const filteredList = useMemo(() => {
        return list.filter((item) => {
            const keyword = searchKeyword.trim().toLowerCase();

            const matchKeyword =
                !keyword ||
                String(item.title || '').toLowerCase().includes(keyword) ||
                String(item.type || '').toLowerCase().includes(keyword) ||
                String(item.content || '').toLowerCase().includes(keyword);

            const matchStatus =
                statusFilter === 'ALL'
                    ? true
                    : statusFilter === '답변완료'
                        ? String(item.status || '').includes('완료')
                        : String(item.status || '') === statusFilter;

            return matchKeyword && matchStatus;
        });
    }, [list, searchKeyword, statusFilter]);

    useEffect(() => {
        if (!filteredList.length) {
            setSelectedId(null);
            setDetail(null);
            setAnswerText('');
            return;
        }

        const exists = filteredList.some((item) => item.id === selectedId);
        if (!exists) {
            setSelectedId(filteredList[0].id);
        }
    }, [filteredList, selectedId]);

    const handleSaveAnswer = async () => {
        if (!detail?.id) return;
        if (!answerText.trim()) {
            alert('답변 내용을 입력하세요.');
            return;
        }

        try {
            setIsSaving(true);

            await api.put(`/api/customer/inquiries/${detail.id}/answer`, {
                answerContent: answerText.trim(),
                answeredBy: '관리자',
            });

            alert('답변이 저장되었습니다.');
            await fetchDetail(detail.id);
            await fetchList();
            setStatusFilter('답변완료');
        } catch (e) {
            console.error('답변 저장 실패', e);
            alert('답변 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInquiry = async () => {
        if (!detail?.id) return;

        const ok = window.confirm('이 문의를 삭제하시겠습니까?');
        if (!ok) return;

        try {
            setIsDeleting(true);

            await api.delete(`/api/customer/inquiries/${detail.id}`);
            alert('문의가 삭제되었습니다.');

            const next = list.filter((item) => item.id !== detail.id);
            setList(next);

            if (next.length > 0) {
                const waitingFirst = next.find((item) => String(item.status || '') === '대기');
                setSelectedId(waitingFirst ? waitingFirst.id : next[0].id);
            } else {
                setSelectedId(null);
                setDetail(null);
                setAnswerText('');
            }
        } catch (e) {
            console.error('문의 삭제 실패', e);
            alert('문의 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full pb-16">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">문의 답변 관리</h2>
                <p className="text-sm text-slate-500 mt-1">
                    답변 대기 문의를 빠르게 확인하고, 답변 작성과 삭제를 한 화면에서 처리합니다.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-6 items-start">
                {/* 왼쪽 목록 패널 */}
                <section className="col-span-12 xl:col-span-4">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b bg-slate-50">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
                                        <MessageSquareMore size={18} />
                                        문의 큐
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                        관리자 작업 목록
                                    </div>
                                </div>

                                <button
                                    onClick={fetchList}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <RefreshCw size={15} />
                                    새로고침
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <div className="text-[11px] font-bold text-slate-500 mb-1">전체</div>
                                    <div className="text-xl font-black text-slate-900">{list.length}</div>
                                </div>
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <div className="text-[11px] font-bold text-amber-700 mb-1">대기</div>
                                    <div className="text-xl font-black text-amber-700">{waitingCount}</div>
                                </div>
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                    <div className="text-[11px] font-bold text-emerald-700 mb-1">완료</div>
                                    <div className="text-xl font-black text-emerald-700">{answeredCount}</div>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    placeholder="제목, 유형, 내용 검색"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800"
                                />
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-500">상태 필터</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setStatusFilter('ALL')}
                                    className={`px-3 py-2 rounded-xl border text-sm font-black ${getStatusTabClass(statusFilter === 'ALL')}`}
                                >
                                    전체
                                </button>
                                <button
                                    onClick={() => setStatusFilter('대기')}
                                    className={`px-3 py-2 rounded-xl border text-sm font-black ${getStatusTabClass(statusFilter === '대기')}`}
                                >
                                    답변대기
                                </button>
                                <button
                                    onClick={() => setStatusFilter('답변완료')}
                                    className={`px-3 py-2 rounded-xl border text-sm font-black ${getStatusTabClass(statusFilter === '답변완료')}`}
                                >
                                    답변완료
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[68vh] overflow-y-auto">
                            {isLoadingList ? (
                                <div className="p-6 text-sm font-bold text-slate-500">문의 목록 불러오는 중...</div>
                            ) : filteredList.length === 0 ? (
                                <div className="p-6 text-sm font-bold text-slate-500">표시할 문의가 없습니다.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredList.map((item) => {
                                        const selected = selectedId === item.id;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedId(item.id)}
                                                className={`w-full text-left px-5 py-4 transition ${
                                                    selected
                                                        ? 'bg-blue-50 border-l-4 border-blue-600'
                                                        : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                                                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            ID {item.id}
                          </span>
                                                </div>

                                                <div className="text-xs text-slate-500 mb-1 line-clamp-1">{item.type}</div>
                                                <div className="text-sm font-black text-slate-900 line-clamp-1 mb-2">
                                                    {item.title}
                                                </div>

                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-[11px] text-slate-400">
                                                        {formatDateTime(item.createdAt)}
                                                    </div>
                                                    {item.answerContent ? (
                                                        <div className="text-[11px] font-black text-emerald-600">답변 있음</div>
                                                    ) : (
                                                        <div className="text-[11px] font-black text-amber-600">답변 필요</div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 오른쪽 작업 패널 */}
                <section className="col-span-12 xl:col-span-8">
                    <div className="flex flex-col gap-6">
                        {/* 문의 정보 */}
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">문의 상세 정보</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        선택한 문의 내용을 확인합니다.
                                    </p>
                                </div>

                                {detail?.status && (
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black ${getStatusStyle(detail.status)}`}>
                    {detail.status}
                  </span>
                                )}
                            </div>

                            <div className="p-6">
                                {!selectedId ? (
                                    <div className="text-sm font-bold text-slate-500">선택된 문의가 없습니다.</div>
                                ) : isLoadingDetail ? (
                                    <div className="text-sm font-bold text-slate-500">문의 상세 불러오는 중...</div>
                                ) : !detail ? (
                                    <div className="text-sm font-bold text-slate-500">문의 상세를 불러오지 못했습니다.</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-12 md:col-span-4">
                                                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                                                        <Tag size={14} />
                                                        문의 유형
                                                    </div>
                                                    <div className="text-slate-900 font-black break-words">{detail.type}</div>
                                                </div>
                                            </div>

                                            <div className="col-span-12 md:col-span-4">
                                                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                                                        <CalendarDays size={14} />
                                                        작성일
                                                    </div>
                                                    <div className="text-slate-900 font-black break-words">{formatDateTime(detail.createdAt)}</div>
                                                </div>
                                            </div>

                                            <div className="col-span-12 md:col-span-4">
                                                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                                                        <Clock3 size={14} />
                                                        최근 답변일
                                                    </div>
                                                    <div className="text-slate-900 font-black break-words">{formatDateTime(detail.answeredAt)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                                                <FileText size={14} />
                                                문의 제목
                                            </div>
                                            <div className="text-xl font-black text-slate-900 break-words">
                                                {detail.title}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                            <div className="text-xs font-bold text-slate-500 mb-3">문의 내용</div>
                                            <div className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-7 min-h-[180px]">
                                                {detail.content}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 답변 작업 */}
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">관리자 답변 작성</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        답변 저장 시 상태는 자동으로 답변완료로 변경됩니다.
                                    </p>
                                </div>

                                <div className="text-sm text-slate-500">
                                    답변자 <span className="font-black text-slate-900">{detail?.answeredBy || '관리자'}</span>
                                </div>
                            </div>

                            <div className="p-6">
                                {!selectedId ? (
                                    <div className="text-sm font-bold text-slate-500">먼저 문의를 선택하세요.</div>
                                ) : !detail ? (
                                    <div className="text-sm font-bold text-slate-500">답변 대상을 불러오지 못했습니다.</div>
                                ) : (
                                    <>
                    <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="관리자 답변을 입력하세요."
                        className="w-full min-h-[340px] max-h-[60vh] px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 leading-7 resize-y"
                    />

                                        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                                            <div className="text-xs text-slate-500">
                                                문의 ID <span className="font-black text-slate-800">{detail.id}</span>
                                                {' · '}
                                                최근 수정 <span className="font-black text-slate-800">{formatDateTime(detail.updatedAt)}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleDeleteInquiry}
                                                    disabled={isDeleting}
                                                    className="px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 font-black hover:bg-rose-100 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    {isDeleting ? '삭제 중...' : '문의 삭제'}
                                                </button>

                                                <button
                                                    onClick={handleSaveAnswer}
                                                    disabled={isSaving}
                                                    className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <SendHorizonal size={16} />
                                                    {isSaving ? '저장 중...' : '답변 저장'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}