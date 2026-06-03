import type { Task } from '../types/task.js'

export function taskToDocument(task: Task): string {
  const parts = [
    `Title: ${task.title}`,
    task.description ? `Description: ${task.description}` : null,
    task.dueDate ? `Due date: ${task.dueDate}` : 'Due date: none',
    `Priority: ${task.priority}`,
    `Status: ${task.status}`,
  ].filter(Boolean)
  return parts.join('\n')
}

export function taskToMetadata(
  userId: string,
  task: Task,
): Record<string, string | number | boolean> {
  return {
    userId,
    taskId: task.id,
    title: task.title,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ?? '',
    description: task.description ?? '',
  }
}

/** Chroma document id scoped per user to avoid collisions. */
export function chromaDocId(userId: string, taskId: string): string {
  return `${userId}__${taskId}`
}
