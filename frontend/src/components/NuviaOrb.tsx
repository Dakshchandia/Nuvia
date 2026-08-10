import { motion } from 'framer-motion'

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking'

interface NuviaOrbProps {
  state: OrbState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  label?: string
  className?: string
}

const sizeMap = {
  sm: { orb: 64,  ring1: 80,  ring2: 96,  ring3: 112 },
  md: { orb: 96,  ring1: 120, ring2: 144, ring3: 168 },
  lg: { orb: 140, ring1: 172, ring2: 204, ring3: 236 },
  xl: { orb: 180, ring1: 220, ring2: 260, ring3: 300 },
}

const stateGradients = {
  idle:       { from: '#e8b4b4', to: '#7a3333', ring: 'rgba(74,31,31,0.12)' },
  listening:  { from: '#f5c4c4', to: '#9b4a4a', ring: 'rgba(74,31,31,0.22)' },
  processing: { from: '#c4d9c4', to: '#5a8a6a', ring: 'rgba(90,138,106,0.2)' },
  speaking:   { from: '#b4d4c4', to: '#3d6b4a', ring: 'rgba(90,138,106,0.25)' },
}

export function NuviaOrb({ state, size = 'lg', onClick, label, className = '' }: NuviaOrbProps) {
  const dims = sizeMap[size]
  const g    = stateGradients[state]
  const isClickable = Boolean(onClick)

  const orbAnim = {
    idle: {
      scale: [1, 1.05, 1],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    listening: {
      scale: [1, 1.1, 1, 1.07, 1],
      transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
    },
    processing: {
      rotate: 360,
      transition: { duration: 3, repeat: Infinity, ease: 'linear' },
    },
    speaking: {
      scale: [1, 1.07, 1, 1.04, 1],
      transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
    },
  }

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: dims.ring3, height: dims.ring3 }}
    >
      {/* Subtle ambient rings */}
      {[dims.ring3, dims.ring2, dims.ring1].map((d, i) => (
        <motion.div
          key={d}
          className="absolute rounded-full border"
          style={{ width: d, height: d, borderColor: g.ring }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}

      {/* Orb core */}
      <motion.div
        className={`relative rounded-full select-none ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
        style={{
          width: dims.orb,
          height: dims.orb,
          background: `radial-gradient(circle at 35% 35%, ${g.from} 0%, ${g.to} 100%)`,
          boxShadow: `0 8px 32px rgba(74,31,31,0.18), 0 2px 8px rgba(74,31,31,0.1), inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
        variants={orbAnim}
        animate={state === 'processing' ? 'processing' : state}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        aria-label={isClickable ? (label || 'Nuvia orb') : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => { if (isClickable && (e.key === 'Enter' || e.key === ' ')) onClick?.() }}
        whileHover={isClickable ? { scale: 1.04 } : undefined}
        whileTap={isClickable   ? { scale: 0.97 } : undefined}
      >
        {/* Highlight sheen */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35) 0%, transparent 60%)' }} />

        {/* Listening — wave bars */}
        {state === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="wave-bar" style={{ animationDelay: `${(i-1)*0.1}s` }} />
            ))}
          </div>
        )}

        {/* Speaking — cyan wave bars */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="wave-bar" style={{
                animationDelay: `${(i-1)*0.08}s`,
                background: 'linear-gradient(to top, #3d6b4a, #7aaa8a)',
              }} />
            ))}
          </div>
        )}

        {/* Processing — spinning arc */}
        {state === 'processing' && (
          <div className="absolute inset-2 rounded-full border-2 border-t-nuvia-sage-dark border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        )}
      </motion.div>
    </div>
  )
}
