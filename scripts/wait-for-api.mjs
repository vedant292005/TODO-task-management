const url = process.env.API_HEALTH_URL ?? 'http://localhost:3001/api/health'
const maxAttempts = 60

for (let i = 0; i < maxAttempts; i++) {
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data.ok) {
        console.log('[wait-for-api] API ready')
        process.exit(0)
      }
    }
  } catch {
    // retry
  }
  await new Promise((r) => setTimeout(r, 500))
}

console.error('[wait-for-api] API did not start in time. Run: npm run dev:server')
process.exit(1)
