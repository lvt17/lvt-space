import { Router } from 'express'
import crypto from 'crypto'
import pool from '../db.js'

const router = Router()

// In-memory store for pending CLI auth sessions (short-lived)
const pendingSessions = new Map<string, {
    createdAt: number
    userId?: string
    token?: string
    status: 'pending' | 'authorized'
}>()

// Cleanup expired sessions every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [code, session] of pendingSessions) {
        if (now - session.createdAt > 10 * 60 * 1000) { // 10 min TTL
            pendingSessions.delete(code)
        }
    }
}, 5 * 60 * 1000)

/**
 * Step 1: CLI requests a session code (no auth needed)
 * POST /api/cli-auth/request
 * Returns { code, loginUrl }
 */
router.post('/request', (_req, res) => {
    const code = crypto.randomBytes(16).toString('hex')

    pendingSessions.set(code, {
        createdAt: Date.now(),
        status: 'pending',
    })

    const baseUrl = process.env.APP_URL || 'http://localhost:5173'
    res.json({
        code,
        loginUrl: `${baseUrl}/cli-auth?code=${code}`,
        expiresIn: 600, // 10 minutes
    })
})

/**
 * Step 2: Web frontend confirms auth (requires Supabase JWT)
 * POST /api/cli-auth/authorize
 * Body: { code }
 * Creates a PAT and links it to the session
 */
router.post('/authorize', async (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7).startsWith('lvt_')) {
        return res.status(401).json({ error: 'Supabase auth required' })
    }

    // Verify Supabase JWT
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: 'Server misconfigured' })
    }

    const token = authHeader.slice(7)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid token' })
    }

    const { code } = req.body
    const session = pendingSessions.get(code)

    if (!session || session.status !== 'pending') {
        return res.status(400).json({ error: 'Invalid or expired session code' })
    }

    // Create PAT for CLI
    const rawToken = 'lvt_' + crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const tokenPrefix = rawToken.slice(0, 8)

    await pool.query(
        `INSERT INTO personal_tokens (user_id, name, token_prefix, token_hash, scopes)
         VALUES ($1, $2, $3, $4, $5)`,
        [data.user.id, 'CLI Login', tokenPrefix, tokenHash, ['read', 'write']]
    )

    // Mark session as authorized
    session.status = 'authorized'
    session.userId = data.user.id
    session.token = rawToken

    res.json({ ok: true })
})

/**
 * Step 3: CLI polls for token (no auth needed)
 * GET /api/cli-auth/poll?code=xxx
 */
router.get('/poll', (req, res) => {
    const code = req.query.code as string
    const session = pendingSessions.get(code)

    if (!session) {
        return res.status(404).json({ status: 'expired' })
    }

    if (session.status === 'pending') {
        return res.json({ status: 'pending' })
    }

    // Authorized — return token and cleanup
    const token = session.token
    pendingSessions.delete(code)
    res.json({ status: 'authorized', token })
})

export default router
