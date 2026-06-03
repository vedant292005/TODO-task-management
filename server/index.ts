import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { requireAuth, type AuthedRequest } from './middleware/requireAuth.js'
import type { ChatMessage, Task } from './types/task.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(config.geminiApiKey),
    geminiModel: config.geminiModel,
    chromaCloud: config.chromaUseCloud,
  })
})

app.post('/api/tasks/sync', requireAuth, async (req, res) => {
  try {
    const { syncTasksToChroma } = await import('./chroma/syncTasks.js')
    const userId = (req as AuthedRequest).userId
    const tasks = (req.body?.tasks ?? []) as Task[]
    const result = await syncTasksToChroma(userId, tasks)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    console.warn('[api/tasks/sync]', message)
    res.json({ synced: 0, skipped: true, reason: message })
  }
})

app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId
    const message = String(req.body?.message ?? '')
    const history = (req.body?.history ?? []) as ChatMessage[]
    const tasks = (req.body?.tasks ?? []) as Task[]

    if (!message.trim()) {
      res.status(400).json({ error: 'message is required' })
      return
    }

    if (message.length > 4000) {
      res.status(400).json({ error: 'message is too long' })
      return
    }

    const { handleChat } = await import('./gemini/chat.js')
    const result = await handleChat({ userId, message, history, tasks })
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed'
    console.error('[api/chat]', message)
    res.status(500).json({ error: message })
  }
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' })
})

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`)
})
