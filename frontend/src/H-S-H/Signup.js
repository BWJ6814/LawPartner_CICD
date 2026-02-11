import React, { useState } from 'react';
/* [수정] axios를 직접 사용하여 서버와 통신합니다. */
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const navigate = useNavigate();

    // 리액트에서 입력값을 저장하는 상자들 (DTO 구조와 일치시킴)
    const [formData, setFormData] = useState({
        userId: '',
        userPw: '',
        userNm: '',
        email: '',
        phone: '',
        roleCode: 'ROLE_USER' // 기본값은 일반 유저
    });

    // 입력값이 바뀔 때마다 실행되는 함수
    const handleChange = (e) => {
        /* 이건 리액트에서 '상태 불변성'을 지키며 객체를 업데이트하는 방식이에요.
           ...formData는 기존 데이터를 복사하고, [e.target.name] 부분만 새로 덮어씁니다. */
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            /* [수정] 백엔드 AuthController의 /api/auth/join 주소로 post 요청을 보냅니다. */
            const response = await axios.post('http://localhost:8080/api/auth/join', formData);

            if (response.data.code === 200) {
                alert('회원가입이 완료되었습니다! 로그인 해주세요.');
                navigate('/login'); // 가입 성공 시 로그인 페이지로 이동
            }
        } catch (error) {
            /* 서버에서 중복 아이디 등 에러를 던지면 메시지를 보여줍니다. */
            alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-center text-3xl font-black text-blue-900 tracking-tighter">회원가입</h2>

                <form className="mt-8 space-y-4" onSubmit={handleSignup}>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">아이디</label>
                        <input name="userId" type="text" required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                               value={formData.userId} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">비밀번호</label>
                        <input name="userPw" type="password" required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                               value={formData.userPw} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">이름(실명)</label>
                        <input name="userNm" type="text" required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                               value={formData.userNm} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">이메일</label>
                        <input name="email" type="email" required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                               value={formData.email} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">전화번호</label>
                        <input name="phone" type="text" placeholder="010-0000-0000" required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                               value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">가입 유형</label>
                        <select name="roleCode" className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-900 outline-none bg-white"
                                value={formData.roleCode} onChange={handleChange}>
                            <option value="ROLE_USER">일반 시민</option>
                            <option value="ROLE_LAWYER">변호사</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full py-3 px-4 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition transform active:scale-95 shadow-md">
                        가입하기
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;