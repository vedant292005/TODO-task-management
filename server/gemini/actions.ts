import type { ChatAction, TaskPriority } from '../types/task.js'

type RawArgs = Record<string, unknown>

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function asPriority(v: unknown): TaskPriority {
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return 'medium'
}

export function functionCallToAction(
  name: string,
  args: RawArgs,
): ChatAction | null {
  switch (name) {
    case 'create_task': {
      const title = asString(args.title)
      if (!title) return null
      return {
        type: 'create_task',
        payload: {
          title,
          description: asString(args.description),
          dueDate: asString(args.dueDate),
          priority: asPriority(args.priority),
        },
      }
    }
    case 'update_task': {
      const id = asString(args.id)
      if (!id) return null
      const status =
        args.status === 'todo' || args.status === 'done' ? args.status : undefined
      return {
        type: 'update_task',
        payload: {
          id,
          title: asString(args.title),
          description: asString(args.description),
          dueDate: asString(args.dueDate),
          priority:
            args.priority === 'low' ||
            args.priority === 'medium' ||
            args.priority === 'high'
              ? args.priority
              : undefined,
          status,
        },
      }
    }
    case 'delete_task': {
      const id = asString(args.id)
      if (!id) return null
      return { type: 'delete_task', payload: { id } }
    }
    case 'toggle_task_done': {
      const id = asString(args.id)
      if (!id) return null
      return { type: 'toggle_task_done', payload: { id } }
    }
    default:
      return null
  }
}
