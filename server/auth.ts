import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import pool from './db.js'

// Extend Express Request to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string
            authMethod?: 'supabase' | 'pat'
        }
    }
}

/* ─── Server-side Supabase client for token verification ─── */
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

/**
 * Verify a Personal Access Token (lvt_xxx format).
 * Returns userId if valid, null otherwise.
 */
async function verifyPAT(token: string): Promise<string | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { rows } = await pool.query(
        `UPDATE personal_tokens
         SET last_used_at = NOW()
         WHERE token_hash = $1
           AND (expires_at IS NULL OR expires_at > NOW())
         RETURNING user_id`,
        [tokenHash]
    )

    return rows.length > 0 ? rows[0].user_id : null
}

/**
 * Multi-strategy auth middleware.
 * Strategy 1: Supabase JWT (for web frontend)
 * Strategy 2: Personal Access Token / lvt_* (for CLI / external)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization token' })
        return
    }

    const token = authHeader.slice(7)

    // Strategy 2: Personal Access Token (lvt_xxx)
    if (token.startsWith('lvt_')) {
        verifyPAT(token)
            .then(userId => {
                if (!userId) {
                    res.status(401).json({ error: 'Invalid or expired token' })
                    return
                }
                req.userId = userId
                req.authMethod = 'pat'
                next()
            })
            .catch(() => {
                res.status(401).json({ error: 'Token verification failed' })
            })
        return
    }

    // Strategy 1: Supabase JWT (default for web frontend)
    if (!supabaseUrl || !supabaseAnonKey) {
        res.status(500).json({ error: 'Server misconfigured: missing Supabase credentials' })
        return
    }

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
            req.authMethod = 'supabase'
            next()
        })
        .catch(() => {
            res.status(401).json({ error: 'Token verification failed' })
        })
}

/**
 * Middleware that ONLY accepts Supabase JWT.
 * Used for sensitive operations like creating PATs.
 */
export function requireSupabaseAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization token' })
        return
    }

    const token = authHeader.slice(7)

    if (token.startsWith('lvt_')) {
        res.status(403).json({ error: 'PAT cannot be used for this operation. Use Supabase session.' })
        return
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        res.status(500).json({ error: 'Server misconfigured' })
        return
    }

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
            req.authMethod = 'supabase'
            next()
        })
        .catch(() => {
            res.status(401).json({ error: 'Token verification failed' })
        })
}
