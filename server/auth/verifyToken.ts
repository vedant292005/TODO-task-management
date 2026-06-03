import { config } from '../config.js'

export type VerifiedUser = {
  uid: string
  email?: string
}

/** Verifies a Firebase ID token via the Identity Toolkit API (no service account file). */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedUser> {
  if (!config.firebaseApiKey) {
    throw new Error('FIREBASE_API_KEY is not configured on the server')
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  )

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
    }
    const detail = body.error?.message ?? 'Invalid or expired auth token'
    throw new Error(detail)
  }

  const data = (await res.json()) as {
    users?: Array<{ localId: string; email?: string }>
  }

  const user = data.users?.[0]
  if (!user?.localId) {
    throw new Error('Invalid auth token')
  }

  return { uid: user.localId, email: user.email }
}
