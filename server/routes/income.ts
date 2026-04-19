import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET income records — combines income_records + paid tasks (filtered by user + optional month)
router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10)
    const offset = (page - 1) * limit
    const month = req.query.month as string // format: YYYY-MM
    const TZ = 'Asia/Ho_Chi_Minh'

    let incomeFilter = 'WHERE user_id = $1'
    let taskFilter = 'WHERE is_paid = true AND user_id = $1'
    const incomeParams: (string | undefined)[] = [req.userId]
    const taskParams: (string | undefined)[] = [req.userId]

    if (month) {
        // Filter by specific month
        incomeFilter += ` AND to_char(received_date, 'YYYY-MM') = $2`
        incomeParams.push(month)
        taskFilter += ` AND to_char((COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')::date, 'YYYY-MM') = $2`
        taskParams.push(month)
    } else {
        // Default: current month
        incomeFilter += ` AND date_trunc('month', received_date) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}')::date)`
        taskFilter += ` AND date_trunc('month', (COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}'))`
    }

    const { rows: incomeRows } = await pool.query(
        `SELECT id, task_name, category, received_date, amount, status, created_at, currency, original_amount, 'income' as source
         FROM income_records ${incomeFilter} ORDER BY received_date DESC`,
        incomeParams
    )

    const { rows: paidTaskRows } = await pool.query(
        `SELECT id, name as task_name, 'Phí dịch vụ' as category, 
         COALESCE(updated_at::date, created_at::date) as received_date, 
         price as amount, 'completed' as status, created_at, currency, original_amount, 'task' as source
         FROM tasks ${taskFilter} ORDER BY updated_at DESC`,
        taskParams
    )

    const allRecords = [...incomeRows, ...paidTaskRows]
        .sort((a, b) => new Date(b.received_date || b.created_at).getTime() - new Date(a.received_date || a.created_at).getTime())

    const total = allRecords.length
    const paged = allRecords.slice(offset, offset + limit)

    res.json({ records: paged, total, page, limit })
})

// GET monthly total (supports optional month param)
router.get('/monthly-total', async (req, res) => {
    const TZ = 'Asia/Ho_Chi_Minh'
    const month = req.query.month as string // format: YYYY-MM

    let incomeDateFilter: string
    let taskDateFilter: string
    const incomeParams: (string | undefined)[] = [req.userId]
    const taskParams: (string | undefined)[] = [req.userId]

    if (month) {
        incomeDateFilter = `AND to_char(received_date, 'YYYY-MM') = $2`
        incomeParams.push(month)
        taskDateFilter = `AND to_char((COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')::date, 'YYYY-MM') = $2`
        taskParams.push(month)
    } else {
        incomeDateFilter = `AND date_trunc('month', received_date) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}')::date)`
        taskDateFilter = `AND date_trunc('month', (COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}'))`
    }

    const { rows: incomeTotal } = await pool.query(`
    SELECT 
        COALESCE(SUM(amount), 0) AS total, 
        COALESCE(SUM(original_amount) FILTER (WHERE currency = 'USD'), 0) AS total_usd,
        COUNT(*) AS count
    FROM income_records
    WHERE user_id = $1 ${incomeDateFilter}
  `, incomeParams)

    const { rows: taskTotal } = await pool.query(`
    SELECT 
        COALESCE(SUM(price), 0) AS total, 
        COALESCE(SUM(original_amount) FILTER (WHERE currency = 'USD'), 0) AS total_usd,
        COUNT(*) AS count
    FROM tasks
    WHERE user_id = $1 AND is_paid = true ${taskDateFilter}
  `, taskParams)

    const total = parseInt(String(incomeTotal[0].total)) + parseInt(String(taskTotal[0].total))
    const totalUSD = parseFloat(String(incomeTotal[0].total_usd)) + parseFloat(String(taskTotal[0].total_usd))
    const count = parseInt(String(incomeTotal[0].count)) + parseInt(String(taskTotal[0].count))

    res.json({ total, totalUSD, count: String(count) })
})

// POST create income record
router.post('/', async (req, res) => {
    const { task_name, category, received_date, amount, status = 'completed', currency, original_amount } = req.body
    // Default to today in Vietnam timezone if no date provided
    const date = received_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    const { rows } = await pool.query(
        `INSERT INTO income_records (task_name, category, received_date, amount, status, user_id, currency, original_amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *, 'income' as source`,
        [task_name, category || null, date, amount || 0, status, req.userId, currency || 'VND', original_amount || 0]
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
