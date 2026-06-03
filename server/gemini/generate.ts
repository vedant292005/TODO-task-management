import { FunctionCallingConfigMode, GoogleGenAI, type GenerateContentConfig } from '@google/genai'
import { assertGeminiKey, config } from '../config.js'

let client: GoogleGenAI | null = null

function getClient() {
  assertGeminiKey()
  if (!client) client = new GoogleGenAI({ apiKey: config.geminiApiKey })
  return client
}

const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
]

function isRetryableError(msg: string): boolean {
  return (
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('high demand')
  )
}

export async function generateWithFallback(
  contents: Parameters<GoogleGenAI['models']['generateContent']>[0]['contents'],
  genConfig: GenerateContentConfig,
) {
  const ai = getClient()
  const models = [...new Set([config.geminiModel, ...FALLBACK_MODELS])]
  let lastError = ''

  for (const model of models) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: genConfig,
      })
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      if (isRetryableError(lastError)) continue
      if (lastError.includes('API_KEY') || lastError.includes('401')) {
        throw new Error(
          'Invalid GEMINI_API_KEY. Create one at https://aistudio.google.com/apikey',
        )
      }
      throw new Error(`Gemini request failed: ${lastError}`)
    }
  }

  throw new Error(
    `All Gemini models are busy or over quota. Try again in a minute. (${lastError.slice(0, 120)})`,
  )
}
