import { useEffect } from 'react'
import { useToast, type ChangelogEntry } from '@/contexts/ToastContext'

const CURRENT_VERSION = '1.4.0'
const LS_KEY = 'lvt_last_seen_version'

const CURRENT_CHANGELOG: ChangelogEntry = {
    version: CURRENT_VERSION,
    date: '25 Tháng 3, 2026',
    features: [
        'CLI — Quản lý workspace từ terminal: tasks, income, notes, stats, whoami',
        'MCP Skill — Kết nối AI Agent để điều khiển Lvt Space bằng ngôn ngữ tự nhiên',
    ],
    fixes: [],
    improvements: [],
}

export default function VersionBadge() {
    const { showChangelog } = useToast()

    // Auto-show popup on first login after deploy or new user
    useEffect(() => {
        const lastSeen = localStorage.getItem(LS_KEY)
        if (lastSeen !== CURRENT_VERSION) {
            const timer = setTimeout(() => {
                showChangelog(CURRENT_CHANGELOG)
                localStorage.setItem(LS_KEY, CURRENT_VERSION)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    return (
        <button
            onClick={() => showChangelog(CURRENT_CHANGELOG)}
            className="h-9 px-3 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            style={{
                background: 'transparent',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
            }}
            title="Xem tính năng phiên bản hiện tại"
        >
            <span style={{ color: 'var(--color-primary)', fontSize: 11 }}>●</span>
            v{CURRENT_VERSION}
        </button>
    )
}
