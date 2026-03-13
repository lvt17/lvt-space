import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/services/supabase'
import type { User, Session, Provider } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    isRecovery: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    signInWithOAuth: (provider: Provider) => Promise<void>
    resetPassword: (email: string) => Promise<{ error: string | null }>
    updatePassword: (password: string) => Promise<{ error: string | null }>
    clearRecovery: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRecovery, setIsRecovery] = useState(false)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
    }

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) return { error: error.message }
        // If no session returned (email confirm required), auto sign in
        if (!data.session) {
            const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
            if (signInErr) return { error: signInErr.message }
        }
        return { error: null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const signInWithOAuth = async (provider: Provider) => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/dashboard` },
        })
    }

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error: error?.message ?? null }
    }

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password })
        if (!error) setIsRecovery(false)
        return { error: error?.message ?? null }
    }

    const clearRecovery = () => setIsRecovery(false)

    return (
        <AuthContext.Provider value={{ user, session, loading, isRecovery, signIn, signUp, signOut, signInWithOAuth, resetPassword, updatePassword, clearRecovery }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
