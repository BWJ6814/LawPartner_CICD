import React, { useState } from 'react';
import DashboardSidebar from '../common/components/DashboardSidebar';
import LawStatsCard from './lawpage/LawStatsCard';
import ConsultTable from './lawpage/ConsultTable';
import ReviewList from './lawpage/ReviewList';

const mockData = {
    stats: [
        { label: '해결한 사건', value: '0건', borderColor: 'border-t-blue-500' },
        { label: '상담 요청', value: '0건', borderColor: 'border-t-orange-500' },
        { label: '평점', value: '4.5 / 5.0', borderColor: 'border-t-emerald-500' }
    ],
    recentConsults: [
        { id: 1, client: '홍길동', category: '교통사고', status: '상담중' },
        { id: 2, client: '김길동', category: '부동산', status: '대기중' }
    ],
    recentReviews: [
        { id: 1, client: '홍길동님', rating: 5, content: '좋은 결과를 얻었습니다.' }
    ]
};

export default function Lawmainpage() {
    const [activePage, setActivePage] = useState('dashboard');

    return (
        <div className="flex h-screen bg-[#f4f7fa] overflow-hidden">
            <DashboardSidebar userRole="LAWYER" activePage={activePage} setActivePage={setActivePage} />

            <main className="flex-1 overflow-y-auto p-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 italic">Lawyer Dashboard</h1>
                </header>

                <LawStatsCard stats={mockData.stats} />

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8">
                        <ConsultTable list={mockData.recentConsults} />
                    </div>
                    <div className="col-span-4">
                        <ReviewList reviews={mockData.recentReviews} />
                    </div>
                </div>
            </main>
        </div>
    );
}