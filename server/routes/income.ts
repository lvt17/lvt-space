import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET income records — combines income_records + paid tasks (filtered by user)
router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10)
    const offset = (page - 1) * limit

    const { rows: incomeRows } = await pool.query(
        `SELECT id, task_name, category, received_date, amount, status, created_at, 'income' as source
         FROM income_records WHERE user_id = $1 ORDER BY received_date DESC`,
        [req.userId]
    )

    const { rows: paidTaskRows } = await pool.query(
        `SELECT id, name as task_name, 'Phí dịch vụ' as category, 
         COALESCE(updated_at::date, created_at::date) as received_date, 
         price as amount, 'completed' as status, created_at, 'task' as source
         FROM tasks WHERE is_paid = true AND user_id = $1 ORDER BY updated_at DESC`,
        [req.userId]
    )

    const allRecords = [...incomeRows, ...paidTaskRows]
        .sort((a, b) => new Date(b.received_date || b.created_at).getTime() - new Date(a.received_date || a.created_at).getTime())

    const total = allRecords.length
    const paged = allRecords.slice(offset, offset + limit)

    res.json({ records: paged, total, page, limit })
})

// GET monthly total
router.get('/monthly-total', async (req, res) => {
    const TZ = 'Asia/Ho_Chi_Minh'
    const { rows: incomeTotal } = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
    FROM income_records
    WHERE user_id = $1 AND date_trunc('month', received_date) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}')::date)
  `, [req.userId])

    const { rows: taskTotal } = await pool.query(`
    SELECT COALESCE(SUM(price), 0) AS total, COUNT(*) AS count
    FROM tasks
    WHERE user_id = $1 AND is_paid = true
    AND date_trunc('month', (COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}'))
  `, [req.userId])

    const total = parseInt(String(incomeTotal[0].total)) + parseInt(String(taskTotal[0].total))
    const count = parseInt(String(incomeTotal[0].count)) + parseInt(String(taskTotal[0].count))

    res.json({ total, count: String(count) })
})

// POST create income record
router.post('/', async (req, res) => {
    const { task_name, category, received_date, amount, status = 'completed' } = req.body
    // Default to today in Vietnam timezone if no date provided
    const date = received_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    const { rows } = await pool.query(
        `INSERT INTO income_records (task_name, category, received_date, amount, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, 'income' as source`,
        [task_name, category || null, date, amount || 0, status, req.userId]
    )
    res.status(201).json(rows[0])
})

// DELETE income record
router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query(
        'DELETE FROM income_records WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
})

export default router
