import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Mic, Clock, ChevronRight, X, Volume2, Brain, Database } from 'lucide-react'
import { api, ConversationRecord } from '../lib/api'
import { AttentionBadge } from '../components/AttentionBadge'
import { useNavigate } from 'react-router-dom'

function timeAgo(ts: string) {
  try {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000)
    const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000)
    if (d === 0 && h < 1) return 'Just now'
    if (d === 0) return `${h}h ago`
    if (d === 1) return 'Yesterday'
    return `${d} days ago`
  } catch { return ts }
}
function formatFull(ts: string) {
  try { return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return ts }
}

function DetailPanel({ conv, onClose }: { conv: ConversationRecord; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
      className="w-full h-full bg-white overflow-y-auto flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-nuvia-border flex-shrink-0">
        <div>
          <p className="text-[11px] text-nuvia-subtle uppercase tracking-widest font-semibold">Conversation detail</p>
          <p className="font-bold text-sm mt-0.5" style={{ color: '#1a1008' }}>Voice session</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-nuvia-surface text-nuvia-muted hover:text-nuvia-text transition-colors"><X size={16} /></button>
      </div>
      <div className="p-5 space-y-4 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <AttentionBadge level={conv.attention_level as 'LOW' | 'NEEDS ATTENTION' | 'URGENT'} />
          <span className="text-nuvia-subtle text-xs flex items-center gap-1"><Clock size={10} />{formatFull(conv.timestamp)}</span>
          <span className="text-nuvia-subtle text-xs capitalize">{conv.language}</span>
        </div>
        <div className="p-4 rounded-2xl border border-nuvia-border" style={{ background: '#fdf8f5' }}>
          <p className="text-[11px] font-bold text-nuvia-subtle uppercase tracking-widest mb-2">You said</p>
          <p className="text-sm leading-relaxed" style={{ color: '#1a1008' }}>{conv.full_text}</p>
        </div>
        {conv.understood && conv.understood.length > 0 && (
          <div className="p-4 rounded-2xl border border-nuvia-border bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} style={{ color: '#4a1f1f' }} />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4a1f1f' }}>What Nuvia understood</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {conv.understood.map((u, i) => (
                <div key={u.label} className="p-3 rounded-xl border"
                  style={{ background: i % 2 === 0 ? '#fdf0f0' : '#f0f7f0', borderColor: i % 2 === 0 ? 'rgba(74,31,31,0.12)' : 'rgba(61,107,74,0.12)' }}
                >
                  <p className="font-semibold text-xs" style={{ color: i % 2 === 0 ? '#4a1f1f' : '#2d5a3a' }}>{u.label}</p>
                  <p className="text-nuvia-muted text-xs mt-0.5">{u.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {conv.memories_used && conv.memories_used.length > 0 && (
          <div className="p-4 rounded-2xl border border-nuvia-border bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Database size={13} style={{ color: '#3d6b4a' }} />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#3d6b4a' }}>Relevant context used</p>
            </div>
            {conv.memories_used.map((m, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-nuvia-border mb-2" style={{ background: '#fdf8f5' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#9b6b6b' }} />
                <p className="text-xs" style={{ color: '#1a1008' }}>{m}</p>
              </div>
            ))}
          </div>
        )}
        {conv.question && (
          <div className="p-4 rounded-2xl border border-nuvia-border bg-white">
            <p className="text-[11px] font-bold text-nuvia-subtle uppercase tracking-widest mb-2">Follow-up</p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#4a1f1f' }}>{conv.question}</p>
          </div>
        )}
        {conv.guidance && (
          <div className="p-4 rounded-2xl border border-nuvia-border bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={13} style={{ color: '#3d6b4a' }} />
              <p className="text-[11px] font-bold text-nuvia-subtle uppercase tracking-widest">Guidance</p>
            </div>
            <p className="text-sm leading-relaxed text-nuvia-muted">{conv.guidance}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ConversationsPage() {
  const navigate = useNavigate()
  const [convs, setConvs] = useState<ConversationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ConversationRecord | null>(null)

  useEffect(() => {
    api.conversations().then(setConvs).catch(() => setConvs([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden" style={{ background: '#f7f3ee' }}>
      <div className={`flex-1 overflow-y-auto ${selected ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
        <div className="px-6 pt-6 pb-4 border-b border-nuvia-border bg-white flex-shrink-0">
          <p className="text-nuvia-subtle text-[11px] font-semibold uppercase tracking-widest mb-0.5">NUVIA / CONVERSATIONS</p>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Playfair Display",serif', color: '#1a1008' }}>Your conversations</h1>
          <p className="text-nuvia-muted text-sm mt-1">Nuvia keeps continuity across all your voice sessions.</p>
        </div>
        <div className="flex-1 p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-nuvia-subtle text-sm pt-4">
              <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin" />Loading…
            </div>
          ) : (
            <div className="space-y-2">
              {convs.map((conv, i) => (
                <motion.button key={conv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setSelected(conv)}
                  className={`w-full bg-white rounded-2xl border p-4 text-left hover:border-nuvia-brown/25 transition-all duration-200 group ${selected?.id === conv.id ? 'border-nuvia-brown/40' : 'border-nuvia-border'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#fdf0f0' }}>
                      <Mic size={15} style={{ color: '#4a1f1f' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold" style={{ color: '#1a1008' }}>Voice session</p>
                        <AttentionBadge level={conv.attention_level as 'LOW' | 'NEEDS ATTENTION' | 'URGENT'} />
                      </div>
                      <p className="text-nuvia-muted text-xs leading-relaxed line-clamp-2 mb-2">{conv.preview}</p>
                      <div className="flex items-center gap-2 text-nuvia-subtle text-[11px]">
                        <Clock size={10} /><span>{timeAgo(conv.timestamp)}</span>
                        <span>·</span><span className="capitalize">{conv.language}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-nuvia-border group-hover:text-nuvia-subtle transition-colors flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                onClick={() => navigate('/app/talk')}
                className="w-full bg-white rounded-2xl border border-dashed border-nuvia-border p-4 hover:border-nuvia-brown/30 transition-all group"
              >
                <div className="flex items-center justify-center gap-2 text-nuvia-subtle group-hover:text-nuvia-brown transition-colors">
                  <Mic size={15} /><span className="text-sm font-medium">Start a new conversation</span>
                </div>
              </motion.button>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {selected && (
          <div className="lg:w-96 lg:border-l lg:border-nuvia-border overflow-hidden flex-shrink-0 bg-white">
            <DetailPanel conv={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
