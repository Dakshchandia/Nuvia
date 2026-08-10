import { useState, useEffect } from 'react'
import { api, StatusResponse } from '../lib/api'

export function useStatus() {
  const [status, setStatus] = useState<StatusResponse>({
    qdrant: 'demo', rime: 'demo', ai: 'demo',
    barge_in_supported: true, reconnect_supported: true, memory_isolation: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const s = await api.status()
        if (mounted) setStatus(s)
      } catch {
        if (mounted) setStatus({ qdrant: 'demo', rime: 'demo', ai: 'demo' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return { status, loading }
}
