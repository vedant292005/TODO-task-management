import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type FirestoreError,
} from 'firebase/firestore'
import type { Task, TaskPriority } from '../types/task'
import { db } from './firebase'

function tasksCollection(userId: string) {
  return collection(db, 'users', userId, 'tasks')
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** Firestore rejects documents containing `undefined` values. */
export function taskForFirestore(task: Task): Task {
  const clean: Task = {
    id: task.id,
    title: task.title,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
  if (task.description) clean.description = task.description
  if (task.dueDate) clean.dueDate = task.dueDate
  return clean
}

export function subscribeTasks(
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError: (message: string) => void,
): () => void {
  return onSnapshot(
    tasksCollection(userId),
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => d.data() as Task)
      onChange(sortTasks(tasks))
    },
    (error: FirestoreError) => {
      if (error.code === 'permission-denied') {
        onError(
          'Cannot access tasks. Publish Firestore rules from firestore.rules in Firebase Console.',
        )
      } else {
        onError(error.message || 'Failed to load tasks')
      }
    },
  )
}

export async function userHasTasks(userId: string): Promise<boolean> {
  const snap = await getDocs(tasksCollection(userId))
  return !snap.empty
}

export async function saveTask(userId: string, task: Task): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'tasks', task.id), taskForFirestore(task))
}

export async function removeTaskById(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'tasks', id))
}

export async function importTasks(userId: string, tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return
  const batch = writeBatch(db)
  for (const task of tasks) {
    batch.set(doc(db, 'users', userId, 'tasks', task.id), taskForFirestore(task))
  }
  await batch.commit()
}

export function makeId(): string {
  if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function buildTask(input: {
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
}): Task {
  const now = nowIso()
  return taskForFirestore({
    id: makeId(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    dueDate: input.dueDate || undefined,
    priority: input.priority,
    status: 'todo',
    createdAt: now,
    updatedAt: now,
  })
}
