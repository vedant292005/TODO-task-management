import type { Task } from '../types/task.js'
import { embedTexts } from '../gemini/embeddings.js'
import { getTaskCollection } from './client.js'
import { chromaDocId, taskToDocument, taskToMetadata } from './taskDocument.js'

export async function syncTasksToChroma(userId: string, tasks: Task[]) {
  if (tasks.length === 0) {
    return { synced: 0, skipped: true, reason: 'empty' }
  }

  try {
    const collection = await getTaskCollection()
    const ids = tasks.map((t) => chromaDocId(userId, t.id))
    const documents = tasks.map(taskToDocument)
    const metadatas = tasks.map((t) => taskToMetadata(userId, t))
    const embeddings = await embedTexts(documents)

    await collection.upsert({
      ids,
      embeddings,
      documents,
      metadatas,
    })

    return { synced: tasks.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chroma sync failed'
    console.warn('[chroma/sync]', message)
    return { synced: 0, skipped: true, reason: message }
  }
}
