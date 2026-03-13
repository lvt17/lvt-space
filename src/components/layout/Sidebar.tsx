import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '@/data/mockData'
import { useAuth } from '@/contexts/AuthContext'
import { FiLogOut, FiSettings } from 'react-icons/fi'
import SpaceLogo from '@/components/ui/SpaceLogo'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    // Derive display name and initials from user metadata or email
    const email = user?.email ?? ''
    const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || email.split('@')[0]
    const initials = displayName
        .split(/[\s._-]/)
        .slice(0, 2)
        .map((s: string) => s.charAt(0).toUpperCase())
        .join('')
        || '?'

    return (
        <aside className={`
            w-[16.5rem] glass-sidebar flex flex-col h-screen fixed z-50
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            xl:translate-x-0
        `}>
            {/* Logo */}
            <div className="p-5 xl:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <SpaceLogo className="w-full h-full" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-text-primary">Lvt Space</h1>
                            <p className="text-[0.5625rem] uppercase tracking-widest text-text-muted font-semibold">
                                Workspace Suite
                            </p>
                        </div>
                    </div>
                    {/* Close button — visible below xl */}
                    <button
                        onClick={onClose}
                        className="xl:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-lightest/50 text-text-muted"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                ? 'sidebar-active'
                                : 'text-text-secondary hover:bg-primary-lightest/50 hover:text-primary'
                            }`
                        }
                    >
                        <span className="material-icons-round text-[1.25rem]">{item.icon}</span>
                        <span className="font-medium text-[0.8125rem]">{item.label}</span>
                    </NavLink>
                ))}

                <div className="pt-3 pb-1.5 px-3.5">
                    <p className="text-[0.5625rem] uppercase font-bold text-text-muted tracking-widest">
                        Hệ thống
                    </p>
                </div>
                <NavLink
                    to="/settings"
                    onClick={onClose}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${isActive
                            ? 'sidebar-active'
                            : 'text-text-secondary hover:bg-primary-lightest/50 hover:text-primary'
                        }`
                    }
                >
                    <FiSettings className="text-[1.25rem]" />
                    <span className="font-medium text-[0.8125rem]">Cài đặt</span>
                </NavLink>
            </nav>

            {/* User card */}
            <div className="p-3 mt-auto">
                <div className="bg-primary-lightest/40 p-3 rounded-2xl flex items-center gap-2.5 border border-border">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary-mid flex items-center justify-center text-xs font-bold text-white border-2 border-white shrink-0">
                        {initials}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-[0.8125rem] font-semibold text-text-primary truncate">
                            {displayName}
                        </p>
                        <p className="text-[0.625rem] text-text-muted truncate">
                            {email}
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Đăng xuất"
                    >
                        <FiLogOut className="text-base" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
