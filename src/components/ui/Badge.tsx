const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-orange-50 text-orange-600 border-orange-200',
    'in-progress': 'bg-blue-50 text-blue-600 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    processing: 'bg-purple-50 text-purple-600 border-purple-200',
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Đang chờ',
    'in-progress': 'Đang xử lý',
    completed: 'Hoàn thành',
    processing: 'Processing',
}

interface BadgeProps {
    status: string
}

export default function Badge({ status }: BadgeProps) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending
    const label = STATUS_LABELS[status] ?? status

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${style}`}>
            {label}
        </span>
    )
}
