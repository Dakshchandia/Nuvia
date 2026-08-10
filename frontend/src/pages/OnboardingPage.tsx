import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Mic, Volume2, Check } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'personal' | 'context' | 'complete'

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ['personal', 'context', 'complete']
  const idx = steps.indexOf(step)
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {steps.slice(0,2).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < idx ? 'bg-nuvia-brown scale-100' :
            i === idx ? 'w-3 h-3 bg-nuvia-brown' :
            'bg-nuvia-border'
          }`}/>
          {i === 0 && <div className="w-8 h-px" style={{background: idx > 0 ? '#4a1f1f' : '#e8ddd3'}}/>}
        </div>
      ))}
      <p className="text-[11px] text-nuvia-subtle ml-1 tracking-wider uppercase">
        {step === 'personal' ? 'Step 1 of 2' : step === 'context' ? 'Step 2 of 2' : 'Done'}
      </p>
    </div>
  )
}

// ── Shared field styles ───────────────────────────────────────────────────────
const inputBase = "w-full px-4 py-3.5 text-sm rounded-2xl border transition-all duration-200 focus:outline-none bg-white"
const inputStyle = `${inputBase} border-nuvia-border focus:border-nuvia-brown/50 focus:shadow-warm-sm`
const inputErr   = `${inputBase} border-red-300 focus:border-red-400`

// ── VoiceHint ─────────────────────────────────────────────────────────────────
function VoiceHint({ text }: { text: string }) {
  const [spoken, setSpoken] = useState(false)
  const speak = () => {
    if (spoken) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'; u.rate = 0.9
    window.speechSynthesis.speak(u)
    setSpoken(true)
  }
  return (
    <button onClick={speak}
      className="flex items-center gap-1.5 text-[11px] text-nuvia-subtle hover:text-nuvia-muted transition-colors mt-2"
      title="Hear Nuvia ask this question"
    >
      <Volume2 size={11}/>{spoken ? 'Playing…' : 'Hear Nuvia ask'}
    </button>
  )
}

// ── Step 1 — Personal details ─────────────────────────────────────────────────
function PersonalStep({
  name, age, nameErr, ageErr,
  setName, setAge, onContinue,
}: {
  name: string; age: string; nameErr: string; ageErr: string
  setName: (v: string) => void; setAge: (v: string) => void
  onContinue: () => void
}) {
  const { start, stop, transcript, isListening, supported, clearTranscript } = useSpeechRecognition('english')
  const [listeningFor, setListeningFor] = useState<'name'|'age'|null>(null)

  const listenFor = (field: 'name'|'age') => {
    if (isListening) { stop(); setListeningFor(null); return }
    clearTranscript()
    setListeningFor(field)
    start()
  }

  // When transcript updates, fill the right field
  if (transcript && listeningFor === 'name' && !isListening) {
    setName(transcript.trim())
    clearTranscript(); setListeningFor(null)
  }
  if (transcript && listeningFor === 'age' && !isListening) {
    const nums = transcript.replace(/[^0-9]/g,'')
    if (nums) setAge(nums)
    clearTranscript(); setListeningFor(null)
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{color:'#1a1008'}}>
          Your name
        </label>
        <div className="relative">
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="What should Nuvia call you?"
            className={nameErr ? inputErr : inputStyle}
            style={{color:'#1a1008'}}
            autoFocus
          />
          {supported && (
            <button onClick={() => listenFor('name')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening && listeningFor==='name' ? 'text-nuvia-brown animate-pulse' : 'text-nuvia-subtle hover:text-nuvia-muted'}`}
              aria-label="Speak your name"
            ><Mic size={14}/></button>
          )}
        </div>
        {nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}
        <VoiceHint text="Hi, I'm Nuvia. What should I call you?" />
      </div>

      {/* Age */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{color:'#1a1008'}}>
          Your age
        </label>
        <div className="relative">
          <input
            type="number" value={age} onChange={e => setAge(e.target.value)}
            placeholder="e.g. 28"
            min={1} max={120}
            className={ageErr ? inputErr : inputStyle}
            style={{color:'#1a1008'}}
          />
          {supported && (
            <button onClick={() => listenFor('age')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening && listeningFor==='age' ? 'text-nuvia-brown animate-pulse' : 'text-nuvia-subtle hover:text-nuvia-muted'}`}
              aria-label="Speak your age"
            ><Mic size={14}/></button>
          )}
        </div>
        {ageErr && <p className="text-red-500 text-xs mt-1">{ageErr}</p>}
        <VoiceHint text="How old are you?" />
      </div>

      <button onClick={onContinue} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2">
        Continue <ArrowRight size={16}/>
      </button>
    </div>
  )
}

// ── Step 2 — Pregnancy / context ─────────────────────────────────────────────
const MONTHS = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th']

function ContextStep({
  pregnancyStatus, pregnancyMonth,
  setPregnancyStatus, setPregnancyMonth,
  onContinue, onBack,
}: {
  pregnancyStatus: string; pregnancyMonth: number | null
  setPregnancyStatus: (v: string) => void; setPregnancyMonth: (v: number | null) => void
  onContinue: () => void; onBack: () => void
}) {
  const { start, stop, transcript, isListening, supported, clearTranscript } = useSpeechRecognition('english')
  const [voiceActive, setVoiceActive] = useState(false)

  const listenForPregnancy = () => {
    if (isListening) { stop(); setVoiceActive(false); return }
    clearTranscript(); setVoiceActive(true); start()
  }

  if (transcript && !isListening && voiceActive) {
    const t = transcript.toLowerCase()
    if (t.includes('yes') || t.includes('haan') || t.includes('ha ')) setPregnancyStatus('yes')
    else if (t.includes('no') || t.includes('nahi') || t.includes('not')) setPregnancyStatus('no')
    // Month detection
    const monthMap: Record<string,number> = {
      one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
      '1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
      first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,
    }
    Object.entries(monthMap).forEach(([word, num]) => {
      if (t.includes(word)) setPregnancyMonth(num)
    })
    clearTranscript(); setVoiceActive(false)
  }

  return (
    <div className="space-y-6">
      {/* Pregnancy status */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{color:'#1a1008'}}>
          Are you currently pregnant?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['yes','no'].map(v => (
            <button key={v} onClick={() => setPregnancyStatus(v)}
              className={`py-3.5 rounded-2xl border text-sm font-semibold capitalize transition-all duration-200 ${
                pregnancyStatus === v
                  ? 'border-nuvia-brown bg-nuvia-rose text-nuvia-brown'
                  : 'border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30 hover:bg-white bg-white'
              }`}
            >
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
        {supported && (
          <button onClick={listenForPregnancy}
            className={`flex items-center gap-1.5 text-[11px] mt-2 transition-colors ${isListening ? 'text-nuvia-brown animate-pulse' : 'text-nuvia-subtle hover:text-nuvia-muted'}`}
          >
            <Mic size={11}/>{isListening ? 'Listening…' : 'Speak your answer'}
          </button>
        )}
        <VoiceHint text="Are you currently pregnant?" />
      </div>

      {/* Pregnancy month — conditional */}
      <AnimatePresence>
        {pregnancyStatus === 'yes' && (
          <motion.div
            initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            transition={{duration:0.2}}
            className="overflow-hidden"
          >
            <label className="block text-sm font-medium mb-3" style={{color:'#1a1008'}}>
              Which month are you in?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((label, i) => {
                const month = i + 1
                return (
                  <button key={month} onClick={() => setPregnancyMonth(month)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      pregnancyMonth === month
                        ? 'border-nuvia-brown bg-nuvia-rose text-nuvia-brown'
                        : 'border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30 bg-white'
                    }`}
                  >{label}</button>
                )
              })}
            </div>
            <VoiceHint text="Which month of pregnancy are you in?" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy note */}
      <p className="text-[11px] text-nuvia-subtle text-center leading-relaxed">
        Your information is used only to personalize your Nuvia experience.
      </p>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="btn-secondary flex items-center gap-2 px-5"
        ><ArrowLeft size={14}/>Back</button>
        <button onClick={onContinue}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5"
        >Continue <ArrowRight size={16}/></button>
      </div>
    </div>
  )
}

// ── Main OnboardingPage ───────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate = useNavigate()
  const { saveProfile } = useProfile()

  const [step, setStep] = useState<Step>('personal')
  const [saving, setSaving] = useState(false)

  // Step 1 state
  const [name, setName] = useState('')
  const [age, setAge]   = useState('')
  const [nameErr, setNameErr] = useState('')
  const [ageErr, setAgeErr]   = useState('')

  // Step 2 state
  const [pregnancyStatus, setPregnancyStatus] = useState('')
  const [pregnancyMonth, setPregnancyMonth]   = useState<number | null>(null)

  // Validate step 1
  const handlePersonalContinue = () => {
    let ok = true
    if (!name.trim()) { setNameErr('Please enter your name.'); ok = false } else setNameErr('')
    const ageNum = parseInt(age)
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setAgeErr('Please enter a valid age (1–120).'); ok = false
    } else setAgeErr('')
    if (ok) setStep('context')
  }

  // Validate step 2 and save
  const handleContextContinue = async () => {
    setSaving(true)
    try {
      await saveProfile({
        name: name.trim(),
        age: parseInt(age),
        pregnancy_status: pregnancyStatus || null,
        pregnancy_month: pregnancyStatus === 'yes' ? pregnancyMonth : null,
      })
      setStep('complete')
      // Nuvia speaks the confirmation
      window.speechSynthesis.cancel()
      const msg = pregnancyStatus === 'yes' && pregnancyMonth
        ? `You're all set, ${name.trim()}. I've noted that you're in your ${MONTHS[pregnancyMonth-1]} month. Nuvia is ready to support you.`
        : `You're all set, ${name.trim()}. Nuvia is ready to support you.`
      const u = new SpeechSynthesisUtterance(msg)
      u.lang = 'en-IN'; u.rate = 0.9
      window.speechSynthesis.speak(u)
    } catch { /**/ }
    finally { setSaving(false) }
  }

  const slideProps = {
    initial:   { opacity: 0, x: 24 },
    animate:   { opacity: 1, x: 0 },
    exit:      { opacity: 0, x: -24 },
    transition:{ duration: 0.22, ease: 'easeOut' },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(120% 80% at 50% 35%, #fdfaf3 0%, #f7f0e3 55%, #eee1cc 100%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full orb-warm" style={{ boxShadow: '0 8px 24px rgba(74,31,31,0.2)' }}/>
            <p className="text-sm font-bold mt-1" style={{ color:'#4a1f1f', fontFamily:'"Playfair Display",serif' }}>Nuvia</p>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1 — Personal */}
          {step === 'personal' && (
            <motion.div key="personal" {...slideProps}>
              <StepDots step="personal" />
              <div className="bg-white rounded-3xl border border-nuvia-border p-7 shadow-warm">
                <h1 className="text-2xl font-semibold mb-2 leading-snug"
                  style={{ fontFamily:'"Playfair Display",serif', color:'#1a1008' }}
                >
                  Let's get to know you.
                </h1>
                <p className="text-nuvia-muted text-sm mb-6 leading-relaxed">
                  Just a few details will help Nuvia personalize your experience.
                </p>
                <PersonalStep
                  name={name} age={age} nameErr={nameErr} ageErr={ageErr}
                  setName={setName} setAge={setAge}
                  onContinue={handlePersonalContinue}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Context */}
          {step === 'context' && (
            <motion.div key="context" {...slideProps}>
              <StepDots step="context" />
              <div className="bg-white rounded-3xl border border-nuvia-border p-7 shadow-warm">
                <h1 className="text-2xl font-semibold mb-2 leading-snug"
                  style={{ fontFamily:'"Playfair Display",serif', color:'#1a1008' }}
                >
                  One more thing.
                </h1>
                <p className="text-nuvia-muted text-sm mb-6 leading-relaxed">
                  This helps Nuvia understand how to support you.
                </p>
                <ContextStep
                  pregnancyStatus={pregnancyStatus}
                  pregnancyMonth={pregnancyMonth}
                  setPregnancyStatus={setPregnancyStatus}
                  setPregnancyMonth={setPregnancyMonth}
                  onContinue={handleContextContinue}
                  onBack={() => setStep('personal')}
                />
                {saving && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-nuvia-subtle text-sm">
                    <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin"/>
                    Saving…
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Complete */}
          {step === 'complete' && (
            <motion.div key="complete" {...slideProps}>
              <div className="bg-white rounded-3xl border border-nuvia-border p-10 shadow-warm text-center">
                {/* Success mark */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type:'spring', stiffness:200, damping:15, delay:0.1 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: '#f0f7f0', border: '1.5px solid rgba(61,107,74,0.2)' }}
                >
                  <Check size={24} style={{ color: '#3d6b4a' }} strokeWidth={2.5}/>
                </motion.div>

                <h1 className="text-2xl font-semibold mb-2"
                  style={{ fontFamily:'"Playfair Display",serif', color:'#1a1008' }}
                >
                  You're all set{name ? `, ${name.trim()}` : ''}.
                </h1>
                <p className="text-nuvia-muted text-sm mb-2 leading-relaxed">
                  Nuvia is ready to support you.
                </p>
                <div className="flex items-center justify-center gap-1.5 mb-8">
                  <Volume2 size={12} style={{ color:'#3d6b4a' }} className="animate-pulse"/>
                  <span className="text-[11px] text-nuvia-subtle">Nuvia is speaking…</span>
                </div>

                <button
                  onClick={() => navigate('/app')}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                >
                  Enter Nuvia <ArrowRight size={18}/>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
