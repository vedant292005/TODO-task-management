import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '../auth/authStore'
import {
  buildTask,
  nowIso,
  persistRemove,
  persistTask,
  subscribeUserTasks,
  taskForFirestore,
  type TaskStorageMode,
} from '../../lib/taskRepository'
import type { Task, TaskPriority } from '../../types/task'

type CreateInput = {
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
}

type UpdateInput = Partial<Omit<Task, 'id' | 'createdAt'>> & { id: string }

type Store = {
  tasks: Task[]
  loading: boolean
  storageMode: TaskStorageMode
  notice: string | null
  error: string | null
  clearError: () => void
  createTask: (input: CreateInput) => Promise<void>
  updateTask: (input: UpdateInput) => Promise<void>
  removeTask: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
}

const Ctx = createContext<Store | null>(null)

const LOCAL_NOTICE =
  'Firestore rules not published — tasks are saved on this browser only. See setup steps below.'

function applyPersistMode(
  savedMode: TaskStorageMode,
  storageMode: TaskStorageMode,
  setStorageMode: (m: TaskStorageMode) => void,
  setNotice: (n: string | null) => void,
) {
  if (savedMode === 'local' && storageMode === 'firestore') {
    setStorageMode('local')
    setNotice(LOCAL_NOTICE)
  }
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [storageMode, setStorageMode] = useState<TaskStorageMode>('firestore')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      setNotice(null)
      setError(null)
      setStorageMode('firestore')
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeUserTasks(
      user.uid,
      (next) => {
        setTasks(next)
        setLoading(false)
      },
      setStorageMode,
      setNotice,
    )

    return unsub
  }, [user])

  const createTask = useCallback(
    async (input: CreateInput) => {
      if (!user) throw new Error('You must be signed in to add tasks')
      const task = buildTask(input)
      const next = sortTasks([task, ...tasks])
      setTasks(next)
      try {
        const savedMode = await persistTask(user.uid, storageMode, task, next)
        applyPersistMode(savedMode, storageMode, setStorageMode, setNotice)
        setError(null)
      } catch (err) {
        setTasks(tasks)
        const msg = err instanceof Error ? err.message : 'Failed to save task'
        setError(msg)
        throw err
      }
    },
    [user, tasks, storageMode],
  )

  const updateTask = useCallback(
    async (input: UpdateInput) => {
      if (!user) throw new Error('You must be signed in')
      const existing = tasks.find((t) => t.id === input.id)
      if (!existing) return

      const updated = taskForFirestore({
        ...existing,
        ...input,
        title:
          input.title !== undefined ? input.title.trim() : existing.title,
        description:
          input.description !== undefined
            ? input.description?.trim() || undefined
            : existing.description,
        updatedAt: nowIso(),
      })

      const prev = tasks
      const next = sortTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
      setTasks(next)
      try {
        const savedMode = await persistTask(user.uid, storageMode, updated, next)
        applyPersistMode(savedMode, storageMode, setStorageMode, setNotice)
        setError(null)
      } catch (err) {
        setTasks(prev)
        const msg = err instanceof Error ? err.message : 'Failed to update task'
        setError(msg)
        throw err
      }
    },
    [user, tasks, storageMode],
  )

  const removeTask = useCallback(
    async (id: string) => {
      if (!user) return
      const prev = tasks
      const next = tasks.filter((t) => t.id !== id)
      setTasks(next)
      try {
        const savedMode = await persistRemove(user.uid, storageMode, next, id)
        applyPersistMode(savedMode, storageMode, setStorageMode, setNotice)
        setError(null)
      } catch (err) {
        setTasks(prev)
        const msg = err instanceof Error ? err.message : 'Failed to delete task'
        setError(msg)
        throw err
      }
    },
    [user, tasks, storageMode],
  )

  const toggleDone = useCallback(
    async (id: string) => {
      if (!user) return
      const existing = tasks.find((t) => t.id === id)
      if (!existing) return

      const updated = taskForFirestore({
        ...existing,
        status: existing.status === 'done' ? 'todo' : 'done',
        updatedAt: nowIso(),
      })

      const prev = tasks
      const next = sortTasks(tasks.map((t) => (t.id === id ? updated : t)))
      setTasks(next)
      try {
        const savedMode = await persistTask(user.uid, storageMode, updated, next)
        applyPersistMode(savedMode, storageMode, setStorageMode, setNotice)
        setError(null)
      } catch (err) {
        setTasks(prev)
        const msg = err instanceof Error ? err.message : 'Failed to update task'
        setError(msg)
        throw err
      }
    },
    [user, tasks, storageMode],
  )

  const clearError = useCallback(() => setError(null), [])

  const store = useMemo<Store>(
    () => ({
      tasks,
      loading,
      storageMode,
      notice,
      error,
      clearError,
      createTask,
      updateTask,
      removeTask,
      toggleDone,
    }),
    [
      tasks,
      loading,
      storageMode,
      notice,
      error,
      clearError,
      createTask,
      updateTask,
      removeTask,
      toggleDone,
    ],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useTasks() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTasks must be used within TaskProvider')
  return v
}
