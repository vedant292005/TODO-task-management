import { authFetch } from '../../lib/apiClient'
import type { ChatAction, ChatMessage, Task } from '../../../shared/task'

export type ChatResponse = {
  reply: string
  actions: ChatAction[]
  contextTaskIds: string[]
}

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

async function parseApiError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (data.error) return data.error
  if (res.status === 401) {
    return 'Session expired. Please sign out and sign in again, then retry.'
  }
  if (res.status === 404) {
    return 'API not found. Run: npm run dev (needs both web + API on port 3001).'
  }
  if (res.status === 500) {
    return data.error ?? 'Server error — check the API terminal for details.'
  }
  return `${fallback} (${res.status})`
}

export async function sendChatMessage(body: {
  message: string
  history: ChatMessage[]
  tasks: Task[]
}): Promise<ChatResponse> {
  let res: Response
  try {
    res = await authFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Cannot reach the API server. In the project folder run: npm run dev',
      )
    }
    throw err
  }

  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Chat request failed'))
  }
  return res.json() as Promise<ChatResponse>
}

export async function syncTasks(tasks: Task[]): Promise<void> {
  try {
    const res = await authFetch('/api/tasks/sync', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    })
    if (!res.ok) return
  } catch {
    // Chroma sync is best-effort
  }
}

export async function checkApiHealth(): Promise<{
  ok: boolean
  geminiConfigured?: boolean
}> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    const data = (await res.json()) as { ok?: boolean; geminiConfigured?: boolean }
    return { ok: res.ok && data.ok === true, geminiConfigured: data.geminiConfigured }
  } catch {
    return { ok: false }
  }
}
