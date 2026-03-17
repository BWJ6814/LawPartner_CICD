// CreateOperatorView.js
import React, { useState } from 'react';
import { Card, Badge } from './AdminComponents';

export default function CreateOperatorView({ handleCreateOperator }) {
  const [form, setForm] = useState({
    userId: '',
    userPw: '',
    userNm: '',
    phone: '',
    email: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!handleCreateOperator) return;
    if (!form.userId || !form.userPw || !form.userNm || !form.phone || !form.email) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await handleCreateOperator(form);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'mt-1 block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

  const labelClass = 'text-xs font-bold text-slate-500 tracking-wide';

  return (
    <Card title="관리자 계정 생성">
      <div className="mb-4 text-xs text-slate-500 flex items-center gap-2">
        <Badge variant="amber">주의</Badge>
        <span>슈퍼 관리자만 새로운 운영자 계정을 생성할 수 있습니다.</span>
      </div>

      <form className="space-y-6 max-w-xl" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="userId">
              아이디
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              className={inputClass}
              placeholder="새 관리자 아이디"
              value={form.userId}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="userPw">
              비밀번호
            </label>
            <input
              id="userPw"
              name="userPw"
              type="password"
              className={inputClass}
              placeholder="초기 비밀번호"
              value={form.userPw}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="userNm">
              이름
            </label>
            <input
              id="userNm"
              name="userNm"
              type="text"
              className={inputClass}
              placeholder="담당자 실명"
              value={form.userNm}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="phone">
              휴대폰번호
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={inputClass}
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={inputClass}
            placeholder="admin@example.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {submitting ? '생성 중...' : '관리자 계정 생성'}
          </button>
        </div>
      </form>
    </Card>
  );
}

