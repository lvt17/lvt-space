import { useState, useEffect, useMemo } from 'react'
import Header from '@/components/layout/Header'

import { incomeApi, type IncomeRow } from '@/services/api'
import { parseCurrency, formatVND } from '@/utils/currency'

function getCurrentMonthVN() {
    const now = new Date()
    const vnDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
    return `${vnDate.getFullYear()}-${String(vnDate.getMonth() + 1).padStart(2, '0')}`
}

function generateMonthOptions(count = 12) {
    const options: { value: string; label: string }[] = []
    const now = new Date()
    const vnNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
    for (let i = 0; i < count; i++) {
        const d = new Date(vnNow.getFullYear(), vnNow.getMonth() - i, 1)
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
        options.push({ value, label })
    }
    return options
}

export default function IncomeReceivedPage() {
    const currentMonth = useMemo(() => getCurrentMonthVN(), [])
    const monthOptions = useMemo(() => generateMonthOptions(12), [])

    const [selectedMonth, setSelectedMonth] = useState(currentMonth)
    const [records, setRecords] = useState<IncomeRow[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(1)
    const [monthlyTotal, setMonthlyTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const limit = 10

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [taskName, setTaskName] = useState('')
    const [category, setCategory] = useState('')
    const [amountInput, setAmountInput] = useState('')

    const isCurrentMonth = selectedMonth === currentMonth

    const loadData = () => {
        setLoading(true)
        Promise.all([
            incomeApi.list(page, limit, selectedMonth),
            incomeApi.monthlyTotal(selectedMonth),
        ]).then(([pageData, monthly]) => {
            setRecords(pageData.records)
            setTotalCount(pageData.total)
            setMonthlyTotal(parseInt(String(monthly.total)) || 0)
        }).finally(() => setLoading(false))
    }

    useEffect(() => { loadData() }, [page, selectedMonth])

    const totalPages = Math.ceil(totalCount / limit) || 1

    const handleAdd = async () => {
        if (!taskName.trim() || !amountInput.trim()) return
        try {
            const record = await incomeApi.create({
                task_name: taskName.trim(),
                category: category.trim() || undefined,
                amount: parseCurrency(amountInput),
            })
            setRecords([record, ...records])
            setTotalCount(prev => prev + 1)
            setMonthlyTotal(prev => prev + Number(record.amount))
            setTaskName('')
            setCategory('')
            setAmountInput('')
            setShowForm(false)
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : 'Lỗi')
        }
    }

    return (
        <>
            <Header title="Thu nhập đã nhận" />

            {loading ? (
                <div className="text-center text-text-muted py-20">Đang tải...</div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="glass-card p-5 sm:p-8 rounded-2xl md:rounded-[2rem] relative overflow-hidden group mb-6 md:mb-8">
                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-text-muted text-xs sm:text-sm font-medium uppercase tracking-wider">
                                            {isCurrentMonth ? 'Tổng thu nhập tháng này' : `Tổng thu nhập ${monthOptions.find(o => o.value === selectedMonth)?.label || ''}`}
                                        </p>
                                        <select
                                            value={selectedMonth}
                                            onChange={e => { setSelectedMonth(e.target.value); setPage(1) }}
                                            className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                                        >
                                            {monthOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-primary">
                                        {formatVND(monthlyTotal)}
                                    </h3>
                                    <p className="text-text-muted text-xs sm:text-sm mt-2">
                                        {totalCount} bản ghi {isCurrentMonth ? 'tháng này' : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="bg-primary hover:bg-primary-mid text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-md shadow-primary/20 w-full sm:w-auto justify-center"
                                >
                                    <span className="material-icons-round text-lg">add</span>
                                    Thêm thu nhập
                                </button>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-48 sm:w-64 h-48 sm:h-64 bg-primary-lightest rounded-full blur-[80px] group-hover:bg-primary-lighter transition-all duration-500" />
                    </div>

                    {/* Add income form */}
                    {showForm && (
                        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 md:mb-8">
                            <h4 className="font-semibold text-text-primary mb-4">Ghi nhận thu nhập mới</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                                <div className="sm:col-span-2 md:col-span-4">
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1 ml-1">Tên công việc</label>
                                    <input
                                        type="text"
                                        value={taskName}
                                        onChange={e => setTaskName(e.target.value)}
                                        placeholder="VD: Website ABC"
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-text-primary placeholder:text-text-muted"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1 ml-1">Loại</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-text-primary"
                                    >
                                        <option value="">Chọn loại</option>
                                        <option value="Phí dịch vụ">Phí dịch vụ</option>
                                        <option value="Tư vấn">Tư vấn</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1 ml-1">Số tiền</label>
                                    <input
                                        type="text"
                                        value={amountInput}
                                        onChange={e => setAmountInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                        placeholder="VD: 1m5"
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-text-primary placeholder:text-text-muted"
                                    />
                                </div>
                                <div className="sm:col-span-2 md:col-span-3 flex gap-2">
                                    <button onClick={handleAdd} className="flex-1 bg-primary hover:bg-primary-mid text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                                        Lưu
                                    </button>
                                    <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-text-muted hover:text-text-primary text-sm rounded-xl border border-border transition-colors">
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Income table */}
                    <div className="glass-card rounded-2xl md:rounded-[2rem] overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
                            <h4 className="text-base md:text-lg font-bold text-text-primary">
                                Công việc đã hoàn thành (Đã nhận tiền)
                            </h4>
                            <button onClick={loadData} className="text-text-muted hover:text-primary transition-colors">
                                <span className="material-icons-round text-xl">refresh</span>
                            </button>
                        </div>

                        {/* Mobile card view */}
                        <div className="sm:hidden divide-y divide-border-light">
                            {records.length === 0 ? (
                                <div className="px-4 py-10 text-center text-text-muted text-sm">Chưa có bản ghi thu nhập nào</div>
                            ) : (
                                records.map((record) => (
                                    <div key={record.id} className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                                    <span className="material-icons-round text-emerald-600 text-xs">check_circle</span>
                                                </div>
                                                <span className="text-sm font-medium text-text-primary">{record.task_name}</span>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    await incomeApi.remove(record.id)
                                                    setRecords(records.filter(r => r.id !== record.id))
                                                    setTotalCount(prev => prev - 1)
                                                    setMonthlyTotal(prev => prev - Number(record.amount))
                                                }}
                                                className="text-text-muted hover:text-red-500"
                                            >
                                                <span className="material-icons-round text-lg">delete</span>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-muted">{record.category || '—'} · {record.received_date ? new Date(record.received_date).toLocaleDateString('vi-VN') : '—'}</span>
                                            <span className="font-bold text-text-primary">{formatVND(record.amount)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left min-w-[36rem]">
                                <thead>
                                    <tr className="text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest border-b border-border bg-surface-secondary">
                                        <th className="px-4 md:px-6 py-3 md:py-3">Tên công việc</th>
                                        <th className="px-4 md:px-6 py-3 md:py-3">Loại</th>
                                        <th className="px-4 md:px-6 py-3 md:py-3">Ngày nhận</th>
                                        <th className="px-4 md:px-6 py-3 md:py-3">Số tiền</th>
                                        <th className="px-4 md:px-6 py-3 md:py-3">Xoá</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {records.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-10 text-center text-text-muted">Chưa có bản ghi thu nhập nào</td></tr>
                                    ) : (
                                        records.map((record) => (
                                            <tr key={record.id} className="group hover:bg-surface-secondary transition-colors">
                                                <td className="px-4 md:px-6 py-4 md:py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                                            <span className="material-icons-round text-emerald-600 text-sm">check_circle</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-text-primary">{record.task_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 md:py-4 text-sm text-text-secondary">{record.category || '—'}</td>
                                                <td className="px-4 md:px-6 py-4 md:py-4 text-sm text-text-secondary">
                                                    {record.received_date ? new Date(record.received_date).toLocaleDateString('vi-VN') : '—'}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 md:py-4 text-sm font-bold text-text-primary">
                                                    {formatVND(record.amount)}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 md:py-4">
                                                    <button
                                                        onClick={async () => {
                                                            await incomeApi.remove(record.id)
                                                            setRecords(records.filter(r => r.id !== record.id))
                                                            setTotalCount(prev => prev - 1)
                                                            setMonthlyTotal(prev => prev - Number(record.amount))
                                                        }}
                                                        className="text-text-muted hover:text-red-500 transition-colors"
                                                    >
                                                        <span className="material-icons-round text-lg">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 sm:p-6 bg-surface-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border gap-3">
                            <p className="text-xs text-text-muted font-medium">
                                Hiển thị {records.length} trên {totalCount} bản ghi
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted disabled:opacity-40"
                                >
                                    <span className="material-icons-round text-lg">chevron_left</span>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold ${page === i + 1
                                            ? 'bg-primary text-white'
                                            : 'bg-surface border border-border text-text-secondary hover:text-primary'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted disabled:opacity-40"
                                >
                                    <span className="material-icons-round text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
