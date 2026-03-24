import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool from './db.js'
import taskRoutes from './routes/tasks.js'
import dailyTaskRoutes from './routes/dailyTasks.js'
import incomeRoutes from './routes/income.js'
import dashboardRoutes from './routes/dashboard.js'
import checklistRoutes from './routes/checklists.js'
import aiRoutes from './routes/ai.js'
import tokenRoutes from './routes/tokens.js'
import cliAuthRoutes from './routes/cliAuth.js'
import { requireAuth, requireSupabaseAuth } from './auth.js'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

app.use(cors({
    origin: [
        'https://lvtspace.me',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    credentials: true,
}))
app.use(express.json({ limit: '50mb' }))

// CLI browser-based auth flow (no auth — public endpoints)
app.use('/api/cli-auth', cliAuthRoutes)

// Token management (Supabase JWT only — PAT cannot create PATs)
app.use('/api/tokens', requireSupabaseAuth, tokenRoutes)

// API routes (both Supabase JWT and PAT accepted)
app.use('/api/tasks', requireAuth, taskRoutes)
app.use('/api/daily-tasks', requireAuth, dailyTaskRoutes)
app.use('/api/income', requireAuth, incomeRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)
app.use('/api/checklists', requireAuth, checklistRoutes)
app.use('/api/ai', requireAuth, aiRoutes)

// User info endpoint (for CLI whoami)
app.get('/api/me', requireAuth, async (req, res) => {
    try {
        // Get user profile from Supabase
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
        )
        const { data: userData } = await supabase.auth.admin.getUserById(req.userId!)

        // Get stats
        const [taskStats, incomeStats, tokenStats] = await Promise.all([
            pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE status = 'completed') as completed FROM tasks WHERE user_id = $1`, [req.userId]),
            pool.query(`SELECT COALESCE(SUM(amount), 0) as total_income, count(*) as records FROM income WHERE user_id = $1`, [req.userId]),
            pool.query(`SELECT count(*) as total FROM personal_tokens WHERE user_id = $1`, [req.userId]),
        ])

        const user = userData?.user
        res.json({
            userId: req.userId,
            authMethod: req.authMethod,
            email: user?.email || null,
            displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || null,
            provider: user?.app_metadata?.provider || 'email',
            createdAt: user?.created_at || null,
            stats: {
                totalTasks: parseInt(taskStats.rows[0]?.total || '0'),
                completedTasks: parseInt(taskStats.rows[0]?.completed || '0'),
                totalIncome: parseFloat(incomeStats.rows[0]?.total_income || '0'),
                incomeRecords: parseInt(incomeStats.rows[0]?.records || '0'),
                activeTokens: parseInt(tokenStats.rows[0]?.total || '0'),
            },
        })
    } catch {
        res.json({ userId: req.userId, authMethod: req.authMethod })
    }
})

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`)
})
