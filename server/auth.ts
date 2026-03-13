import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

// Extend Express Request to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}

/* ─── Server-side Supabase client for token verification ─── */
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

/**
 * Middleware: verify Supabase JWT via auth.getUser().
 * Works with both legacy HS256 and new ECC (P-256) signing keys.
 * Attaches req.userId for downstream route handlers.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization token' })
        return
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        res.status(500).json({ error: 'Server misconfigured: missing Supabase credentials' })
        return
    }

    const token = authHeader.slice(7)

    // Create a temporary client with the user's token to verify it
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    })

    supabase.auth.getUser(token)
        .then(({ data, error }) => {
            if (error || !data.user) {
                res.status(401).json({ error: 'Invalid or expired token' })
                return
            }
            req.userId = data.user.id
            next()
        })
        .catch(() => {
            res.status(401).json({ error: 'Token verification failed' })
        })
}
