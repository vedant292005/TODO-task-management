import { auth } from './firebase'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('You must be signed in')
  }

  const token = await user.getIdToken(true)
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  return fetch(url, { ...init, headers })
}
