import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, RotateCcw, Volume2, AlertTriangle, CheckCircle, ChevronRight, Sparkles, Shield, Info, Clock, Zap, Database, Brain } from 'lucide-react'
import { NuviaOrb, OrbState } from '../components/NuviaOrb'
import { StatusBadge } from '../components/StatusBadge'
import { AttentionBadge } from '../components/AttentionBadge'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useStatus } from '../hooks/useStatus'
import { useVoiceSession } from '../hooks/useVoiceSession'
import { useLanguage } from '../hooks/useLanguage'
import { api, ConversationResponse, TurnLatency } from '../lib/api'
import { t } from '../lib/i18n'
import { getLangConfig } from '../lib/languageConfig'
import type { AppLanguage } from '../lib/i18n'

type ConvStep = 'input' | 'understood' | 'context' | 'guidance'

export function TalkPage() {
  const { status } = useStatus()
  const session = useVoiceSession()
  const { language, setLanguage } = useLanguage()
  const cfg = getLangConfig(language)

  const { start, stop, transcript: stt, isListening, errorMessage: sttErr, supported, clearTranscript } =
    useSpeechRecognition(language)

  const [typed, setTyped]           = useState('')
  const [step, setStep]             = useState<ConvStep>('input')
  const [orb, setOrb]               = useState<OrbState>('idle')
  const [loading, setLoading]       = useState(false)
  const [apiErr, setApiErr]         = useState<string | null>(null)
  const [resp, setResp]             = useState<ConversationResponse | null>(null)
  const [demoTTS, setDemoTTS]       = useState(false)
  const [latency, setLatency]       = useState<TurnLatency | null>(null)
  const [bargeCount, setBargeCount] = useState(0)
  const [sttStartMs, setSttStartMs] = useState(0)
  const [sttMs, setSttMs]           = useState<number | null>(null)
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const resultsEl = useRef<HTMLDivElement>(null)
  const text = isListening ? stt : (stt || typed)

  useEffect(() => {
    if (isListening) setOrb('listening')
    else if (orb === 'listening') setOrb('idle')
  }, [isListening]) // eslint-disable-line

  useEffect(() => {
    if (step !== 'input')
      setTimeout(() => resultsEl.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180)
  }, [step])

  // Barge-in: if user speaks while Nuvia is speaking → cancel audio immediately
  useEffect(() => {
    if (isListening && orb === 'speaking') {
      session.cancelAudio()
      setOrb('listening')
      setBargeCount(c => c + 1)
    }
  }, [isListening]) // eslint-disable-line

  // STT duration tracking
  useEffect(() => {
    if (!isListening && sttStartMs > 0) setSttMs(Date.now() - sttStartMs)
  }, [isListening, sttStartMs])

  const handleOrbClick = useCallback(() => {
    if (!supported) { document.getElementById('ti')?.focus(); return }
    if (isListening) { stop(); setOrb('idle') }
    else {
      clearTranscript(); setTyped(''); setStep('input')
      setResp(null); setApiErr(null)
      setSttStartMs(Date.now())
      start()
    }
  }, [isListening, supported, start, stop, clearTranscript])

  const handleLangChange = (l: AppLanguage) => {
    setLanguage(l)
    // If currently listening, restart with new language
    if (isListening) { stop(); clearTranscript() }
  }

  const handleUnderstand = async () => {
    const txt = text.trim(); if (!txt) return
    if (isListening) stop()
    setLoading(true); setApiErr(null); setOrb('processing')
    const turnId = session.newTurnId()

    // Voice history query detection
    const historyPat = [/have i (mentioned|talked|said)/i, /did i (mention|tell)/i,
      /kya maine.*pehle/i, /pahle.*baat/i, /maine pehle.*bataya/i]
    if (historyPat.some(p => p.test(txt))) {
      try {
        const hr = await api.historyQuery(txt, language, 'demo_user')
        const ans = hr.spoken_answer || hr.answer
        setResp({ intent: language==='hindi'?'इतिहास प्रश्न':'History query', understanding: txt.substring(0,50),
          response: ans, question: '',
          memories:[], attention_level:'LOW', guidance:hr.answer,
          why:[`Found ${hr.memories_found} memory(s)`], summary:{}, demo_retrieval:false,
          ai_powered:false, is_health_related:false })
        setStep('guidance'); setOrb('idle'); setLoading(false)
        setTimeout(() => {
          window.speechSynthesis.cancel()
          const u = new SpeechSynthesisUtterance(ans)
          u.lang = cfg.sttLang; u.rate = 0.9
          setOrb('speaking'); u.onend = () => setOrb('idle')
          window.speechSynthesis.speak(u)
        }, 300)
        return
      } catch { /**/ }
    }

    try {
      const r = await api.conversation({ text:txt, language, session_id:session.sessionId, turn_id:turnId, user_id:'demo_user' })
      setResp(r); setStep('understood'); setOrb('idle')
      if (r.latency) setLatency({ ...r.latency, stt_ms: sttMs ?? undefined })
      api.saveConversationFull({ text:txt, language, session_id:r.session_id, turn_id:r.turn_id,
        attention_level:r.attention_level, intent:r.intent, understanding:r.understanding, response:r.response, question:r.question,
        guidance:r.guidance, memories_used:r.memories.map(m=>m.content) }).catch(()=>{})
    } catch {
      setApiErr(t('error.connection', language))
      setOrb('idle')
    } finally { setLoading(false) }
  }

  const handleConfirm = () => { setStep('context'); setTimeout(() => setStep('guidance'), 550) }

  const handleSpeak = async () => {
    if (!resp) return
    const txt = resp.response
    setOrb('speaking')
    const rimeStart = Date.now()
    try {
      const r = await api.tts(txt, language)
      if (r.audio) {
        const url = URL.createObjectURL(r.audio)
        const a = new Audio(url)
        session.registerAudio(a); audioRef.current = a
        a.play()
        if (latency) setLatency({ ...latency, rime_ms: Date.now() - rimeStart })
        a.onended = () => { setOrb('idle'); URL.revokeObjectURL(url) }
        return
      }
    } catch { /**/ }
    // Browser fallback with correct language
    setDemoTTS(true); window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(txt)
    u.lang = cfg.sttLang; u.rate = 0.9
    u.onend = () => { setOrb('idle'); setDemoTTS(false) }
    window.speechSynthesis.speak(u)
  }

  const handleReset = () => {
    setStep('input'); setResp(null); setTyped(''); clearTranscript()
    setApiErr(null); setOrb('idle'); setLatency(null); setSttMs(null); setSttStartMs(0)
    session.cancelAudio(); setDemoTTS(false)
  }

  const orbIdleLabel = supported ? t('orb.idle', language) : t('orb.idleNoMic', language)
  const orbLabel = orb==='idle'?orbIdleLabel : orb==='listening'?t('orb.listening',language)
    : orb==='processing'?t('orb.processing',language) : t('orb.speaking',language)

  return (
    <div className="min-h-full flex flex-col" style={{background:'#f7f3ee'}}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-nuvia-border bg-white px-5 py-3.5">
        <div className="max-w-xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-0.5">NUVIA / TALK</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-base font-semibold" style={{fontFamily:'"Playfair Display",serif',color:'#1a1008'}}>
              {t('talk.title', language)}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge service="Qdrant" status={status.qdrant}/>
              <StatusBadge service="Rime"   status={demoTTS?'demo':status.rime}/>
              <StatusBadge service="AI"     status={status.ai}/>
            </div>
          </div>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {(['english','hindi','hinglish'] as AppLanguage[]).map(l=>(
              <button key={l} onClick={()=>handleLangChange(l)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize border transition-all duration-200 ${language===l?'border-nuvia-brown text-nuvia-brown bg-nuvia-rose':'border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30'}`}
              >{getLangConfig(l).label}</button>
            ))}
            {bargeCount>0 && <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-nuvia-sage text-nuvia-muted border border-nuvia-border">⚡ {bargeCount} barge-in{bargeCount>1?'s':''}</span>}
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-8 space-y-5 pb-24">

          {/* Orb */}
          <div className="flex flex-col items-center gap-3 py-2">
            <NuviaOrb state={orb} size="lg" onClick={handleOrbClick} label={orbLabel}/>
            <motion.p key={`${orb}-${language}`} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              className="text-sm font-medium flex items-center gap-2"
            >
              {orb==='idle'      && <><Mic size={13} className="text-nuvia-subtle"/><span className="text-nuvia-muted">{orbIdleLabel}</span></>}
              {orb==='listening' && <><span className="w-2 h-2 rounded-full animate-pulse" style={{background:'#4a1f1f'}}/><span style={{color:'#4a1f1f'}} className="font-semibold">{t('orb.listening',language)}</span></>}
              {orb==='processing'&& <><Sparkles size={13} className="animate-pulse" style={{color:'#3d6b4a'}}/><span style={{color:'#3d6b4a'}} className="font-semibold">{t('orb.processing',language)}</span></>}
              {orb==='speaking'  && <><Volume2 size={13} className="animate-pulse" style={{color:'#3d6b4a'}}/><span style={{color:'#3d6b4a'}} className="font-semibold">{t('orb.speaking',language)}</span></>}
            </motion.p>
            {!supported && <p className="text-xs px-3 py-1.5 rounded-xl border border-nuvia-border bg-white text-nuvia-muted">{t('error.noMic',language)}</p>}
          </div>

          {/* Speech error */}
          <AnimatePresence>
            {sttErr && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="flex items-start gap-3 p-4 rounded-2xl border bg-white border-nuvia-border"
              >
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-sm text-nuvia-muted">{sttErr}</p>
                  <div className="flex gap-3 mt-1.5">
                    <button onClick={handleOrbClick} className="text-xs underline" style={{color:'#4a1f1f'}}>{t('error.tryAgain',language)}</button>
                    <button onClick={()=>document.getElementById('ti')?.focus()} className="text-xs underline" style={{color:'#4a1f1f'}}>{t('error.useText',language)}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* YOU SAID */}
          <div className="bg-white rounded-2xl border border-nuvia-border p-5"
            style={{boxShadow:isListening?'0 0 0 2px rgba(74,31,31,0.15)':''}}
          >
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="ti" className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle">
                {t('input.label',language)}
              </label>
              {isListening && <span className="flex items-center gap-1.5 text-xs font-medium" style={{color:'#4a1f1f'}}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#4a1f1f'}}/>
                {t('orb.listening',language)}
              </span>}
            </div>
            <textarea id="ti" rows={3}
              className="w-full bg-transparent placeholder-nuvia-subtle/50 text-sm resize-none focus:outline-none leading-relaxed"
              style={{color:'#1a1008'}}
              placeholder={t('input.placeholder',language)}
              value={text} onChange={e=>{if(!isListening)setTyped(e.target.value)}} readOnly={isListening}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-nuvia-border flex-wrap gap-2">
              <div className="flex gap-1.5">
                <button onClick={()=>{setTyped(cfg.demoPhrase);clearTranscript();setStep('input')}}
                  className="text-xs text-nuvia-muted hover:text-nuvia-text px-2.5 py-1.5 rounded-lg hover:bg-nuvia-surface border border-transparent hover:border-nuvia-border transition-all">
                  {t('input.loadDemo',language)}
                </button>
                <button onClick={()=>{setTyped('');clearTranscript()}}
                  className="text-xs text-nuvia-muted hover:text-nuvia-text px-2.5 py-1.5 rounded-lg hover:bg-nuvia-surface border border-transparent hover:border-nuvia-border transition-all flex items-center gap-1">
                  <RotateCcw size={10}/>{t('input.clear',language)}
                </button>
              </div>
              <button onClick={handleUnderstand} disabled={!text.trim()||loading}
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
              >
                {loading
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('input.processing',language)}</>
                  : <><Send size={12}/>{t('input.understand',language)}</>}
              </button>
            </div>
          </div>

          {/* API error */}
          <AnimatePresence>
            {apiErr && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-nuvia-border"
              >
                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0"/>
                <p className="text-sm text-nuvia-muted">{apiErr}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pipeline */}
          <div ref={resultsEl}>
          <AnimatePresence>
          {resp && step!=='input' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">

              {/* STEP 1 */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                className="bg-white rounded-2xl border border-nuvia-border overflow-hidden shadow-warm-sm"
              >
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-nuvia-border" style={{background:'#fdf8f5'}}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{background:'#fdf0f0',color:'#4a1f1f'}}>1</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{color:'#4a1f1f'}}>{t('step1.title',language)}</span>
                  {resp.ai_powered && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{background:'#f0f7f0',color:'#3d6b4a'}}>AI</span>}
                </div>
                <div className="p-5">
                  {resp.is_health_related===false ? (
                    <p className="text-nuvia-muted text-sm">{resp.response}</p>
                  ) : (
                    <div className="mb-4 space-y-4">
                      <div className="p-4 rounded-xl border bg-nuvia-surface border-nuvia-border/60">
                        <p className="font-semibold text-sm" style={{color:'#4a1f1f'}}>{resp.intent}</p>
                        <p className="text-nuvia-muted text-sm mt-1">{resp.understanding}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black mt-0.5 orb-warm" style={{color:'#fff'}}>N</div>
                        <div className="bubble-nuvia flex-1 text-sm">{resp.response}</div>
                      </div>
                    </div>
                  )}
                  {step==='understood' && resp.is_health_related!==false && (
                    <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} className="border-t border-nuvia-border pt-4 space-y-3">
                      <p className="text-sm text-nuvia-muted flex items-center gap-2">
                        <Info size={13} className="text-nuvia-subtle flex-shrink-0"/>{t('step1.confirm',language)}
                      </p>
                      <button onClick={handleConfirm} className="btn-primary flex items-center gap-2 w-full justify-center">
                        <CheckCircle size={14}/>{t('step1.confirmBtn',language)}
                      </button>
                    </motion.div>
                  )}
                  {step==='understood' && resp.is_health_related===false && (
                    <button onClick={handleReset} className="btn-secondary text-sm flex items-center gap-2 mt-3"><RotateCcw size={12}/>{t('step3.newBtn',language)}</button>
                  )}
                </div>
              </motion.div>

              {/* STEP 2 */}
              <AnimatePresence>
              {(step==='context'||step==='guidance') && (
                <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                  className="bg-white rounded-2xl border border-nuvia-border overflow-hidden shadow-warm-sm"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-nuvia-border" style={{background:'#f5fbf5'}}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{background:'#f0f7f0',color:'#3d6b4a'}}>2</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{color:'#3d6b4a'}}>{t('step2.title',language)}</span>
                    </div>
                    <StatusBadge service="Qdrant" status={resp.demo_retrieval?'demo':'live'}/>
                  </div>
                  <div className="p-5">
                    {resp.memories.length>0 ? (
                      <div className="space-y-2.5">
                        {resp.memories.map(m=>(
                          <div key={m.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-nuvia-border" style={{background:'#fdf8f5'}}>
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{background:'#9b6b6b'}}/>
                            <div>
                              <p className="text-sm font-medium" style={{color:'#1a1008'}}>{m.content}</p>
                              <p className="text-nuvia-subtle text-xs mt-1">{m.source} · {m.date} · {Math.round(m.relevance*100)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-nuvia-subtle text-sm italic">{t('step2.noContext',language)}</p>}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* STEP 3 */}
              <AnimatePresence>
              {step==='guidance' && (
                <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
                  className="bg-white rounded-2xl border border-nuvia-border overflow-hidden shadow-warm-sm"
                >
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-nuvia-border" style={{background:'#fdf8f5'}}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{background:'#fdf0f0',color:'#4a1f1f'}}>3</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{color:'#4a1f1f'}}>{t('step3.title',language)}</span>
                  </div>
                  <div className="p-5 space-y-5">
                    {resp.question && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black mt-0.5 orb-warm" style={{color:'#fff'}}>?</div>
                        <div className="bg-orange-50 text-orange-900 border border-orange-100 p-3 rounded-xl rounded-tl-none flex-1 text-sm">{resp.question}</div>
                      </div>
                    )}
                    <div className="border-t border-nuvia-border pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-2">{t('step3.supportLevel',language)}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <AttentionBadge level={resp.attention_level}/>
                        <span className="flex items-center gap-1.5 text-xs text-nuvia-subtle"><Shield size={10}/>{t('step3.notDiagnosis',language)}</span>
                      </div>
                    </div>
                    {resp.guidance && (
                      <div className="border-t border-nuvia-border pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-2">{t('step3.guidance',language)}</p>
                        <p className="text-sm text-nuvia-muted leading-relaxed">{resp.guidance}</p>
                        {resp.attention_level==='URGENT' && (
                          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50">
                            <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5"/>
                            <p className="text-red-700 text-xs">{t('step3.urgent',language)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {resp.why.length>0 && (
                      <div className="border-t border-nuvia-border pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-2">{t('step3.why',language)}</p>
                        <ul className="space-y-1.5">
                          {resp.why.map((w,i)=>(
                            <li key={i} className="flex items-center gap-2 text-xs text-nuvia-muted">
                              <ChevronRight size={11} style={{color:'#9b6b6b',flexShrink:0}}/>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="border-t border-nuvia-border pt-4 flex gap-2.5 flex-wrap">
                      <button onClick={handleSpeak} disabled={orb==='speaking'} className="btn-primary flex items-center gap-2 flex-1 justify-center text-sm">
                        <Volume2 size={14}/>{orb==='speaking'?t('step3.speaking',language):t('step3.speakBtn',language)}
                      </button>
                      <button onClick={handleReset} className="btn-secondary flex items-center gap-2 px-4 text-sm">
                        <RotateCcw size={12}/>{t('step3.newBtn',language)}
                      </button>
                    </div>
                    {demoTTS && <p className="text-center text-xs text-nuvia-subtle">{t('step3.demoTTS',language)}</p>}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Latency panel */}
              {latency && step==='guidance' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
                  className="bg-white rounded-2xl border border-nuvia-border p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-3 flex items-center gap-1.5">
                    <Zap size={10}/>Voice Performance · {getLangConfig(language).rimeModel} / {getLangConfig(language).rimeSpeaker}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[{icon:<Mic size={10}/>,label:'STT',val:latency.stt_ms},
                      {icon:<Database size={10}/>,label:'Qdrant',val:latency.qdrant_ms},
                      {icon:<Brain size={10}/>,label:'AI',val:latency.llm_ms},
                      {icon:<Volume2 size={10}/>,label:'Rime',val:latency.rime_ms},
                      {icon:<Clock size={10}/>,label:'Total',val:latency.total_ms}
                    ].map(({icon,label,val})=>(
                      <div key={label} className="flex items-center gap-1.5 text-nuvia-subtle">
                        {icon}<span>{label}:</span>
                        <span className="font-semibold" style={{color:'#1a1008'}}>{val!=null?`${Math.round(val)}ms`:'—'}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
