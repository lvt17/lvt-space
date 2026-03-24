import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

export default function CliAuthPage() {
    const { user, loading } = useAuth()
    const [searchParams] = useSearchParams()
    const code = searchParams.get('code')
    const [status, setStatus] = useState<'loading' | 'confirm' | 'success' | 'error' | 'no-code'>('loading')
    const [error, setError] = useState('')

    useEffect(() => {
        if (!code) {
            setStatus('no-code')
            return
        }
        if (!loading && user) {
            setStatus('confirm')
        }
    }, [code, user, loading])

    async function handleAuthorize() {
        if (!code) return
        setStatus('loading')

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
                setError('Vui lòng đăng nhập trước')
                setStatus('error')
                return
            }

            const res = await fetch('/api/cli-auth/authorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ code }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Authorization failed')
            }

            setStatus('success')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
            setStatus('error')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
            <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-xl">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                            <polyline points="4 17 10 11 4 5" />
                            <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-heading">Đăng nhập CLI</h1>
                    <p className="text-sm text-muted mt-1">Lvt Space Terminal</p>
                </div>

                {status === 'no-code' && (
                    <div className="text-center">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            Link không hợp lệ. Hãy chạy <code className="bg-surface px-1.5 py-0.5 rounded font-mono text-xs">lvt login</code> từ terminal.
                        </div>
                    </div>
                )}

                {status === 'confirm' && !user && (
                    <div className="text-center">
                        <p className="text-muted mb-4">Bạn cần đăng nhập trước khi xác nhận CLI.</p>
                        <a href="/login" className="inline-flex px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                            Đăng nhập
                        </a>
                    </div>
                )}

                {status === 'confirm' && user && (
                    <div className="space-y-4">
                        <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                            <p className="text-sm text-body">
                                Một ứng dụng CLI đang yêu cầu quyền truy cập tài khoản <span className="font-semibold text-heading">{user.email}</span>
                            </p>
                        </div>

                        <div className="p-3 bg-surface rounded-xl text-xs text-muted space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Đọc và ghi tasks
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Quản lý daily checklist
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Quản lý thu nhập
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Xem dashboard
                            </div>
                        </div>

                        <button
                            onClick={handleAuthorize}
                            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition cursor-pointer"
                        >
                            Xác nhận đăng nhập CLI
                        </button>

                        <a href="/dashboard" className="block text-center text-sm text-muted hover:text-body transition">
                            Huỷ bỏ
                        </a>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-heading font-semibold">Đăng nhập thành công!</p>
                            <p className="text-sm text-muted mt-1">Quay lại terminal — CLI đã sẵn sàng sử dụng.</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                        <button
                            onClick={() => setStatus('confirm')}
                            className="text-sm text-primary hover:underline cursor-pointer"
                        >
                            Thử lại
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
