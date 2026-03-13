/**
 * Skeleton loading components for instant visual feedback.
 * Replace "Đang tải..." text with animated placeholder shapes.
 */

export function SkeletonPulse({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-xl ${className}`} />
}

/** Dashboard stat card skeleton */
export function StatCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl md:rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
                <SkeletonPulse className="w-10 h-10 rounded-xl" />
                <SkeletonPulse className="h-4 w-24" />
            </div>
            <SkeletonPulse className="h-8 w-32 mb-2" />
            <SkeletonPulse className="h-3 w-20" />
        </div>
    )
}

/** Dashboard skeleton — 4 stat cards + chart area */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl md:rounded-3xl p-6">
                    <SkeletonPulse className="h-5 w-40 mb-4" />
                    <SkeletonPulse className="h-48 w-full rounded-2xl" />
                </div>
                <div className="glass-card rounded-2xl md:rounded-3xl p-6">
                    <SkeletonPulse className="h-5 w-36 mb-4" />
                    <div className="space-y-3">
                        <SkeletonPulse className="h-12 w-full" />
                        <SkeletonPulse className="h-12 w-full" />
                        <SkeletonPulse className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

/** Task table skeleton rows */
export function TaskTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    <td className="px-4 py-3"><SkeletonPulse className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><SkeletonPulse className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><SkeletonPulse className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><SkeletonPulse className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><SkeletonPulse className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><SkeletonPulse className="h-6 w-16" /></td>
                </tr>
            ))}
        </>
    )
}

/** Task card skeleton for mobile */
export function TaskCardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3 px-4 py-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4">
                    <div className="flex justify-between mb-3">
                        <SkeletonPulse className="h-5 w-40" />
                        <SkeletonPulse className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                        <SkeletonPulse className="h-4 w-24" />
                        <SkeletonPulse className="h-4 w-20" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/** General page loading skeleton */
export function PageSkeleton() {
    return (
        <div className="space-y-4 py-6">
            <div className="flex justify-between">
                <SkeletonPulse className="h-5 w-32" />
                <SkeletonPulse className="h-5 w-24" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                        <SkeletonPulse className="w-10 h-10 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <SkeletonPulse className="h-4 w-3/4" />
                            <SkeletonPulse className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/** Loading spinner for buttons */
export function ButtonSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
    const px = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return <div className={`${px} border-2 border-current/30 border-t-current rounded-full animate-spin`} />
}
