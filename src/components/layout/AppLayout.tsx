import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SpaceLogo from '@/components/ui/SpaceLogo'

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            <div className="stars-overlay" />

            {/* Mobile/Tablet header with hamburger — visible below xl */}
            <div className="xl:hidden fixed top-0 left-0 right-0 z-30 glass-sidebar px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary-lightest/50 text-text-primary"
                >
                    <span className="material-icons-round">menu</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 flex items-center justify-center">
                        <SpaceLogo className="w-full h-full" />
                    </div>
                    <h1 className="text-lg font-bold text-text-primary">Lvt Space</h1>
                </div>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="xl:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex min-h-screen">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="w-full xl:ml-[16.5rem] flex-1 p-4 pt-[4.5rem] sm:p-6 sm:pt-[4.5rem] md:p-8 md:pt-[4.5rem] xl:p-8 xl:pt-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </>
    )
}
