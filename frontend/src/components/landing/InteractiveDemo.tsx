import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    label: 'YOU SAID',
    content: (
      <div className="flex justify-end">
        <div className="bubble-user max-w-xs">
          "Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai."
        </div>
      </div>
    ),
  },
  {
    label: 'NUVIA UNDERSTOOD',
    content: (
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Headache',  detail: 'Since yesterday', color: '#f5d8d8' },
          { label: 'Dizziness', detail: 'Today',           color: '#d8f0e8' },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-2xl border border-nuvia-border"
            style={{ background: item.color }}
          >
            <p className="font-semibold text-sm" style={{ color: '#1a1008' }}>{item.label}</p>
            <p className="text-xs text-nuvia-muted mt-0.5">{item.detail}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: 'RELEVANT CONTEXT',
    content: (
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-nuvia-border" style={{ background: '#fdf6f0' }}>
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#9b6b6b' }} />
        <div>
          <p className="text-sm" style={{ color: '#1a1008' }}>User mentioned a headache two days ago.</p>
          <p className="text-xs text-nuvia-subtle mt-1">Previous conversation · 2 days ago</p>
        </div>
      </div>
    ),
  },
  {
    label: 'NUVIA ASKS',
    content: (
      <div className="flex justify-start">
        <div className="bubble-nuvia max-w-xs">
          "Theek hai. Kya abhi bhi dizziness ya chakkar ho raha hai?"
        </div>
      </div>
    ),
  },
]

export function InteractiveDemo() {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setActive(s => (s + 1) % STEPS.length), 2600)
    return () => clearInterval(t)
  }, [auto])

  return (
    <section id="demo" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="section-eyebrow mb-3">Interactive demo</p>
          <h2 className="text-4xl" style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}>
            Say it naturally.
          </h2>
        </div>

        {/* Step tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <button key={s.label} onClick={() => { setActive(i); setAuto(false) }}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                active === i
                  ? 'border-nuvia-brown text-nuvia-brown bg-nuvia-rose'
                  : 'border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30'
              }`}
            >{s.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto min-h-[120px] bg-white rounded-3xl border border-nuvia-border p-6 shadow-warm">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {STEPS[active].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => { setActive(i); setAuto(false) }}
              className="rounded-full transition-all duration-300"
              style={{
                width: active === i ? 20 : 8,
                height: 8,
                background: active === i ? '#4a1f1f' : '#e8ddd3',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
