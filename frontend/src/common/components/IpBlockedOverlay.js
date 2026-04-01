import React from 'react';

/** IP 차단 시 현재 URL 유지, 화면 전체에서 이용 차단 안내 */
export default function IpBlockedOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/85 px-6 text-center backdrop-blur-sm"
      role="alertdialog"
      aria-live="assertive"
      aria-label="IP 접근 차단"
    >
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
        <p className="text-lg font-black text-slate-900">접근이 차단된 IP입니다</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          로그인, 상담, 게시판, 전문가 찾기 등 이 사이트의 모든 기능을 사용할 수 없습니다.
          관리자가 IP 차단을 해제한 뒤 <strong className="text-slate-800">브라우저를 새로고침</strong>해 주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-700"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  );
}
