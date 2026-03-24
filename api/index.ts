import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import taskRoutes from '../server/routes/tasks.js'
import dailyTaskRoutes from '../server/routes/dailyTasks.js'
import incomeRoutes from '../server/routes/income.js'
import dashboardRoutes from '../server/routes/dashboard.js'
import checklistRoutes from '../server/routes/checklists.js'
import aiRoutes from '../server/routes/ai.js'
import tokenRoutes from '../server/routes/tokens.js'
import cliAuthRoutes from '../server/routes/cliAuth.js'
import { requireAuth, requireSupabaseAuth } from '../server/auth.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// CLI browser-based auth flow (no auth — public endpoints)
app.use('/api/cli-auth', cliAuthRoutes)

// Token management (Supabase JWT only)
app.use('/api/tokens', requireSupabaseAuth, tokenRoutes)

// API routes (both Supabase JWT and PAT accepted)
app.use('/api/tasks', requireAuth, taskRoutes)
app.use('/api/daily-tasks', requireAuth, dailyTaskRoutes)
app.use('/api/income', requireAuth, incomeRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)
app.use('/api/checklists', requireAuth, checklistRoutes)
app.use('/api/ai', requireAuth, aiRoutes)

// User info endpoint (for CLI whoami)
app.get('/api/me', requireAuth, (req, res) => {
    res.json({ userId: req.userId, authMethod: req.authMethod })
})

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

export default app
