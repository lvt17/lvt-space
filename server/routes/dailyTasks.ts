import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET daily tasks for today — combines daily_tasks + main tasks with today deadline
router.get('/', async (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)

    const { rows: dailyRows } = await pool.query(
        `SELECT id, title, scheduled_date, time, cost, is_completed, created_at, 'daily' as source
         FROM daily_tasks WHERE scheduled_date = $1 AND user_id = $2 ORDER BY created_at ASC`,
        [date, req.userId]
    )

    const { rows: taskRows } = await pool.query(
        `SELECT id, name as title, deadline::text as scheduled_date, NULL as time, price as cost, 
         CASE WHEN status = 'completed' THEN true ELSE false END as is_completed,
         created_at, 'task' as source
         FROM tasks WHERE deadline = $1 AND user_id = $2 ORDER BY created_at ASC`,
        [date, req.userId]
    )

    res.json([...taskRows, ...dailyRows])
})

// GET tomorrow's tasks
router.get('/tomorrow', async (req, res) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const { rows: dailyRows } = await pool.query(
        `SELECT id, title, scheduled_date, time, cost, is_completed, created_at, 'daily' as source
         FROM daily_tasks WHERE scheduled_date = $1 AND user_id = $2 ORDER BY created_at ASC`,
        [tomorrowStr, req.userId]
    )

    const { rows: taskRows } = await pool.query(
        `SELECT id, name as title, deadline::text as scheduled_date, NULL as time, price as cost,
         CASE WHEN status = 'completed' THEN true ELSE false END as is_completed,
         created_at, 'task' as source
         FROM tasks WHERE deadline = $1 AND user_id = $2 ORDER BY created_at ASC`,
        [tomorrowStr, req.userId]
    )

    res.json([...taskRows, ...dailyRows])
})

// POST create daily task
router.post('/', async (req, res) => {
    const { title, scheduled_date, time, cost = 0 } = req.body
    const date = scheduled_date || new Date().toISOString().slice(0, 10)
    const { rows } = await pool.query(
        `INSERT INTO daily_tasks (title, scheduled_date, time, cost, user_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *, 'daily' as source`,
        [title, date, time || null, cost, req.userId]
    )
    res.status(201).json(rows[0])
})

// PATCH toggle completion — handles both daily_tasks and tasks
router.patch('/:id/toggle', async (req, res) => {
    const { rows: dailyRows } = await pool.query(
        `UPDATE daily_tasks SET is_completed = NOT is_completed
     WHERE id = $1 AND user_id = $2 RETURNING *, 'daily' as source`,
        [req.params.id, req.userId]
    )
    if (dailyRows.length) return res.json(dailyRows[0])

    const { rows: taskRows } = await pool.query(
        `UPDATE tasks SET status = CASE WHEN status = 'completed' THEN 'pending' ELSE 'completed' END, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING id, name as title, deadline::text as scheduled_date, NULL as time, price as cost,
     CASE WHEN status = 'completed' THEN true ELSE false END as is_completed, created_at, 'task' as source`,
        [req.params.id, req.userId]
    )
    if (!taskRows.length) return res.status(404).json({ error: 'Not found' })
    res.json(taskRows[0])
})

// DELETE daily task
router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query(
        'DELETE FROM daily_tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
})

export default router
