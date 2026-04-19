import VersionBadge from '@/components/ui/VersionBadge'
import NotificationBell from '@/components/ui/NotificationBell'
import { useTranslation } from 'react-i18next'
import { FiGlobe } from 'react-icons/fi'

interface HeaderProps {
    title: string
    subtitle?: string
    children?: React.ReactNode
}

export default function Header({ title, subtitle, children }: HeaderProps) {
    const { i18n } = useTranslation()

    const toggleLang = () => {
        const newLang = i18n.language === 'en' ? 'vi' : 'en'
        i18n.changeLanguage(newLang)
    }

    return (
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
            <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold text-text-primary mb-1 break-words">{title}</h2>
                {subtitle && <p className="text-text-muted text-xs sm:text-sm">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {children}
                {/* Language Switcher */}
                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-text-muted hover:text-primary hover:border-primary transition-all text-[10px] font-bold uppercase tracking-wider h-8"
                >
                    <FiGlobe className="text-sm" />
                    {i18n.language === 'en' ? 'VI' : 'EN'}
                </button>
                {/* Version + Bell — hidden on mobile (already in mobile header) */}
                <div className="hidden xl:flex items-center gap-2">
                    <VersionBadge />
                    <NotificationBell />
                </div>
            </div>
        </header>
    )
}
