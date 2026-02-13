export default function ReviewList({ reviews }) {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">최근 의뢰인 후기</h3>
            <div className="space-y-4">
                {reviews.map(r => (
                    <div key={r.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-bold text-slate-900">{r.client}</span>
                            <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{r.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}