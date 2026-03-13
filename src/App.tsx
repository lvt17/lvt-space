import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'

/* ─── Lazy-loaded pages (route-level code splitting) ─── */
const LoginPage = lazy(() => import('./pages/LoginPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TaskManagementPage = lazy(() => import('./pages/TaskManagementPage'))
const DailyChecklistPage = lazy(() => import('./pages/DailyChecklistPage'))
const IncomeReceivedPage = lazy(() => import('./pages/IncomeReceivedPage'))
const ChecklistPage = lazy(() => import('./pages/ChecklistPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoader() {
    return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, isRecovery } = useAuth()
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }
    if (!user) return <Navigate to="/login" replace />
    if (isRecovery) return <Navigate to="/reset-password" replace />
    return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }
    if (user) return <Navigate to="/dashboard" replace />
    return <>{children}</>
}

export default function App() {
    return (
        <ThemeProvider>
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/tasks" element={<TaskManagementPage />} />
                        <Route path="/today" element={<DailyChecklistPage />} />
                        <Route path="/income" element={<IncomeReceivedPage />} />
                        <Route path="/checklists" element={<ChecklistPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
        </ThemeProvider>
    )
}
