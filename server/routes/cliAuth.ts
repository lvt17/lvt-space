import { Router } from 'express'
import crypto from 'crypto'
import pool from '../db.js'

const router = Router()

/**
 * Step 1: CLI requests a session code (no auth needed)
 * POST /api/cli-auth/request
 */
router.post('/request', async (_req, res) => {
    const code = crypto.randomBytes(16).toString('hex')

    await pool.query(
        `INSERT INTO cli_auth_sessions (code, status, created_at)
         VALUES ($1, 'pending', NOW())`,
        [code]
    )

    const baseUrl = process.env.APP_URL || 'https://lvtspace.me'
    res.json({
        code,
        loginUrl: `${baseUrl}/cli-auth?code=${code}`,
        expiresIn: 600,
    })
})

/**
 * Step 2: Web frontend confirms auth (requires Supabase JWT)
 * POST /api/cli-auth/authorize
 */
router.post('/authorize', async (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7).startsWith('lvt_')) {
        return res.status(401).json({ error: 'Supabase auth required' })
    }

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

    // Verify session exists and is pending
    const { rows } = await pool.query(
        `SELECT * FROM cli_auth_sessions WHERE code = $1 AND status = 'pending'
         AND created_at > NOW() - INTERVAL '10 minutes'`,
        [code]
    )
    if (!rows.length) {
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

    // Mark session as authorized with the token
    await pool.query(
        `UPDATE cli_auth_sessions SET status = 'authorized', token = $1 WHERE code = $2`,
        [rawToken, code]
    )

    res.json({ ok: true })
})

/**
 * Step 3: CLI polls for token (no auth needed)
 * GET /api/cli-auth/poll?code=xxx
 */
router.get('/poll', async (req, res) => {
    const code = req.query.code as string
    if (!code) return res.status(400).json({ error: 'Missing code' })

    const { rows } = await pool.query(
        `SELECT status, token FROM cli_auth_sessions
         WHERE code = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
        [code]
    )

    if (!rows.length) {
        return res.status(404).json({ status: 'expired' })
    }

    if (rows[0].status === 'pending') {
        return res.json({ status: 'pending' })
    }

    // Authorized — return token and delete session
    const token = rows[0].token
    await pool.query('DELETE FROM cli_auth_sessions WHERE code = $1', [code])
    res.json({ status: 'authorized', token })
})

export default router
