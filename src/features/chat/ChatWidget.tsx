import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../../shared/task'
import { useTasks } from '../tasks/taskStore'
import { applyChatActions } from './applyActions'
import { checkApiHealth, sendChatMessage } from './api'
import { QUICK_PROMPTS } from './constants'

export function ChatWidget() {
  const { tasks, createTask, updateTask, removeTask, toggleDone } = useTasks()
  const store = { tasks, createTask, updateTask, removeTask, toggleDone }

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiReady, setApiReady] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your task assistant. Ask about your tasks, or say “Create a high priority task for tomorrow called Submit Report”.",
    },
  ])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open, loading])

  async function refreshApiStatus() {
    const h = await checkApiHealth()
    setApiReady(h.ok && Boolean(h.geminiConfigured))
    return h
  }

  useEffect(() => {
    if (!open) return
    refreshApiStatus().then((h) => {
      if (!h.ok) {
        setError('Starting API… If this persists, run: npm run dev')
      } else {
        setError(null)
      }
    })
    const timer = window.setInterval(() => {
      refreshApiStatus()
    }, 8000)
    return () => window.clearInterval(timer)
  }, [open])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const health = await refreshApiStatus()
      if (!health.ok) {
        throw new Error(
          'API server is not running. Open a terminal, run: cd d:\\todo-task-manager then npm run dev',
        )
      }
      if (!health.geminiConfigured) {
        throw new Error('GEMINI_API_KEY is missing in the server .env file.')
      }

      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)

      const result = await sendChatMessage({
        message: trimmed,
        history,
        tasks,
      })

      if (result.actions.length > 0) {
        try {
          await applyChatActions(store, result.actions)
        } catch (actionErr) {
          const actionMsg =
            actionErr instanceof Error ? actionErr.message : 'Could not apply task changes'
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `${result.reply}\n\nNote: ${actionMsg}`,
            },
          ])
          return
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I couldn't complete that.\n\n${msg}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chatRoot">
      {open && (
        <section className="chatPanel" aria-label="AI task assistant">
          <header className="chatHeader">
            <div>
              <div className="chatTitle">Task Assistant</div>
              <div className="chatSubtitle">
                {apiReady ? 'Gemini · Ready' : 'Connecting to API…'}
              </div>
            </div>
            <button
              type="button"
              className="chatIconBtn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>

          <div className="chatMessages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={m.role === 'user' ? 'chatBubbleUser' : 'chatBubbleBot'}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chatTyping" aria-live="polite">
                <span className="chatDot" />
                <span className="chatDot" />
                <span className="chatDot" />
              </div>
            )}
          </div>

          <div className="chatQuickRow">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chatChip"
                disabled={loading}
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {error && <div className="chatError">{error}</div>}

          <form
            className="chatInputRow"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(input)
            }}
          >
            <input
              className="chatInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your tasks…"
              disabled={loading}
              aria-label="Chat message"
            />
            <button type="submit" className="chatSendBtn" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatFab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
