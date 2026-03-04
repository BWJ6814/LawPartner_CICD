import React, { useState, useEffect, useRef } from 'react';
import api from '../common/api/axiosConfig'; // 경로 확인 필요!

const SettingsModal = ({ isOpen, onClose, profileData, onSaveName }) => {
    const [activeTab, setActiveTab] = useState('profile'); // profile, password, delete

    const [nameInput, setNameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');

    // ★ [핵심 2] 이미지 파일 상태들
    const [imageFile, setImageFile] = useState(null); // 백엔드로 보낼 실제 파일 객체
    const [imagePreview, setImagePreview] = useState(''); // 화면에 띄울 미리보기 URL
    const fileInputRef = useRef(null);

    const [pwInput, setPwInput] = useState({ oldPw: '', newPw: '', confirmPw: '' });
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    // 모달 열릴 때마다 현재 이름으로 초기화 및 탭 리셋
    useEffect(() => {
        if (isOpen && profileData) {
            setNameInput(profileData.name || '');
            setEmailInput(profileData.email || '');
            setPhoneInput(profileData.phone || '');
            // 프로필 이미지가 있다면 세팅 (없으면 기본 이미지 띄우게 처리)
            setImagePreview(profileData.profileImage || '');
            setImageFile(null);

            setPwInput({ oldPw: '', newPw: '', confirmPw: '' });
            setActiveTab('profile');
        }
    }, [isOpen, profileData]);

    if (!isOpen) return null;

    // 공통 로딩 및 에러 처리 래퍼
    const handleAction = async (actionFn, successMsg) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await actionFn();
            if (successMsg) alert(successMsg);
        } catch (error) {
            const msg = error.response?.data?.message || "처리 중 오류가 발생했습니다.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // 이미지 파일 선택 시 미리보기 생성
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); // 내 브라우저에 임시 URL 만들어서 띄움
        }
    };

    // 1. 프로필 변경 API (FormData 활용)
    const handleSaveProfile = () => handleAction(async () => {
        if (!nameInput.trim()) throw new Error("이름을 입력해주세요.");
        if (!emailInput.trim()) throw new Error("이메일을 입력해주세요.");
        if (!phoneInput.trim()) throw new Error("전화번호를 입력해주세요.");

        // ★ [핵심 3] 파일과 텍스트를 같이 보내려면 무조건 FormData 써야 함
        const formData = new FormData();
        formData.append('name', nameInput);
        formData.append('email', emailInput);
        formData.append('phone', phoneInput);
        if (imageFile) {
            formData.append('profileImage', imageFile);
        }

        // 헤더에 multipart/form-data 안 붙여도 axios가 FormData 객체 보면 알아서 세팅해줌
        await api.post('/api/mypage/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        localStorage.setItem('nickNm', nameInput);
        alert("프로필이 성공적으로 변경되었습니다.");

        // ★ 정보가 대규모로 바뀌었으니 사이드바나 대시보드 리렌더링을 위해 페이지 새로고침 하는 게 가장 깔끔함
        window.location.reload();
    }, null);

    // 2. 비밀번호 변경 API
    const handleSavePassword = () => handleAction(async () => {
        if (!pwInput.oldPw || !pwInput.newPw) throw new Error("모든 비밀번호 필드를 입력해주세요.");
        if (pwInput.newPw !== pwInput.confirmPw) throw new Error("새 비밀번호가 일치하지 않습니다.");
        if (pwInput.newPw.length < 7) throw new Error("비밀번호는 8자 이상이어야 합니다."); // 간단한 유효성 검사 예시

        await api.put('/api/mypage/password', {
            oldPassword: pwInput.oldPw,
            newPassword: pwInput.newPw
        });
        alert("비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.");
        localStorage.clear();
        window.location.href = '/login';
    }, null); // 성공 메시지 alert 대신 위에서 처리

    // 3. 회원 탈퇴 API
    const handleDeleteAccount = () => handleAction(async () => {
        if (!window.confirm("정말로 탈퇴하시겠습니까?\n\n※ 주의: 모든 상담 내역과 활동 기록이 영구적으로 삭제되며 복구할 수 없습니다.")) {
            throw new Error("탈퇴가 취소되었습니다."); // 로딩 상태 해제를 위한 더미 에러
        }

        await api.delete('/api/mypage/account');
        alert("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
        localStorage.clear();
        window.location.href = '/';
    }, null);


    // 탭 버튼 컴포넌트 (스타일링용)
    const TabButton = ({ tabName, icon, label, isDanger = false }) => {
        const isActive = activeTab === tabName;
        let baseClasses = "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200";
        let activeClasses = isActive
            ? (isDanger ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200" : "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200")
            : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700";

        return (
            <button onClick={() => setActiveTab(tabName)} className={`${baseClasses} ${activeClasses}`}>
                <i className={`fas ${icon} ${isActive ? '' : 'opacity-70'}`}></i>
                {label}
            </button>
        );
    };

    // 입력창 공통 스타일
    const inputClasses = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors text-slate-700 placeholder:text-slate-400 bg-slate-50/50 font-medium";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-2 ml-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 backdrop-blur-sm bg-slate-900/40 transition-opacity" onClick={onClose}>
            {/* 모달 컨테이너 */}
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 transform transition-all scale-100 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 및 닫기 버튼 */}
                <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 bg-white z-10 relative">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">계정 설정</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {/* 상단 탭 메뉴 (Pill Style) */}
                <div className="px-6 py-4 bg-white">
                    <div className="flex p-1 bg-slate-100/70 rounded-xl">
                        <TabButton tabName="profile" icon="fa-user-edit" label="프로필" />
                        <TabButton tabName="password" icon="fa-lock" label="비밀번호" />
                        <TabButton tabName="delete" icon="fa-user-slash" label="탈퇴" isDanger={true} />
                    </div>
                </div>

                {/* 콘텐츠 영역 (스크롤 가능하게) */}
                <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white relative">

                    {/* 로딩 오버레이 */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="flex flex-col items-center">
                                <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-3"></i>
                                <p className="text-sm font-bold text-slate-600">처리 중입니다...</p>
                            </div>
                        </div>
                    )}

                    {/* 1. 프로필 탭 콘텐츠 */}
                    {activeTab === 'profile' && (
                        <div className="space-y-5 py-2 animate-fadeIn">

                            {/* ★ 프로필 이미지 변경 UI */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                    <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />
                                        ) : (
                                            <i className="fas fa-user text-3xl text-slate-400"></i>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-camera text-white text-xl"></i>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 font-medium">사진을 클릭해 변경</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* 닉네임 입력 */}
                            <div>
                                <label className={labelClasses}>닉네임</label>
                                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className={inputClasses} placeholder="닉네임 입력" />
                            </div>

                            {/* 이메일 입력 (수정 가능!) */}
                            <div>
                                <label className={labelClasses}>이메일</label>
                                <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className={inputClasses} placeholder="example@law.com" />
                            </div>

                            {/* 전화번호 입력 (수정 가능!) */}
                            <div>
                                <label className={labelClasses}>전화번호</label>
                                <input type="text" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className={inputClasses} placeholder="010-1234-5678" />
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={isLoading}
                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                변경사항 저장
                            </button>
                        </div>
                    )}
                    {/* 2. 비밀번호 탭 콘텐츠 */}
                    {activeTab === 'password' && (
                        <div className="space-y-5 py-2 animate-fadeIn">
                            <div>
                                <label className={labelClasses}>현재 비밀번호</label>
                                <input
                                    type="password"
                                    value={pwInput.oldPw}
                                    onChange={(e) => setPwInput({...pwInput, oldPw: e.target.value})}
                                    className={inputClasses}
                                    placeholder="사용 중인 비밀번호 입력"
                                />
                            </div>
                            <div className="pt-2 space-y-5 border-t border-slate-100">
                                <div>
                                    <label className={labelClasses}>새 비밀번호</label>
                                    <input
                                        type="password"
                                        value={pwInput.newPw}
                                        onChange={(e) => setPwInput({...pwInput, newPw: e.target.value})}
                                        className={inputClasses}
                                        placeholder="변경할 비밀번호 입력 (8자 이상)"
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        value={pwInput.confirmPw}
                                        onChange={(e) => setPwInput({...pwInput, confirmPw: e.target.value})}
                                        className={`${inputClasses} ${pwInput.newPw && pwInput.confirmPw && pwInput.newPw !== pwInput.confirmPw ? 'border-red-300 focus:ring-red-200' : ''}`}
                                        placeholder="변경할 비밀번호 재입력"
                                    />
                                    {pwInput.newPw && pwInput.confirmPw && pwInput.newPw !== pwInput.confirmPw && (
                                        <p className="text-xs text-red-500 mt-1 ml-1 font-medium"><i className="fas fa-exclamation-circle mr-1"></i> 비밀번호가 일치하지 않습니다.</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleSavePassword}
                                disabled={isLoading || !pwInput.oldPw || !pwInput.newPw || !pwInput.confirmPw}
                                className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                비밀번호 변경하기
                            </button>
                        </div>
                    )}

                    {/* 3. 회원 탈퇴 탭 콘텐츠 */}
                    {activeTab === 'delete' && (
                        <div className="py-4 animate-fadeIn">
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start mb-6">
                                <div className="bg-red-100 p-2 rounded-full mr-4 shrink-0">
                                    <i className="fas fa-exclamation-triangle text-xl text-red-500"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-700 mb-1">회원 탈퇴 시 유의사항</h4>
                                    <p className="text-sm text-red-600/80 leading-relaxed font-medium">
                                        탈퇴하시면 진행 중인 모든 법률 상담 내역과 대시보드 데이터가 <strong className="underline">영구적으로 삭제</strong>됩니다.<br/>
                                        삭제된 데이터는 복구할 수 없습니다.
                                    </p>
                                </div>
                            </div>

                            <div className="px-2">
                                <p className="text-slate-600 text-sm font-medium mb-4 text-center">
                                    정말로 LAW PARTNER를 떠나시겠습니까?
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-white border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all shadow-sm shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-user-slash mr-2"></i> 네, 영구 탈퇴하겠습니다
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 간단한 페이드인 애니메이션용 스타일 (tailwind.config.js에 추가하면 더 좋음)
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);

export default SettingsModal;