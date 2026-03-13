import { useState, useEffect, useMemo, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { taskApi, type TaskRow } from '@/services/api'
import { parseCurrency, formatVND } from '@/utils/currency'
import { FiSearch, FiPlus, FiTrash2, FiRefreshCw, FiChevronLeft, FiChevronRight, FiZap, FiX, FiTerminal, FiEdit2, FiCheck, FiSettings, FiChevronDown, FiHelpCircle } from 'react-icons/fi'

/* ─── Server Status Options ─── */
const SERVER_STATUSES = [
    { value: 'pending', label: 'Đang chờ', emoji: '⏳' },
    { value: 'in-progress', label: 'Đang làm', emoji: '🔧' },
    { value: 'completed', label: 'Hoàn thành', emoji: '🎯' },
    { value: 'done', label: 'Done + Paid', emoji: '✅' },
] as const

interface StatusMapping {
    keyword: string
    serverStatus: string
    isPaid: boolean
}

const DEFAULT_MAPPINGS: StatusMapping[] = [
    { keyword: 'done', serverStatus: 'completed', isPaid: true },
    { keyword: 'demo', serverStatus: 'completed', isPaid: false },
    { keyword: 'started', serverStatus: 'in-progress', isPaid: false },
]

const STORAGE_KEY = 'raw_status_mappings'

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Đang chờ' },
    { value: 'in-progress', label: 'Đang làm' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'paid', label: 'Đã thanh toán' },
]

function loadMappings(): StatusMapping[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : DEFAULT_MAPPINGS
    } catch { return DEFAULT_MAPPINGS }
}

function saveMappings(mappings: StatusMapping[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
}

const PAGE_SIZE = 10

export default function TaskManagementPage() {
    const [tasks, setTasks] = useState<TaskRow[]>([])
    const [name, setName] = useState('')
    const [deadline, setDeadline] = useState(new Date().toISOString().slice(0, 10))
    const [priceInput, setPriceInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    /* Search & filter */
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)

    const loadTasks = () => {
        setLoading(true)
        taskApi.list()
            .then(setTasks)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { loadTasks() }, [])

    /* Filtered + paginated tasks */
    const filtered = useMemo(() => {
        let result = tasks
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(t => t.name.toLowerCase().includes(q))
        }
        if (statusFilter !== 'all') {
            if (statusFilter === 'paid') {
                result = result.filter(t => t.is_paid)
            } else {
                result = result.filter(t => t.status === statusFilter)
            }
        }
        return result
    }, [tasks, search, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)
    const paginated = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE
        return filtered.slice(start, start + PAGE_SIZE)
    }, [filtered, safePage])

    // Reset page when search/filter changes
    useEffect(() => { setPage(1) }, [search, statusFilter])

    const handleAddTask = useCallback(async () => {
        if (!name.trim() || submitting) return
        setSubmitting(true)
        try {
            const price = parseCurrency(priceInput)
            const task = await taskApi.create({ name: name.trim(), deadline: deadline || undefined, price })
            setTasks(prev => [task, ...prev])
            setName('')
            setDeadline(new Date().toISOString().slice(0, 10))
            setPriceInput('')
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi')
        } finally {
            setSubmitting(false)
        }
    }, [name, deadline, priceInput, submitting])

    const handleDelete = useCallback(async (id: string) => {
        await taskApi.remove(id)
        setTasks(prev => prev.filter(t => t.id !== id))
    }, [])

    const handleTogglePaid = useCallback(async (id: string) => {
        setTasks(prev => {
            const task = prev.find(t => t.id === id)
            if (!task) return prev
            return prev // optimistic: actual update happens async
        })
        // Get current task state for logic
        let currentTask: TaskRow | undefined
        setTasks(prev => { currentTask = prev.find(t => t.id === id); return prev })
        const willBePaid = !currentTask?.is_paid
        const updated = await taskApi.togglePaid(id)
        if (willBePaid && updated.status !== 'paid') {
            const u2 = await taskApi.update(id, { status: 'paid' })
            setTasks(prev => prev.map(t => t.id === id ? u2 : t))
        } else if (!willBePaid && updated.status === 'paid') {
            const u2 = await taskApi.update(id, { status: 'completed' })
            setTasks(prev => prev.map(t => t.id === id ? u2 : t))
        } else {
            setTasks(prev => prev.map(t => t.id === id ? updated : t))
        }
    }, [])

    const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
        let currentTask: TaskRow | undefined
        setTasks(prev => { currentTask = prev.find(t => t.id === id); return prev })
        let updated = await taskApi.update(id, { status: newStatus })
        if (newStatus === 'paid' && !currentTask?.is_paid) {
            updated = await taskApi.togglePaid(id)
        } else if (newStatus !== 'paid' && currentTask?.is_paid) {
            updated = await taskApi.togglePaid(id)
        }
        setTasks(prev => prev.map(t => t.id === id ? updated : t))
    }, [])

    /* ─── Edit Task ─── */
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null)
    const [editName, setEditName] = useState('')
    const [editDeadline, setEditDeadline] = useState('')
    const [editPrice, setEditPrice] = useState('')
    const [editSaving, setEditSaving] = useState(false)

    const openEdit = (task: TaskRow) => {
        setEditingTask(task)
        setEditName(task.name)
        setEditDeadline(task.deadline ? task.deadline.slice(0, 10) : '')
        setEditPrice(task.price ? String(task.price) : '')
    }

    const handleEditSave = useCallback(async () => {
        if (!editingTask || !editName.trim() || editSaving) return
        setEditSaving(true)
        try {
            const updated = await taskApi.update(editingTask.id, {
                name: editName.trim(),
                deadline: editDeadline || undefined,
                price: parseCurrency(editPrice),
            })
            setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t))
            setEditingTask(null)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi cập nhật')
        } finally {
            setEditSaving(false)
        }
    }, [editingTask, editName, editDeadline, editPrice, editSaving])

    /* ─── Smart Raw Input Parser ─── */
    const [rawInput, setRawInput] = useState('')
    const [showRawModal, setShowRawModal] = useState(false)
    const [showRawHelp, setShowRawHelp] = useState(false)
    const [statusMappings, setStatusMappings] = useState<StatusMapping[]>(loadMappings)
    const [showMappingConfig, setShowMappingConfig] = useState(false)
    const [newKeyword, setNewKeyword] = useState('')
    const [newServerStatus, setNewServerStatus] = useState('pending')

    const handleAddMapping = () => {
        const kw = newKeyword.trim().toLowerCase()
        if (!kw || statusMappings.some(m => m.keyword === kw)) return
        const isPaid = newServerStatus === 'done'
        const serverStatus = newServerStatus === 'done' ? 'completed' : newServerStatus
        const updated = [...statusMappings, { keyword: kw, serverStatus, isPaid }]
        setStatusMappings(updated)
        saveMappings(updated)
        setNewKeyword('')
    }

    const handleRemoveMapping = (keyword: string) => {
        const updated = statusMappings.filter(m => m.keyword !== keyword)
        setStatusMappings(updated)
        saveMappings(updated)
    }

    const parseRawInput = (raw: string) => {
        const [mainPart, statusPart] = raw.split('=>').map(s => s.trim())
        if (!mainPart) return null

        let status = 'pending'
        let isPaid = false
        const statusKey = (statusPart || '').toLowerCase().trim()

        // Match against custom mappings
        if (statusKey) {
            const mapping = statusMappings.find(m => m.keyword === statusKey)
            if (mapping) {
                status = mapping.serverStatus
                isPaid = mapping.isPaid
            }
        }

        // Price detection: 1m2 (1.2M), 2m (2M), 500k, 1.5m, etc.
        const compoundMRegex = /(\d+)\s*[mM]\s*(\d+)/
        const simplePriceRegex = /(\d+(?:[.,]\d+)?)\s*([kmKM])\b/
        const priceNumRegex = /\b(\d{4,})\b/
        let price = 0
        let mainWithoutPrice = mainPart

        const compoundMatch = mainPart.match(compoundMRegex)
        if (compoundMatch) {
            price = parseInt(compoundMatch[1]) * 1000000 + parseInt(compoundMatch[2]) * 100000
            mainWithoutPrice = mainPart.replace(compoundMatch[0], ' ')
        } else {
            const priceMatch = mainPart.match(simplePriceRegex)
            if (priceMatch) {
                const num = parseFloat(priceMatch[1].replace(',', '.'))
                const unit = priceMatch[2].toLowerCase()
                price = unit === 'k' ? num * 1000 : unit === 'm' ? num * 1000000 : num
                mainWithoutPrice = mainPart.replace(priceMatch[0], ' ')
            } else {
                const numMatch = mainPart.match(priceNumRegex)
                if (numMatch) {
                    price = parseInt(numMatch[1])
                    mainWithoutPrice = mainPart.replace(numMatch[0], ' ')
                }
            }
        }

        const dateRegex = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/
        let deadline = ''
        const dateMatch = mainWithoutPrice.match(dateRegex)
        if (dateMatch) {
            const day = parseInt(dateMatch[1])
            const month = parseInt(dateMatch[2])
            let year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear()
            if (year < 100) year += 2000
            deadline = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            mainWithoutPrice = mainWithoutPrice.replace(dateMatch[0], ' ')
        }

        const taskName = mainWithoutPrice.replace(/\s+/g, ' ').trim()
        return { name: taskName, price, deadline, status, isPaid, statusLabel: statusKey }
    }

    // Parse all lines for preview
    const parsedLines = rawInput.trim()
        ? rawInput.split('\n').filter(l => l.trim()).map(l => parseRawInput(l))
        : []

    const handleRawSubmit = async () => {
        const lines = rawInput.split('\n').filter(l => l.trim())
        if (!lines.length || submitting) return
        setSubmitting(true)
        try {
            const newTasks: TaskRow[] = []
            for (const line of lines) {
                const parsed = parseRawInput(line)
                if (!parsed || !parsed.name) continue
                const task = await taskApi.create({
                    name: parsed.name,
                    deadline: parsed.deadline || undefined,
                    price: parsed.price,
                })
                let updated = task
                if (parsed.status !== 'pending') {
                    updated = await taskApi.update(task.id, { status: parsed.status })
                }
                if (parsed.isPaid) {
                    updated = await taskApi.togglePaid(task.id)
                }
                newTasks.push(updated)
            }
            setTasks([...newTasks, ...tasks])
            setRawInput('')
            setShowRawModal(false)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <Header
                title="Quản lý công việc"
                subtitle="Tổ chức các sản phẩm và theo dõi các khoản thanh toán đang chờ xử lý."
            />

            {error && (
                <div className="glass-card rounded-xl p-3 sm:p-4 mb-4 bg-red-50 border-red-200 text-red-600 text-sm">
                    {error}
                    <button onClick={() => setError('')} className="ml-4 underline">Đóng</button>
                </div>
            )}

            {/* Add task form */}
            <div className="glass-card rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <FiPlus className="text-base text-white" />
                        </div>
                        <h3 className="font-semibold text-base md:text-lg text-text-primary">Thêm công việc mới</h3>
                    </div>
                    <button
                        onClick={() => setShowRawModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-mid text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                    >
                        <FiTerminal className="text-sm" />
                        Raw Input
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 md:gap-5 items-end">
                    <div className="sm:col-span-2 md:col-span-4">
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Tên công việc</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder=""
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Hạn chót</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Giá (VNĐ)</label>
                        <input
                            type="text"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder=""
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                        />
                    </div>
                    <div className="sm:col-span-2 md:col-span-3">
                        <button
                            onClick={handleAddTask}
                            disabled={submitting || !name.trim()}
                            className="w-full bg-primary hover:bg-primary-mid transition-all text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FiPlus className="text-lg" />
                            )}
                            {submitting ? 'Đang tạo...' : 'Tạo công việc'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Raw Input Modal */}
            {showRawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRawModal(false)} />
                    <div className="relative glass-card rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                    <FiZap className="text-base text-white" />
                                </div>
                                <h3 className="font-bold text-xl text-text-primary">Raw Input</h3>
                                <span className="text-[0.65rem] text-text-muted bg-surface px-2.5 py-1 rounded-full border border-border">Smart Parse</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setShowRawHelp(!showRawHelp)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${showRawHelp ? 'bg-primary text-white' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
                                    title="Hướng dẫn sử dụng"
                                >
                                    <FiHelpCircle className="text-lg" />
                                </button>
                                <button
                                    onClick={() => setShowRawModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                                >
                                    <FiX className="text-lg" />
                                </button>
                            </div>
                        </div>

                        {/* Help Guide */}
                        {showRawHelp && (
                            <div className="mb-5 bg-primary/5 border border-primary/15 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FiHelpCircle className="text-primary text-base" />
                                    <h4 className="font-bold text-sm text-text-primary">Hướng dẫn sử dụng Raw Input</h4>
                                </div>
                                <div className="space-y-3 text-xs text-text-secondary">
                                    <div>
                                        <p className="font-semibold text-text-primary mb-1">📝 Cú pháp cơ bản:</p>
                                        <code className="block bg-surface/80 border border-border rounded-lg px-3 py-2 font-mono text-text-muted">tên công việc &nbsp; giá &nbsp; ngày &nbsp; =&gt; trạng thái</code>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <p className="font-semibold text-text-primary mb-1">💰 Định dạng giá:</p>
                                            <ul className="space-y-0.5 text-text-muted">
                                                <li><code className="bg-surface px-1.5 py-0.5 rounded">500k</code> → 500.000đ</li>
                                                <li><code className="bg-surface px-1.5 py-0.5 rounded">1m5</code> → 1.500.000đ</li>
                                                <li><code className="bg-surface px-1.5 py-0.5 rounded">2tr</code> → 2.000.000đ</li>
                                                <li><code className="bg-surface px-1.5 py-0.5 rounded">300000</code> → 300.000đ</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-primary mb-1">📅 Định dạng ngày:</p>
                                            <ul className="space-y-0.5 text-text-muted">
                                                <li><code className="bg-surface px-1.5 py-0.5 rounded">15/3</code> → 15 tháng 3</li>
                                                <li><code className="bg-surface px-1.5 py-0.5 rounded">20/03/2026</code> → 20/03/2026</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary mb-1">🏷️ Trạng thái (sau dấu =&gt;):</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">done → Hoàn thành + Đã TT</span>
                                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">started → Đang làm</span>
                                            <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">Không có → Đang chờ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary mb-1">✨ Ví dụ:</p>
                                        <code className="block bg-surface/80 border border-border rounded-lg px-3 py-2 font-mono text-text-muted whitespace-pre">Setup server 2m 15/3 =&gt; done{"\n"}Thiết kế logo 500k 20/3 =&gt; started{"\n"}Viết tài liệu 300k</code>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status Mapping Config */}
                        <div className="mb-4 border border-border rounded-xl overflow-hidden">
                            <button
                                onClick={() => setShowMappingConfig(!showMappingConfig)}
                                className="w-full flex items-center justify-between px-4 py-2.5 bg-surface hover:bg-surface-secondary transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FiSettings className="text-sm text-text-muted" />
                                    <span className="text-xs font-semibold text-text-primary">Custom Status Mapping</span>
                                    <span className="text-[0.6rem] text-text-muted bg-surface px-1.5 py-0.5 rounded-full border border-border">{statusMappings.length}</span>
                                </div>
                                <FiChevronDown className={`text-sm text-text-muted transition-transform ${showMappingConfig ? 'rotate-180' : ''}`} />
                            </button>
                            {showMappingConfig && (
                                <div className="px-4 py-3 space-y-3 border-t border-border bg-surface/50">
                                    {/* Current mappings */}
                                    <div className="space-y-1.5">
                                        {statusMappings.map(m => (
                                            <div key={m.keyword} className="flex items-center gap-2 text-xs">
                                                <code className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100 font-mono font-semibold">{m.keyword}</code>
                                                <span className="text-text-muted">→</span>
                                                <span className={`px-2 py-0.5 rounded-md border font-medium ${
                                                    m.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : m.serverStatus === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                    : m.serverStatus === 'in-progress' ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                    {m.isPaid ? '✅ Done + Paid'
                                                     : m.serverStatus === 'completed' ? '🎯 Hoàn thành'
                                                     : m.serverStatus === 'in-progress' ? '🔧 Đang làm'
                                                     : '⏳ Đang chờ'}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveMapping(m.keyword)}
                                                    className="ml-auto text-text-muted hover:text-red-500 transition-colors"
                                                    title="Xoá"
                                                >
                                                    <FiX className="text-sm" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Add new mapping */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                                        <input
                                            type="text"
                                            value={newKeyword}
                                            onChange={e => setNewKeyword(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddMapping()}
                                            placeholder="keyword..."
                                            className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                                        />
                                        <select
                                            value={newServerStatus}
                                            onChange={e => setNewServerStatus(e.target.value)}
                                            className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary cursor-pointer outline-none focus:ring-1 focus:ring-primary/30"
                                        >
                                            {SERVER_STATUSES.map(s => (
                                                <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddMapping}
                                            disabled={!newKeyword.trim()}
                                            className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-30 hover:bg-primary-mid transition-colors"
                                        >
                                            <FiPlus className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={rawInput}
                            onChange={e => setRawInput(e.target.value)}
                            placeholder={`vd: example 1 500k 15/3 => done\n    example 2 1m2 20/3 => started`}
                            rows={8}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted font-mono resize-none"
                            autoFocus
                        />

                        {/* Live preview */}
                        {parsedLines.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                                <p className="text-xs font-semibold text-text-muted uppercase">Preview ({parsedLines.filter(p => p?.name).length} tasks)</p>
                                {parsedLines.map((p, i) => p?.name ? (
                                    <div key={i} className="flex flex-wrap gap-1.5 text-xs">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 font-medium truncate max-w-[200px]">
                                            📝 {p.name}
                                        </span>
                                        {p.price > 0 && (
                                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100 font-medium">
                                                💰 {formatVND(p.price)}
                                            </span>
                                        )}
                                        {p.deadline && (
                                            <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-100 font-medium">
                                                📅 {new Date(p.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-md border font-medium ${
                                            p.isPaid
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : p.status === 'completed'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                    : p.status === 'in-progress'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                        : 'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                            {p.isPaid ? '✅ Done'
                                                : p.status === 'completed' ? `🎯 ${p.statusLabel || 'Completed'}`
                                                : p.status === 'in-progress' ? `🔧 ${p.statusLabel || 'In Progress'}`
                                                : '⏳ Pending'}
                                        </span>
                                    </div>
                                ) : null)}
                            </div>
                        )}

                        {/* Syntax help */}
                        <p className="text-[0.6rem] text-text-muted/60 mt-3">
                            Mỗi dòng = 1 task · Cú pháp: <code className="bg-surface px-1 py-0.5 rounded text-text-muted">tên giá ngày =&gt; trạng thái</code>
                            &nbsp;·&nbsp; Keywords: {statusMappings.map(m => (
                                <code key={m.keyword} className="bg-surface px-1 py-0.5 rounded text-text-muted mx-0.5">{m.keyword}</code>
                            ))}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setShowRawModal(false)}
                                className="flex-1 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-surface transition-colors text-sm"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleRawSubmit}
                                disabled={submitting || !parsedLines.some(p => p?.name)}
                                className="flex-1 bg-primary hover:bg-primary-mid transition-all text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FiPlus className="text-base" />
                                )}
                                {submitting ? 'Đang thêm...' : `Thêm ${parsedLines.filter(p => p?.name).length || ''} task`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task table */}
            <div className="glass-card rounded-2xl lg:rounded-3xl overflow-hidden">
                {/* Header with search + filter */}
                <div className="p-4 sm:p-6 border-b border-border space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-text-primary text-sm sm:text-base">Dự án đang hoạt động & Thanh toán</h3>
                        <button onClick={loadTasks} className="text-text-muted hover:text-primary transition-colors">
                            <FiRefreshCw className="text-xl" />
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm kiếm công việc..."
                                className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                            />
                        </div>
                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary cursor-pointer focus:ring-2 focus:ring-primary/30 outline-none"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Mobile card view */}
                <div className="sm:hidden divide-y divide-border-light">
                    {loading ? (
                        <div className="px-4 py-10 text-center text-text-muted">Đang tải...</div>
                    ) : paginated.length === 0 ? (
                        <div className="px-4 py-10 text-center text-text-muted">
                            {search || statusFilter !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có công việc nào'}
                        </div>
                    ) : (
                        paginated.map((task) => (
                            <div key={task.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-sm text-text-primary">{task.name}</p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'Không hạn'}
                                        </p>
                                    </div>
                                    <p className="font-bold text-sm text-text-primary">{formatVND(task.price)}</p>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary flex-1"
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <label className="flex items-center gap-2 text-xs text-text-muted">
                                        <input
                                            type="checkbox"
                                            checked={task.is_paid}
                                            onChange={() => handleTogglePaid(task.id)}
                                            className="rounded border-border text-primary focus:ring-primary/40 w-4 h-4"
                                        />
                                        Đã TT
                                    </label>
                                    <button onClick={() => handleDelete(task.id)} className="text-text-muted hover:text-red-500">
                                        <FiTrash2 className="text-lg" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left min-w-[36rem]">
                        <thead>
                            <tr className="bg-surface-secondary">
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest">Tên công việc</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest">Hạn chót</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest">Giá</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest">Trạng thái</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest">Đã TT</th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-[0.6875rem] font-bold text-text-muted uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-text-muted">Đang tải...</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-text-muted">
                                    {search || statusFilter !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có công việc nào'}
                                </td></tr>
                            ) : (
                                paginated.map((task) => (
                                    <tr key={task.id} className="hover:bg-surface-secondary transition-colors group">
                                        <td className="px-4 lg:px-6 py-4 lg:py-5 font-medium text-sm text-text-primary">{task.name}</td>
                                        <td className="px-4 lg:px-6 py-4 lg:py-5 text-sm text-text-secondary">
                                            {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 lg:py-5 font-bold text-text-primary text-sm">{formatVND(task.price)}</td>
                                        <td className="px-4 lg:px-6 py-4 lg:py-5">
                                            <select
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary cursor-pointer focus:ring-2 focus:ring-primary/30 outline-none"
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 lg:py-5">
                                            <input
                                                type="checkbox"
                                                checked={task.is_paid}
                                                onChange={() => handleTogglePaid(task.id)}
                                                className="rounded border-border text-primary focus:ring-primary/40 w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 lg:py-5">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(task)} className="text-text-muted hover:text-primary transition-colors" title="Chỉnh sửa">
                                                    <FiEdit2 className="text-[1.1rem]" />
                                                </button>
                                                <button onClick={() => handleDelete(task.id)} className="text-text-muted hover:text-red-500 transition-colors" title="Xoá">
                                                    <FiTrash2 className="text-[1.1rem]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: count + pagination */}
                <div className="p-3 sm:p-4 bg-surface-secondary border-t border-border flex items-center justify-between">
                    <p className="text-[0.6875rem] text-text-muted uppercase font-bold px-1 sm:px-2">
                        {filtered.length} công việc
                        {(search || statusFilter !== 'all') && ` (tổng ${tasks.length})`}
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={safePage <= 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-white disabled:opacity-30 disabled:hover:text-text-muted disabled:hover:bg-transparent transition-colors"
                            >
                                <FiChevronLeft className="text-sm" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1]) > 1) acc.push('dots')
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((item, idx) =>
                                    item === 'dots' ? (
                                        <span key={`dots-${idx}`} className="text-text-muted text-xs px-1">…</span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setPage(item)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                                item === safePage
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-text-muted hover:text-primary hover:bg-white'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    )
                                )}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage >= totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-white disabled:opacity-30 disabled:hover:text-text-muted disabled:hover:bg-transparent transition-colors"
                            >
                                <FiChevronRight className="text-sm" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingTask(null)} />
                    <div className="relative glass-card rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                                    <FiEdit2 className="text-sm text-primary" />
                                </div>
                                <h3 className="font-bold text-base text-text-primary">Chỉnh sửa công việc</h3>
                            </div>
                            <button onClick={() => setEditingTask(null)} className="w-7 h-7 rounded-full bg-surface hover:bg-red-50 flex items-center justify-center transition-colors">
                                <FiX className="text-sm text-text-muted hover:text-red-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Tên công việc</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Hạn chót</label>
                                    <input
                                        type="date"
                                        value={editDeadline}
                                        onChange={e => setEditDeadline(e.target.value)}
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Giá (VNĐ)</label>
                                    <input
                                        type="text"
                                        value={editPrice}
                                        onChange={e => setEditPrice(e.target.value)}
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingTask(null)}
                                className="flex-1 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-surface transition-colors text-sm"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={editSaving || !editName.trim()}
                                className="flex-1 bg-primary hover:bg-primary-mid transition-all text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                {editSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FiCheck className="text-base" />
                                )}
                                {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
