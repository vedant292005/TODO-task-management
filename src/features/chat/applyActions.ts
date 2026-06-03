import type { ChatAction } from '../../../shared/task'
import type { Store } from './types'

export async function applyChatActions(
  store: Store,
  actions: ChatAction[],
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'create_task':
        await store.createTask(action.payload)
        break
      case 'update_task':
        await store.updateTask(action.payload)
        break
      case 'delete_task':
        await store.removeTask(action.payload.id)
        break
      case 'toggle_task_done':
        await store.toggleDone(action.payload.id)
        break
    }
  }
}
