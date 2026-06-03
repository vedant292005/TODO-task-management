import React from 'react'
import { FirestoreSetupBanner } from '../../components/FirestoreSetupBanner'
import type { NavKey } from '../../types/nav'
import { compareYmd, todayYmd } from '../../lib/dates'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { TaskModal } from './TaskModal'
import { TaskRow } from './TaskRow'
import { useTasks } from './taskStore'

type Props = {
  nav: NavKey
  query: string
  showAdd: boolean
  onCloseAdd: () => void
}

type FilterState = {
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  hideDone: boolean
}

const defaultFilters: FilterState = {
  status: 'all',
  priority: 'all',
  hideDone: false,
}

function matchesQuery(t: Task, q: string) {
  if (!q) return true
  const qq = q.toLowerCase()
  return (
    t.title.toLowerCase().includes(qq) ||
    (t.description ? t.description.toLowerCase().includes(qq) : false)
  )
}

export function TaskList({ nav, query, showAdd, onCloseAdd }: Props) {
  const { tasks, loading, error, notice, clearError } = useTasks()
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters)
  const [editId, setEditId] = React.useState<string | null>(null)

  const today = todayYmd()

  const visible = tasks
    .filter((t) => matchesQuery(t, query.trim()))
    .filter((t) => {
      if (nav === 'today') return t.dueDate === today
      if (nav === 'upcoming') return t.dueDate ? t.dueDate > today : false
      return true
    })
    .filter((t) => (filters.hideDone ? t.status !== 'done' : true))
    .filter((t) => (filters.status === 'all' ? true : t.status === filters.status))
    .filter((t) =>
      filters.priority === 'all' ? true : t.priority === filters.priority,
    )

  const sorted =
    nav === 'upcoming'
      ? [...visible].sort((a, b) => compareYmd(a.dueDate, b.dueDate))
      : visible

  return (
    <div className="taskArea">
      <FirestoreSetupBanner notice={notice} error={error} onDismiss={clearError} />

      <div className="taskToolbar">
        <button
          className="primaryBtn inlineBtn"
          type="button"
          onClick={() => setEditId('__new__')}
        >
          + Add task
        </button>

        {nav === 'filters' ? (
          <div className="filterRow">
            <label className="chip">
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value as any }))
                }
              >
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="chip">
              <span>Priority</span>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priority: e.target.value as any }))
                }
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="chip">
              <input
                type="checkbox"
                checked={filters.hideDone}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, hideDone: e.target.checked }))
                }
              />
              Hide done
            </label>
          </div>
        ) : (
          <div className="toolbarHint">
            {nav === 'inbox'
              ? 'New tasks land here.'
              : nav === 'today'
                ? 'Due today.'
                : nav === 'upcoming'
                  ? 'Future tasks, sorted by date.'
                  : 'Filter and focus.'}
          </div>
        )}
      </div>

      {loading ? (
        <div className="emptyState">
          <div className="emptyTitle">Loading tasks…</div>
          <div className="emptyBody">Syncing from Firebase.</div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="emptyState">
          <div className="emptyTitle">
            {tasks.length > 0 ? 'No tasks in this view' : 'No tasks here yet'}
          </div>
          <div className="emptyBody">
            {tasks.length > 0 ? (
              <>
                You have {tasks.length} task{tasks.length === 1 ? '' : 's'} in other views.
                Open <strong>Inbox</strong> to see tasks without a due date, or set a due date
                for Today / Upcoming.
              </>
            ) : (
              <>
                Create one with <strong>+ Add task</strong> (tasks save to Firebase).
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="taskList">
          {sorted.map((t) => (
            <TaskRow key={t.id} task={t} onEdit={() => setEditId(t.id)} />
          ))}
        </div>
      )}

      <TaskModal
        open={showAdd || editId === '__new__'}
        mode="create"
        onClose={() => {
          onCloseAdd()
          setEditId(null)
        }}
      />
      <TaskModal
        open={editId !== null && editId !== '__new__'}
        mode="edit"
        taskId={editId ?? undefined}
        onClose={() => setEditId(null)}
      />
    </div>
  )
}

