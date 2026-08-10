import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

export function QdrantSection() {
  return (
    <section id="qdrant" className="py-24" style={{ background: '#f7f3ee' }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="section-eyebrow mb-3">Context memory</p>
          <h2 className="text-4xl" style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}>
            Context changes the conversation.
          </h2>
          <p className="text-nuvia-muted mt-3 max-w-xl mx-auto text-sm">
            Nuvia doesn't treat every conversation as a blank slate. Qdrant retrieves relevant previous context when it matters.
          </p>
        </motion.div>

        <div className="max-w-sm mx-auto space-y-3">
          {[
            { label: '2 days ago', text: '"User mentioned a headache."', bg: 'white' },
            { label: 'Today', text: '"Mujhe headache phir se ho raha hai."', bg: '#fdf0f0', highlight: true },
            { label: 'Nuvia — with context', text: '"I remember you mentioned a headache recently. Has it been continuous?"', bg: '#f0f7f0' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
              <div className="rounded-2xl border border-nuvia-border p-4" style={{ background: item.bg }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-1">{item.label}</p>
                <p className="text-sm" style={{ color: '#1a1008' }}>{item.text}</p>
              </div>
              {i < 2 && <div className="flex justify-center py-1"><ArrowDown size={14} className="text-nuvia-subtle" /></div>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
