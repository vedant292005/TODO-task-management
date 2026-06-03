import type { FunctionDeclaration } from '@google/genai'

export const taskToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'create_task',
    description:
      'Create a new task in the task manager. Use when the user asks to add, create, or schedule a task.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short task title' },
        description: { type: 'string', description: 'Optional longer details' },
        dueDate: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
      },
      required: ['title', 'priority'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task by id.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        status: { type: 'string', enum: ['todo', 'done'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task by id.',
    parametersJsonSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'toggle_task_done',
    description: 'Toggle a task between todo and done.',
    parametersJsonSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
]
