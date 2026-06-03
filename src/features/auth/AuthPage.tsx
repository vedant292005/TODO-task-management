import { useState } from 'react'
import { useAuth } from './authStore'

function authErrorMessage(code: string): string {
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid email or password.'
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists.'
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.'
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.'
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed. Please try again.'
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked. Allow popups for this site and try again.'
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'This email is already registered with a different sign-in method.'
  }
  return 'Authentication failed. Please try again.'
}

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
      setError(authErrorMessage(code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="brandRow authBrand">
          <div className="brandMark" aria-hidden />
          <div>
            <div className="brandName">To‑Do Manager</div>
            <div className="brandTag">Sign in to sync tasks & AI assistant</div>
          </div>
        </div>

        <h1 className="authTitle">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
        <p className="authHint">
          Tasks are stored in Firebase. The AI assistant uses Gemini + Chroma RAG.
        </p>

        <button
          type="button"
          className="googleBtn"
          disabled={busy}
          onClick={async () => {
            setError(null)
            setBusy(true)
            try {
              await signInWithGoogle()
            } catch (err) {
              const code =
                err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
              setError(authErrorMessage(code))
            } finally {
              setBusy(false)
            }
          }}
        >
          <span className="googleBtnIcon" aria-hidden>
            G
          </span>
          Continue with Google
        </button>

        <div className="authDivider">
          <span>or</span>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label className="field">
            <div className="label">Email</div>
            <input
              className="textInput"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <div className="label">Password</div>
            <input
              className="textInput"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && <div className="chatError">{error}</div>}

          <button type="submit" className="primaryBtn" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          className="navBtn authToggle"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError(null)
          }}
        >
          {mode === 'signin'
            ? 'Need an account? Create one'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
