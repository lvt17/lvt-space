import { useEffect } from 'react'
import { useToast, type ChangelogEntry } from '@/contexts/ToastContext'

const CURRENT_VERSION = '1.3.0'
const LS_KEY = 'lvt_last_seen_version'

const CURRENT_CHANGELOG: ChangelogEntry = {
    version: CURRENT_VERSION,
    date: '15 Tháng 3, 2026',
    features: [
        'Hệ thống thông báo Toast (success, error, warning, info, update)',
        'Nhắc nhở deadline tự động: cảnh báo trước 1 ngày và nhắc hoàn thành đúng hạn',
        'Tạo mô tả chi tiết cho từng items trong checklist',
        'Tạo mô tả với cá nhân hoá tối đa cho từng task, có thể thêm ảnh và chỉnh sửa text đa dạng',
        'Xem mô tả trực tiếp từ Notes Board',
        'Thêm bộ lọc theo ngày thêm và theo deadline cho phần quản lý công việc'
    ],
    fixes: [
        'Hiển thị ngày sai timezone — giờ đúng theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)',
        'Một số lỗi UI nhỏ tồn đọng',
        'Data cache: giảm request trùng lặp khi chuyển trang',
    ],
    improvements: [
        'Các popup mở với kích thước lớn hơn mặc định',
        'Cải thiện tốc độ xử lý dữ liệu và hiển thị',
        'Cải thiện UX/UI thân thiện hơn với người dùng',
        'Cải thiện thao tác di chuyển trong Notes Board',
        'Cải thiện thuật toán để xử lý số liệu chính xác hơn'
    ],
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
