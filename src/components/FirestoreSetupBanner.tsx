import { FIRESTORE_RULES_HELP } from '../lib/taskRepository'

const RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`

export function FirestoreSetupBanner({
  notice,
  error,
  onDismiss,
}: {
  notice: string | null
  error: string | null
  onDismiss: () => void
}) {
  const message = error ?? notice
  if (!message) return null

  const isRulesIssue =
    message.includes('Firestore') ||
    message.includes('rules') ||
    message.includes('permission')

  return (
    <div className="chatError taskError setupBanner">
      <div className="setupBannerBody">
        <strong>{isRulesIssue ? 'Firebase setup required' : 'Notice'}</strong>
        <p>{message}</p>
        {isRulesIssue && (
          <details className="setupDetails">
            <summary>How to fix (2 minutes)</summary>
            <ol className="setupSteps">
              <li>
                Open{' '}
                <a
                  href="https://console.firebase.google.com/project/todo-task-management-a1666/firestore/rules"
                  target="_blank"
                  rel="noreferrer"
                >
                  Firebase Console → Firestore Rules
                </a>
              </li>
              <li>Replace the rules with the snippet below</li>
              <li>Click <strong>Publish</strong></li>
              <li>Refresh this page</li>
            </ol>
            <pre className="rulesSnippet">{RULES_SNIPPET}</pre>
            <p className="setupHint">
              Until then, tasks work in this browser only ({FIRESTORE_RULES_HELP.split('\n')[0]}).
            </p>
          </details>
        )}
      </div>
      <button type="button" className="errorDismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}
