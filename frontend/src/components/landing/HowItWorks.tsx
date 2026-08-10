import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const steps = [
  { num: '01', title: 'Talk',       desc: 'Speak naturally in English, Hindi, or Hinglish. No forms, no checklists.' },
  { num: '02', title: 'Understand', desc: 'Nuvia extracts symptoms, timing, and context from what you said.' },
  { num: '03', title: 'Remember',   desc: 'Qdrant retrieves relevant previous context — only what matters now.' },
  { num: '04', title: 'Follow up',  desc: 'One useful, contextual question based on your specific input.' },
  { num: '05', title: 'Guide',      desc: 'Careful, supportive guidance. Never a diagnosis. Always honest.' },
  { num: '06', title: 'Speak back', desc: 'Rime TTS converts the response to natural voice.' },
]

export function HowItWorks() {
  const navigate = useNavigate()
  return (
    <section id="how-it-works" className="py-24" style={{ background: '#f7f3ee' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="section-eyebrow mb-3">How it works</p>
          <h2 className="text-4xl lg:text-5xl"
            style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}
          >
            A conversation, not a form.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-nuvia-border p-6 hover:shadow-warm transition-shadow duration-200"
            >
              <span className="text-3xl font-black block mb-3" style={{ color: '#e8ddd3', fontFamily: '"Playfair Display", serif' }}>
                {step.num}
              </span>
              <h3 className="font-semibold mb-2" style={{ color: '#1a1008' }}>{step.title}</h3>
              <p className="text-sm text-nuvia-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/app/talk')} className="btn-primary py-3 px-8">
            Experience it →
          </button>
        </div>
      </div>
    </section>
  )
}
