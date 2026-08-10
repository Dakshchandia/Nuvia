import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, AlertCircle, TrendingUp, MessageSquare, Send, Clock, Database } from 'lucide-react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { AttentionBadge } from '../components/AttentionBadge'

interface InsightsData {
  conversations_analyzed: number; memories_analyzed: number
  recurring_topics: { topic: string; count: number; description: string }[]
  insights: { type: string; title: string; description: string; topics?: string[] }[]
  timeline: { date: string; time: string; title: string; preview: string; attention_level: string; id: string }[]
  last_updated: string | null; has_data: boolean
  attention_counts?: Record<string, number>
}

const colorStyles: Record<string, { bg: string; icon: string; border: string }> = {
  brown: { bg: '#fdf0f0', icon: '#4a1f1f', border: 'rgba(74,31,31,0.12)' },
  sage:  { bg: '#f0f7f0', icon: '#2d5a3a', border: 'rgba(61,107,74,0.12)' },
  amber: { bg: '#fffbeb', icon: '#92400e', border: 'rgba(180,130,60,0.2)' },
  red:   { bg: '#fff1f1', icon: '#991b1b', border: 'rgba(180,60,60,0.2)' },
  blue:  { bg: '#eff6ff', icon: '#1d4ed8', border: 'rgba(29,78,216,0.12)' },
}

function fmt(date: string) {
  try { return new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) }
  catch { return date }
}

export function InsightsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [askMemories, setAskMemories] = useState(0)

  useEffect(() => {
    api.insights()
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const handleAsk = async () => {
    if (!question.trim()) return
    setAskLoading(true); setAskAnswer(null)
    try {
      const r = await api.historyQuery(question, 'english', 'demo_user')
      setAskAnswer(r.answer)
      setAskMemories(r.memories_found)
    } catch {
      setAskAnswer("I couldn't search your history right now. Please try again.")
    } finally { setAskLoading(false) }
  }

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto pb-16" style={{background:'#f7f3ee',minHeight:'100%'}}>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mb-8">
        <p className="text-nuvia-subtle text-[11px] font-semibold uppercase tracking-widest mb-0.5">NUVIA / HEALTH INSIGHTS</p>
        <h1 className="text-2xl font-semibold" style={{fontFamily:'"Playfair Display",serif',color:'#1a1008'}}>
          Health Insights
        </h1>
        <p className="text-nuvia-muted mt-1.5 text-sm max-w-lg">
          Your conversation patterns, summarized. These are conversational observations — not medical analysis.
        </p>
      </motion.div>

      {/* Disclaimer */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.05}}
        className="bg-white rounded-2xl border border-nuvia-border p-4 mb-6 flex items-start gap-3"
      >
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{color:'#4a1f1f'}}/>
        <p className="text-xs text-nuvia-muted leading-relaxed">
          <strong style={{color:'#1a1008'}}>Not a medical tool.</strong>{' '}
          Insights are derived from your conversation history only. They do not constitute medical advice or diagnosis. Always consult a qualified healthcare professional.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-2 text-nuvia-subtle text-sm">
          <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin"/>Loading…
        </div>
      ) : !data || !data.has_data ? (
        <div className="bg-white rounded-2xl border border-nuvia-border p-10 text-center">
          <Sparkles size={32} className="mx-auto mb-3 text-nuvia-border"/>
          <p className="font-semibold mb-1" style={{color:'#1a1008'}}>No insights yet</p>
          <p className="text-nuvia-subtle text-sm mb-5">Insights will become available as you continue talking with Nuvia.</p>
          <button onClick={() => navigate('/app/talk')} className="btn-primary text-sm">Talk to Nuvia</button>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Overview stats */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label:'Conversations', val: data.conversations_analyzed, color:'brown' },
              { label:'Memories', val: data.memories_analyzed, color:'sage' },
              { label:'Recurring topics', val: data.recurring_topics.length, color:'brown' },
              { label:'Needs attention', val: data.attention_counts?.['NEEDS ATTENTION'] ?? 0, color:'amber' },
            ].map(item => {
              const s = colorStyles[item.color] || colorStyles.brown
              return (
                <div key={item.label} className="bg-white rounded-2xl border p-4 text-center"
                  style={{borderColor:s.border}}
                >
                  <p className="text-2xl font-black" style={{color:s.icon,fontFamily:'"Playfair Display",serif'}}>{item.val}</p>
                  <p className="text-[11px] text-nuvia-subtle mt-1">{item.label}</p>
                </div>
              )
            })}
          </motion.div>

          {/* Recurring themes */}
          {data.recurring_topics.length > 0 && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
              className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} style={{color:'#4a1f1f'}}/>
                <p className="text-sm font-semibold" style={{color:'#1a1008'}}>Recurring themes</p>
              </div>
              <div className="space-y-3">
                {data.recurring_topics.map((t,i) => (
                  <div key={t.topic} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:i===0?'#4a1f1f':i===1?'#9b6b6b':'#c4a080'}}/>
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize" style={{color:'#1a1008'}}>{t.topic}</p>
                        <p className="text-[11px] text-nuvia-subtle">{t.description}</p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{background:'#fdf0f0',color:'#4a1f1f'}}>
                      ×{t.count}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-nuvia-subtle mt-4 pt-3 border-t border-nuvia-border italic">
                These are conversation patterns, not medical diagnoses.
              </p>
            </motion.div>
          )}

          {/* AI insights */}
          {data.insights.length > 0 && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
              className="space-y-3"
            >
              {data.insights.map((ins,i) => {
                const s = ins.type === 'attention' ? colorStyles.amber : colorStyles.sage
                return (
                  <div key={i} className="bg-white rounded-2xl border p-5 flex items-start gap-4" style={{borderColor:s.border}}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{background:s.bg,color:s.icon}}
                    >
                      {ins.type==='attention' ? <AlertCircle size={16}/> : <Sparkles size={16}/>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1" style={{color:'#1a1008'}}>{ins.title}</p>
                      <p className="text-nuvia-muted text-sm leading-relaxed">{ins.description}</p>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* Recent conversation timeline */}
          {data.timeline.length > 0 && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{color:'#4a1f1f'}}/>
                  <p className="text-sm font-semibold" style={{color:'#1a1008'}}>Your conversation pattern</p>
                </div>
                <button onClick={() => navigate('/app/timeline')}
                  className="text-[11px] flex items-center gap-1" style={{color:'#9b6b6b'}}>
                  View timeline<ChevronRight size={10}/>
                </button>
              </div>
              <div className="space-y-2">
                {data.timeline.slice(0,5).map((ev,i) => (
                  <button key={ev.id} onClick={() => navigate('/app/conversations')}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-nuvia-surface transition-colors group"
                  >
                    <div className="flex-shrink-0 w-14 text-right">
                      <p className="text-[11px] text-nuvia-subtle font-medium">{fmt(ev.date)}</p>
                      {ev.time && <p className="text-[10px] text-nuvia-subtle/70">{ev.time}</p>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold group-hover:text-nuvia-brown transition-colors" style={{color:'#1a1008'}}>{ev.title}</p>
                      <p className="text-[11px] text-nuvia-muted line-clamp-1 mt-0.5">{ev.preview}</p>
                    </div>
                    <AttentionBadge level={ev.attention_level as 'LOW'|'NEEDS ATTENTION'|'URGENT'}/>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* What Nuvia remembers */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
            className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={13} style={{color:'#3d6b4a'}}/>
                <p className="text-sm font-semibold" style={{color:'#1a1008'}}>What Nuvia remembers</p>
              </div>
              <button onClick={() => navigate('/app/memory')}
                className="text-[11px] flex items-center gap-1" style={{color:'#9b6b6b'}}>
                View memory<ChevronRight size={10}/>
              </button>
            </div>
            {data.recurring_topics.length > 0 ? (
              <div className="space-y-2">
                {data.recurring_topics.slice(0,4).map((t) => (
                  <div key={t.topic} className="flex items-center gap-2 text-xs text-nuvia-muted">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'#4a1f1f'}}/>
                    <span className="capitalize">{t.topic} mentioned</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-nuvia-subtle text-xs">No specific topics detected yet.</p>
            )}
          </motion.div>

          {/* Ask about history */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={13} style={{color:'#4a1f1f'}}/>
              <p className="text-sm font-semibold" style={{color:'#1a1008'}}>Ask about your conversations</p>
            </div>
            <p className="text-nuvia-subtle text-xs mb-4">
              Ask Nuvia anything about your past conversations. For example: "Have I mentioned headaches before?"
            </p>
            <div className="flex gap-2">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
                placeholder="Have I mentioned headaches before?"
                className="flex-1 text-sm bg-nuvia-surface border border-nuvia-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-nuvia-brown/40"
                style={{color:'#1a1008'}}
              />
              <button onClick={handleAsk} disabled={!question.trim() || askLoading}
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
              >
                {askLoading
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <><Send size={12}/>Ask</>
                }
              </button>
            </div>
            {askAnswer && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                className="mt-4 p-4 rounded-xl border border-nuvia-border" style={{background:'#fdf8f5'}}
              >
                <p className="text-sm leading-relaxed" style={{color:'#1a1008'}}>{askAnswer}</p>
                {askMemories > 0 && (
                  <p className="text-[11px] text-nuvia-subtle mt-2">Found in {askMemories} memory record{askMemories>1?'s':''}</p>
                )}
              </motion.div>
            )}
          </motion.div>

        </div>
      )}
    </div>
  )
}

function ChevronRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}
