import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}

/**
 * Middleware: extract user_id from Supabase JWT Bearer token.
 * Attaches req.userId for downstream route handlers.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization token' })
        return
    }

    const token = authHeader.slice(7)

    try {
        const secret = process.env.SUPABASE_JWT_SECRET
        let payload: { sub?: string }

        if (secret) {
            payload = jwt.verify(token, secret) as { sub?: string }
        } else {
            payload = jwt.decode(token) as { sub?: string }
        }

        if (!payload?.sub) {
            res.status(401).json({ error: 'Invalid token: no user ID' })
            return
        }

        req.userId = payload.sub
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
        return
    }
}
