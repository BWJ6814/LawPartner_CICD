import React, { useState } from 'react';
import PaymentModal from './PaymentModal';

const PaymentTab = ({ isSubscribed, setIsSubscribed, email, phone }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const handleSubscriptionToggle = () => {
        if (isSubscribed) {
            if (window.confirm('구독을 취소하시겠습니까?')) {
                setIsSubscribed(false);
                console.log('구독 취소');
            }
        } else {
            setIsPaymentModalOpen(true);
        }
    };

    const handlePaymentSuccess = () => {
        setIsSubscribed(true);
        console.log('구독 완료');
    };

    return (
        <>
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

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={handlePaymentSuccess}
                email={email}
                phone={phone}
            />
        </>
    );
};

export default PaymentTab;
