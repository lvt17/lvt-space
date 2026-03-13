import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FiMail, FiLock, FiLogIn, FiUserPlus, FiKey, FiUser } from 'react-icons/fi'
import SpaceLogo from '@/components/ui/SpaceLogo'

type AuthMode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
    const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth()
    const navigate = useNavigate()
    const [mode, setMode] = useState<AuthMode>('login')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const switchMode = (m: AuthMode) => { setMode(m); setError(''); setSuccess('') }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!email.trim()) {
            setError('Vui lòng nhập email')
            return
        }

        if (mode === 'forgot') {
            setLoading(true)
            try {
                const { error: err } = await resetPassword(email)
                if (err) { setError(err); return }
                setSuccess('Đã gửi link đặt lại mật khẩu! Kiểm tra hộp thư email của bạn.')
            } finally {
                setLoading(false)
            }
            return
        }

        if (!password.trim()) {
            setError('Vui lòng nhập mật khẩu')
            return
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        setLoading(true)
        try {
            if (mode === 'signup') {
                const { error: err } = await signUp(email, password)
                if (err) { setError(err); return }
                navigate('/dashboard', { replace: true })
            } else {
                const { error: err } = await signIn(email, password)
                if (err) { setError(err); return }
                navigate('/dashboard', { replace: true })
            }
        } finally {
            setLoading(false)
        }
    }

    const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset password' : 'Welcome back'
    const subtitle = mode === 'signup'
        ? 'Sign up to start managing your workspace'
        : mode === 'forgot'
            ? 'Enter your email to receive a reset link'
            : 'Sign in to your Lvt Space workspace'

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left — Illustration Panel */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c5cbf 0%, #9b7fd4 30%, #c4b5e0 60%, #e8dff5 100%)' }}
            >
                {/* Abstract shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Large wave */}
                    <div className="absolute -bottom-20 -left-20 w-[120%] h-[60%] rounded-[50%] opacity-20"
                        style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3))' }} />
                    {/* Floating circles */}
                    <div className="absolute top-[15%] left-[20%] w-32 h-32 rounded-full opacity-15 bg-white" />
                    <div className="absolute top-[60%] right-[15%] w-20 h-20 rounded-full opacity-10 bg-white" />
                    <div className="absolute top-[40%] left-[60%] w-12 h-12 rounded-full opacity-20 bg-white" />
                    {/* Diagonal lines */}
                    <div className="absolute top-[25%] right-[30%] w-64 h-0.5 bg-white/10 rotate-45" />
                    <div className="absolute top-[55%] left-[10%] w-40 h-0.5 bg-white/10 -rotate-12" />
                    {/* Small triangles */}
                    <div className="absolute top-[30%] right-[20%] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-white/15 rotate-[30deg]" />
                    <div className="absolute bottom-[30%] left-[25%] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-white/10 -rotate-[15deg]" />
                </div>

                {/* Center rocket icon */}
                <div className="relative z-10 text-center">
                    <div className="w-28 h-28 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <SpaceLogo className="w-full h-full" />
                    </div>
                    <h2 className="text-white text-2xl font-bold tracking-tight">Lvt Space</h2>
                    <p className="text-white/60 text-sm mt-1">Workspace Suite</p>
                </div>
            </div>

            {/* Right — Form Panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <SpaceLogo className="w-full h-full" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Lvt Space</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Workspace Suite</p>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block mb-8">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <SpaceLogo className="w-full h-full" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">Lvt Space</h1>
                                <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Workspace Suite</p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
                    <p className="text-sm text-gray-400 mb-7">{subtitle}</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl px-4 py-3 mb-5">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#7c5cbf]/30 focus:border-[#7c5cbf] outline-none text-sm text-gray-900 placeholder:text-gray-300 bg-white transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#7c5cbf]/30 focus:border-[#7c5cbf] outline-none text-sm text-gray-900 placeholder:text-gray-300 bg-white transition-all"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {mode !== 'forgot' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#7c5cbf]/30 focus:border-[#7c5cbf] outline-none text-sm text-gray-900 placeholder:text-gray-300 bg-white transition-all"
                                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="text-right -mt-2">
                                <button
                                    type="button"
                                    onClick={() => switchMode('forgot')}
                                    className="text-xs text-[#7c5cbf] hover:text-[#6b4fb0] font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#7c5cbf] hover:bg-[#6b4fb0] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#7c5cbf]/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : mode === 'signup' ? (
                                <>
                                    <FiUserPlus className="text-base" />
                                    Create Account
                                </>
                            ) : mode === 'forgot' ? (
                                <>
                                    <FiKey className="text-base" />
                                    Send Reset Link
                                </>
                            ) : (
                                <>
                                    <FiLogIn className="text-base" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Social login — only on login/signup */}
                    {mode !== 'forgot' && (
                        <div className="mt-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-xs text-gray-400">Or {mode === 'signup' ? 'sign up' : 'sign in'} with:</span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => signInWithOAuth('google')}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google
                                </button>
                                <button
                                    type="button"
                                    onClick={() => signInWithOAuth('github')}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    GitHub
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mode switch */}
                    <div className="mt-6 text-center">
                        {mode === 'forgot' ? (
                            <button
                                onClick={() => switchMode('login')}
                                className="text-sm text-[#7c5cbf] hover:text-[#6b4fb0] font-medium transition-colors"
                            >
                                ← Back to sign in
                            </button>
                        ) : (
                            <button
                                onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
                                className="text-sm text-gray-500"
                            >
                                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                                <span className="text-[#7c5cbf] hover:text-[#6b4fb0] font-medium transition-colors">
                                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                                </span>
                            </button>
                        )}
                    </div>

                    <p className="text-center text-xs text-gray-300 mt-8">
                        © 2026 Lvt Space. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}
