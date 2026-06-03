import { loadJson, saveJson } from './storage'
import type { Task } from '../types/task'

function storageKey(userId: string) {
  return `todoTaskManager:v1:${userId}`
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function loadLocalTasks(userId: string): Task[] {
  return sortTasks(loadJson<{ tasks: Task[] }>(storageKey(userId), { tasks: [] }).tasks)
}

export function saveLocalTasks(userId: string, tasks: Task[]): void {
  saveJson(storageKey(userId), { tasks: sortTasks(tasks) })
}
