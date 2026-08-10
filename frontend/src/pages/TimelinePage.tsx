import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MessageSquare, Database, ChevronRight,
  ChevronLeft, Clock, Mic, Sparkles, Volume2, AlertCircle, X
} from 'lucide-react'
import { api, ConversationRecord, MemoryItem } from '../lib/api'
import { AttentionBadge } from '../components/AttentionBadge'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const toDateKey = (ts: string) => { try { return new Date(ts).toISOString().split('T')[0] } catch { return ts } }
const toTime = (ts: string) => { try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
const toDayLabel = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d } }
const toShortDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) } catch { return d } }

type Filter = 'all' | 'conversations' | 'memories' | 'attention'

interface CalendarDayData {
  conversation_count: number
  memory_count: number
  has_attention_event: boolean
}
interface DayEvent {
  id: string; time: string; type: string; title: string
  preview: string; attention_level: string
  understood?: unknown[]; question?: string; guidance?: string; memories_used?: string[]
}

// ── Compact Calendar Component ────────────────────────────────────────────────
function NuviaCalendar({
  viewYear, viewMonth, selectedDate, dayData, onSelect, onPrev, onNext, onToday
}: {
  viewYear: number; viewMonth: number; selectedDate: string | null
  dayData: Record<string, CalendarDayData>
  onSelect: (d: string) => void
  onPrev: () => void; onNext: () => void; onToday: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nuvia-surface text-nuvia-muted hover:text-nuvia-text transition-colors"
          aria-label="Previous month"
        ><ChevronLeft size={14}/></button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold" style={{color:'#1a1008'}}>{monthLabel}</p>
          <button onClick={onToday}
            className="text-[11px] px-2 py-0.5 rounded-full border border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30 hover:text-nuvia-text transition-all"
          >Today</button>
        </div>
        <button onClick={onNext}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nuvia-surface text-nuvia-muted hover:text-nuvia-text transition-colors"
          aria-label="Next month"
        ><ChevronRight size={14}/></button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-nuvia-subtle py-1 tracking-wider">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square"/>
          const dateStr = `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`
          const data = dayData[dateStr]
          const isToday = dateStr === today
          const isSel = dateStr === selectedDate
          const hasConv = data && data.conversation_count > 0
          const hasMem = data && data.memory_count > 0
          const hasAttn = data && data.has_attention_event
          const hasAny = hasConv || hasMem

          return (
            <button key={i}
              onClick={() => onSelect(dateStr)}
              aria-label={`${dateStr}${hasAny ? ', has activity' : ''}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-150 relative ${
                isSel
                  ? 'text-white font-semibold'
                  : isToday
                  ? 'font-bold'
                  : hasAny
                  ? 'hover:bg-nuvia-rose cursor-pointer'
                  : 'cursor-default text-nuvia-subtle'
              }`}
              style={{
                background: isSel ? '#4a1f1f' : isToday && !isSel ? '#fdf0f0' : undefined,
                color: isSel ? '#fff' : isToday ? '#4a1f1f' : hasAny ? '#1a1008' : '#94a3b8',
                outline: isToday && !isSel ? '1px solid rgba(74,31,31,0.3)' : undefined,
              }}
            >
              <span className="text-xs leading-none">{day}</span>
              {hasAny && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasConv && <span className="w-1 h-1 rounded-full" style={{background: isSel ? 'rgba(255,255,255,0.7)' : hasAttn ? '#c08030' : '#4a1f1f'}}/>}
                  {hasMem  && <span className="w-1 h-1 rounded-full" style={{background: isSel ? 'rgba(255,255,255,0.5)' : '#3d6b4a'}}/>}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-nuvia-border">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:'#4a1f1f'}}/><span className="text-[10px] text-nuvia-subtle">Conversation</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:'#3d6b4a'}}/><span className="text-[10px] text-nuvia-subtle">Memory</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:'#c08030'}}/><span className="text-[10px] text-nuvia-subtle">Needs attention</span></div>
      </div>
    </div>
  )
}

// ── Day detail panel ──────────────────────────────────────────────────────────
function DayPanel({
  date, onClose, language
}: {
  date: string; onClose: () => void; language: string
}) {
  const navigate = useNavigate()
  const [events, setEvents] = useState<DayEvent[]>([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [askLoading, setAskLoading] = useState(false)

  useEffect(() => {
    setLoading(true); setAiSummary(null)
    api.calendarDay(date)
      .then(d => { setEvents(d.conversations); setSummary(d.summary) })
      .catch(() => { setEvents([]); setSummary('Could not load data for this day.') })
      .finally(() => setLoading(false))
  }, [date])

  const handleSummarize = async () => {
    setAiLoading(true)
    try {
      const query = `What happened on ${date}? Summarize my conversations from that day.`
      const r = await api.historyQuery(query, language as 'english'|'hindi'|'hinglish', 'demo_user')
      setAiSummary(r.answer)
    } catch { setAiSummary('Could not generate summary right now.') }
    finally { setAiLoading(false) }
  }

  const handleAskVoice = async () => {
    setAskLoading(true)
    const query = `What happened on ${date}?`
    try {
      const r = await api.historyQuery(query, language as 'english'|'hindi'|'hinglish', 'demo_user')
      const textToSpeak = r.spoken_answer || r.answer
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(textToSpeak)
      u.lang = language === 'english' ? 'en-IN' : 'hi-IN'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    } catch { /**/ }
    finally { setAskLoading(false) }
  }

  const dayLabel = toDayLabel(date)

  return (
    <motion.div
      initial={{opacity:0, x:12}} animate={{opacity:1, x:0}} exit={{opacity:0, x:12}}
      transition={{duration:0.2}}
      className="bg-white rounded-2xl border border-nuvia-border overflow-hidden flex flex-col h-full"
      style={{minHeight:'400px'}}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-nuvia-border flex-shrink-0" style={{background:'#fdf8f5'}}>
        <div>
          <p className="text-[10px] text-nuvia-subtle uppercase tracking-widest font-semibold">Selected day</p>
          <p className="text-sm font-semibold mt-0.5 leading-snug" style={{color:'#1a1008'}}>{dayLabel}</p>
          {summary && !loading && (
            <p className="text-[11px] text-nuvia-muted mt-1">{summary}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-nuvia-subtle hover:text-nuvia-muted transition-colors rounded" aria-label="Close detail panel">
          <X size={14}/>
        </button>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 p-5 text-nuvia-subtle text-sm">
            <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin"/>
            Loading…
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={28} className="mx-auto mb-3 text-nuvia-border"/>
            <p className="text-sm font-medium mb-1" style={{color:'#1a1008'}}>No activity on this day</p>
            <p className="text-nuvia-subtle text-xs">Your conversations and memories will appear here.</p>
          </div>
        ) : (
          <div className="p-4 space-y-2.5">
            {events.map((ev, i) => (
              <motion.button key={ev.id || i}
                initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                onClick={() => navigate('/app/conversations')}
                className="w-full text-left p-3.5 rounded-xl border border-nuvia-border hover:border-nuvia-brown/25 transition-all group"
                style={{background:'#fdf8f5'}}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{background: ev.type==='memory'?'#f0f7f0':'#fdf0f0'}}
                  >
                    {ev.type === 'memory'
                      ? <Database size={12} style={{color:'#3d6b4a'}}/>
                      : <MessageSquare size={12} style={{color:'#4a1f1f'}}/>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[10px] text-nuvia-subtle flex items-center gap-1">
                        <Clock size={8}/>{ev.time}
                      </span>
                      <AttentionBadge level={ev.attention_level as 'LOW'|'NEEDS ATTENTION'|'URGENT'}/>
                    </div>
                    <p className="text-xs font-semibold group-hover:text-nuvia-brown transition-colors" style={{color:'#1a1008'}}>{ev.title}</p>
                    <p className="text-[11px] text-nuvia-muted mt-0.5 line-clamp-2 leading-relaxed">{ev.preview}</p>
                  </div>
                  <ChevronRight size={12} className="text-nuvia-border group-hover:text-nuvia-subtle flex-shrink-0 mt-1 transition-colors"/>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* AI summary + ask */}
      {events.length > 0 && (
        <div className="px-4 pb-4 pt-3 border-t border-nuvia-border flex-shrink-0 space-y-2.5">
          {aiSummary ? (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              className="p-3 rounded-xl border border-nuvia-border text-xs text-nuvia-muted leading-relaxed"
              style={{background:'#fdf8f5'}}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-nuvia-subtle mb-1.5">What happened</p>
              <p>{aiSummary}</p>
              <p className="text-[10px] text-nuvia-subtle mt-1 italic">Conversation summary — not a medical diagnosis.</p>
            </motion.div>
          ) : (
            <button onClick={handleSummarize} disabled={aiLoading}
              className="w-full text-left p-3 rounded-xl border border-dashed border-nuvia-border hover:border-nuvia-brown/30 text-xs text-nuvia-muted hover:text-nuvia-text transition-all flex items-center gap-2"
            >
              {aiLoading
                ? <><span className="w-3 h-3 border border-nuvia-border border-t-nuvia-brown rounded-full animate-spin flex-shrink-0"/>Generating summary…</>
                : <><Sparkles size={12} style={{color:'#4a1f1f',flexShrink:0}}/>Summarize this day</>
              }
            </button>
          )}
          <button onClick={handleAskVoice} disabled={askLoading}
            className="w-full text-left p-3 rounded-xl border border-dashed border-nuvia-border hover:border-nuvia-sage-dark/40 text-xs text-nuvia-muted hover:text-nuvia-text transition-all flex items-center gap-2"
          >
            {askLoading
              ? <><Volume2 size={12} style={{color:'#3d6b4a',flexShrink:0}} className="animate-pulse"/>Speaking…</>
              : <><Mic size={12} style={{color:'#3d6b4a',flexShrink:0}}/>Ask Nuvia about this day</>
            }
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Main TimelinePage ─────────────────────────────────────────────────────────
export function TimelinePage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const today = new Date().toISOString().split('T')[0]

  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [selected, setSelected]   = useState<string | null>(today)
  const [filter, setFilter]       = useState<Filter>('all')
  const [dayData, setDayData]     = useState<Record<string, CalendarDayData>>({})
  const [calLoading, setCalLoading] = useState(true)
  const [allConvs, setAllConvs]   = useState<ConversationRecord[]>([])
  const [listLoading, setListLoading] = useState(true)

  // Load calendar month data
  useEffect(() => {
    setCalLoading(true)
    const monthStr = `${viewYear}-${pad(viewMonth+1)}`
    api.calendar(monthStr)
      .then(d => {
        const map: Record<string, CalendarDayData> = {}
        d.days.forEach(day => { map[day.date] = day })
        setDayData(map)
      })
      .catch(() => setDayData({}))
      .finally(() => setCalLoading(false))
  }, [viewYear, viewMonth])

  // Load all conversations for chronological list
  useEffect(() => {
    api.conversations()
      .then(setAllConvs)
      .catch(() => setAllConvs([]))
      .finally(() => setListLoading(false))
  }, [])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) }
    else setViewMonth(m => m-1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) }
    else setViewMonth(m => m+1)
  }, [viewMonth])

  const goToday = useCallback(() => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelected(today)
  }, [today])

  // Filtered chronological list
  const filteredConvs = allConvs.filter(c => {
    if (filter === 'conversations') return true
    if (filter === 'memories') return false  // convs don't show in memories filter
    if (filter === 'attention') return c.attention_level === 'NEEDS ATTENTION' || c.attention_level === 'URGENT'
    return true
  })

  // Group by date for chronological list
  const groupedByDate: Record<string, ConversationRecord[]> = {}
  filteredConvs.forEach(c => {
    const k = toDateKey(c.timestamp)
    if (!groupedByDate[k]) groupedByDate[k] = []
    groupedByDate[k].push(c)
  })
  const sortedDates = Object.keys(groupedByDate).sort((a,b) => b.localeCompare(a))

  const formatGroupLabel = (d: string) => {
    const today2 = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0]
    if (d === today2) return 'Today'
    if (d === yesterday) return 'Yesterday'
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{background:'#f7f3ee'}}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-7 pb-20">

          {/* Header */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex items-start justify-between flex-wrap gap-3 mb-6">
            <div>
              <p className="text-[10px] text-nuvia-subtle font-semibold uppercase tracking-widest mb-0.5">NUVIA / TIMELINE</p>
              <h1 className="text-2xl font-semibold" style={{fontFamily:'"Playfair Display",serif',color:'#1a1008'}}>
                Your Nuvia Timeline
              </h1>
              <p className="text-nuvia-muted text-sm mt-1">See what happened across your conversations.</p>
            </div>
            <button onClick={() => navigate('/app/conversations')}
              className="text-xs flex items-center gap-1 transition-colors mt-1" style={{color:'#9b6b6b'}}
            >All conversations<ChevronRight size={12}/></button>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.07}} className="flex gap-2 mb-6 flex-wrap">
            {(['all','conversations','attention'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all duration-150 ${
                  filter===f
                    ? 'border-nuvia-brown text-nuvia-brown bg-nuvia-rose'
                    : 'border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30 hover:text-nuvia-text'
                }`}
              >{f === 'all' ? 'All' : f === 'conversations' ? 'Conversations' : 'Needs attention'}</button>
            ))}
          </motion.div>

          {/* Calendar + detail panel */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
            <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[1fr_1fr]' : 'grid-cols-1 max-w-sm'}`}>

              {/* Calendar card */}
              <div className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm">
                {calLoading ? (
                  <div className="flex items-center gap-2 text-nuvia-subtle text-sm h-52 justify-center">
                    <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin"/>Loading calendar…
                  </div>
                ) : (
                  <NuviaCalendar
                    viewYear={viewYear} viewMonth={viewMonth}
                    selectedDate={selected} dayData={dayData}
                    onSelect={d => setSelected(prev => prev===d ? null : d)}
                    onPrev={prevMonth} onNext={nextMonth} onToday={goToday}
                  />
                )}
              </div>

              {/* Detail panel */}
              <AnimatePresence>
                {selected && (
                  <DayPanel key={selected} date={selected} onClose={() => setSelected(null)} language={language}/>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Chronological timeline */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="mt-8">
            <h2 className="text-sm font-semibold mb-4" style={{fontFamily:'"Playfair Display",serif',color:'#1a1008'}}>
              Recent activity
            </h2>

            {listLoading ? (
              <div className="flex items-center gap-2 text-nuvia-subtle text-sm">
                <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin"/>Loading…
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-nuvia-border p-8 text-center">
                <Calendar size={28} className="mx-auto mb-3 text-nuvia-border"/>
                <p className="font-medium text-sm mb-1" style={{color:'#1a1008'}}>No conversations yet</p>
                <p className="text-nuvia-subtle text-xs mb-4">Your Nuvia timeline will appear here as you continue talking.</p>
                <button onClick={() => navigate('/app/talk')} className="btn-primary text-xs">Start your first conversation</button>
              </div>
            ) : (
              <div className="space-y-5">
                {sortedDates.map((date, gi) => (
                  <motion.div key={date} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:gi*0.05}}>
                    {/* Date group label */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <button onClick={() => {
                        const d = new Date(date)
                        setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelected(date)
                        window.scrollTo({top:0, behavior:'smooth'})
                      }} className="flex items-center gap-2 group">
                        <span className="text-xs font-bold tracking-wide" style={{color:'#4a1f1f'}}>{formatGroupLabel(date)}</span>
                        <span className="text-[10px] text-nuvia-subtle">{toShortDate(date)}</span>
                      </button>
                      <div className="flex-1 h-px" style={{background:'linear-gradient(90deg,rgba(74,31,31,0.15),transparent)'}}/>
                    </div>

                    {/* Events in this day */}
                    <div className="space-y-2 ml-0">
                      {groupedByDate[date].map((conv, i) => (
                        <button key={conv.id}
                          onClick={() => navigate('/app/conversations')}
                          className="w-full bg-white rounded-xl border border-nuvia-border p-3.5 text-left hover:border-nuvia-brown/25 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-right w-12">
                              <p className="text-[10px] text-nuvia-subtle font-medium">{toTime(conv.timestamp)}</p>
                            </div>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'#fdf0f0'}}>
                              <MessageSquare size={12} style={{color:'#4a1f1f'}}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold mb-0.5 group-hover:text-nuvia-brown transition-colors" style={{color:'#1a1008'}}>Voice conversation</p>
                              <p className="text-[11px] text-nuvia-muted line-clamp-1">{conv.preview}</p>
                              <p className="text-[10px] text-nuvia-subtle mt-1 capitalize">{conv.language}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <AttentionBadge level={conv.attention_level as 'LOW'|'NEEDS ATTENTION'|'URGENT'}/>
                              <ChevronRight size={12} className="text-nuvia-border group-hover:text-nuvia-subtle transition-colors"/>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
