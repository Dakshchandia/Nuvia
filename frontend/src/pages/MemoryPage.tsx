import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Trash2, Tag, Info, Sparkles, ChevronRight } from 'lucide-react'
import { api, MemoryItem } from '../lib/api'
import { useStatus } from '../hooks/useStatus'
import { StatusBadge } from '../components/StatusBadge'
import { useNavigate } from 'react-router-dom'

const DEMO_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_001',
    content: 'User mentioned a headache two days ago.',
    source: 'Voice session',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    relevance: 0.92,
    tags: ['headache', 'head pain'],
  },
  {
    id: 'mem_005',
    content: 'User mentioned occasional dizziness while standing up.',
    source: 'Voice session',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    relevance: 0.81,
    tags: ['dizziness', 'chakkar', 'vertigo'],
  },
  {
    id: 'mem_002',
    content: 'User mentioned mild swelling in the feet four days ago.',
    source: 'Voice session',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    relevance: 0.78,
    tags: ['swelling', 'feet', 'sujan'],
  },
  {
    id: 'mem_004',
    content: 'User reported feeling fatigued and low on energy last week.',
    source: 'Voice session',
    date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    relevance: 0.74,
    tags: ['fatigue', 'tiredness', 'thakaan'],
  },
  {
    id: 'mem_003',
    content: 'User prefers Hinglish for conversational interactions.',
    source: 'Preference',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    relevance: 1.0,
    tags: ['language', 'preference', 'hinglish'],
  },
]

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return d }
}

function RelevanceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 90 ? 'from-emerald-500 to-cyan-500' : pct >= 70 ? 'from-violet-500 to-cyan-500' : 'from-violet-600 to-violet-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-nuvia-border overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="text-[11px] text-nuvia-subtle w-8 text-right">{pct}%</span>
    </div>
  )
}

export function MemoryPage() {
  const navigate = useNavigate()
  const { status } = useStatus()
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleted, setDeleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.memories()
      .then((data) => setMemories(data.length ? data : DEMO_MEMORIES))
      .catch(() => setMemories(DEMO_MEMORIES))
      .finally(() => setLoading(false))
  }, [])

  const handleForget = async (id: string) => {
    setDeleting(id)
    try {
      await api.deleteMemory(id)
    } catch { /* optimistic */ }
    finally {
      setDeleted((prev) => new Set([...prev, id]))
      setMemories((prev) => prev.filter((m) => m.id !== id))
      setDeleting(null)
    }
  }

  const visible = memories.filter((m) => !deleted.has(m.id))

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <p className="text-nuvia-subtle text-[11px] font-semibold uppercase tracking-widest mb-0.5">NUVIA / MEMORY</p>
        <h1 className="text-2xl font-black text-white">Nuvia Memory</h1>
        <p className="text-nuvia-muted mt-1.5 text-sm max-w-lg leading-relaxed">
          Relevant context helps Nuvia keep conversations continuous.
          Memory is retrieved using Qdrant vector similarity — only what's relevant surfaces.
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <StatusBadge service="Qdrant" status={status.qdrant} />
          <span className="text-nuvia-subtle text-xs">{visible.length} stored</span>
        </div>
      </motion.div>

      {/* How memory works info bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6 flex items-start gap-3 border-cyan-500/15"
        style={{ background: 'rgba(6,182,212,0.03)' }}
      >
        <Info size={14} className="text-nuvia-cyan-light mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold mb-0.5">How memory retrieval works</p>
          <p className="text-nuvia-subtle text-xs leading-relaxed">
            When you speak to Nuvia, relevant memories are retrieved using vector similarity — not all memories, only the ones that match your current concern.
          </p>
        </div>
        <button onClick={() => navigate('/app/under-the-hood')}
          className="text-nuvia-subtle hover:text-nuvia-muted text-xs flex items-center gap-1 flex-shrink-0 transition-colors"
        >
          Details <ChevronRight size={11} />
        </button>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-2 text-nuvia-subtle text-sm">
          <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-violet rounded-full animate-spin" />
          Loading memory…
        </div>
      ) : visible.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-10 text-center"
        >
          <Database size={36} className="text-nuvia-border mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No memories stored</p>
          <p className="text-nuvia-subtle text-sm">Start a conversation and Nuvia will build context over time.</p>
          <button onClick={() => navigate('/app/talk')}
            className="btn-primary mt-5 flex items-center gap-2 mx-auto"
          >
            <Sparkles size={14} /> Start talking
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {visible.map((mem, i) => (
              <motion.div
                key={mem.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, paddingBottom: 0 }}
                transition={{ delay: i * 0.05, layout: { duration: 0.3 } }}
                className="glass-card p-5 hover:border-nuvia-violet/20 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Content */}
                    <p className="text-white text-sm leading-relaxed font-medium mb-3">{mem.content}</p>

                    {/* Tags */}
                    {mem.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <Tag size={10} className="text-nuvia-subtle flex-shrink-0" />
                        {mem.tags.map((tag) => (
                          <span key={tag}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-nuvia-violet/8 text-nuvia-violet-light border border-nuvia-violet/15"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Relevance bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-nuvia-subtle uppercase tracking-widest font-medium">Relevance</span>
                      </div>
                      <RelevanceBar value={mem.relevance} />
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[11px] text-nuvia-subtle flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-nuvia-violet/60" />
                        {mem.source}
                      </span>
                      <span>·</span>
                      <span>{formatDate(mem.date)}</span>
                    </div>
                  </div>

                  {/* Forget button */}
                  <button
                    onClick={() => handleForget(mem.id)}
                    disabled={deleting === mem.id}
                    className="flex items-center gap-1.5 text-xs text-nuvia-subtle hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-500/8 border border-transparent hover:border-red-500/20 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label={`Forget: ${mem.content.substring(0, 40)}`}
                  >
                    {deleting === mem.id
                      ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      : <Trash2 size={12} />
                    }
                    Forget
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
