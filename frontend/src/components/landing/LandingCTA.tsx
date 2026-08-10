import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function LandingCTA() {
  const navigate = useNavigate()
  return (
    <section className="py-24" style={{ background: '#f7f3ee' }}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-14 text-center"
          style={{ background: 'linear-gradient(135deg, #fce8e8 0%, #f7f3ee 50%, #e8f0e8 100%)' }}
        >
          <h2 className="text-4xl lg:text-5xl mb-4"
            style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}
          >
            Because health deserves<br />more than checkboxes.
          </h2>
          <p className="text-nuvia-muted mb-8 text-base">Start a conversation with Nuvia.</p>
          <button onClick={() => navigate('/onboarding')} className="btn-primary py-3.5 px-8 text-sm">
            Experience the Demo →
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-nuvia-border py-10 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold" style={{ color: '#4a1f1f', fontFamily: '"Playfair Display", serif' }}>Nuvia</p>
          <p className="text-xs text-nuvia-subtle mt-0.5">Your health, heard. · Voice-first health support.</p>
        </div>
        <p className="text-xs text-nuvia-subtle">Not a medical device. Always consult a healthcare professional.</p>
      </div>
    </footer>
  )
}
