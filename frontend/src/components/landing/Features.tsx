import { motion } from 'framer-motion'
import { Mic, Layers, TrendingUp, Heart } from 'lucide-react'

const features = [
  {
    icon: <Mic size={20} />,
    title: 'Conversational health input',
    desc: 'No dropdowns to translate feelings into. Concerns are shared the way they\'re lived—as a conversation.',
  },
  {
    icon: <Layers size={20} />,
    title: 'Context-aware responses',
    desc: 'Each conversation is understood in context: what\'s happening, since when, and how it\'s changing.',
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Evolving concern tracking',
    desc: 'Concerns aren\'t one-time entries. Nuvia follows a thread over time so patterns stay visible.',
  },
  {
    icon: <Heart size={20} />,
    title: 'Supportive, not diagnostic',
    desc: 'Nuvia organises what you share and guides you toward appropriate care—never claims a diagnosis.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl lg:text-5xl mb-16"
          style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}
        >
          Built around how concerns actually arrive.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="warm-card p-7"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: '#fdf0f0', color: '#4a1f1f' }}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a1008' }}>{f.title}</h3>
              <p className="text-sm text-nuvia-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
