import { Router } from 'express'
import crypto from 'crypto'
import pool from '../db.js'

const router = Router()

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

function generateToken(): string {
    return 'lvt_' + crypto.randomBytes(32).toString('hex')
}

// GET list all tokens for user (no raw token shown)
router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        `SELECT id, name, token_prefix, scopes, last_used_at, expires_at, created_at
         FROM personal_tokens WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.userId]
    )
    res.json(rows)
})

// POST create a new PAT
router.post('/', async (req, res) => {
    const { name = 'CLI Token', scopes = ['read', 'write'], expires_in_days } = req.body

    if (!name?.trim()) {
        return res.status(400).json({ error: 'Token name is required' })
    }

    const rawToken = generateToken()
    const tokenHash = hashToken(rawToken)
    const tokenPrefix = rawToken.slice(0, 8) // "lvt_xxxx"

    const expiresAt = expires_in_days
        ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
        : null

    const { rows } = await pool.query(
        `INSERT INTO personal_tokens (user_id, name, token_prefix, token_hash, scopes, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, token_prefix, scopes, expires_at, created_at`,
        [req.userId, name.trim(), tokenPrefix, tokenHash, scopes, expiresAt]
    )

    // Return raw token ONCE — user must save it
    res.status(201).json({
        ...rows[0],
        token: rawToken,
        warning: 'Save this token now. It will not be shown again.',
    })
})

// DELETE revoke a token
router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query(
        'DELETE FROM personal_tokens WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Token not found' })
    res.status(204).end()
})

export default router
