import type { TaskPriority } from '../../../shared/task'

export type Store = {
  tasks: { id: string }[]
  createTask: (input: {
    title: string
    description?: string
    dueDate?: string
    priority: TaskPriority
  }) => Promise<void>
  updateTask: (input: {
    id: string
    title?: string
    description?: string
    dueDate?: string
    priority?: TaskPriority
    status?: 'todo' | 'done'
  }) => Promise<void>
  removeTask: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
}
