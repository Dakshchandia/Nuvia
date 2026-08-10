interface AttentionBadgeProps {
  level: 'LOW' | 'NEEDS ATTENTION' | 'URGENT'
}

const config = {
  'LOW': {
    bg: 'rgba(90,138,106,0.1)', text: '#2d5a3a',
    border: 'rgba(90,138,106,0.2)', dot: '#3d7a4a',
  },
  'NEEDS ATTENTION': {
    bg: 'rgba(180,130,60,0.1)', text: '#7a5010',
    border: 'rgba(180,130,60,0.2)', dot: '#c08030', pulse: true,
  },
  'URGENT': {
    bg: 'rgba(180,60,60,0.1)', text: '#8a1515',
    border: 'rgba(180,60,60,0.2)', dot: '#c03030', pulse: true,
  },
}

export function AttentionBadge({ level }: AttentionBadgeProps) {
  const c = config[level]
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${'pulse' in c && c.pulse ? 'animate-pulse' : ''}`}
        style={{ background: c.dot }} />
      {level}
    </span>
  )
}
