import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import IncomeChart from '@/components/charts/IncomeChart'
import { dashboardApi, type DashboardStats, type PerformanceRow } from '@/services/api'
import { formatVND } from '@/utils/currency'
import type { StatCardData } from '@/types'

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [performance, setPerformance] = useState<PerformanceRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([dashboardApi.stats(), dashboardApi.performance()])
            .then(([s, p]) => { setStats(s); setPerformance(p) })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const cards: StatCardData[] = stats
        ? [
            { title: 'Tổng thu nhập tháng này', value: formatVND(stats.monthlyIncome), icon: 'account_balance_wallet' },
            { title: 'Đã nhận', value: formatVND(stats.totalIncome), icon: 'savings' },
            { title: 'Chưa thanh toán', value: formatVND(stats.unpaidTotal), icon: 'hourglass_top' },
            { title: 'Hoàn thành', value: `${stats.completionRate}%`, subtitle: `${stats.completedTasks}/${stats.totalTasks}`, icon: 'check_circle' },
        ]
        : []

    if (error) return <div className="text-red-500 p-4 lg:p-8">Lỗi: {error}</div>

    return (
        <>
            <Header title="Dashboard" />

            {loading ? (
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
                            <h3 className="text-base md:text-lg font-bold text-text-primary">Hiệu suất các tháng</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[36rem]">
                                <thead>
                                    <tr className="text-[0.625rem] text-text-muted font-bold uppercase tracking-wider bg-surface-secondary">
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">Tháng</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">Doanh thu</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">Tổng việc</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4">Hoàn thành</th>
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
