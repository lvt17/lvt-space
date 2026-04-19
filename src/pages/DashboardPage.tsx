import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import IncomeChart from '@/components/charts/IncomeChart'
import { formatVND, formatUSD } from '@/utils/currency'
import { useDataCache } from '@/contexts/DataCacheContext'
import type { StatCardData } from '@/types'
import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
    const { dashboardStats: stats, dashboardPerformance: performance, dashboardLoading: loading } = useDataCache()
    const { t } = useTranslation()

    const cards: StatCardData[] = stats
        ? [
            { 
                title: t('dashboard.stats.total_income'), 
                value: formatVND(stats.monthlyTotalIncome), 
                subtitle: stats.monthlyTotalIncomeUSD && stats.monthlyTotalIncomeUSD > 0 ? `(${formatUSD(stats.monthlyTotalIncomeUSD)})` : undefined,
                icon: 'account_balance_wallet' 
            },
            { 
                title: t('dashboard.stats.received_income'), 
                value: formatVND(stats.totalIncome), 
                subtitle: stats.totalIncomeUSD && stats.totalIncomeUSD > 0 ? `(${formatUSD(stats.totalIncomeUSD)})` : undefined,
                icon: 'savings' 
            },
            { 
                title: t('dashboard.stats.unpaid_total'), 
                value: formatVND(stats.unpaidTotal), 
                subtitle: stats.unpaidTotalUSD && stats.unpaidTotalUSD > 0 ? `(${formatUSD(stats.unpaidTotalUSD)})` : undefined,
                icon: 'hourglass_top' 
            },
            { title: t('dashboard.stats.completion_rate'), value: `${stats.completionRate}%`, subtitle: `${stats.completedTasks}/${stats.totalTasks}`, icon: 'check_circle' },
        ]
        : []

    return (
        <>
            <Header title={t('dashboard.title')} />

            {loading && !stats ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm text-text-muted">Đang tải...</span>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-6 md:mb-8">
                        {cards.map((stat, i) => (
                            <div key={stat.title} className={i < 3 ? 'col-span-2 md:col-span-1' : ''}>
                                <StatCard {...stat} />
                            </div>
                        ))}
                    </div>

                    {stats && stats.monthlyTrend.length > 0 && (
                        <IncomeChart data={stats.monthlyTrend} />
                    )}

                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="p-4 sm:p-6 flex justify-between items-center border-b border-border">
                            <h3 className="text-base md:text-lg font-bold text-text-primary">{t('dashboard.charts.performance')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[36rem]">
                                <thead>
                                    <tr className="text-[0.625rem] text-text-muted font-bold uppercase tracking-wider bg-surface-secondary">
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">{t('dashboard.table.month')}</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">{t('dashboard.table.revenue')}</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">{t('dashboard.table.total_tasks')}</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">{t('dashboard.table.completed')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {performance.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 sm:px-6 py-10 text-center text-text-muted">Chưa có dữ liệu</td></tr>
                                    ) : (
                                        performance.map((row) => (
                                            <tr key={row.month} className="hover:bg-surface-secondary transition-all">
                                                <td className="px-4 sm:px-6 py-4 sm:py-5 font-semibold text-text-primary text-sm">{row.month}</td>
                                                <td className="px-4 sm:px-6 py-4 sm:py-5 text-text-secondary text-sm">{formatVND(row.revenue)}</td>
                                                <td className="px-4 sm:px-6 py-4 sm:py-5 text-text-secondary text-sm font-semibold">{row.totalTasks}</td>
                                                <td className="px-4 sm:px-6 py-4 sm:py-5">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="flex-1 h-2 bg-primary-lightest rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-primary"
                                                                style={{ width: `${row.completionRate}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-medium text-text-primary">{row.completionRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
