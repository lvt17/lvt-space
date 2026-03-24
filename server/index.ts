import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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
app.get('/api/me', requireAuth, (req, res) => {
    res.json({ userId: req.userId, authMethod: req.authMethod })
})

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`)
})
