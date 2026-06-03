import type { Task } from '../types/task.js'
import { config } from '../config.js'
import { embedTexts } from '../gemini/embeddings.js'
import { getTaskCollection } from './client.js'

const RAG_TIMEOUT_MS = 2500

export async function searchTaskIds(
  userId: string,
  query: string,
  limit = config.ragTopK,
): Promise<string[]> {
  const collection = await getTaskCollection()
  const [queryEmbedding] = await embedTexts([query])

  const result = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
    where: { userId },
    include: ['metadatas'],
  })

  const metadatas = result.metadatas?.[0] ?? []
  const ids: string[] = []

  for (const meta of metadatas) {
    if (meta && typeof meta.taskId === 'string') {
      ids.push(meta.taskId)
    }
  }

  return ids
}

/** Semantic search with timeout — never block chat for long. */
export async function searchTaskIdsFast(
  userId: string,
  query: string,
  tasks: Task[],
): Promise<string[]> {
  const keyword = findRelevantTaskIds(query, tasks)

  try {
    const semantic = await Promise.race([
      searchTaskIds(userId, query),
      new Promise<string[]>((_, reject) => {
        setTimeout(() => reject(new Error('Chroma RAG timeout')), RAG_TIMEOUT_MS)
      }),
    ])
    return semantic.length > 0 ? semantic : keyword
  } catch {
    return keyword
  }
}

/** Keyword fallback when Chroma is unavailable. */
export function findRelevantTaskIds(
  message: string,
  tasks: Task[],
  limit = config.ragTopK,
): string[] {
  const terms = message
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2)

  if (terms.length === 0) return []

  const scored = tasks.map((task) => {
    const text = `${task.title} ${task.description ?? ''} ${task.priority} ${task.status}`.toLowerCase()
    const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0)
    return { id: task.id, score }
  })

  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.id)
}
