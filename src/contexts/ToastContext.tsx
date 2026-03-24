import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose, MdNewReleases, MdRocketLaunch, MdAutoAwesome, MdBuild, MdTrendingUp, MdArrowForward } from 'react-icons/md'

/* ─── Types ─── */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'update'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
    onClick?: () => void
    persistent?: boolean
}

export interface Notification {
    id: string
    type: ToastType
    title: string
    message?: string
    timestamp: number
    read: boolean
    onClick?: () => void
}

export interface ChangelogEntry {
    version: string
    date: string
    features: string[]
    fixes?: string[]
    improvements?: string[]
}

interface ToastContextValue {
    toast: {
        success: (title: string, message?: string, duration?: number) => void
        error: (title: string, message?: string, duration?: number) => void
        warning: (title: string, message?: string, duration?: number) => void
        info: (title: string, message?: string, duration?: number) => void
        update: (version: string, changelog: ChangelogEntry) => void
        custom: (type: ToastType, title: string, opts?: { message?: string; duration?: number; onClick?: () => void; persistent?: boolean }) => void
    }
    showChangelog: (entry: ChangelogEntry) => void
    notifications: Notification[]
    unreadCount: number
    markAllRead: () => void
    clearNotifications: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

/* ─── Toast Icon & Colors ─── */
const TOAST_CONFIG: Record<ToastType, {
    icon: typeof MdCheckCircle
    accentColor: string // CSS color for the left border & icon
}> = {
    success: { icon: MdCheckCircle, accentColor: '#10b981' },
    error:   { icon: MdError,       accentColor: '#ef4444' },
    warning: { icon: MdWarning,     accentColor: '#f59e0b' },
    info:    { icon: MdInfo,        accentColor: '#3b82f6' },
    update:  { icon: MdNewReleases, accentColor: 'var(--color-primary)' },
}

const DEFAULT_DURATION: Record<ToastType, number> = {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 3500,
    update: 8000,
}

/* ─── ToastItem Component ─── */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
    const config = TOAST_CONFIG[toast.type]
    const Icon = config.icon
    const [exiting, setExiting] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleClose = useCallback(() => {
        setExiting(true)
        setTimeout(() => onClose(toast.id), 280)
    }, [toast.id, onClose])

    useEffect(() => {
        if (toast.persistent) return
        timerRef.current = setTimeout(handleClose, toast.duration ?? DEFAULT_DURATION[toast.type])
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [handleClose, toast.duration, toast.type, toast.persistent])

    const handleClick = () => {
        if (toast.onClick) toast.onClick()
        handleClose()
    }

    return (
        <div
            className={`
                toast-item group relative flex items-start gap-3 px-4 py-3.5
                rounded-xl border-l-4
                shadow-lg
                backdrop-blur-sm
                ${exiting ? 'toast-exit' : 'toast-enter'}
                cursor-pointer hover:shadow-xl transition-shadow
            `}
            style={{
                minWidth: 320,
                maxWidth: 420,
                borderLeftColor: config.accentColor,
                background: 'var(--color-surface)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
            onClick={handleClick}
            role="alert"
        >
            <Icon className="text-xl shrink-0 mt-0.5" style={{ color: config.accentColor }} />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                    {toast.title}
                </p>
                {toast.message && (
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {toast.message}
                    </p>
                )}
                {toast.type === 'update' && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: config.accentColor }}>
                        Nhấn để xem chi tiết →
                    </p>
                )}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); handleClose() }}
                className="opacity-0 group-hover:opacity-100 shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                style={{ color: 'var(--color-text-muted)' }}
            >
                <MdClose className="text-sm" />
            </button>

            {!toast.persistent && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden">
                    <div
                        style={{
                            height: '100%',
                            backgroundColor: config.accentColor,
                            opacity: 0.35,
                            animation: `toast-progress ${toast.duration ?? DEFAULT_DURATION[toast.type]}ms linear forwards`,
                        }}
                    />
                </div>
            )}
        </div>
    )
}

/* ─── Changelog Popup ─── */
function ChangelogPopup({ entry, onClose }: { entry: ChangelogEntry; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm changelog-backdrop" />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl shadow-2xl changelog-modal overflow-hidden"
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header — clean, no gradient */}
                <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-3.5">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}
                        >
                            <MdRocketLaunch className="text-xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                    Có gì mới
                                </h2>
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}
                                >
                                    v{entry.version}
                                </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                {entry.date}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:opacity-80"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <MdClose className="text-lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[55vh] overflow-y-auto space-y-5">
                    {/* Features */}
                    {entry.features.length > 0 && (
                        <section>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                                style={{ color: '#10b981' }}
                            >
                                <MdAutoAwesome className="text-sm" />
                                Tính năng mới
                            </h3>
                            <ul className="space-y-2">
                                {entry.features.map((f, i) => (
                                    <li key={i} className="text-[13px] leading-relaxed flex items-start gap-2.5"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: '#10b981' }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Fixes */}
                    {entry.fixes && entry.fixes.length > 0 && (
                        <section>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                                style={{ color: '#f59e0b' }}
                            >
                                <MdBuild className="text-sm" />
                                Sửa lỗi
                            </h3>
                            <ul className="space-y-2">
                                {entry.fixes.map((f, i) => (
                                    <li key={i} className="text-[13px] leading-relaxed flex items-start gap-2.5"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: '#f59e0b' }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Improvements */}
                    {entry.improvements && entry.improvements.length > 0 && (
                        <section>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                                style={{ color: '#3b82f6' }}
                            >
                                <MdTrendingUp className="text-sm" />
                                Cải tiến
                            </h3>
                            <ul className="space-y-2">
                                {entry.improvements.map((f, i) => (
                                    <li key={i} className="text-[13px] leading-relaxed flex items-start gap-2.5"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: '#3b82f6' }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        style={{
                            background: 'var(--color-primary)',
                            color: '#fff',
                        }}
                    >
                        Đã hiểu
                        <MdArrowForward className="text-sm" />
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Provider ─── */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const [changelogEntry, setChangelogEntry] = useState<ChangelogEntry | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('app_notifications')
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })

    // Persist notifications
    useEffect(() => {
        localStorage.setItem('app_notifications', JSON.stringify(notifications.slice(0, 50)))
    }, [notifications])

    const unreadCount = notifications.filter(n => !n.read).length

    const addToast = useCallback((type: ToastType, title: string, opts?: { message?: string; duration?: number; onClick?: () => void; persistent?: boolean }) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        setToasts(prev => [...prev, { id, type, title, ...opts }])
        // Also log to notification history
        setNotifications(prev => [{
            id,
            type,
            title,
            message: opts?.message,
            timestamp: Date.now(),
            read: false,
            onClick: opts?.onClick,
        }, ...prev].slice(0, 50))
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showChangelog = useCallback((entry: ChangelogEntry) => {
        setChangelogEntry(entry)
    }, [])

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const clearNotifications = useCallback(() => {
        setNotifications([])
    }, [])

    const toast = {
        success: (title: string, message?: string, duration?: number) => addToast('success', title, { message, duration }),
        error: (title: string, message?: string, duration?: number) => addToast('error', title, { message, duration }),
        warning: (title: string, message?: string, duration?: number) => addToast('warning', title, { message, duration }),
        info: (title: string, message?: string, duration?: number) => addToast('info', title, { message, duration }),
        update: (version: string, changelog: ChangelogEntry) => {
            addToast('update', `Phiên bản ${version} đã sẵn sàng!`, {
                message: 'Có nhiều cải tiến và tính năng mới',
                duration: 8000,
                onClick: () => setChangelogEntry(changelog),
            })
        },
        custom: (type: ToastType, title: string, opts?: { message?: string; duration?: number; onClick?: () => void; persistent?: boolean }) =>
            addToast(type, title, opts),
    }

    return (
        <ToastContext.Provider value={{ toast, showChangelog, notifications, unreadCount, markAllRead, clearNotifications }}>
            {children}

            {/* Toast Container — fixed top-right */}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onClose={removeToast} />
                        </div>
                    ))}
                </div>
            )}

            {/* Changelog Popup */}
            {changelogEntry && (
                <ChangelogPopup entry={changelogEntry} onClose={() => setChangelogEntry(null)} />
            )}
        </ToastContext.Provider>
    )
}
