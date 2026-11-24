import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type Health =
  | { state: 'loading' }
  | { state: 'ok'; status: string }
  | { state: 'error'; message: string }

async function fetchHealth(signal: AbortSignal): Promise<string> {
  const response = await fetch(`${API_URL}/actuator/health`, { signal })
  const body: unknown = await response.json().catch(() => null)
  if (body && typeof body === 'object' && 'status' in body && typeof body.status === 'string') {
    return body.status
  }
  throw new Error(`HTTP ${response.status}`)
}

function App() {
  const [health, setHealth] = useState<Health>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then((status) => setHealth({ state: 'ok', status }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        setHealth({ state: 'error', message })
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <h1>Nối Từ</h1>
      <p className="server">
        Máy chủ:{' '}
        {health.state === 'loading' && <span className="muted">đang kết nối…</span>}
        {health.state === 'ok' && (
          <span className={health.status === 'UP' ? 'up' : 'down'}>{health.status}</span>
        )}
        {health.state === 'error' && (
          <span className="down">không kết nối được ({health.message})</span>
        )}
      </p>
    </main>
  )
}

export default App
