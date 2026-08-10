import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Settings, ChevronRight, RefreshCw, Shield, Mic, Volume2 } from 'lucide-react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'

type RiskLevel = 'low' | 'watch' | 'elevated' | 'urgent'

interface RiskData {
  risk_level: RiskLevel; signals: Signal[]; trend: string
  explanation: string; recommended_action: string
  requires_emergency_response: boolean; signal_count: number
  memory_count: number; recurring_signals: string[]
  worsening_detected: boolean; analyzed_at: string; demo: boolean
}
interface Signal {
  signal: string; category: string; count: number; recurring: boolean
  last_seen: string; last_date: string; days_since: number|null; source_memories: string[]
}
interface EmergencySettings {
  emergency_response_enabled: boolean; emergency_contact_name: string
  emergency_contact_phone: string; location_sharing_enabled: boolean
  automation_preference: string
}
interface SOSEvent {
  id: string; timestamp: string; risk_level: string; trigger_signals: string[]
  user_confirmed: boolean; location_available: boolean
  nearest_hospital: string|null; notification_status: string; demo_mode: boolean; note?: string
}

const RISK_CONFIG: Record<RiskLevel, { label:string; bg:string; border:string; dot:string; text:string; icon: React.ReactNode; desc:string }> = {
  low:      { label:'LOW',      bg:'#f0f7f0', border:'rgba(61,107,74,0.2)',  dot:'#3d6b4a', text:'#2d5a3a', icon:<CheckCircle size={18}/>, desc:'Nothing concerning detected recently.' },
  watch:    { label:'WATCH',    bg:'#fffbeb', border:'rgba(180,130,60,0.2)', dot:'#c08030', text:'#8a5020', icon:<Clock size={18}/>,       desc:'Some patterns may need attention.' },
  elevated: { label:'ELEVATED', bg:'#fff7ed', border:'rgba(200,100,30,0.2)', dot:'#c06020', text:'#7a4010', icon:<AlertTriangle size={18}/>,desc:'Repeated signals suggest professional attention.' },
  urgent:   { label:'URGENT',   bg:'#fff1f1', border:'rgba(180,60,60,0.25)', dot:'#c03030', text:'#8a1515', icon:<AlertTriangle size={18}/>,desc:'Potentially serious signals detected.' },
}

const CAT_COLORS: Record<string,{bg:string;text:string}> = {
  urgent:   { bg:'#fff1f1', text:'#8a1515' },
  elevated: { bg:'#fff7ed', text:'#7a4010' },
  watch:    { bg:'#fffbeb', text:'#8a5020' },
}

function fmtTime(iso:string){ try{ return new Date(iso).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) }catch{return iso} }

function RiskStatusCard({ data }: { data: RiskData }) {
  const cfg = RISK_CONFIG[data.risk_level as RiskLevel] ?? RISK_CONFIG.low
  return (
    <div className="rounded-2xl border p-6" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'white', color: cfg.text, border: `1px solid ${cfg.border}` }}
        >{cfg.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }}/>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: cfg.text }}>
              Current risk status: {cfg.label}
            </p>
          </div>
          <p className="text-sm leading-relaxed mb-2" style={{ color: '#1a1008' }}>{data.explanation}</p>
          <p className="text-xs text-nuvia-muted leading-relaxed">{data.recommended_action}</p>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-nuvia-subtle flex-wrap">
            <span>{data.memory_count} memories analyzed</span>
            <span>·</span>
            <span>{data.signal_count} signal{data.signal_count !== 1 ? 's' : ''} found</span>
            <span>·</span>
            <span>Trend: {data.trend}</span>
            <span>·</span>
            <span>Updated {fmtTime(data.analyzed_at)}</span>
          </div>
          <p className="text-[10px] text-nuvia-subtle/70 mt-2 italic">
            Not a medical diagnosis. This is a conversational pattern assessment.
          </p>
        </div>
      </div>
    </div>
  )
}

function SignalCards({ signals }: { signals: Signal[] }) {
  if (!signals.length) return <p className="text-nuvia-subtle text-sm italic">No specific signals detected.</p>
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {signals.map((s, i) => {
        const cc = CAT_COLORS[s.category] ?? CAT_COLORS.watch
        return (
          <motion.div key={s.signal} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
            className="bg-white rounded-xl border border-nuvia-border p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-semibold capitalize" style={{ color:'#1a1008' }}>{s.signal}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0"
                style={{ background: cc.bg, color: cc.text }}>
                {s.category}
              </span>
            </div>
            <div className="space-y-0.5 text-[11px] text-nuvia-subtle">
              <p>Mentioned {s.count} time{s.count!==1?'s':''}</p>
              {s.last_seen && <p>Last seen: {s.last_seen}</p>}
              {s.recurring && <p className="font-semibold" style={{ color:'#c08030' }}>↺ Recurring pattern</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function SOSPanel({ riskData, settings, language }: { riskData: RiskData; settings: EmergencySettings; language: string }) {
  const [phase, setPhase] = useState<'idle'|'confirm'|'locating'|'done'>('idle')
  const [location, setLocation] = useState<{ lat:number; lon:number; address:string } | null>(null)
  const [hospital, setHospital] = useState<string|null>(null)
  const [sosResult, setSosResult] = useState<{ notification_status:string; demo_mode:boolean; note?:string } | null>(null)
  const [isDemoMode] = useState(!settings.emergency_contact_name || !settings.emergency_contact_phone)

  const handleSOS = async (confirmed: boolean) => {
    if (!confirmed) { setPhase('idle'); return }
    setPhase('locating')
    let lat: number|undefined, lon: number|undefined, address = ''
    let nearestHospital: string|null = null

    if (settings.location_sharing_enabled && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        )
        lat = pos.coords.latitude; lon = pos.coords.longitude
        // Reverse geocode via OpenStreetMap Nominatim (free, no key)
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          const d = await r.json()
          address = d.display_name?.split(',').slice(0,3).join(', ') || ''
          // Search nearby hospitals
          const hr = await fetch(`https://nominatim.openstreetmap.org/search?q=hospital&format=json&limit=1&viewbox=${lon-0.05},${lat+0.05},${lon+0.05},${lat-0.05}&bounded=1`)
          const hd = await hr.json()
          if (hd[0]) nearestHospital = hd[0].display_name?.split(',').slice(0,2).join(', ') || null
        } catch { /**/ }
        setLocation({ lat, lon, address })
        setHospital(nearestHospital)
      } catch { /**/ }
    }

    const result = await api.triggerSOS({
      risk_level: riskData.risk_level,
      signals: riskData.signals.slice(0,5).map(s=>s.signal),
      location_lat: lat, location_lon: lon,
      location_address: address || undefined,
      nearest_hospital: nearestHospital || undefined,
      user_confirmed: true,
      demo_mode: isDemoMode,
    })
    setSosResult(result)
    setPhase('done')

    // Speak confirmation
    const lang = language === 'english' ? 'en-IN' : 'hi-IN'
    const msg = isDemoMode
      ? 'This is a demo simulation. In a real emergency, your contact would be notified.'
      : 'Emergency response initiated. Your contact has been logged for notification.'
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(msg)
    u.lang = lang; u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  if (riskData.risk_level !== 'urgent' && riskData.risk_level !== 'elevated') return null

  return (
    <div className="rounded-2xl border p-5" style={{ background:'#fff1f1', borderColor:'rgba(180,60,60,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} style={{ color:'#c03030' }}/>
        <p className="text-sm font-bold" style={{ color:'#8a1515' }}>Emergency Response</p>
        {isDemoMode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 ml-auto">DEMO</span>}
      </div>

      {phase === 'idle' && (
        <>
          <p className="text-xs text-nuvia-muted mb-3 leading-relaxed">
            {isDemoMode
              ? 'No emergency contact configured. This will run as a demo simulation.'
              : `Emergency contact: ${settings.emergency_contact_name}`
            }
          </p>
          <button onClick={() => setPhase('confirm')}
            className="btn-primary text-sm flex items-center gap-2 w-full justify-center"
            style={{ background:'#c03030' }}
          >
            <Phone size={14}/> {isDemoMode ? 'Run Demo SOS' : 'Activate Emergency Response'}
          </button>
        </>
      )}

      {phase === 'confirm' && (
        <div className="space-y-3">
          <p className="text-sm font-medium" style={{ color:'#1a1008' }}>
            {isDemoMode ? 'Run demo emergency simulation?' : 'Activate emergency response?'}
          </p>
          <p className="text-xs text-nuvia-muted">
            {isDemoMode ? 'No real notification will be sent.' : `Will log notification for ${settings.emergency_contact_name} (${settings.emergency_contact_phone}).`}
          </p>
          <div className="flex gap-2">
            <button onClick={() => handleSOS(true)} className="btn-primary flex-1 text-sm py-2" style={{ background:'#c03030' }}>Confirm</button>
            <button onClick={() => setPhase('idle')} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}

      {phase === 'locating' && (
        <div className="flex items-center gap-2 text-sm text-nuvia-muted">
          <span className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"/>
          Getting location &amp; finding nearest care…
        </div>
      )}

      {phase === 'done' && sosResult && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2"><CheckCircle size={14} style={{ color:'#3d6b4a' }}/><p className="text-xs font-semibold" style={{ color:'#2d5a3a' }}>Emergency response logged</p></div>
          {location?.address && <p className="text-xs text-nuvia-muted flex items-center gap-1"><MapPin size={10}/>Location: {location.address}</p>}
          {hospital && <p className="text-xs text-nuvia-muted flex items-center gap-1"><MapPin size={10}/>Nearest care: {hospital}</p>}
          <p className="text-xs text-nuvia-subtle">Status: {sosResult.notification_status.replace(/_/g,' ')}</p>
          {sosResult.note && <p className="text-[11px] text-nuvia-subtle italic">{sosResult.note}</p>}
        </div>
      )}
    </div>
  )
}

function SettingsPanel({ settings, onSave }: { settings: EmergencySettings; onSave: (s: EmergencySettings) => void }) {
  const [local, setLocal] = useState<EmergencySettings>({ ...settings })
  const [saved, setSaved] = useState(false)
  const save = async () => {
    await api.saveRiskSettings(local)
    onSave(local); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="bg-white rounded-2xl border border-nuvia-border p-5 space-y-4">
      <p className="text-sm font-semibold" style={{ color:'#1a1008' }}>Emergency Settings</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-nuvia-subtle uppercase tracking-widest block mb-1">Contact name</label>
          <input value={local.emergency_contact_name} onChange={e=>setLocal({...local,emergency_contact_name:e.target.value})}
            placeholder="e.g. Mother" className="w-full px-3 py-2 text-sm rounded-xl border border-nuvia-border focus:outline-none focus:border-nuvia-brown/40 bg-nuvia-surface" style={{ color:'#1a1008' }}/>
        </div>
        <div>
          <label className="text-[11px] text-nuvia-subtle uppercase tracking-widest block mb-1">Contact phone</label>
          <input value={local.emergency_contact_phone} onChange={e=>setLocal({...local,emergency_contact_phone:e.target.value})}
            placeholder="+91 XXXXX XXXXX" className="w-full px-3 py-2 text-sm rounded-xl border border-nuvia-border focus:outline-none focus:border-nuvia-brown/40 bg-nuvia-surface" style={{ color:'#1a1008' }}/>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color:'#1a1008' }}>Emergency response</p>
          <p className="text-[11px] text-nuvia-subtle">Enable SOS workflow</p>
        </div>
        <button onClick={() => setLocal({...local,emergency_response_enabled:!local.emergency_response_enabled})}
          className={`w-10 h-5 rounded-full transition-all relative ${local.emergency_response_enabled?'bg-nuvia-brown':'bg-nuvia-border'}`}
        ><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.emergency_response_enabled?'left-5.5':'left-0.5'}`} style={{ left: local.emergency_response_enabled?'calc(100% - 18px)':'2px' }}/></button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color:'#1a1008' }}>Location sharing</p>
          <p className="text-[11px] text-nuvia-subtle">Share location during emergency</p>
        </div>
        <button onClick={() => setLocal({...local,location_sharing_enabled:!local.location_sharing_enabled})}
          className={`w-10 h-5 rounded-full transition-all relative ${local.location_sharing_enabled?'bg-nuvia-brown':'bg-nuvia-border'}`}
        ><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: local.location_sharing_enabled?'calc(100% - 18px)':'2px' }}/></button>
      </div>
      <div>
        <label className="text-[11px] text-nuvia-subtle uppercase tracking-widest block mb-1">Automation</label>
        <div className="flex gap-2">
          {[['ask','Ask me first'],['auto','Auto-escalate']].map(([v,l])=>(
            <button key={v} onClick={()=>setLocal({...local,automation_preference:v})}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${local.automation_preference===v?'border-nuvia-brown bg-nuvia-rose text-nuvia-brown':'border-nuvia-border text-nuvia-muted'}`}
            >{l}</button>
          ))}
        </div>
      </div>
      <button onClick={save} className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
        {saved ? <><CheckCircle size={14}/>Saved</> : 'Save Settings'}
      </button>
    </div>
  )
}

export function RiskMonitorPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [settings, setSettings] = useState<EmergencySettings | null>(null)
  const [history, setHistory] = useState<SOSEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [tab, setTab] = useState<'overview'|'settings'|'history'>('overview')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rd, st, hist] = await Promise.all([
        api.riskAnalyze(), api.getRiskSettings(), api.sosHistory()
      ])
      setRiskData(rd as RiskData); setSettings(st); setHistory(hist.events)
    } catch { /**/ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleReanalyze = async () => {
    setAnalyzing(true)
    try { const rd = await api.riskAnalyze(); setRiskData(rd as RiskData) } catch { /**/ }
    finally { setAnalyzing(false) }
    // Brief voice feedback
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance('Analysis complete.')
    u.lang = language === 'english' ? 'en-IN' : 'hi-IN'; u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto pb-20" style={{ background:'#f7f3ee', minHeight:'100%' }}>
      {/* Header */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-6">
        <p className="text-[10px] text-nuvia-subtle font-semibold uppercase tracking-widest mb-0.5">NUVIA / RISK MONITOR</p>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily:'"Playfair Display",serif', color:'#1a1008' }}>
              Risk Monitor
            </h1>
            <p className="text-nuvia-muted text-sm mt-1 max-w-lg">
              Nuvia looks for important patterns across your memories. This is a conversational support tool — not a medical diagnostic system.
            </p>
          </div>
          <button onClick={handleReanalyze} disabled={analyzing}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4 flex-shrink-0"
          >
            <RefreshCw size={13} className={analyzing ? 'animate-spin' : ''}/>
            {analyzing ? 'Analyzing…' : 'Re-analyze'}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['overview','Overview'],['settings','Emergency Settings'],['history','Response History']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${tab===v?'border-nuvia-brown text-nuvia-brown bg-nuvia-rose':'border-nuvia-border text-nuvia-muted hover:border-nuvia-brown/30'}`}
          >{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-nuvia-subtle text-sm">
          <span className="w-3 h-3 border-2 border-nuvia-border border-t-nuvia-brown rounded-full animate-spin"/>Analyzing memories…
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* OVERVIEW TAB */}
          {tab === 'overview' && riskData && (
            <motion.div key="overview" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-5">
              <RiskStatusCard data={riskData} />

              {/* Signals */}
              {riskData.signals.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-3" style={{ color:'#1a1008' }}>
                    Signals Nuvia noticed
                  </h2>
                  <SignalCards signals={riskData.signals} />
                </div>
              )}

              {/* Recurring / worsening */}
              {(riskData.recurring_signals.length > 0 || riskData.worsening_detected) && (
                <div className="bg-white rounded-2xl border border-nuvia-border p-4">
                  <p className="text-xs font-semibold mb-2" style={{ color:'#1a1008' }}>Pattern analysis</p>
                  {riskData.recurring_signals.length > 0 && (
                    <p className="text-xs text-nuvia-muted mb-1">↺ Recurring: {riskData.recurring_signals.slice(0,4).join(', ')}</p>
                  )}
                  {riskData.worsening_detected && (
                    <p className="text-xs" style={{ color:'#c06020' }}>↑ Recent signals are more frequent than earlier this week</p>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div className="bg-white rounded-2xl border border-nuvia-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={13} style={{ color:'#3d6b4a' }}/>
                  <p className="text-xs font-semibold" style={{ color:'#1a1008' }}>Why am I seeing this?</p>
                </div>
                <p className="text-xs text-nuvia-muted leading-relaxed">{riskData.explanation}</p>
                <button onClick={() => navigate('/app/memory')} className="mt-2 text-[11px] flex items-center gap-1" style={{ color:'#9b6b6b' }}>
                  View source memories <ChevronRight size={10}/>
                </button>
              </div>

              {/* Emergency SOS panel — only shows for elevated/urgent */}
              {settings && (riskData.risk_level === 'urgent' || riskData.risk_level === 'elevated') && (
                <SOSPanel riskData={riskData} settings={settings} language={language} />
              )}

              {/* No memory CTA */}
              {riskData.memory_count === 0 && (
                <div className="bg-white rounded-2xl border border-nuvia-border p-8 text-center">
                  <Activity size={28} className="mx-auto mb-3 text-nuvia-border"/>
                  <p className="font-medium text-sm mb-1" style={{ color:'#1a1008' }}>No memories to analyze yet</p>
                  <p className="text-nuvia-subtle text-xs mb-4">Start talking with Nuvia to build conversation context.</p>
                  <button onClick={() => navigate('/app/talk')} className="btn-primary text-xs">Talk to Nuvia</button>
                </div>
              )}
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {tab === 'settings' && settings && (
            <motion.div key="settings" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <SettingsPanel settings={settings} onSave={setSettings} />
              <p className="text-[11px] text-nuvia-subtle text-center mt-4 leading-relaxed">
                Emergency contact information is stored only on this device session.<br/>
                Real SMS/notification requires a notification provider to be configured server-side.
              </p>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              {history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-nuvia-border p-8 text-center">
                  <p className="text-nuvia-subtle text-sm">No emergency events logged yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(ev => (
                    <div key={ev.id} className="bg-white rounded-2xl border border-nuvia-border p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs font-semibold" style={{ color:'#1a1008' }}>{fmtTime(ev.timestamp)}</p>
                          <p className="text-[11px] text-nuvia-subtle uppercase">{ev.risk_level}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ev.demo_mode && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">DEMO</span>}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-nuvia-surface text-nuvia-subtle border border-nuvia-border">
                            {ev.notification_status.replace(/_/g,' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ev.trigger_signals.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-nuvia-surface border border-nuvia-border text-nuvia-muted capitalize">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-nuvia-subtle flex-wrap">
                        {ev.user_confirmed && <span className="flex items-center gap-1"><CheckCircle size={10} style={{ color:'#3d6b4a' }}/>Confirmed</span>}
                        {ev.location_available && <span className="flex items-center gap-1"><MapPin size={10}/>Location shared</span>}
                        {ev.nearest_hospital && <span className="flex items-center gap-1"><MapPin size={10}/>{ev.nearest_hospital}</span>}
                      </div>
                      {ev.note && <p className="text-[11px] text-nuvia-subtle mt-1.5 italic">{ev.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  )
}
