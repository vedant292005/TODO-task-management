import type { NextFunction, Request, Response } from 'express'
import { verifyFirebaseIdToken } from '../auth/verifyToken.js'

export type AuthedRequest = Request & { userId: string }

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const token = header.slice(7)
    const user = await verifyFirebaseIdToken(token)
    ;(req as AuthedRequest).userId = user.uid
    next()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Invalid or expired session'
    res.status(401).json({ error: message })
  }
}
