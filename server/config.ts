function envBool(key: string, defaultValue = false): boolean {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
  ragTopK: Number(process.env.RAG_TOP_K ?? 6),
  firebaseApiKey: process.env.FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY ?? '',
  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? '',
  chromaUseCloud: envBool('CHROMA_USE_CLOUD', true),
  chromaApiKey: process.env.CHROMA_API_KEY ?? '',
  chromaTenant: process.env.CHROMA_TENANT ?? '',
  chromaDatabase: process.env.CHROMA_DATABASE ?? '',
  chromaCollection: process.env.CHROMA_COLLECTION ?? 'todo_tasks',
}

export function assertGeminiKey() {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
}
