import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../common/api/axiosConfig';
import AdminInquiryManageView from './AdminInquiryManageView';

export default function AdminInquiryManageContainer() {
    // ==================================================================================
    // 🗄️ 상태 관리 (State)
    // ==================================================================================
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

    const adminName = localStorage.getItem('userNm') || '관리자';

    // ==================================================================================
    // 🔄 데이터 통신 (API)
    // ==================================================================================
    const fetchList = async () => {
        try {
            setIsLoadingList(true);
            const res = await api.get('/api/admin/customer/inquiries');
            if (res.data.success) {
                const data = res.data.data || [];
                setList(data);
                
                // 첫 진입 시 대기 중인 첫 번째 문의 자동 선택
                if (!selectedId && data.length > 0) {
                    const waitingFirst = data.find(item => item.status === '대기');
                    setSelectedId(waitingFirst ? waitingFirst.id : data[0].id);
                }
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "문의 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoadingList(false);
        }
    };

    const fetchDetail = async (id) => {
        if (!id) return;
        try {
            setIsLoadingDetail(true);
            const res = await api.get(`/api/admin/customer/inquiries/${id}`);
            if (res.data.success) {
                setDetail(res.data.data);
                setAnswerText(res.data.data?.answerContent || '');
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "문의 상세를 불러오는 중 오류가 발생했습니다.");
            setDetail(null);
            setAnswerText('');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // ==================================================================================
    // 🚀 이벤트 핸들러
    // ==================================================================================
    const handleSaveAnswer = async () => {
        if (!detail?.id) return;
        if (!answerText.trim()) return toast.warn('답변 내용을 입력하세요.');

        try {
            setIsSaving(true);
            const res = await api.put(`/api/admin/customer/inquiries/${detail.id}/answer`, {
                answerContent: answerText.trim(),
                answeredBy: adminName, // 하드코딩 제거된 값 사용
            });
            if (res.data.success) {
                toast.success(res.data.message || '답변이 저장되었습니다.');
                await fetchDetail(detail.id);
                await fetchList();
                setStatusFilter('답변완료');
            }
        } catch (e) {
            toast.error(e.response?.data?.message || '답변 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInquiry = async () => {
        if (!detail?.id) return;
        if (!window.confirm('이 문의를 삭제하시겠습니까?')) return;

        try {
            setIsDeleting(true);
            const res = await api.delete(`/api/admin/customer/inquiries/${detail.id}`);
            if (res.data.success) {
                toast.success(res.data.message || '문의가 삭제되었습니다.');
                const next = list.filter(item => item.id !== detail.id);
                setList(next);
                if (next.length > 0) {
                    const waitingFirst = next.find(item => item.status === '대기');
                    setSelectedId(waitingFirst ? waitingFirst.id : next[0].id);
                } else {
                    setSelectedId(null);
                    setDetail(null);
                    setAnswerText('');
                }
            }
        } catch (e) {
            toast.error(e.response?.data?.message || '문의 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ==================================================================================
    // 📊 파생 데이터 (useMemo) & Effects
    // ==================================================================================
    const waitingCount = useMemo(
        () => list.filter(item => item.status === '대기').length, [list]
    );

    const answeredCount = useMemo(
        () => list.filter(item => String(item.status || '').includes('완료')).length, [list]
    );

    const filteredList = useMemo(() => {
        return list.filter(item => {
            const keyword = searchKeyword.trim().toLowerCase();
            const matchKeyword = !keyword
                || String(item.title || '').toLowerCase().includes(keyword)
                || String(item.type || '').toLowerCase().includes(keyword);

            const matchStatus = statusFilter === 'ALL'
                ? true
                : statusFilter === '답변완료'
                    ? String(item.status || '').includes('완료')
                    : String(item.status || '') === statusFilter;

            return matchKeyword && matchStatus;
        });
    }, [list, searchKeyword, statusFilter]);

    useEffect(() => { fetchList(); }, []);

    useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId]);

    useEffect(() => {
        if (!filteredList.length) {
            setSelectedId(null); setDetail(null); setAnswerText('');
            return;
        }
        const exists = filteredList.some(item => item.id === selectedId);
        if (!exists) setSelectedId(filteredList[0].id);
    }, [filteredList, selectedId]);

    // ==================================================================================
    // 🎨 View 컴포넌트에 Props로 데이터 및 함수 전달
    // ==================================================================================
    return (
        <AdminInquiryManageView
            list={list}
            filteredList={filteredList}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            detail={detail}
            isLoadingList={isLoadingList}
            isLoadingDetail={isLoadingDetail}
            isSaving={isSaving}
            isDeleting={isDeleting}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            answerText={answerText}
            setAnswerText={setAnswerText}
            fetchList={fetchList}
            handleSaveAnswer={handleSaveAnswer}
            handleDeleteInquiry={handleDeleteInquiry}
            waitingCount={waitingCount}
            answeredCount={answeredCount}
            adminName={adminName}
        />
    );
}