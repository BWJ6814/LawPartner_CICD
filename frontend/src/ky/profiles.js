import React, { useState } from 'react';

const menuItems = [
    { id: 'overview', label: '대시보드'},
    { id: 'dashboard', label: '프로필' }

];

export default function ProfileSetting() {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        idType: 'Hitman',
        email: '',
        contact: '',
        gender: 'male',
        intro: '',
    });
    const [profileImage, setProfileImage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setProfileImage(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('프로필 저장:', formData);
        alert('프로필이 저장되었습니다!');
    };

    const handleCancel = () => {
        if (window.confirm('변경사항을 취소하시겠습니까?')) {
            setFormData({
                name: '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                birthYear: '',
                birthMonth: '',
                birthDay: '',
                idType: 'Hitman',
                email: '',
                contact: '',
                gender: 'male',
                intro: '',
            });
            setProfileImage(null);
        }
    };


    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* 사이드바 */}
            <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col fixed top-20 left-0 bottom-0 overflow-y-auto">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold">프로필 설정</h2>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveMenu(item.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all text-sm font-medium
                ${activeMenu === item.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }
              `}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* 하단 유저 메뉴 */}
                <div className="p-4 border-t border-slate-700 relative">
                    {/* 메뉴 펼침 */}
                    {showUserMenu && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 rounded-lg shadow-xl border border-slate-600 overflow-hidden">
                            <button
                                onClick={() => setShowUserMenu(false)}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition border-b border-slate-700"
                            >
                                프로필 관리
                            </button>
                            <button
                                onClick={() => setShowUserMenu(false)}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition border-b border-slate-700"
                            >
                                공개 후기 작성소
                            </button>
                            <button
                                onClick={() => setShowUserMenu(false)}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition border-b border-slate-700"
                            >
                                알림
                            </button>
                            <button
                                onClick={() => setShowUserMenu(false)}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-600 hover:text-white transition font-semibold"
                            >
                                로그아웃
                            </button>
                        </div>
                    )}

                    {/* 유저 프로필 버튼 */}
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                            김
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-sm font-semibold">김구역</div>
                            <div className="text-xs text-slate-400">변호사님</div>
                        </div>
                        <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 왼쪽: 사진 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">사진</label>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                                        {profileImage ? (
                                            <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl text-gray-400">사진</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="profile-upload"
                                    />
                                    <label
                                        htmlFor="profile-upload"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition text-sm font-semibold"
                                    >
                                        사진 업로드
                                    </label>
                                </div>
                            </div>

                            {/* 오른쪽: 폼 필드들 */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">현재 비밀번호 입력</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호 입력</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 하단 필드들 */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">아이디 (수정불가)</label>
                                <input
                                    type="text"
                                    name="idType"
                                    value={formData.idType}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
                                <input
                                    type="tel"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    placeholder="010-1234-5678"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">예비 연락처 설명</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">생년월일</label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        name="birthYear"
                                        placeholder="연도"
                                        value={formData.birthYear}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                    <select
                                        name="birthMonth"
                                        value={formData.birthMonth}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">월</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}월</option>
                                        ))}
                                    </select>
                                    <select
                                        name="birthDay"
                                        value={formData.birthDay}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">일</option>
                                        {[...Array(31)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}일</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">성별</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>남자</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>여자</span>
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">소개</label>
                                <textarea
                                    name="intro"
                                    value={formData.intro}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="고객분들에게 자신을 어필하세요!!"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                취소하기
                            </button>
                            <button
                                type="button"
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                            >
                                회원 탈퇴
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                            >
                                저장하기
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}