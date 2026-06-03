import { useTasks } from '../tasks/taskStore'
import { useTaskSync } from './useTaskSync'

export function TaskSyncBridge() {
  const { tasks } = useTasks()
  useTaskSync(tasks)
  return null
}
