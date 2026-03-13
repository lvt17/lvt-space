import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const PIE_DATA = [
    { name: 'Phí dịch vụ', value: 68 },
    { name: 'Tư vấn', value: 32 },
]

const COLORS = ['#C264FF', '#EACAFF']

export default function IncomePieChart() {
    return (
        <div className="glass-card p-8 rounded-[2rem]">
            <h4 className="text-text-primary font-bold mb-6">Phân bổ thu nhập</h4>
            <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                                data={PIE_DATA}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {PIE_DATA.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                        </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-text-muted text-xs uppercase">Tổng</span>
                        <span className="text-text-primary text-2xl font-bold">100%</span>
                    </div>
                </div>
                <div className="flex gap-6 text-xs font-medium">
                    {PIE_DATA.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-text-secondary">
                                {entry.name} ({entry.value}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
