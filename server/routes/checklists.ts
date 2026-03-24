import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET all checklists (filtered by user)
router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT * FROM checklists WHERE user_id = $1 ORDER BY updated_at DESC',
        [req.userId]
    )
    res.json(rows)
})

// GET single checklist
router.get('/:id', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT * FROM checklists WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
})

// POST create checklist
router.post('/', async (req, res) => {
    const { title = 'Untitled', description, items = [], color = 'purple', pos_x = 100, pos_y = 100, width, height, type = 'checklist', content = '' } = req.body
    const { rows } = await pool.query(
        `INSERT INTO checklists (title, description, items, color, pos_x, pos_y, width, height, user_id, type, content)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [title, description || null, JSON.stringify(items), color, pos_x, pos_y, width ?? null, height ?? null, req.userId, type, content]
    )
    res.status(201).json(rows[0])
})

// PUT update checklist
router.put('/:id', async (req, res) => {
    const { title, description, items, color, pos_x, pos_y, width, height, type, content } = req.body
    const { rows } = await pool.query(
        `UPDATE checklists
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             items = COALESCE($3::jsonb, items),
             color = COALESCE($4, color),
             pos_x = COALESCE($5, pos_x),
             pos_y = COALESCE($6, pos_y),
             width = COALESCE($7, width),
             height = COALESCE($8, height),
             type = COALESCE($9, type),
             content = COALESCE($10, content),
             updated_at = NOW()
         WHERE id = $11 AND user_id = $12
         RETURNING *`,
        [title, description, items ? JSON.stringify(items) : null, color, pos_x ?? null, pos_y ?? null, width ?? null, height ?? null, type ?? null, content ?? null, req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
})

// DELETE checklist
router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query(
        'DELETE FROM checklists WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
})

export default router
