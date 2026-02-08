import React from 'react';
import { Link } from 'react-router-dom'; // 페이지 이동이 필요할 경우를 대비

const Footer = () => {
    return (
        // 배경색: 헤더와 어울리는 짙은 네이비 (bg-[#0f172a] = slate-900)
        <footer className="bg-[#0f172a] text-white py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">

                {/* 1. 사이트 명 및 로고 */}
                <div className="mb-6 flex flex-col items-center">
                    <Link to="/" className="flex items-center gap-2 group decoration-0 mb-2">
                        <span className="text-3xl">⚖️</span>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter group-hover:opacity-80 transition whitespace-nowrap">
                            LAW PARTNER
                        </h2>
                    </Link>
                    <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
                        AI & Professional Legal Service
                    </p>
                </div>

                {/* 2. 법적 고지 (Disclaimer) - 실무 필수 요소 */}
                <div className="max-w-3xl bg-slate-800/50 rounded-xl p-4 mb-8 border border-slate-700/50">
                    <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed font-light">
                        본 서비스의 모든 상담 내용은 참고용이며 법적 효력을 갖지 않습니다.<br className="hidden md:block" />
                        정확한 법적 판단을 위해서는 전문가와의 대면 상담을 권장합니다.
                    </p>
                </div>

                {/* 3. Copyright & Links */}
                <div className="flex flex-col items-center gap-4">
                    {/* 이용약관 등 하단 링크 (선택 사항) */}
                    <div className="flex gap-6 text-[11px] text-slate-500 font-bold">
                        <Link to="/terms" className="hover:text-white transition decoration-0">이용약관</Link>
                        <Link to="/privacy" className="hover:text-white transition decoration-0">개인정보처리방침</Link>
                        <Link to="/contact" className="hover:text-white transition decoration-0">제휴문의</Link>
                    </div>

                    {/* 저작권 표기 */}
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">
                        Copyright © LAW PARTNER. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;