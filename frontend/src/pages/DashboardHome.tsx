import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mic, MessageSquare, Database, ArrowRight, Clock,
  ChevronRight, Sparkles, Volume2, Brain, Search, AlertCircle, Activity
} from 'lucide-react'
import { NuviaOrb } from '../components/NuviaOrb'
import { AttentionBadge } from '../components/AttentionBadge'
import { StatusBadge } from '../components/StatusBadge'
import { useStatus } from '../hooks/useStatus'
import { useProfile } from '../hooks/useProfile'
import { api, ConversationRecord, MemoryItem } from '../lib/api'

const DEMO_CONVS: ConversationRecord[] = [
  { id:'c1', preview:'Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai.', full_text:'', language:'hinglish', timestamp: new Date(Date.now()-86400000).toISOString(), attention_level:'NEEDS ATTENTION' },
  { id:'c2', preview:'Feeling tired and low on energy since last few days.', full_text:'', language:'english', timestamp: new Date(Date.now()-3*86400000).toISOString(), attention_level:'LOW' },
  { id:'c3', preview:'Mujhe thoda bukhar lag raha hai aur gala dard kar raha hai.', full_text:'', language:'hinglish', timestamp: new Date(Date.now()-5*86400000).toISOString(), attention_level:'NEEDS ATTENTION' },
]
const DEMO_MEMS: MemoryItem[] = [
  { id:'m1', content:'User mentioned a headache two days ago.', source:'Voice session', date: new Date(Date.now()-2*86400000).toISOString().split('T')[0], relevance:0.92, tags:['headache'] },
  { id:'m2', content:'User prefers Hinglish for interactions.', source:'Preference', date: new Date(Date.now()-7*86400000).toISOString().split('T')[0], relevance:1.0, tags:['language'] },
  { id:'m3', content:'User mentioned mild swelling four days ago.', source:'Voice session', date: new Date(Date.now()-4*86400000).toISOString().split('T')[0], relevance:0.78, tags:['swelling'] },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  if (h < 21) return 'Good evening.'
  return 'Good night.'
}
function timeAgo(ts: string) {
  try {
    const d = Math.floor((Date.now()-new Date(ts).getTime())/86400000)
    const h = Math.floor((Date.now()-new Date(ts).getTime())/3600000)
    if (d===0&&h===0) return 'Just now'
    if (d===0) return `${h}h ago`
    if (d===1) return 'Yesterday'
    return `${d} days ago`
  } catch { return '' }
}
function fmt(ts: string) {
  try { return new Date(ts).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) }
  catch { return ts }
}

const FLOW = [
  { icon:<Mic size={11}/>,     label:'Talk',       c:'rose' },
  { icon:<Brain size={11}/>,   label:'Understand', c:'sage' },
  { icon:<Database size={11}/>,label:'Remember',   c:'rose' },
  { icon:<Search size={11}/>,  label:'Follow up',  c:'sage' },
  { icon:<Sparkles size={11}/>,label:'Guide',      c:'rose' },
  { icon:<Volume2 size={11}/>, label:'Speak',      c:'sage' },
]

export function DashboardHome() {
  const navigate = useNavigate()
  const { status } = useStatus()
  const { profile } = useProfile()
  const [convs, setConvs] = useState<ConversationRecord[]>([])
  const [mems, setMems]   = useState<MemoryItem[]>([])
  const [insight, setInsight] = useState<{ title: string; description: string } | null>(null)
  const [riskLevel, setRiskLevel] = useState<string | null>(null)

  useEffect(() => {
    api.conversations().then(d => setConvs(d.length ? d : DEMO_CONVS)).catch(() => setConvs(DEMO_CONVS))
    api.memories().then(d => setMems(d.length ? d.slice(0,3) : DEMO_MEMS)).catch(() => setMems(DEMO_MEMS))
    api.insights().then(d => {
      if (d.insights && d.insights.length > 0) setInsight(d.insights[0])
    }).catch(() => {})
    api.riskAnalyze().then(d => setRiskLevel(d.risk_level)).catch(() => {})
  }, [])

  const dc = convs.length ? convs : DEMO_CONVS
  const dm = mems.length  ? mems  : DEMO_MEMS
  const lastConv = dc[0] ?? null

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto pb-24 space-y-5" style={{background:'#f7f3ee',minHeight:'100%'}}>

      {/* Header */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] text-nuvia-subtle font-semibold uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-semibold" style={{fontFamily:'"Playfair Display",serif',color:'#1a1008'}}>
            {greeting()}{profile.name ? ` ${profile.name}.` : ''}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-sm text-nuvia-muted">Nuvia is ready to listen.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge service="Qdrant" status={status.qdrant}/>
          <StatusBadge service="Rime"   status={status.rime}/>
          <StatusBadge service="AI"     status={status.ai}/>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.07}}
        className="bg-white rounded-3xl border border-nuvia-border overflow-hidden shadow-warm"
      >
        <div className="h-1 w-full" style={{background:'linear-gradient(90deg,#f5d8d8,#fdf0e8,#d8eed8)'}}/>
        <div className="p-7 lg:p-9 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <NuviaOrb state="idle" size="md" onClick={() => navigate('/app/talk')} label="Start talking"/>
            <p className="text-xs text-nuvia-subtle">Tap to talk</p>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full border border-nuvia-border text-xs font-medium text-nuvia-muted">
              <Mic size={11} style={{color:'#4a1f1f'}}/> Talk to Nuvia
            </div>
            <h2 className="text-2xl lg:text-3xl font-semibold mb-2 leading-snug" style={{fontFamily:'"Playfair Display",serif',color:'#1a1008'}}>
              Tell Nuvia what's on your mind.
            </h2>
            <p className="text-nuvia-muted text-sm mb-6 leading-relaxed max-w-md">
              Speak naturally. Nuvia listens, understands, retrieves relevant context, and responds with care.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button onClick={() => navigate('/app/talk')} className="btn-primary flex items-center gap-2 justify-center text-sm">
                <Mic size={14}/> Start talking <ArrowRight size={14}/>
              </button>
              <button onClick={() => navigate('/app/how-it-works')} className="btn-secondary text-sm flex items-center gap-2 justify-center">
                How it works
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flow strip */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
        className="bg-white rounded-2xl border border-nuvia-border p-4 shadow-warm-sm"
      >
        <div className="flex items-center gap-1">
          {FLOW.map((s,i) => (
            <div key={s.label} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{background:s.c==='rose'?'#fdf0f0':'#f0f7f0',color:s.c==='rose'?'#4a1f1f':'#3d6b4a'}}
                >{s.icon}</div>
                <span className="text-[9px] text-nuvia-subtle font-medium text-center leading-tight">{s.label}</span>
              </div>
              {i < FLOW.length-1 && <div className="step-connector flex-1 mx-0.5 mb-4"/>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Three-column grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Continue last conversation */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.14}}
          className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={13} style={{color:'#4a1f1f'}}/>
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:'#4a1f1f'}}>Continue your conversation</p>
          </div>
          {lastConv ? (
            <>
              <p className="text-xs text-nuvia-muted leading-relaxed line-clamp-2 mb-3">{lastConv.preview}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-nuvia-subtle text-[11px]">
                  <Clock size={9}/><span>{timeAgo(lastConv.timestamp)}</span>
                  <span>·</span><span className="capitalize">{lastConv.language}</span>
                </div>
                <AttentionBadge level={lastConv.attention_level as 'LOW'|'NEEDS ATTENTION'|'URGENT'}/>
              </div>
              <button onClick={() => navigate('/app/talk')}
                className="mt-3 w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >Continue <ArrowRight size={11}/></button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-nuvia-subtle text-xs mb-3">No conversations yet.</p>
              <button onClick={() => navigate('/app/talk')} className="btn-primary text-xs py-2">Start talking</button>
            </div>
          )}
        </motion.div>

        {/* Nuvia insight */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.18}}
          className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} style={{color:'#3d6b4a'}}/>
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:'#3d6b4a'}}>Nuvia Insight</p>
          </div>
          {insight ? (
            <>
              <p className="text-sm font-medium mb-2 leading-relaxed" style={{color:'#1a1008'}}>{insight.title}</p>
              <p className="text-[11px] text-nuvia-subtle italic mb-3">{insight.description}</p>
              <button onClick={() => navigate('/app/insights')}
                className="text-[11px] flex items-center gap-1 transition-colors" style={{color:'#9b6b6b'}}
              >View insights <ChevronRight size={10}/></button>
            </>
          ) : (
            <p className="text-nuvia-subtle text-xs leading-relaxed">
              Your insights will appear as you continue talking with Nuvia.
            </p>
          )}
        </motion.div>

        {/* Risk status */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.22}}
          className="bg-white rounded-2xl border border-nuvia-border p-5 shadow-warm-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} style={{color: riskLevel === 'urgent' ? '#c03030' : riskLevel === 'elevated' ? '#c06020' : riskLevel === 'watch' ? '#c08030' : '#3d6b4a'}}/>
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:'#1a1008'}}>Risk Status</p>
          </div>
          {riskLevel ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: riskLevel === 'urgent' ? '#c03030' : riskLevel === 'elevated' ? '#c06020' : riskLevel === 'watch' ? '#c08030' : '#3d6b4a' }}/>
                <p className="text-sm font-semibold uppercase" style={{ color: riskLevel === 'urgent' ? '#8a1515' : riskLevel === 'elevated' ? '#7a4010' : riskLevel === 'watch' ? '#8a5020' : '#2d5a3a' }}>
                  {riskLevel}
                </p>
              </div>
              <p className="text-[11px] text-nuvia-subtle mb-3 italic">Not a medical diagnosis.</p>
              <button onClick={() => navigate('/app/risk')}
                className="text-[11px] flex items-center gap-1 transition-colors" style={{color:'#9b6b6b'}}
              >View Risk Monitor <ChevronRight size={10}/></button>
            </>
          ) : (
            <p className="text-nuvia-subtle text-xs leading-relaxed">
              Risk analysis will appear after your first conversation.
            </p>
          )}
        </motion.div>

        {/* Relevant memory */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.22}}
          className="bg-white rounded-2xl border border-nuvia-border overflow-hidden shadow-warm-sm"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-nuvia-border">
            <div className="flex items-center gap-2">
              <Database size={13} style={{color:'#3d6b4a'}}/>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:'#3d6b4a'}}>Relevant Memory</p>
            </div>
            <button onClick={() => navigate('/app/memory')} className="text-nuvia-subtle hover:text-nuvia-muted text-[11px] flex items-center gap-1 transition-colors">
              View all<ChevronRight size={10}/>
            </button>
          </div>
          <div className="divide-y divide-nuvia-border">
            {dm.slice(0,2).map((m) => (
              <div key={m.id} className="px-5 py-3">
                <p className="text-xs leading-relaxed mb-1 line-clamp-2" style={{color:'#1a1008'}}>{m.content}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-nuvia-subtle">{m.source} · {fmt(m.date)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{background:'#fdf0f0',color:'#7a3f3f'}}>
                    {Math.round(m.relevance*100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content grid — conversations + memory + flow */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Recent conversations */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.26}}
          className="lg:col-span-3 bg-white rounded-3xl border border-nuvia-border overflow-hidden shadow-warm-sm"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-nuvia-border">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} style={{color:'#4a1f1f'}}/>
              <h3 className="text-sm font-semibold" style={{color:'#1a1008'}}>Recent conversations</h3>
            </div>
            <button onClick={() => navigate('/app/conversations')} className="text-nuvia-subtle hover:text-nuvia-muted text-xs flex items-center gap-1 transition-colors">
              View all <ChevronRight size={11}/>
            </button>
          </div>
          <div className="divide-y divide-nuvia-border">
            {dc.slice(0,3).map((c,i) => (
              <motion.button key={c.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:0.28+i*0.06}}
                onClick={() => navigate('/app/conversations')}
                className="w-full px-5 py-4 flex items-start gap-3 hover:bg-nuvia-surface text-left group transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:'#fdf0f0'}}>
                  <Mic size={12} style={{color:'#4a1f1f'}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-nuvia-text group-hover:text-nuvia-brown transition-colors">Voice session</p>
                    <AttentionBadge level={c.attention_level as 'LOW'|'NEEDS ATTENTION'|'URGENT'}/>
                  </div>
                  <p className="text-nuvia-muted text-xs line-clamp-1 mb-1">{c.preview}</p>
                  <div className="flex items-center gap-1.5 text-nuvia-subtle text-[11px]">
                    <Clock size={9}/><span>{timeAgo(c.timestamp)}</span>
                    <span>·</span><span className="capitalize">{c.language}</span>
                  </div>
                </div>
                <ChevronRight size={12} className="text-nuvia-border group-hover:text-nuvia-subtle transition-colors flex-shrink-0 mt-1"/>
              </motion.button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-nuvia-border">
            <button onClick={() => navigate('/app/talk')}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-1 transition-colors"
              style={{color:'#4a1f1f'}}
            ><Mic size={11}/>Start a new conversation</button>
          </div>
        </motion.div>

        {/* Right col */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Quick nav */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="grid grid-cols-3 gap-2.5">
            {[
              { icon:<Mic size={15}/>,          label:'Talk',      to:'/app/talk',          c:'rose' },
              { icon:<MessageSquare size={15}/>, label:'Convos',    to:'/app/conversations', c:'rose' },
              { icon:<Database size={15}/>,      label:'Memory',    to:'/app/memory',        c:'sage' },
            ].map(a => (
              <button key={a.to} onClick={() => navigate(a.to)}
                className="bg-white rounded-xl border border-nuvia-border p-3 flex flex-col items-center gap-1.5 hover:shadow-warm transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  style={{background:a.c==='rose'?'#fdf0f0':'#f0f7f0',color:a.c==='rose'?'#4a1f1f':'#3d6b4a'}}
                >{a.icon}</div>
                <p className="text-[11px] font-semibold" style={{color:'#1a1008'}}>{a.label}</p>
              </button>
            ))}
          </motion.div>

          {/* Flow strip */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.34}}
            className="bg-white rounded-2xl border border-nuvia-border p-4 shadow-warm-sm"
          >
            <p className="text-xs font-semibold mb-3" style={{color:'#1a1008'}}>How Nuvia works</p>
            <div className="flex items-center gap-0.5">
              {FLOW.map((s,i) => (
                <div key={s.label} className="flex items-center gap-0.5 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{background:s.c==='rose'?'#fdf0f0':'#f0f7f0',color:s.c==='rose'?'#4a1f1f':'#3d6b4a'}}
                    >{s.icon}</div>
                    <span className="text-[8px] text-nuvia-subtle font-medium text-center leading-tight">{s.label}</span>
                  </div>
                  {i < FLOW.length-1 && <div className="step-connector flex-1 mx-0.5 mb-4"/>}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/app/how-it-works')}
              className="mt-2.5 text-[11px] flex items-center gap-1 transition-colors" style={{color:'#9b6b6b'}}
            >Learn more <ChevronRight size={10}/></button>
          </motion.div>

          {/* High-trust */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.38}}
            className="bg-white rounded-2xl border p-4 shadow-warm-sm"
            style={{borderColor:'rgba(61,107,74,0.15)'}}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <AlertCircle size={12} style={{color:'#3d6b4a'}}/>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{color:'#3d6b4a'}}>High-trust mode</p>
            </div>
            <div className="space-y-1.5">
              {['You confirm what Nuvia understood','Relevant context is surfaced','Nuvia does not diagnose','You stay in control'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-[11px] text-nuvia-muted">
                  <span style={{color:'#3d6b4a'}}>✓</span>{item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  )
}
