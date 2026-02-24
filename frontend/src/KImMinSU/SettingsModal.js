import React, { useState } from 'react';

const SettingsModal = ({ isOpen, onClose, profileImage, setProfileImage, currentName, onSaveName }) => {
    const [nameInput, setNameInput] = useState(currentName);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!nameInput.trim()) {
            alert("이름을 입력을 해주세요..");
            return;
        }

        // 1. 로컬 스토리지 업데이트 (새로고침 방어)
        localStorage.setItem('userNm', nameInput);

        // ★ 실무 팩트: 나중에 백엔드 API 뚫리면 여기에 axios.put('/api/users/profile', { name: nameInput }) 쏴야 진짜 DB 바뀐다.

        // 2. 부모 컴포넌트(사이드바) 상태 즉시 업데이트
        onSaveName(nameInput);
        alert("프로필이 수정되었습니다.");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-96 max-w-full m-4 border border-slate-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-black text-slate-800">프로필 설정</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 font-bold text-xl transition">&times;</button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-600 mb-1">이름 변경</label>
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                        placeholder="새로운 이름을 입력하세요"
                    />
                </div>

                {/* 프로필 사진 수정 등 추가 UI는 여기에 넣으면 됨 */}

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">저장</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;