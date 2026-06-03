export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'done'

export type Task = {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type ChatAction =
  | {
      type: 'create_task'
      payload: {
        title: string
        description?: string
        dueDate?: string
        priority: TaskPriority
      }
    }
  | {
      type: 'update_task'
      payload: {
        id: string
        title?: string
        description?: string
        dueDate?: string
        priority?: TaskPriority
        status?: TaskStatus
      }
    }
  | { type: 'delete_task'; payload: { id: string } }
  | { type: 'toggle_task_done'; payload: { id: string } }
