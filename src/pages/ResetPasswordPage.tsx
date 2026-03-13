import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FiLock, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi'

export default function ResetPasswordPage() {
    const { updatePassword, clearRecovery } = useAuth()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }
        if (password !== confirm) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }
        setLoading(true)
        try {
            const { error: err } = await updatePassword(password)
            if (err) { setError(err); return }
            setSuccess(true)
            setTimeout(() => {
                clearRecovery()
                navigate('/dashboard', { replace: true })
            }, 2000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0ecf9 0%, #e8e0f4 50%, #f5f0ff 100%)' }}>
            <div className="stars-overlay" />
            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-mid rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/25">
                        <span className="text-2xl">🔑</span>
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Đặt mật khẩu mới</h1>
                    <p className="text-sm text-text-muted mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>

                <div className="glass-card rounded-3xl p-8 shadow-2xl">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCheck className="text-3xl text-green-600" />
                            </div>
                            <h3 className="font-bold text-lg text-text-primary mb-2">Đổi mật khẩu thành công!</h3>
                            <p className="text-sm text-text-muted">Đang chuyển hướng về Dashboard...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Mật khẩu mới</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="w-full bg-surface border border-border rounded-xl pl-11 pr-11 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onPointerDown={() => setShowPw(true)}
                                            onPointerUp={() => setShowPw(false)}
                                            onPointerLeave={() => setShowPw(false)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                                        >
                                            {showPw ? <FiEye className="text-base" /> : <FiEyeOff className="text-base" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2 ml-1">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type={showConfirmPw ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="Nhập lại mật khẩu"
                                            className="w-full bg-surface border border-border rounded-xl pl-11 pr-11 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-text-primary placeholder:text-text-muted"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onPointerDown={() => setShowConfirmPw(true)}
                                            onPointerUp={() => setShowConfirmPw(false)}
                                            onPointerLeave={() => setShowConfirmPw(false)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                                        >
                                            {showConfirmPw ? <FiEye className="text-base" /> : <FiEyeOff className="text-base" />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-primary to-primary-mid hover:from-primary-mid hover:to-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FiCheck className="text-lg" />
                                            Đặt mật khẩu mới
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
