import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TaskManagementPage from './pages/TaskManagementPage'
import DailyChecklistPage from './pages/DailyChecklistPage'
import IncomeReceivedPage from './pages/IncomeReceivedPage'
import ChecklistPage from './pages/ChecklistPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SettingsPage from './pages/SettingsPage'

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
                <Routes>
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/tasks" element={<TaskManagementPage />} />
                        <Route path="/today" element={<DailyChecklistPage />} />
                        <Route path="/income" element={<IncomeReceivedPage />} />
                        <Route path="/checklists" element={<ChecklistPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
        </ThemeProvider>
    )
}
