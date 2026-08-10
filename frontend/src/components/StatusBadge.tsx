interface StatusBadgeProps {
  service: string
  status: 'live' | 'demo'
}

export function StatusBadge({ service, status }: StatusBadgeProps) {
  return (
    <span className={status === 'live' ? 'badge-live' : 'badge-demo'}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        status === 'live' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
      }`} />
      {service} · {status === 'live' ? 'Live' : 'Demo'}
    </span>
  )
}
