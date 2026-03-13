interface HeaderProps {
    title: string
    subtitle?: string
    children?: React.ReactNode
}

export default function Header({ title, subtitle, children }: HeaderProps) {
    return (
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
            <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold text-text-primary mb-1 break-words">{title}</h2>
                {subtitle && <p className="text-text-muted text-xs sm:text-sm">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {children}
            </div>
        </header>
    )
}
