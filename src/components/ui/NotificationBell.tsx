import { useState, useRef, useEffect } from 'react'
import { MdNotifications, MdCheckCircle, MdError, MdWarning, MdInfo, MdNewReleases, MdClose, MdDoneAll, MdDeleteSweep } from 'react-icons/md'
import { useToast, type ToastType } from '@/contexts/ToastContext'

const ICON_MAP: Record<ToastType, typeof MdCheckCircle> = {
    success: MdCheckCircle,
    error: MdError,
    warning: MdWarning,
    info: MdInfo,
    update: MdNewReleases,
}

const COLOR_MAP: Record<ToastType, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    update: 'var(--color-primary)',
}

function timeAgo(ts: number): string {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} giờ trước`
    const days = Math.floor(hrs / 24)
    return `${days} ngày trước`
}

export default function NotificationBell() {
    const { notifications, unreadCount, markAllRead, clearNotifications } = useToast()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const handleToggle = () => {
        setOpen(prev => !prev)
        if (!open && unreadCount > 0) markAllRead()
    }

    return (
        <div ref={ref} className="relative z-50">
            {/* Bell button */}
            <button
                onClick={handleToggle}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                    background: open ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: open ? '#fff' : 'var(--color-text-secondary)',
                    boxShadow: open ? '0 4px 16px rgba(var(--theme-primary-rgb), 0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
                    border: `1px solid ${open ? 'transparent' : 'var(--color-border)'}`,
                }}
                title="Thông báo"
            >
                <MdNotifications className={`text-xl transition-transform ${open ? 'rotate-12' : ''}`} />

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white animate-pulse"
                        style={{ background: '#ef4444' }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className="absolute top-full right-0 mt-2 rounded-2xl overflow-hidden notification-panel-enter"
                    style={{
                        width: 380,
                        maxHeight: 480,
                        background: 'var(--color-surface)',
                        border: '1px solid rgba(var(--theme-primary-rgb), 0.25)',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.3), 0 0 24px rgba(var(--theme-primary-rgb), 0.15), 0 2px 8px rgba(0,0,0,0.12)',
                    }}
                >
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            Thông báo
                            {notifications.length > 0 && (
                                <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}
                                >
                                    {notifications.length}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllRead}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--color-text-muted)' }}
                                        title="Đánh dấu đã đọc"
                                    >
                                        <MdDoneAll className="text-sm" />
                                    </button>
                                    <button
                                        onClick={clearNotifications}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--color-text-muted)' }}
                                        title="Xoá tất cả"
                                    >
                                        <MdDeleteSweep className="text-sm" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <MdClose className="text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <MdNotifications className="text-3xl mx-auto mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    Chưa có thông báo nào
                                </p>
                            </div>
                        ) : (
                            notifications.map((n, i) => {
                                const Icon = ICON_MAP[n.type]
                                return (
                                    <div
                                        key={n.id}
                                        className="flex items-start gap-3 px-4 py-3 transition-colors cursor-default"
                                        style={{
                                            background: n.read ? 'transparent' : 'rgba(var(--theme-primary-rgb), 0.04)',
                                            borderBottom: i < notifications.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                                        }}
                                        onClick={() => { if (n.onClick) n.onClick() }}
                                    >
                                        {/* Icon */}
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                            style={{ background: `${COLOR_MAP[n.type]}15` }}
                                        >
                                            <Icon className="text-sm" style={{ color: COLOR_MAP[n.type] }} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {n.message}
                                                </p>
                                            )}
                                            <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                {timeAgo(n.timestamp)}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!n.read && (
                                            <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: 'var(--color-primary)' }} />
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
