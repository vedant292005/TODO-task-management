import { useMemo, useState } from 'react'
import { SidebarSection } from './components/SidebarSection'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './features/auth/authStore'
import { ChatWidget } from './features/chat/ChatWidget'
import { TaskList } from './features/tasks/TaskList'
import { TaskProvider } from './features/tasks/taskStore'
import type { NavKey } from './types/nav'

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'filters', label: 'Filters' },
]

function pageTitle(nav: NavKey) {
  return NAV_ITEMS.find((n) => n.key === nav)?.label ?? 'Tasks'
}

function pageSubtitle(nav: NavKey) {
  if (nav === 'inbox') return 'Capture and organize new work.'
  if (nav === 'today') return 'Focus on what is due today.'
  if (nav === 'upcoming') return 'Plan ahead by due date.'
  return 'Narrow down with status and priority.'
}

function TodoApp() {
  const { user, logOut } = useAuth()
  const [nav, setNav] = useState<NavKey>('inbox')
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const title = useMemo(() => pageTitle(nav), [nav])
  const subtitle = useMemo(() => pageSubtitle(nav), [nav])

  return (
    <TaskProvider>
      <div className="appShell">
        <aside className="sidebar">
          <div className="sidebarPanel">
            <div className="brandRow">
              <div className="brandMark" aria-hidden />
              <div>
                <div className="brandName">To‑Do Manager</div>
                <div className="brandTag">Gemini + Firebase</div>
              </div>
            </div>

            <SidebarSection title="Account">
              <div className="userEmail">{user?.email}</div>
              <button type="button" className="navBtn" onClick={() => void logOut()}>
                Sign out
              </button>
            </SidebarSection>

            <SidebarSection title="Views">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={nav === item.key ? 'navBtn navBtnActive' : 'navBtn'}
                  onClick={() => setNav(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </SidebarSection>

            <SidebarSection title="Search">
              <input
                className="textInput"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
                aria-label="Search tasks"
              />
            </SidebarSection>

            <SidebarSection title="Quick add">
              <button
                type="button"
                className="primaryBtn"
                onClick={() => setShowAdd(true)}
              >
                + New task
              </button>
            </SidebarSection>
          </div>
        </aside>

        <main className="main">
          <header className="mainHeader">
            <div>
              <h1 className="pageTitle">{title}</h1>
              <p className="pageSubtle">{subtitle}</p>
            </div>
          </header>

          <div className="content">
            <TaskList
              nav={nav}
              query={query}
              showAdd={showAdd}
              onCloseAdd={() => setShowAdd(false)}
            />
          </div>
        </main>
      </div>

      <ChatWidget />
    </TaskProvider>
  )
}

export function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="authPage">
        <div className="emptyState authLoading">
          <div className="emptyTitle">Loading…</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <TodoApp />
}
