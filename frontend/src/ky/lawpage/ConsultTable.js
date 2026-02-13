export default function ConsultTable({ list }) {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">최근 상담 요청 현황</h3>
                <button className="text-sm font-bold text-blue-600 hover:underline">전체 보기</button>
            </div>
            <table className="w-full text-sm">
                <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-3 font-semibold text-slate-600">상담자</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600">카테고리</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600">상태</th>
                </tr>
                </thead>
                <tbody>
                {list.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-3 text-slate-700 font-medium">{c.client}</td>
                        <td className="py-4 px-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">{c.category}</span></td>
                        <td className="py-4 px-3"><span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">{c.status}</span></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}