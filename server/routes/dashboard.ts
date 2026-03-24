import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET dashboard stats (filtered by user)
router.get('/stats', async (req, res) => {
  const userId = req.userId

  const TZ = 'Asia/Ho_Chi_Minh'

  const [taskStats, incomeStats, monthlyTrend, allIncomeStats] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks,
        COUNT(*) FILTER (WHERE status IN ('pending', 'processing', 'in-progress')) AS active_tasks,
        COALESCE(SUM(price) FILTER (WHERE is_paid = false), 0) AS unpaid_total,
        COALESCE(SUM(price) FILTER (WHERE is_paid = true), 0) AS paid_total,
        COALESCE(SUM(price) FILTER (WHERE is_paid = true AND date_trunc('month', (COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}'))), 0) AS paid_this_month,
        COALESCE(SUM(price) FILTER (WHERE date_trunc('month', (created_at AT TIME ZONE '${TZ}')) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}'))), 0) AS all_tasks_this_month
      FROM tasks WHERE user_id = $1
    `, [userId]),
    pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS monthly_income
      FROM income_records
      WHERE user_id = $1 AND date_trunc('month', received_date) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}')::date)
    `, [userId]),
    pool.query(`
      SELECT
        to_char(date_trunc('month', t.month), 'Mon') AS name,
        COALESCE(SUM(t.price), 0) AS income
      FROM (
        SELECT date_trunc('month', (COALESCE(updated_at, created_at) AT TIME ZONE '${TZ}')) AS month, price
        FROM tasks WHERE user_id = $1
        UNION ALL
        SELECT date_trunc('month', received_date) AS month, amount AS price
        FROM income_records WHERE user_id = $1 AND received_date IS NOT NULL
      ) t
      WHERE t.month >= date_trunc('month', (NOW() AT TIME ZONE '${TZ}')) - INTERVAL '11 months'
      GROUP BY date_trunc('month', t.month)
      ORDER BY date_trunc('month', t.month) ASC
    `, [userId]),
    pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_income_this_month
      FROM income_records
      WHERE user_id = $1 AND date_trunc('month', received_date) = date_trunc('month', (NOW() AT TIME ZONE '${TZ}')::date)
    `, [userId]),
  ])

  const ts = taskStats.rows[0]
  const totalTasks = parseInt(ts.total_tasks) || 0
  const completedTasks = parseInt(ts.completed_tasks) || 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const monthlyIncome = parseInt(incomeStats.rows[0].monthly_income) || 0
  const paidThisMonth = parseInt(ts.paid_this_month) || 0
  const allTasksThisMonth = parseInt(ts.all_tasks_this_month) || 0

  const paidTotal = parseInt(ts.paid_total) || 0
  const incomeThisMonth = parseInt(allIncomeStats.rows[0].total_income_this_month) || 0

  res.json({
    totalTasks,
    completedTasks,
    activeTasks: parseInt(ts.active_tasks) || 0,
    monthlyIncome: monthlyIncome + paidThisMonth,
    monthlyTotalIncome: allTasksThisMonth + monthlyIncome,
    unpaidTotal: parseInt(ts.unpaid_total) || 0,
    totalIncome: paidThisMonth + incomeThisMonth,
    completionRate,
    monthlyTrend: monthlyTrend.rows.map(r => ({
      name: r.name,
      income: parseInt(r.income),
    })),
  })
})

// GET monthly performance (last 6 months, filtered by user)
router.get('/performance', async (req, res) => {
  const TZ = 'Asia/Ho_Chi_Minh'
  const { rows } = await pool.query(`
    WITH task_months AS (
      SELECT
        date_trunc('month', (created_at AT TIME ZONE '${TZ}')) AS month,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COALESCE(SUM(price), 0) AS task_revenue
      FROM tasks
      WHERE user_id = $1 AND created_at >= (NOW() AT TIME ZONE '${TZ}') - INTERVAL '6 months'
      GROUP BY date_trunc('month', (created_at AT TIME ZONE '${TZ}'))
    ),
    income_months AS (
      SELECT
        date_trunc('month', received_date) AS month,
        COALESCE(SUM(amount), 0) AS income_revenue
      FROM income_records
      WHERE user_id = $1 AND received_date IS NOT NULL
        AND received_date >= ((NOW() AT TIME ZONE '${TZ}')::date - INTERVAL '6 months')
      GROUP BY date_trunc('month', received_date)
    )
    SELECT
      to_char(COALESCE(t.month, i.month), 'TMTháng MM') AS month,
      COALESCE(t.total, 0) AS total,
      COALESCE(t.completed, 0) AS completed,
      COALESCE(t.task_revenue, 0) + COALESCE(i.income_revenue, 0) AS revenue
    FROM task_months t
    FULL OUTER JOIN income_months i ON t.month = i.month
    ORDER BY COALESCE(t.month, i.month) DESC
    LIMIT 6
  `, [req.userId])

  res.json(rows.map(r => {
    const total = parseInt(r.total) || 0
    const completed = parseInt(r.completed) || 0
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      month: r.month,
      revenue: parseInt(r.revenue),
      totalTasks: total,
      completionRate: rate,
      status: rate >= 50 ? 'on-target' : 'below-average',
    }
  }))
})

export default router
