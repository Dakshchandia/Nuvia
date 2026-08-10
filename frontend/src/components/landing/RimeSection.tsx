import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

export function RimeSection() {
  return (
    <section id="rime" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="section-eyebrow mb-3">Voice output</p>
          <h2 className="text-4xl mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}>
            Don't just read the answer.<br />Hear it.
          </h2>
          <p className="text-nuvia-muted max-w-md mx-auto text-sm mb-10">
            Rime TTS converts Nuvia's response into natural speech so every answer feels like a conversation.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-nuvia-border" style={{ background: '#f7f3ee' }}>
            <Volume2 size={20} style={{ color: '#4a1f1f' }} />
            <div className="flex gap-1 items-center">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${(i-1)*0.08}s`, background: 'linear-gradient(to top,#4a1f1f,#9b6b6b)' }} />
              ))}
            </div>
            <span className="text-xs text-nuvia-muted">Natural voice · Rime TTS</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
