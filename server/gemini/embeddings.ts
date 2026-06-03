import { GoogleGenAI } from '@google/genai'
import { assertGeminiKey, config } from '../config.js'

let client: GoogleGenAI | null = null

function getClient() {
  assertGeminiKey()
  if (!client) client = new GoogleGenAI({ apiKey: config.geminiApiKey })
  return client
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const ai = getClient()
  const result = await ai.models.embedContent({
    model: config.embeddingModel,
    contents: texts,
  })
  const vectors = result.embeddings?.map((e) => e.values ?? []) ?? []
  if (vectors.length !== texts.length) {
    throw new Error('Embedding count mismatch from Gemini')
  }
  return vectors
}
