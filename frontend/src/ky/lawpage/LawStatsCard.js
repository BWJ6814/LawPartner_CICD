export default function LawStatsCard({ stats }) {
    return (
        <div className="grid grid-cols-3 gap-6 mb-10">
            {stats.map((stat, i) => (
                <div key={i} className={`bg-white p-8 rounded-[2rem] border-t-4 ${stat.borderColor} shadow-sm`}>
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{stat.label}</p>
                    <div className="text-4xl font-black text-slate-900 italic">{stat.value}</div>
                </div>
            ))}
        </div>
    );
}