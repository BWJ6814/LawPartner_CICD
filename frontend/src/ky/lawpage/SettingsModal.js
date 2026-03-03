import React, { useState, useRef, useEffect } from 'react';
import PaymentModal from './PaymentModal';
import api from '../../common/api/axiosConfig';

const SettingsModal = ({ isOpen, onClose, profileImage, setProfileImage, isSubscribed, setIsSubscribed }) => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'payment'
    const fileInputRef = useRef(null);
    const withdrawPwRef = useRef(null); // 회원탈퇴 비밀번호 입력 (DOM 직접 접근 제거)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // 결제 모달 상태
    const userRole = localStorage.getItem('userRole');

    // 프로필 변경 상태
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        bio: '',
        imgUrl: ''
    });

    // 비밀번호 변경 상태
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 모달 열릴 때 프로필 데이터 로드
    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            // 1. 기본 정보 (이름/이메일/전화번호) — KimMinSu팀 API
            try {
                const res = await api.get('/api/mypage/profile');
                const d = res.data.data;
                setProfileData(prev => ({
                    ...prev,
                    name:  d.name  || '',
                    email: d.email || '',
                    phone: d.phone || ''
                }));
            } catch (err) {
                console.error('기본 프로필 로딩 실패:', err);
            }
            // 2. 변호사 전용 정보 (전문분야/소개글/사진) — KY팀 API
            if (userRole === 'ROLE_LAWYER') {
                try {
                    const kyRes = await api.get('/api/ky/profile');
                    const kd = kyRes.data.data || {};
                    setProfileData(prev => ({
                        ...prev,
                        specialties: kd.specialties || [],
                        bio: kd.bio || ''
                    }));
                    if (kd.imgUrl) {
                        setProfileImage(`http://localhost:8080${kd.imgUrl}`);
                    }
                } catch (err) {
                    console.error('변호사 프로필 로딩 실패:', err);
                }
            }
        };
        load();
    }, [isOpen]);

    if (!isOpen) return null;

    // 이미지 업로드 핸들러 (백엔드 API 연동)
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하여야 합니다.'); return; }
        if (!file.type.startsWith('image/')) { alert('이미지 파일만 업로드 가능합니다.'); return; }

        // 미리보기 (즉시 반영)
        const reader = new FileReader();
        reader.onloadend = () => setProfileImage(reader.result);
        reader.readAsDataURL(file);

        // 변호사는 서버에 저장 (KY팀 API)
        if (userRole === 'ROLE_LAWYER') {
            const formData = new FormData();
            formData.append('file', file);
            try {
                await api.post('/api/ky/profile/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('프로필 사진이 저장되었습니다.');
            } catch (err) {
                alert('사진 업로드에 실패했습니다.');
                console.error(err);
            }
        }
    };

    // 이미지 삭제 핸들러
    const handleImageRemove = () => {
        setProfileImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleProfileSave = async () => {
        try {
            // 1. 기본 정보 저장 — KimMinSu팀 API
            await api.put('/api/mypage/profile', {
                name:  profileData.name,
                email: profileData.email,
                phone: profileData.phone
            });
            // 2. 변호사 전용 정보 저장 — KY팀 API
            if (userRole === 'ROLE_LAWYER') {
                await api.put('/api/ky/profile', {
                    specialties: profileData.specialties || [],
                    bio: profileData.bio || ''
                });
            }
            alert('프로필이 저장되었습니다.');
            localStorage.setItem('userNm', profileData.name);
        } catch (err) {
            alert('저장에 실패했습니다.');
            console.error(err);
        }
    };

    const handlePasswordChange = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        api.put('/api/mypage/password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        })
            .then(() => {
                alert('비밀번호가 변경되었습니다.');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            })
            .catch(err => {
                const msg = err.response?.data?.message || '비밀번호 변경에 실패했습니다.';
                alert(msg);
                console.error(err);
            });
    };

    const handleSubscriptionToggle = () => {
        if (isSubscribed) {
            // 구독 취소
            if (window.confirm('구독을 취소하시겠습니까?')) {
                setIsSubscribed(false);
                console.log('구독 취소');
                // 실제 구독 취소 로직
            }
        } else {
            // 구독하기 - 결제 모달 열기
            setIsPaymentModalOpen(true);
        }
    };

    const handlePaymentSuccess = () => {
        setIsSubscribed(true);
        console.log('구독 완료');
        // 실제 구독 활성화 로직
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 py-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">설정</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* 사이드바 메뉴 */}
                    <div className="w-52 bg-gray-50 border-r border-gray-200 p-3 flex-shrink-0">
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                    activeTab === 'profile'
                                        ? 'bg-white text-blue-600 font-semibold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                프로필 변경
                            </button>

                            <button
                                onClick={() => setActiveTab('password')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                    activeTab === 'password'
                                        ? 'bg-white text-blue-600 font-semibold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                비밀번호 변경
                            </button>

                            <button
                                onClick={() => setActiveTab('payment')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                    activeTab === 'payment'
                                        ? 'bg-white text-blue-600 font-semibold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                결제 및 구독관리
                            </button>

                            <div className="border-t border-gray-200 my-3" />

                            <button
                                onClick={() => setActiveTab('withdraw')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                    activeTab === 'withdraw'
                                        ? 'bg-red-50 text-red-600 font-semibold shadow-sm'
                                        : 'text-red-400 hover:bg-red-50'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                </svg>
                                회원탈퇴
                            </button>
                        </nav>
                    </div>

                    {/* 콘텐츠 영역 */}
                    <div className="flex-1 p-5 overflow-y-auto">
                        {/* 프로필 변경 */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                {/* 프로필 이미지 섹션 */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 사진</h3>
                                    <div className="flex items-center gap-6">
                                        {/* 현재 프로필 이미지 */}
                                        <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center text-white text-3xl font-semibold overflow-hidden">
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt="프로필"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                profileData.name.charAt(0)
                                            )}
                                        </div>

                                        {/* 업로드 버튼들 */}
                                        <div className="flex flex-col gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                사진 업로드
                                            </button>
                                            {profileImage && (
                                                <button
                                                    onClick={handleImageRemove}
                                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                                                >
                                                    사진 삭제
                                                </button>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                JPG, PNG 파일 (최대 5MB)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 프로필 정보 */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 정보</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                이름
                                                <span className="ml-2 text-xs text-gray-400 font-normal">변경 불가</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                readOnly
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                이메일
                                            </label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                전화번호
                                                <span className="ml-2 text-xs text-gray-400 font-normal">변경 불가</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                readOnly
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>

                                        {/* 전문 분야 - 변호사만 표시 */}
                                        {userRole === 'ROLE_LAWYER' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                전문 분야
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {['형사범죄', '교통사고', '부동산', '임대차', '손해배상', '대여금', '미수금', '채권추심', '이혼', '상속/가사', '노동', '기업', '지식재산권', '회생/파산', '계약서 검토', '기타'].map((field) => (
                                                    <button
                                                        key={field}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = profileData.specialties || [];
                                                            const updated = current.includes(field)
                                                                ? current.filter(f => f !== field)
                                                                : [...current, field];
                                                            setProfileData({ ...profileData, specialties: updated });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                                            (profileData.specialties || []).includes(field)
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {field}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500">해당하는 전문 분야를 선택하세요</p>
                                        </div>
                                        )}

                                        {/* 소개글 - 변호사만 표시 */}
                                        {userRole === 'ROLE_LAWYER' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                소개글
                                            </label>
                                            <textarea
                                                value={profileData.bio || ''}
                                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                placeholder="변호사님을 소개해주세요. (전문 분야, 경력, 상담 방식 등)"
                                                rows={4}
                                                maxLength={300}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            />
                                            <p className="text-xs text-gray-500 text-right mt-1">
                                                {(profileData.bio || '').length} / 300
                                            </p>
                                        </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleProfileSave}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    저장하기
                                </button>
                            </div>
                        )}

                        {/* 비밀번호 변경 */}
                        {activeTab === 'password' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                현재 비밀번호
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                새 비밀번호
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                새 비밀번호 확인
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePasswordChange}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    비밀번호 변경하기
                                </button>
                            </div>
                        )}

                        {/* 회원탈퇴 */}
                        {activeTab === 'withdraw' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-red-600 mb-2">회원탈퇴</h3>
                                    <p className="text-sm text-gray-500">탈퇴 시 계정 및 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-700 mb-3">탈퇴 시 삭제되는 정보</h4>
                                    <ul className="space-y-2 text-sm text-red-600">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            프로필 정보 및 계정 데이터
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            상담 내역 및 채팅 기록
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            AI 상담 및 판례 검색 기록
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            구독 및 결제 정보 (진행중인 구독은 자동 해지)
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        탈퇴 사유 (선택)
                                    </label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                                        <option value="">선택해주세요</option>
                                        <option value="not-useful">서비스가 유용하지 않음</option>
                                        <option value="expensive">비용이 부담됨</option>
                                        <option value="other-service">다른 서비스 이용</option>
                                        <option value="privacy">개인정보 우려</option>
                                        <option value="etc">기타</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        비밀번호 확인
                                    </label>
                                    <input
                                        ref={withdrawPwRef}
                                        type="password"
                                        placeholder="현재 비밀번호를 입력해주세요"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const pw = withdrawPwRef.current?.value;
                                        if (!pw) { alert('비밀번호를 입력해주세요.'); return; }
                                        if (window.confirm('정말로 탈퇴하시겠습니까?\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
                                            api.delete('/api/mypage/withdraw', { data: { password: pw } })
                                                .then(() => {
                                                    alert('탈퇴 처리가 완료되었습니다.');
                                                    localStorage.clear();
                                                    window.location.href = '/';
                                                })
                                                .catch(err => {
                                                    const msg = err.response?.data?.message || '탈퇴 처리에 실패했습니다.';
                                                    alert(msg);
                                                });
                                        }
                                    }}
                                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                                >
                                    회원탈퇴
                                </button>

                                <p className="text-xs text-gray-400 text-center">
                                    탈퇴 처리는 즉시 진행되며, 삭제된 데이터는 복구할 수 없습니다.
                                </p>
                            </div>
                        )}

                        {/* 결제 및 구독관리 */}
                        {activeTab === 'payment' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">구독 정보</h3>

                                    {isSubscribed ? (
                                        <>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-gray-900">현재 플랜</span>
                                                    <span className="text-blue-600 font-bold">LawParts 구독중</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-gray-600">
                                                    <span>다음 결제일</span>
                                                    <span>2026년 3월 16일</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                                <h4 className="font-semibold text-gray-900 mb-2">결제 내역</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">2026-02-16</span>
                                                        <span className="font-semibold">₩29,900</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">2026-01-16</span>
                                                        <span className="font-semibold">₩29,900</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4 text-center">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            <p className="text-gray-600 font-semibold mb-2">구독 중인 플랜이 없습니다</p>
                                            <p className="text-sm text-gray-500">LawParts를 구독하고 더 많은 혜택을 누려보세요!</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubscriptionToggle}
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                                        isSubscribed
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isSubscribed ? '구독 취소하기' : 'LawParts 구독하기'}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    {isSubscribed
                                        ? '구독을 취소하시면 다음 결제일부터 요금이 청구되지 않습니다.'
                                        : '구독하시면 프리미엄 기능과 무제한 상담을 이용하실 수 있습니다.'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 결제 모달 */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default SettingsModal;