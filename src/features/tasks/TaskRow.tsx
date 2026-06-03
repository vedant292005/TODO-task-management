import type { Task } from '../../types/task'
import { useTasks } from './taskStore'

function priorityLabel(p: Task['priority']) {
  if (p === 'high') return 'High'
  if (p === 'medium') return 'Medium'
  return 'Low'
}

export function TaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { toggleDone, removeTask } = useTasks()

  return (
    <div className={task.status === 'done' ? 'taskRow taskRowDone' : 'taskRow'}>
      <button
        className="check"
        type="button"
        aria-label={task.status === 'done' ? 'Mark as not done' : 'Mark as done'}
        onClick={() => void toggleDone(task.id)}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>

      <button className="taskMain" type="button" onClick={onEdit}>
        <div className="taskTitleRow">
          <div className="taskTitle">{task.title}</div>
          <div className="taskMeta">
            <span className={`pill pill-${task.priority}`}>
              {priorityLabel(task.priority)}
            </span>
            {task.dueDate ? <span className="pill pill-date">{task.dueDate}</span> : null}
          </div>
        </div>
        {task.description ? <div className="taskDesc">{task.description}</div> : null}
      </button>

      <button
        className="iconBtn danger"
        type="button"
        aria-label="Delete task"
        onClick={() => void removeTask(task.id)}
      >
        Delete
      </button>
    </div>
  )
}

