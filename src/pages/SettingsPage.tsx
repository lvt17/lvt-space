import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme, PALETTES, type ThemeMode } from '@/contexts/ThemeContext'
import { supabase } from '@/services/supabase'
import Header from '@/components/layout/Header'
import { FiUser, FiLock, FiCheck, FiAlertCircle, FiTrash2, FiMail, FiSun, FiMoon, FiMonitor, FiSliders, FiShield, FiRefreshCw, FiHeart } from 'react-icons/fi'
import { taskApi } from '@/services/api'

type SettingsSection = 'appearance' | 'profile' | 'security' | 'updates' | 'credits' | 'danger'

const NAV_ITEMS: { id: SettingsSection; label: string; icon: typeof FiSun; description: string }[] = [
    { id: 'appearance', label: 'Giao diện', icon: FiSliders, description: 'Theme, bảng màu' },
    { id: 'profile', label: 'Hồ sơ', icon: FiUser, description: 'Tên, email' },
    { id: 'security', label: 'Bảo mật', icon: FiShield, description: 'Mật khẩu' },
    { id: 'updates', label: 'Cập nhật', icon: FiRefreshCw, description: 'Lịch sử phiên bản' },
    { id: 'credits', label: 'Credits', icon: FiHeart, description: 'Thông tin & công nghệ' },
    { id: 'danger', label: 'Nâng cao', icon: FiTrash2, description: 'Xoá dữ liệu' },
]

export default function SettingsPage() {
    const { user, updatePassword, resetPassword } = useAuth()
    const { mode, palette, setMode, setPalette } = useTheme()
    const currentName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || ''

    const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')
    const [showMobileContent, setShowMobileContent] = useState(false)

    /* Display name */
    const [displayName, setDisplayName] = useState(currentName)
    const [nameLoading, setNameLoading] = useState(false)
    const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    /* Password */
    const [oldPw, setOldPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [pwLoading, setPwLoading] = useState(false)
    const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    /* Delete all tasks */
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!displayName.trim()) return
        setNameLoading(true)
        setNameMsg(null)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: displayName.trim(), full_name: displayName.trim() },
            })
            if (error) {
                setNameMsg({ type: 'error', text: error.message })
            } else {
                setNameMsg({ type: 'success', text: 'Đã cập nhật tên hiển thị!' })
            }
        } catch {
            setNameMsg({ type: 'error', text: 'Có lỗi xảy ra' })
        } finally {
            setNameLoading(false)
        }
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setPwMsg(null)
        if (!oldPw) {
            setPwMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' })
            return
        }
        if (newPw.length < 6) {
            setPwMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
            return
        }
        if (newPw !== confirmPw) {
            setPwMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' })
            return
        }
        setPwLoading(true)
        try {
            // Verify old password first
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: oldPw,
            })
            if (signInErr) {
                setPwMsg({ type: 'error', text: 'Mật khẩu hiện tại không đúng' })
                return
            }
            const { error } = await updatePassword(newPw)
            if (error) {
                setPwMsg({ type: 'error', text: error })
            } else {
                setPwMsg({ type: 'success', text: 'Đã đổi mật khẩu thành công!' })
                setOldPw('')
                setNewPw('')
                setConfirmPw('')
            }
        } catch {
            setPwMsg({ type: 'error', text: 'Có lỗi xảy ra' })
        } finally {
            setPwLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!user?.email) return
        setPwLoading(true)
        setPwMsg(null)
        try {
            const { error } = await resetPassword(user.email)
            if (error) {
                setPwMsg({ type: 'error', text: error })
            } else {
                setPwMsg({ type: 'success', text: `Đã gửi link đặt lại mật khẩu tới ${user.email}` })
            }
        } catch {
            setPwMsg({ type: 'error', text: 'Có lỗi xảy ra' })
        } finally {
            setPwLoading(false)
        }
    }

    const MODE_OPTIONS: { value: ThemeMode; icon: typeof FiSun; label: string }[] = [
        { value: 'light', icon: FiSun, label: 'Sáng' },
        { value: 'dark', icon: FiMoon, label: 'Tối' },
        { value: 'system', icon: FiMonitor, label: 'Hệ thống' },
    ]

    return (
        <>
            <Header
                title="Cài đặt"
                subtitle="Quản lý tài khoản và tuỳ chỉnh giao diện."
            />

            <div className="flex gap-8 max-w-6xl">
                {/* ─── Desktop Sidebar ─── */}
                <aside className="hidden lg:block w-56 shrink-0 sticky top-4 self-start">
                    <nav className="glass-card rounded-2xl p-3 space-y-1">
                        {NAV_ITEMS.map(item => {
                            const Icon = item.icon
                            const active = activeSection === item.id
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all group cursor-pointer
                                        ${active
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                        }
                                    `}
                                >
                                    <Icon className={`text-base shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary'}`} />
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold truncate ${active ? 'text-primary' : ''}`}>{item.label}</p>
                                        <p className="text-[0.65rem] text-text-muted truncate">{item.description}</p>
                                    </div>
                                    {active && <div className="ml-auto w-1 h-5 rounded-full bg-primary shrink-0" />}
                                </button>
                            )
                        })}
                    </nav>

                    {/* User info mini card */}
                    <div className="glass-card rounded-2xl p-4 mt-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {(currentName || user?.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate">{currentName || 'User'}</p>
                                <p className="text-[0.65rem] text-text-muted truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ─── Main Content ─── */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Mobile: Tab List View (like iOS Settings) */}
                    <div className={`lg:hidden ${activeSection && showMobileContent ? 'hidden' : 'block'}`}>
                        <div className="glass-card rounded-2xl p-2 space-y-0.5">
                            {NAV_ITEMS.map(item => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveSection(item.id); setShowMobileContent(true) }}
                                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-colors hover:bg-surface-hover active:bg-surface-hover cursor-pointer group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Icon className="text-sm text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                                            <p className="text-[0.65rem] text-text-muted">{item.description}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Mobile: Back Button (shown when viewing content) */}
                    {showMobileContent && (
                        <button
                            onClick={() => setShowMobileContent(false)}
                            className="lg:hidden flex items-center gap-1.5 text-sm font-semibold text-primary mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            Cài đặt
                        </button>
                    )}

                    {/* ═══ Content Sections (hidden on mobile when tab list visible) ═══ */}
                    <div className={`${!showMobileContent ? 'hidden lg:block' : ''}`}>

                        {/* ═══ Section: Appearance ═══ */}
                        {activeSection === 'appearance' && (
                            <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <FiSliders className="text-base text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-text-primary">Giao diện</h3>
                                        <p className="text-xs text-text-muted">Tuỳ chỉnh theme và bảng màu</p>
                                    </div>
                                </div>

                                {/* 2-column: Mode + Palette side by side on desktop */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                                    {/* Mode Toggle */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase mb-3 ml-1">
                                            Chế độ hiển thị
                                        </label>
                                        <div className="flex gap-2">
                                            {MODE_OPTIONS.map(opt => {
                                                const Icon = opt.icon
                                                const active = mode === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setMode(opt.value)}
                                                        className={`
                                                    flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl text-sm font-semibold transition-all border cursor-pointer
                                                    ${active
                                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                                : 'bg-surface border-border text-text-secondary hover:border-primary/30 hover:bg-surface-hover'
                                                            }
                                                `}
                                                    >
                                                        <Icon className="text-xl" />
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Palette Picker */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase mb-3 ml-1">
                                            Bảng màu
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-2.5">
                                            {PALETTES.map(p => {
                                                const active = palette === p.id
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setPalette(p.id)}
                                                        className={`
                                                    group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer
                                                    ${active
                                                                ? 'border-2 shadow-md'
                                                                : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
                                                            }
                                                `}
                                                        style={{
                                                            borderColor: active ? p.primary : undefined,
                                                            boxShadow: active ? `0 4px 14px ${p.primary}30` : undefined,
                                                        }}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <div
                                                                className="w-7 h-7 rounded-full shadow-inner"
                                                                style={{
                                                                    background: `linear-gradient(135deg, ${p.primary}, ${p.mid})`,
                                                                }}
                                                            />
                                                            {active && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <FiCheck className="text-white text-xs drop-shadow" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-left min-w-0">
                                                            <div className={`text-xs font-semibold truncate ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                                {p.label}
                                                            </div>
                                                            <div className="flex gap-0.5 mt-0.5">
                                                                {[p.primary, p.mid, p.soft, p.light].map((c, i) => (
                                                                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ Section: Profile ═══ */}
                        {activeSection === 'profile' && (
                            <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <FiUser className="text-base text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-text-primary">Thông tin cá nhân</h3>
                                        <p className="text-xs text-text-muted">Quản lý hồ sơ của bạn</p>
                                    </div>
                                </div>

                                <form onSubmit={handleNameUpdate}>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Email</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Tên hiển thị</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={e => setDisplayName(e.target.value)}
                                                placeholder="Nhập tên hiển thị"
                                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            />
                                        </div>
                                    </div>

                                    {nameMsg && (
                                        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mt-4 ${nameMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                            }`}>
                                            {nameMsg.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                            {nameMsg.text}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={nameLoading || !displayName.trim()}
                                        className="mt-4 bg-primary hover:bg-primary-mid transition-all text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                    >
                                        {nameLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <FiCheck className="text-base" />
                                        )}
                                        Lưu thay đổi
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ═══ Section: Security ═══ */}
                        {activeSection === 'security' && (
                            <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <FiShield className="text-base text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-text-primary">Bảo mật</h3>
                                        <p className="text-xs text-text-muted">Đổi mật khẩu và bảo mật tài khoản</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordUpdate}>
                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            value={oldPw}
                                            onChange={e => setOldPw(e.target.value)}
                                            placeholder="Nhập mật khẩu hiện tại"
                                            className="w-full max-w-md bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Mật khẩu mới</label>
                                            <input
                                                type="password"
                                                value={newPw}
                                                onChange={e => setNewPw(e.target.value)}
                                                placeholder="Ít nhất 6 ký tự"
                                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Xác nhận mật khẩu</label>
                                            <input
                                                type="password"
                                                value={confirmPw}
                                                onChange={e => setConfirmPw(e.target.value)}
                                                placeholder="Nhập lại mật khẩu mới"
                                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    {pwMsg && (
                                        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mt-4 ${pwMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                            }`}>
                                            {pwMsg.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                            {pwMsg.text}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 flex-wrap mt-4">
                                        <button
                                            type="submit"
                                            disabled={pwLoading || !oldPw || !newPw || !confirmPw}
                                            className="bg-primary hover:bg-primary-mid transition-all text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                        >
                                            {pwLoading ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <FiLock className="text-base" />
                                            )}
                                            Đổi mật khẩu
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            disabled={pwLoading}
                                            className="text-sm text-primary hover:text-primary-mid transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50 cursor-pointer"
                                        >
                                            <FiMail className="text-sm" />
                                            Quên mật khẩu?
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ═══ Section: Updates ═══ */}
                        {activeSection === 'updates' && (
                            <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <FiRefreshCw className="text-base text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-text-primary">Lịch sử cập nhật</h3>
                                        <p className="text-xs text-text-muted">Các tính năng mới và cải tiến</p>
                                    </div>
                                    <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">v1.3.0</span>
                                </div>

                                <div className="space-y-0">
                                    {[
                                        {
                                            version: 'v1.3.0',
                                            date: '15/03/2026',
                                            tag: 'Mới nhất',
                                            tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                            changes: [
                                                'Hệ thống thông báo Toast + chuông thông báo',
                                                'Nhắc nhở deadline tự động (trước 1 ngày & đúng hạn)',
                                                'Mô tả chi tiết cho từng task với Rich Text Editor',
                                                'Xem mô tả trực tiếp từ Notes Board',
                                                'Badge version + popup changelog tính năng mới',
                                                'Cải thiện tốc độ xử lý và UX/UI',
                                            ],
                                        },
                                        {
                                            version: 'v1.2.0',
                                            date: '13/03/2026',
                                            tag: '',
                                            tagColor: '',
                                            changes: [
                                                'Đăng nhập bằng Google & GitHub',
                                                'Dark mode cải tiến — bảng màu Đơn sắc premium',
                                                'Canvas đổi pin 3D — kéo thả mượt hơn',
                                                'Color picker trên note hoạt động ổn định',
                                                'Ẩn resize dots trên card, giữ chức năng',
                                            ],
                                        },
                                        {
                                            version: 'v1.1.0',
                                            date: '12/03/2026',
                                            tag: '',
                                            tagColor: '',
                                            changes: [
                                                'Canvas chế độ ghi chú tự do',
                                                'Note sinh bởi AI (Gemini)',
                                                'Card Daily Tasks, Weekly Deadline, All Tasks',
                                                'Responsive mobile hoàn chỉnh',
                                            ],
                                        },
                                        {
                                            version: 'v1.0.0',
                                            date: '11/03/2026',
                                            tag: 'Ra mắt',
                                            tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                            changes: [
                                                'Dashboard tổng quan thu nhập & công việc',
                                                'Quản lý công việc CRUD + trạng thái',
                                                'Ghi nhận thu nhập theo tháng',
                                                'Hệ thống xác thực (email/password)',
                                                'Theme system: 6 bảng màu + dark mode',
                                            ],
                                        },
                                    ].map((release, idx) => (
                                        <div key={release.version} className="relative pl-6 pb-6 last:pb-0">
                                            {/* Timeline line */}
                                            {idx < 3 && <div className="absolute left-[0.4375rem] top-3 bottom-0 w-0.5 bg-border" />}
                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-primary border-primary' : 'bg-surface border-border'}`} />

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-bold text-text-primary">{release.version}</span>
                                                <span className="text-xs text-text-muted">— {release.date}</span>
                                                {release.tag && (
                                                    <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${release.tagColor}`}>{release.tag}</span>
                                                )}
                                            </div>
                                            <ul className="space-y-1">
                                                {release.changes.map((c, i) => (
                                                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                                        <span className="text-primary mt-1">•</span>
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ Section: Credits ═══ */}
                        {activeSection === 'credits' && (
                            <div className="space-y-5">
                                {/* Developer Hero Card */}
                                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl"
                                    style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-mid) 100%)' }}
                                >
                                    <div className="absolute inset-0">
                                        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/[0.07]" />
                                        <div className="absolute bottom-0 left-[15%] w-72 h-28 rounded-full bg-white/[0.04]" />
                                    </div>

                                    <div className="relative p-7 sm:p-9 flex flex-col sm:flex-row items-center gap-6">
                                        <img
                                            src="https://github.com/lvt17.png"
                                            alt="Liêu Vĩnh Toàn"
                                            className="w-[5rem] h-[5rem] rounded-2xl object-cover shrink-0 ring-2 ring-white/20"
                                        />
                                        <div className="text-center sm:text-left flex-1">
                                            <h3 className="text-lg font-extrabold text-white tracking-tight">Liêu Vĩnh Toàn</h3>
                                            <p className="text-white/60 text-sm mt-0.5">Full-stack Developer</p>
                                            <div className="flex items-center gap-2.5 mt-3 justify-center sm:justify-start flex-wrap">
                                                <a href="https://github.com/lvt17" target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                                    GitHub
                                                </a>
                                                <a href="https://linkedin.com/in/lvt17" target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                                    LinkedIn
                                                </a>
                                                <a href="https://www.instagram.com/l.vt17_/" target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                                    Instagram
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tech Stack */}
                                <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-8">
                                    <h4 className="text-[0.65rem] font-bold text-text-muted uppercase tracking-[0.1em] mb-5">Công nghệ sử dụng</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            {
                                                name: 'React', desc: 'UI Framework', icon: (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.31 0-.586.066-.823.192C5.018 2.209 4.507 3.748 4.72 5.97c.066.706.192 1.457.372 2.236-2.227.893-3.688 2.133-3.688 3.296 0 1.164 1.46 2.404 3.688 3.297-.18.779-.306 1.53-.372 2.236-.213 2.222.298 3.761 1.56 4.443.237.126.513.192.823.192 1.345 0 3.107-.96 4.888-2.623 1.78 1.654 3.542 2.603 4.887 2.603.31 0 .586-.066.823-.192 1.262-.682 1.773-2.221 1.56-4.443a15.658 15.658 0 0 0-.372-2.236c2.228-.893 3.688-2.133 3.688-3.297 0-1.163-1.46-2.403-3.688-3.296.18-.779.306-1.53.372-2.236.213-2.222-.298-3.761-1.56-4.443a1.627 1.627 0 0 0-.823-.192zM12 16.878c-1.197 0-2.393-.195-3.5-.584.576-.8 1.203-1.692 1.87-2.636a32.494 32.494 0 0 0 3.26 0c.667.944 1.294 1.836 1.87 2.636-1.107.389-2.303.584-3.5.584zm-5.406-4.15c-.485-.85-.921-1.696-1.305-2.532.384-.836.82-1.683 1.305-2.532a30.457 30.457 0 0 0 0 5.064zM17.406 7.278c.485.85.921 1.696 1.305 2.532-.384.836-.82 1.683-1.305 2.532a30.457 30.457 0 0 0 0-5.064z" /></svg>
                                                )
                                            },
                                            {
                                                name: 'TypeScript', desc: 'Language', icon: (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" /></svg>
                                                )
                                            },
                                            {
                                                name: 'Tailwind CSS', desc: 'Styling', icon: (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" /></svg>
                                                )
                                            },
                                            {
                                                name: 'Vite', desc: 'Build Tool', icon: (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="m8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.36-6.53a.306.306 0 0 0-.352-.382l-2.72.518a.306.306 0 0 1-.353-.384z" /></svg>
                                                )
                                            },
                                            {
                                                name: 'Supabase', desc: 'Backend & Auth', icon: (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .716.233l9.081-12.261.401-.562a1.04 1.04 0 0 0-.836-1.66z" /></svg>
                                                )
                                            },
                                            {
                                                name: 'HuggingFace', desc: 'AI Engine', icon: (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM8.5 13h7a.5.5 0 0 1 .5.5c0 2.21-1.79 4-4 4s-4-1.79-4-4a.5.5 0 0 1 .5-.5z" /></svg>
                                                )
                                            },
                                        ].map(tech => (
                                            <div key={tech.name} className="group p-4 rounded-xl bg-surface border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-default">
                                                <div className="text-text-muted group-hover:text-primary transition-colors duration-200 mb-2.5">
                                                    {tech.icon}
                                                </div>
                                                <p className="text-[0.8rem] font-bold text-text-primary leading-tight">{tech.name}</p>
                                                <p className="text-[0.65rem] text-text-muted mt-0.5">{tech.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* About */}
                                <div className="glass-card rounded-2xl md:rounded-3xl px-6 sm:px-8 py-7">
                                    <div className="max-w-lg mx-auto">
                                        <p className="text-xs font-bold text-primary tracking-wide text-center">LVT SPACE · v1.3.0</p>

                                        <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                                            Lvt Space là một Workspace Suite được thiết kế để giúp bạn tổ chức công việc, theo dõi thu nhập và ghi chú ý tưởng — tất cả trong một giao diện duy nhất, tối giản và hiện đại.
                                        </p>
                                        <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                                            Ứng dụng được xây dựng với triết lý "less is more" — tập trung vào trải nghiệm người dùng mượt mà, hỗ trợ đa nền tảng và tuỳ biến cao với hệ thống theme động.
                                        </p>

                                        <h5 className="text-[0.65rem] font-bold text-text-muted uppercase tracking-[0.1em] mt-6 mb-3">Tính năng nổi bật</h5>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                            {[
                                                { label: 'Dashboard', desc: 'Tổng quan thu nhập, biểu đồ thống kê' },
                                                { label: 'Quản lý công việc', desc: 'CRUD, trạng thái, deadline' },
                                                { label: 'Canvas ghi chú', desc: 'Kéo thả tự do, resize, pin' },
                                                { label: 'AI Notes', desc: 'Tạo ghi chú thông minh bằng AI' },
                                                { label: '6 bảng màu', desc: 'Theme động + hỗ trợ dark mode' },
                                                { label: 'Đăng nhập linh hoạt', desc: 'Email, Google, GitHub' },
                                                { label: 'Thu nhập', desc: 'Ghi nhận và theo dõi theo tháng' },
                                                { label: 'Responsive', desc: 'Tương thích mobile & desktop' },
                                            ].map(f => (
                                                <div key={f.label} className="py-1">
                                                    <p className="text-xs font-semibold text-text-primary">{f.label}</p>
                                                    <p className="text-[0.65rem] text-text-muted leading-snug">{f.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="text-center mt-6 pt-4 border-t border-border">

                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ Section: Danger Zone ═══ */}
                        {activeSection === 'danger' && (
                            <div className="glass-card rounded-2xl md:rounded-3xl p-6 sm:p-8 border-2 border-red-200 dark:border-red-900/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                        <FiTrash2 className="text-base text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-red-600 dark:text-red-400">Vùng nguy hiểm</h3>
                                        <p className="text-xs text-text-muted">Hành động không thể hoàn tác</p>
                                    </div>
                                </div>

                                <p className="text-sm text-text-muted mb-4">
                                    Xoá tất cả công việc (tasks) của bạn. Hành động này <strong className="text-red-500">không thể hoàn tác</strong>.
                                </p>

                                <div className="space-y-3 max-w-md">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Gõ <code className="bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded font-mono">XOÁ TẤT CẢ</code> để xác nhận</label>
                                        <input
                                            type="text"
                                            value={deleteConfirm}
                                            onChange={e => setDeleteConfirm(e.target.value)}
                                            placeholder="XOÁ TẤT CẢ"
                                            className="w-full bg-surface border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none text-sm text-text-primary placeholder:text-text-muted"
                                        />
                                    </div>

                                    {deleteMsg && (
                                        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${deleteMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                            }`}>
                                            {deleteMsg.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                            {deleteMsg.text}
                                        </div>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (deleteConfirm !== 'XOÁ TẤT CẢ') return
                                            setDeleteLoading(true)
                                            setDeleteMsg(null)
                                            try {
                                                await taskApi.removeAll()
                                                setDeleteMsg({ type: 'success', text: 'Đã xoá tất cả công việc!' })
                                                setDeleteConfirm('')
                                            } catch {
                                                setDeleteMsg({ type: 'error', text: 'Có lỗi xảy ra' })
                                            } finally {
                                                setDeleteLoading(false)
                                            }
                                        }}
                                        disabled={deleteLoading || deleteConfirm !== 'XOÁ TẤT CẢ'}
                                        className="bg-red-500 hover:bg-red-600 transition-all text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-red-200 dark:shadow-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm cursor-pointer"
                                    >
                                        {deleteLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <FiTrash2 className="text-base" />
                                        )}
                                        Xoá tất cả công việc
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>{/* end content wrapper */}
                </div>
            </div>
        </>
    )
}
