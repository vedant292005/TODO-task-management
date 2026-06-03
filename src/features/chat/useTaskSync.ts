import { useEffect } from 'react'
import { useAuth } from '../auth/authStore'
import { syncTasks } from './api'
import type { Task } from '../../../shared/task'

/** Syncs the user's tasks to Chroma for semantic search (debounced). */
export function useTaskSync(tasks: Task[]) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const timer = window.setTimeout(() => {
      syncTasks(tasks).catch(() => {
        // Chroma sync is best-effort; chat still works with keyword fallback.
      })
    }, 800)

    return () => window.clearTimeout(timer)
  }, [tasks, user])
}
