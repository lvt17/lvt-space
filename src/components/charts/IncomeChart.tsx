import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { MonthlyIncome } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'

interface IncomeChartProps {
    data: MonthlyIncome[]
}

export default function IncomeChart({ data }: IncomeChartProps) {
    const { resolvedDark, paletteDef } = useTheme()
    const primary = paletteDef.primary

    const tooltipStyle = resolvedDark
        ? {
            background: '#1e1e2e',
            border: '1px solid #313244',
            borderRadius: '12px',
            color: '#cdd6f4',
            fontSize: '13px',
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4)`,
        }
        : {
            background: '#ffffff',
            border: '1px solid #E8DFF5',
            borderRadius: '12px',
            color: '#1A0A2E',
            fontSize: '13px',
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.06)`,
        }

    const gridStroke = resolvedDark ? 'rgba(49, 50, 68, 0.5)' : `rgba(194, 100, 255, 0.08)`
    const axisStroke = resolvedDark ? '#6c7086' : '#9B8DAE'

    return (
        <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Xu hướng Thu nhập Hàng tháng</h3>
                    <p className="text-text-muted text-sm">Income performance over the last 12 months</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={primary} stopOpacity={resolvedDark ? 0.3 : 0.2} />
                            <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                        dataKey="name"
                        stroke={axisStroke}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke={axisStroke}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}tr`}
                    />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value.toLocaleString('vi-VN')}₫`, 'Thu nhập']}
                    />
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke={primary}
                        strokeWidth={3}
                        fill="url(#incomeGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
