import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Brain, Database, HelpCircle, Shield, Volume2, ChevronDown, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    num: '01',
    icon: <Mic size={20} />,
    title: 'Talk',
    color: 'violet',
    short: 'Speak naturally instead of filling forms.',
    desc: 'Tap the Nuvia orb or type your message. Nuvia listens through the browser microphone using the SpeechRecognition API. You can speak in English, Hindi, or Hinglish — naturally, the way you would tell a friend.',
    tech: 'Browser SpeechRecognition / webkitSpeechRecognition',
    example: '"Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai."',
  },
  {
    num: '02',
    icon: <Brain size={20} />,
    title: 'Understand',
    color: 'cyan',
    short: 'Nuvia extracts what matters from what you said.',
    desc: 'Nuvia\'s conversation engine extracts structured information from your words — symptoms, timing, keywords, and context. This is not a diagnosis engine. It identifies what you shared so it can help you better.',
    tech: 'Rule-based extraction — symptoms, duration, timing, keywords',
    example: 'Headache → Since yesterday · Dizziness → Today',
  },
  {
    num: '03',
    icon: <Database size={20} />,
    title: 'Remember',
    color: 'violet',
    short: 'Qdrant retrieves relevant previous context.',
    desc: 'Nuvia searches your previous conversations for relevant context using Qdrant vector similarity. Only memories that are actually relevant to your current concern are retrieved — not everything.',
    tech: 'Qdrant vector similarity search — nuvia_memories collection',
    example: '"User mentioned a headache two days ago." → retrieved',
  },
  {
    num: '04',
    icon: <HelpCircle size={20} />,
    title: 'Follow up',
    color: 'cyan',
    short: 'Nuvia asks the next most useful question.',
    desc: 'Based on what you said and what was retrieved from memory, Nuvia generates a contextual follow-up question. It is shaped by your specific input — not a generic template.',
    tech: 'Context-aware follow-up generation',
    example: '"Theek hai. Kya abhi bhi dizziness ya chakkar ho raha hai?"',
  },
  {
    num: '05',
    icon: <Shield size={20} />,
    title: 'Guide',
    color: 'violet',
    short: 'Careful, supportive guidance. Never a diagnosis.',
    desc: 'Nuvia provides supportive guidance based on what you shared. It uses careful language — "Based on what you\'ve shared, this may need attention" — never claiming to diagnose any condition. If something is urgent, Nuvia clearly says so.',
    tech: 'Attention levels: LOW / NEEDS ATTENTION / URGENT',
    example: '"Based on what you\'ve shared, this may need attention."',
  },
  {
    num: '06',
    icon: <Volume2 size={20} />,
    title: 'Speak back',
    color: 'cyan',
    short: 'Rime turns the response into natural voice.',
    desc: 'The response is sent to Rime TTS, which converts it to natural speech. You hear Nuvia speak back to you. The orb enters speaking state and shows an audio waveform. Falls back to browser speech if Rime is not configured.',
    tech: 'Rime TTS API → browser speechSynthesis fallback',
    example: 'Orb → SPEAKING state · Audio waveform plays',
  },
]

export function HowItWorksPage() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>('01')

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-nuvia-subtle text-[11px] font-semibold uppercase tracking-widest mb-0.5">NUVIA / HOW IT WORKS</p>
        <h1 className="text-2xl font-black text-white">A conversation, not a form.</h1>
        <p className="text-nuvia-muted mt-1.5 text-sm max-w-lg">
          Six steps from your voice to a clear, supportive response.
        </p>
      </motion.div>

      {/* Flow pills */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 flex-wrap mb-8 p-4 glass-card"
      >
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1.5">
            <button
              onClick={() => setExpanded(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                expanded === s.num
                  ? s.color === 'violet'
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'border-nuvia-border text-nuvia-subtle hover:text-nuvia-muted hover:border-nuvia-subtle'
              }`}
            >
              {s.icon}
              {s.title}
            </button>
            {i < STEPS.length - 1 && <ArrowRight size={12} className="text-nuvia-border flex-shrink-0" />}
          </div>
        ))}
      </motion.div>

      {/* Accordion steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isOpen = expanded === step.num
          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`glass-card overflow-hidden transition-all duration-200 ${
                isOpen ? (step.color === 'violet' ? 'border-violet-500/25' : 'border-cyan-500/25') : 'hover:border-nuvia-subtle/30'
              }`}
            >
              {/* Step header — always visible */}
              <button
                onClick={() => setExpanded(isOpen ? null : step.num)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
              >
                <span className={`text-2xl font-black flex-shrink-0 ${isOpen ? (step.color === 'violet' ? 'text-violet-400' : 'text-cyan-400') : 'text-nuvia-border'}`}>
                  {step.num}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  step.color === 'violet' ? 'bg-violet-500/10 text-nuvia-violet-light' : 'bg-cyan-500/10 text-nuvia-cyan-light'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base">{step.title}</p>
                  <p className="text-nuvia-subtle text-xs mt-0.5">{step.short}</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-nuvia-muted flex-shrink-0" />
                </motion.div>
              </button>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-nuvia-border">
                      <p className="text-nuvia-muted text-sm leading-relaxed">{step.desc}</p>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Tech */}
                        <div className="p-3 rounded-xl bg-white/3 border border-nuvia-border">
                          <p className="text-[11px] font-bold text-nuvia-subtle uppercase tracking-widest mb-1">Technology</p>
                          <p className="text-nuvia-muted text-xs">{step.tech}</p>
                        </div>
                        {/* Example */}
                        <div className={`p-3 rounded-xl border ${step.color === 'violet' ? 'bg-violet-500/5 border-violet-500/20' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
                          <p className="text-[11px] font-bold text-nuvia-subtle uppercase tracking-widest mb-1">Example</p>
                          <p className={`text-xs font-medium ${step.color === 'violet' ? 'text-violet-300' : 'text-cyan-300'}`}>{step.example}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-8 glass-card p-6 text-center border-nuvia-violet/20"
        style={{ boxShadow: '0 0 40px rgba(124,58,237,0.06)' }}
      >
        <p className="text-white font-bold text-lg mb-1">Ready to try it?</p>
        <p className="text-nuvia-muted text-sm mb-4">Experience the full Nuvia flow — from voice to guided response.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate('/app/talk')}
            className="btn-primary flex items-center gap-2"
          >
            <Mic size={15} /> Talk to Nuvia
          </button>
          <button onClick={() => navigate('/app/under-the-hood')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            Under the hood
          </button>
        </div>
      </motion.div>
    </div>
  )
}
