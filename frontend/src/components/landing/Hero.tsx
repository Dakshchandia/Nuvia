import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Chat demo data
const chatMessages = [
  { from: 'user',  text: 'Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai.' },
  { from: 'nuvia', text: 'That sounds uncomfortable. Has the dizziness been happening when you stand up, or throughout the day?' },
  { from: 'user',  text: 'Mostly when I stand up quickly.' },
]

const contextTags = ['Headache · since yesterday', 'Dizziness · recurring', 'Positional']

export function Hero() {
  const navigate = useNavigate()

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-14 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #fdf6f0 0%, #f7f3ee 60%, #f2f7f2 100%)' }}
    >
      <div className="relative max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">

        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="space-y-7"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-nuvia-border bg-white text-xs font-medium text-nuvia-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-nuvia-brown animate-pulse" />
            Voice-first health support
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl leading-[1.08] tracking-tight"
            style={{ fontFamily: '"Playfair Display", serif', color: '#1a1008' }}
          >
            Your health<br />
            <em className="not-italic" style={{ color: '#4a1f1f' }}>deserves to be</em><br />
            heard.
          </h1>

          <p className="text-base text-nuvia-muted leading-relaxed max-w-md">
            Explain what you're experiencing naturally — in English, Hindi, or Hinglish.
            Nuvia listens, remembers context, and responds with care.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/onboarding')} className="btn-primary text-sm py-3 px-6 flex items-center gap-2 justify-center">
              Try the Demo →
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-sm py-3 px-6 flex items-center gap-2 justify-center"
            >
              See how it works
            </button>
          </div>

          <p className="text-xs text-nuvia-subtle">Voice-first · Context-aware · Human-centered</p>
        </motion.div>

        {/* Right — chat card demo */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <div className="bg-white rounded-3xl border border-nuvia-border shadow-warm-lg overflow-hidden max-w-md mx-auto">

            {/* Card header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-nuvia-border">
              <div className="w-8 h-8 rounded-full orb-warm flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1a1008' }}>Nuvia</p>
                <p className="text-xs text-nuvia-subtle">Listening · not a diagnosis</p>
              </div>
            </div>

            {/* Messages */}
            <div className="px-5 py-5 space-y-3">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.4 }}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.from === 'user'
                    ? <div className="bubble-user">{msg.text}</div>
                    : <div className="bubble-nuvia">{msg.text}</div>
                  }
                </motion.div>
              ))}
            </div>

            {/* Context captured */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="px-5 pb-5"
            >
              <div className="rounded-2xl p-4 border border-nuvia-border" style={{ background: '#faf6f2' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-2.5">
                  Context Captured
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {contextTags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: '#f5d8d8', color: '#5c2020' }}
                    >{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
