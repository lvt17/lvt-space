import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET all tasks (filtered by user)
router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [req.userId]
    )
    res.json(rows)
})

// POST create task
router.post('/', async (req, res) => {
    const { name, deadline, price, status = 'pending' } = req.body
    const { rows } = await pool.query(
        `INSERT INTO tasks (name, deadline, price, status, user_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, deadline || null, price || 0, status, req.userId]
    )
    res.status(201).json(rows[0])
})

// PUT update task
router.put('/:id', async (req, res) => {
    const { name, deadline, price, status, is_paid } = req.body
    const { rows } = await pool.query(
        `UPDATE tasks
     SET name = COALESCE($1, name),
         deadline = COALESCE($2, deadline),
         price = COALESCE($3, price),
         status = COALESCE($4, status),
         is_paid = COALESCE($5, is_paid),
         updated_at = NOW()
     WHERE id = $6 AND user_id = $7 RETURNING *`,
        [name, deadline, price, status, is_paid, req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Task not found' })
    res.json(rows[0])
})

// PATCH toggle paid
router.patch('/:id/toggle-paid', async (req, res) => {
    const { rows } = await pool.query(
        `UPDATE tasks SET is_paid = NOT is_paid, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
        [req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Task not found' })
    res.json(rows[0])
})

// DELETE all tasks for user
router.delete('/all', async (req, res) => {
    await pool.query('DELETE FROM tasks WHERE user_id = $1', [req.userId])
    res.status(204).end()
})

// DELETE task
router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Task not found' })
    res.status(204).end()
})

export default router
