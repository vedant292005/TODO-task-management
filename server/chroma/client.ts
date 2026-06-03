import { config } from '../config.js'

type Collection = import('chromadb').Collection
type ChromaClient = import('chromadb').ChromaClient

let client: ChromaClient | null = null
let collectionPromise: Promise<Collection> | null = null

async function loadChroma() {
  return import('chromadb')
}

async function getClient(): Promise<ChromaClient> {
  if (!client) {
    const { ChromaClient, CloudClient } = await loadChroma()
    if (config.chromaUseCloud) {
      client = new CloudClient({
        apiKey: config.chromaApiKey,
        tenant: config.chromaTenant,
        database: config.chromaDatabase,
      })
    } else {
      client = new ChromaClient({ host: 'localhost', port: 8000 })
    }
  }
  return client
}

export async function getTaskCollection(): Promise<Collection> {
  if (!collectionPromise) {
    collectionPromise = (async () => {
      const chroma = await getClient()
      try {
        return await chroma.getCollection({
          name: config.chromaCollection,
          embeddingFunction: null,
        })
      } catch {
        return await chroma.createCollection({
          name: config.chromaCollection,
          embeddingFunction: null,
        })
      }
    })()
  }
  return collectionPromise
}
