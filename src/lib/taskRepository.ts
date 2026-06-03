import {
  buildTask,
  importTasks,
  makeId,
  nowIso,
  removeTaskById,
  saveTask,
  subscribeTasks,
  taskForFirestore,
  userHasTasks,
} from './tasksFirestore'
import { loadLocalTasks, saveLocalTasks } from './localTaskStorage'
import { loadJson } from './storage'
import type { Task, TaskPriority } from '../types/task'

const LEGACY_STORAGE_KEY = 'todoTaskManager:v1'

export type TaskStorageMode = 'firestore' | 'local'

export const FIRESTORE_RULES_HELP = `Firebase Console → Build → Firestore Database → Rules → Publish:

match /users/{userId}/tasks/{taskId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}`

export function isPermissionError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: string }).code) === 'permission-denied'
  }
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')
}

export function subscribeUserTasks(
  userId: string,
  onTasks: (tasks: Task[]) => void,
  onMode: (mode: TaskStorageMode) => void,
  onNotice: (message: string | null) => void,
): () => void {
  let firestoreUnsub: (() => void) | null = null
  let active = true

  const useLocal = (notice: string | null) => {
    if (!active) return
    firestoreUnsub?.()
    firestoreUnsub = null
    onMode('local')
    onNotice(notice)
    const legacy = loadJson<{ tasks: Task[] }>(LEGACY_STORAGE_KEY, { tasks: [] })
    const local = loadLocalTasks(userId)
    const merged =
      local.length > 0 ? local : legacy.tasks.length > 0 ? legacy.tasks : []
    if (merged.length > 0 && local.length === 0) {
      saveLocalTasks(userId, merged)
    }
    onTasks(merged)
  }

  ;(async () => {
    try {
      const hasCloud = await userHasTasks(userId)
      if (!hasCloud) {
        const legacy = loadJson<{ tasks: Task[] }>(LEGACY_STORAGE_KEY, { tasks: [] })
        const local = loadLocalTasks(userId)
        const seed = local.length > 0 ? local : legacy.tasks
        if (seed.length > 0) {
          await importTasks(userId, seed)
        }
      }
    } catch (err) {
      if (isPermissionError(err)) {
        useLocal(
          'Firestore rules not published — tasks are saved on this browser only. See setup steps below.',
        )
        return
      }
    }

    if (!active) return

    firestoreUnsub = subscribeTasks(
      userId,
      (tasks) => {
        if (!active) return
        onMode('firestore')
        onNotice(null)
        saveLocalTasks(userId, tasks)
        onTasks(tasks)
      },
      () => {
        useLocal(
          'Firestore rules not published — tasks are saved on this browser only. See setup steps below.',
        )
      },
    )
  })()

  return () => {
    active = false
    firestoreUnsub?.()
  }
}

export async function persistTask(
  userId: string,
  mode: TaskStorageMode,
  task: Task,
  allTasks: Task[],
): Promise<TaskStorageMode> {
  if (mode === 'local') {
    saveLocalTasks(userId, allTasks)
    return 'local'
  }
  try {
    await saveTask(userId, task)
    return 'firestore'
  } catch (err) {
    if (isPermissionError(err)) {
      saveLocalTasks(userId, allTasks)
      return 'local'
    }
    throw err
  }
}

export async function persistRemove(
  userId: string,
  mode: TaskStorageMode,
  allTasks: Task[],
  id: string,
): Promise<TaskStorageMode> {
  if (mode === 'local') {
    saveLocalTasks(userId, allTasks)
    return 'local'
  }
  try {
    await removeTaskById(userId, id)
    return 'firestore'
  } catch (err) {
    if (isPermissionError(err)) {
      saveLocalTasks(userId, allTasks)
      return 'local'
    }
    throw err
  }
}

export { buildTask, makeId, nowIso, taskForFirestore }
export type { TaskPriority }
