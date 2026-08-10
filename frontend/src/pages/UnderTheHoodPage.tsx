import { motion } from 'framer-motion'
import { ArrowDown, CheckCircle, Cpu, Database, Mic, Volume2, Zap } from 'lucide-react'
import { useStatus } from '../hooks/useStatus'
import { StatusBadge } from '../components/StatusBadge'

const FLOW = [
  { label: 'MICROPHONE', sub: 'User speaks naturally', color: 'brown' },
  { label: 'SPEECH RECOGNITION', sub: 'Browser SpeechRecognition / webkitSpeechRecognition', color: 'brown' },
  { label: 'REACT FRONTEND', sub: 'TypeScript · Vite · Tailwind · Framer Motion', color: 'brown' },
  { label: 'FASTAPI BACKEND', sub: 'Python · Pydantic · HTTPX · Async', color: 'sage' },
  { label: 'AI / LLM', sub: 'Gemini · OpenAI-compatible · Rule-based fallback', color: 'sage' },
  { label: 'QDRANT RETRIEVAL', sub: 'Vector similarity · user_id payload filter · nuvia_memories', color: 'brown' },
  { label: 'CONTEXT-AWARE RESPONSE', sub: 'Follow-up · Attention level · Explainability · Handoff', color: 'sage' },
  { label: 'RIME TTS', sub: 'Natural voice synthesis → browser fallback', color: 'brown' },
  { label: 'AUDIO OUTPUT', sub: 'User hears Nuvia · Barge-in cancels playback', color: 'sage' },
]

const TECH = [
  { label: 'React 18 + TypeScript', color: 'blue', desc: 'Type-safe component tree, hooks, React Router v6.' },
  { label: 'FastAPI', color: 'emerald', desc: 'Async Python backend. Pydantic validation on every endpoint.' },
  { label: 'Qdrant', color: 'violet', desc: 'Vector DB. Every query filtered by user_id — cross-user isolation enforced.' },
  { label: 'Rime TTS', color: 'cyan', desc: 'Natural voice synthesis. Key stays server-side. Browser fallback when unconfigured.' },
  { label: 'Gemini (AI)', color: 'amber', desc: 'OpenAI-compatible endpoint. Two-step: extract → respond. Full rule-based fallback.' },
  { label: 'Docker Compose', color: 'sky', desc: 'One-command Qdrant deployment with persistent volume.' },
]

const CAPABILITIES = [
  { label: 'Barge-in', desc: 'User speech while Nuvia is speaking immediately cancels audio playback and starts a new turn.' },
  { label: 'Memory isolation', desc: 'Every Qdrant query includes a MUST filter on user_id. User A cannot see User B memories.' },
  { label: 'Session continuity', desc: 'session_id stored in sessionStorage. Survives page refresh. Backend deduplicates via turn_id.' },
  { label: 'Latency telemetry', desc: 'STT, Qdrant, LLM, Rime timings measured per-turn and shown in Talk page.' },
  { label: 'Reconnect recovery', desc: 'Session restored from sessionStorage on reconnect. Duplicate turns prevented by turn_id set.' },
  { label: 'High-trust confirmation', desc: 'WHAT I UNDERSTOOD shown before any guidance. User must confirm before pipeline continues.' },
  { label: 'Human handoff', desc: 'URGENT level triggers a safe summary the user can share with a healthcare professional.' },
  { label: 'Audit log', desc: 'Every pipeline event logged per session_id: speech_received → understanding → memory → response.' },
  { label: 'Multilingual', desc: 'English (en-IN), Hindi (hi-IN), Hinglish (hi-IN). AI responds in the user\'s language.' },
]

const colorMap: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  sky:     'bg-sky-50 text-sky-700 border-sky-200',
}

export function UnderTheHoodPage() {
  const { status } = useStatus()

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto pb-16" style={{ background: '#f7f3ee', minHeight: '100%' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-nuvia-subtle text-[11px] font-semibold uppercase tracking-widest mb-0.5">NUVIA / UNDER THE HOOD</p>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Playfair Display",serif', color: '#1a1008' }}>
          How Nuvia is built.
        </h1>
        <p className="text-nuvia-muted mt-1.5 text-sm max-w-xl">Technical overview for engineers and hackathon judges.</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <StatusBadge service="Qdrant" status={status.qdrant} />
          <StatusBadge service="Rime"   status={status.rime}   />
          <StatusBadge service="AI"     status={status.ai}     />
          {status.barge_in_supported && (
            <span className="badge-live"><CheckCircle size={10} />Barge-in supported</span>
          )}
          {status.memory_isolation && (
            <span className="badge-live"><CheckCircle size={10} />Memory isolated</span>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Flow */}
        <div>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#1a1008' }}>
            <Zap size={14} style={{ color: '#4a1f1f' }} /> Architecture flow
          </h2>
          <div className="space-y-0.5">
            {FLOW.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white rounded-xl border border-nuvia-border px-4 py-3 flex items-center gap-3">
                  <span className="flex-shrink-0" style={{ color: item.color === 'brown' ? '#4a1f1f' : '#3d6b4a' }}>
                    {i === 0 ? <Mic size={12} /> : i === FLOW.length - 1 ? <Volume2 size={12} /> : <Cpu size={12} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-wider" style={{ color: item.color === 'brown' ? '#4a1f1f' : '#3d6b4a' }}>{item.label}</p>
                    <p className="text-nuvia-subtle text-[11px] mt-0.5 truncate">{item.sub}</p>
                  </div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex justify-center py-0.5"><ArrowDown size={12} className="text-nuvia-subtle" /></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: tech + capabilities */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#1a1008' }}>
              <Cpu size={14} style={{ color: '#3d6b4a' }} /> Technology stack
            </h2>
            <div className="space-y-2">
              {TECH.map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-xl border border-nuvia-border p-3.5 flex items-start gap-3"
                >
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${colorMap[card.color]}`}>{card.label}</span>
                  <p className="text-nuvia-muted text-xs leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-4" style={{ color: '#1a1008' }}>Production capabilities</h2>
            <div className="space-y-2">
              {CAPABILITIES.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-white rounded-xl border border-nuvia-border p-4 flex items-start gap-3"
                >
                  <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#3d6b4a' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#1a1008' }}>{c.label}</p>
                    <p className="text-nuvia-subtle text-xs mt-0.5 leading-relaxed">{c.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: '#1a1008' }}>API endpoints</h2>
            <div className="bg-white rounded-xl border border-nuvia-border p-4 space-y-2 font-mono">
              {[
                { m: 'GET',    p: '/health',                d: 'Health check' },
                { m: 'GET',    p: '/api/status',            d: 'Live/Demo + capabilities' },
                { m: 'POST',   p: '/api/conversation',      d: 'Full AI pipeline + latency' },
                { m: 'POST',   p: '/api/tts',               d: 'Rime TTS / fallback' },
                { m: 'GET',    p: '/api/memory',            d: 'User memories (isolated)' },
                { m: 'POST',   p: '/api/memory',            d: 'Upsert memory' },
                { m: 'DELETE', p: '/api/memory/:id',        d: 'Forget memory' },
                { m: 'GET',    p: '/api/conversations',     d: 'History with full detail' },
                { m: 'POST',   p: '/api/conversations/full',d: 'Save full pipeline result' },
                { m: 'POST',   p: '/api/history-query',     d: 'Voice history query' },
                { m: 'POST',   p: '/api/handoff',           d: 'Generate handoff summary' },
                { m: 'GET',    p: '/api/handoff/events/:id',d: 'Audit event log' },
              ].map(ep => (
                <div key={ep.p} className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${ep.m === 'GET' ? 'bg-emerald-100 text-emerald-700' : ep.m === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{ep.m}</span>
                  <span className="text-nuvia-muted flex-shrink-0">{ep.p}</span>
                  <span className="text-nuvia-subtle ml-auto text-right text-[11px] hidden sm:block">{ep.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
