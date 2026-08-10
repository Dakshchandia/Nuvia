import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

const flow = [
  { label: 'USER VOICE', sub: 'Browser SpeechRecognition' },
  { label: 'REACT FRONTEND', sub: 'TypeScript · Vite · Tailwind' },
  { label: 'FASTAPI BACKEND', sub: 'Python · Pydantic · HTTPX' },
  { label: 'AI / LLM', sub: 'Gemini · OpenAI-compatible endpoint' },
  { label: 'QDRANT RETRIEVAL', sub: 'Vector similarity · nuvia_memories' },
  { label: 'RIME TTS', sub: 'Natural voice synthesis' },
  { label: 'USER HEARS NUVIA', sub: 'Audio playback' },
]

const tech = ['React', 'TypeScript', 'FastAPI', 'Qdrant', 'Rime', 'Docker']

export function TechArchitecture() {
  return (
    <section id="technology" className="py-24" style={{ background: '#f7f3ee' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <p className="section-eyebrow mb-3">Architecture</p>
          <h2 className="text-4xl" style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}>
            How the pieces fit.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-1">
            {flow.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <div className="bg-white rounded-xl border border-nuvia-border px-4 py-3">
                  <p className="text-xs font-bold tracking-wider" style={{ color: '#4a1f1f' }}>{item.label}</p>
                  <p className="text-nuvia-subtle text-[11px] mt-0.5">{item.sub}</p>
                </div>
                {i < flow.length - 1 && <div className="flex justify-center py-0.5"><ArrowDown size={12} className="text-nuvia-subtle" /></div>}
              </motion.div>
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: '#1a1008' }}>Technology stack</p>
            <div className="flex flex-wrap gap-2">
              {tech.map(t => (
                <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-nuvia-border bg-white text-nuvia-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
