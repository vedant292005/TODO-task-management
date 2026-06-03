import { useEffect, useMemo, useState } from 'react'
import type { TaskPriority } from '../../types/task'
import { useTasks } from './taskStore'

type Mode = 'create' | 'edit'

type Props = {
  open: boolean
  mode: Mode
  taskId?: string
  onClose: () => void
}

export function TaskModal({ open, mode, taskId, onClose }: Props) {
  const { tasks, createTask, updateTask } = useTasks()

  const task = useMemo(
    () => (mode === 'edit' && taskId ? tasks.find((t) => t.id === taskId) : undefined),
    [mode, taskId, tasks],
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSaveError(null)
    if (mode === 'edit' && task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setDueDate(task.dueDate ?? '')
      setPriority(task.priority)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
    }
  }, [open, mode, task])

  if (!open) return null

  const canSave = title.trim().length > 0

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <div className="modalTitle">{mode === 'edit' ? 'Edit task' : 'New task'}</div>
          <button className="iconBtn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modalBody">
          <label className="field">
            <div className="label">Title</div>
            <input
              className="textInput"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </label>

          <label className="field">
            <div className="label">Description (optional)</div>
            <textarea
              className="textArea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details…"
              rows={4}
            />
          </label>

          <div className="grid2">
            <label className="field">
              <div className="label">Due date</div>
              <input
                className="textInput"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <label className="field">
              <div className="label">Priority</div>
              <select
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>

        {saveError && <div className="chatError modalError">{saveError}</div>}

        <div className="modalFooter">
          <button className="navBtn" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="primaryBtn"
            type="button"
            disabled={!canSave || saving}
            onClick={async () => {
              if (!canSave || saving) return
              setSaveError(null)
              setSaving(true)
              try {
                if (mode === 'edit' && taskId) {
                  await updateTask({
                    id: taskId,
                    title,
                    description,
                    dueDate: dueDate || undefined,
                    priority,
                  })
                } else {
                  await createTask({
                    title,
                    description,
                    dueDate: dueDate || undefined,
                    priority,
                  })
                }
                onClose()
              } catch (err) {
                setSaveError(
                  err instanceof Error ? err.message : 'Could not save task',
                )
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

