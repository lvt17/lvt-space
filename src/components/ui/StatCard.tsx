import type { StatCardData } from '@/types'

export default function StatCard({ title, value, icon, trend, subtitle }: StatCardData) {
    return (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-text-muted text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-text-primary">{value}</h3>
                </div>
                <div className="w-10 h-10 bg-primary-lightest rounded-xl flex items-center justify-center text-primary">
                    <span className="material-icons-round">{icon}</span>
                </div>
            </div>
            {trend && (
                <div className={`flex items-center gap-2 text-xs font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    <span className="material-icons-round text-sm">
                        {trend.isPositive ? 'trending_up' : 'trending_down'}
                    </span>
                    <span>{trend.value}</span>
                </div>
            )}
            {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
    )
}
