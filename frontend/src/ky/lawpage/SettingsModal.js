import React, { useState, useRef } from 'react';
import PaymentModal from './PaymentModal';

const SettingsModal = ({ isOpen, onClose, profileImage, setProfileImage, isSubscribed, setIsSubscribed }) => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'payment'
    const fileInputRef = useRef(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // 결제 모달 상태

    // 프로필 변경 상태
    const [profileData, setProfileData] = useState({
        name: '김구역',
        email: 'gen03@example.com',
        phone: '010-1234-5678'
    });

    // 비밀번호 변경 상태
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    if (!isOpen) return null;

    // 이미지 업로드 핸들러
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 크기 체크 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }

            // 이미지 파일인지 확인
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            // FileReader로 미리보기
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
                console.log('프로필 이미지 업로드:', file.name);
                // 실제로는 서버에 업로드하는 로직 필요
            };
            reader.readAsDataURL(file);
        }
    };

    // 이미지 삭제 핸들러
    const handleImageRemove = () => {
        setProfileImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleProfileSave = () => {
        console.log('프로필 저장:', profileData);
        // 실제 저장 로직
    };

    const handlePasswordChange = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        console.log('비밀번호 변경');
        // 실제 비밀번호 변경 로직
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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

                <div className="flex">
                    {/* 사이드바 메뉴 */}
                    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
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
                    <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-73px)]">
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
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* 전문 분야 */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                전문 분야
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {['민사', '형사', '가사', '부동산', '노동', '기업', '교통사고', '이민'].map((field) => (
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

                                        {/* 소개글 */}
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
                                        type="password"
                                        placeholder="현재 비밀번호를 입력해주세요"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        if (window.confirm('정말로 탈퇴하시겠습니까?\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
                                            console.log('회원탈퇴 처리');
                                            // 실제 회원탈퇴 API 호출 로직
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