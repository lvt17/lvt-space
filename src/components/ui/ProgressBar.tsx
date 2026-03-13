interface ProgressBarProps {
    completed: number
    total: number
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const isAllDone = total > 0 && completed === total

    return (
        <div className="glass-card p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl mb-6 md:mb-8 relative overflow-hidden">
            {/* Background glow */}
            <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[60px] transition-all duration-700 ${isAllDone ? 'bg-green-300/30' : 'bg-primary-lightest/60'}`} />
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors ${isAllDone ? 'bg-green-100' : 'bg-primary-lightest'}`}>
                            <span className={`material-icons-round text-xl ${isAllDone ? 'text-green-600' : 'text-primary'}`}>
                                {isAllDone ? 'celebration' : 'trending_up'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-text-primary">
                                {isAllDone ? 'Xuất sắc! 🎉' : 'Tiến độ hôm nay'}
                            </h3>
                            <p className="text-text-muted text-xs sm:text-sm">
                                {isAllDone
                                    ? 'Bạn đã hoàn thành tất cả nhiệm vụ!'
                                    : `${completed}/${total} nhiệm vụ đã hoàn thành`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-2xl sm:text-3xl font-extrabold ${isAllDone ? 'text-green-500' : 'text-primary'}`}>
                            {percentage}%
                        </span>
                    </div>
                </div>
                <div className="w-full bg-primary-lightest/70 h-2.5 sm:h-3 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${isAllDone
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                            : 'bg-gradient-to-r from-primary to-primary-mid shadow-[0_0_12px_rgba(194,100,255,0.3)]'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
