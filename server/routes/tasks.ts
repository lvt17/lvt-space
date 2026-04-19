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
    const { name, deadline, price, status = 'pending', description, currency, original_amount } = req.body
    const { rows } = await pool.query(
        `INSERT INTO tasks (name, deadline, price, status, description, user_id, currency, original_amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
            name,
            deadline || null,
            price || 0,
            status,
            description || null,
            req.userId,
            currency || 'VND',
            original_amount || 0
        ]
    )
    res.status(201).json(rows[0])
})

// PUT update task
router.put('/:id', async (req, res) => {
    const { name, deadline, price, status, is_paid, description, currency, original_amount } = req.body
    const { rows } = await pool.query(
        `UPDATE tasks
     SET name = COALESCE($1, name),
         deadline = COALESCE($2, deadline),
         price = COALESCE($3, price),
         status = COALESCE($4, status),
         is_paid = COALESCE($5, is_paid),
         description = COALESCE($6, description),
         currency = COALESCE($7, currency),
         original_amount = COALESCE($8, original_amount),
         updated_at = NOW(),
         paid_at = CASE 
           WHEN $5 = true AND (is_paid = false OR paid_at IS NULL) THEN NOW()
           WHEN $5 = false THEN NULL
           ELSE paid_at
         END
     WHERE id = $9 AND user_id = $10 RETURNING *`,
        [name, deadline, price, status, is_paid, description, currency, original_amount, req.params.id, req.userId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Task not found' })
    res.json(rows[0])
})

// PATCH toggle paid
router.patch('/:id/toggle-paid', async (req, res) => {
    const { rows } = await pool.query(
        `UPDATE tasks 
         SET is_paid = NOT is_paid, 
             updated_at = NOW(),
             paid_at = CASE WHEN NOT is_paid THEN NOW() ELSE NULL END
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
