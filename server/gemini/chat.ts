import { FunctionCallingConfigMode } from '@google/genai'
import type { ChatAction, ChatMessage, Task } from '../types/task.js'
import { findRelevantTaskIds } from '../chroma/search.js'
import { functionCallToAction } from './actions.js'
import { generateWithFallback } from './generate.js'
import { taskToolDeclarations } from './tools.js'

function formatTasksForPrompt(tasks: Task[]): string {
  if (tasks.length === 0) return 'No tasks yet.'
  return tasks
    .map(
      (t) =>
        `- [${t.id}] ${t.title} | ${t.priority} | ${t.status}${
          t.dueDate ? ` | due ${t.dueDate}` : ''}${t.description ? ` | ${t.description}` : ''}`,
    )
    .join('\n')
}

export async function handleChat(input: {
  userId: string
  message: string
  history: ChatMessage[]
  tasks: Task[]
}): Promise<{ reply: string; actions: ChatAction[]; contextTaskIds: string[] }> {
  const contextTaskIds = findRelevantTaskIds(input.message, input.tasks)
  let ragContext = ''

  const relevant = input.tasks.filter((t) => contextTaskIds.includes(t.id))
  if (relevant.length > 0) {
    ragContext = `\n\nMost relevant tasks:\n${formatTasksForPrompt(relevant)}`
  }

  const systemInstruction = `You are a helpful task management assistant. Use the provided tools when the user asks to create, update, delete, or complete tasks.

Current tasks (${input.tasks.length} total):
${formatTasksForPrompt(input.tasks)}
${ragContext}

Use exact task IDs from the list when updating or deleting. Today is ${new Date().toISOString().slice(0, 10)}. Be concise and friendly. Never invent task IDs.`

  const contents = [
    ...input.history.slice(-10).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: input.message }] },
  ]

  const response = await generateWithFallback(contents, {
    systemInstruction,
    tools: [{ functionDeclarations: taskToolDeclarations }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    },
  })

  const actions: ChatAction[] = []
  for (const call of response.functionCalls ?? []) {
    const action = functionCallToAction(
      call.name ?? '',
      (call.args ?? {}) as Record<string, unknown>,
    )
    if (action) actions.push(action)
  }

  const reply =
    response.text?.trim() ||
    (actions.length > 0 ? 'Done — I updated your tasks.' : "I couldn't generate a response.")

  return { reply, actions, contextTaskIds }
}
