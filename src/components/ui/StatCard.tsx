import type { StatCardData } from '@/types'

export default function StatCard({ title, value, icon, trend, subtitle }: StatCardData) {
    return (
        <div className="glass-card p-4 sm:p-6 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="min-w-0 flex-1 mr-2">
                    <p className="text-text-muted text-xs sm:text-sm font-medium">{title}</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 text-text-primary truncate">{value}</h3>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-lightest rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-icons-round text-lg sm:text-2xl">{icon}</span>
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
            {subtitle && <p className="text-sm font-semibold text-primary mt-1">{subtitle}</p>}
        </div>
    )
}
