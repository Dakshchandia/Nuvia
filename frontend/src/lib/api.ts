const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export interface ConversationRequest {
  text: string
  language: 'english' | 'hindi' | 'hinglish'
  session_id?: string
  turn_id?: string
  user_id?: string
}

export interface UnderstoodItem { label: string; detail: string }

export interface MemoryItem {
  id: string; content: string; source: string
  date: string; relevance: number; tags: string[]
}

export interface TurnLatency {
  turn_id: string
  stt_ms?: number; qdrant_ms?: number
  llm_ms?: number; rime_ms?: number; total_ms?: number
  timestamp: string
}

export interface ConversationResponse {
  intent: string
  understanding: string
  memories: MemoryItem[]
  response: string
  question?: string
  attention_level: 'LOW' | 'NEEDS ATTENTION' | 'URGENT'
  guidance?: string
  why: string[]
  summary: Record<string, unknown>
  demo_retrieval: boolean
  ai_powered: boolean
  session_id?: string
  turn_id?: string
  latency?: TurnLatency
  is_health_related?: boolean
  handoff_suggested?: boolean
  handoff_summary?: string
}

export interface StatusResponse {
  qdrant: 'live' | 'demo'
  rime: 'live' | 'demo'
  ai: 'live' | 'demo'
  barge_in_supported?: boolean
  reconnect_supported?: boolean
  memory_isolation?: boolean
}

export interface ConversationRecord {
  id: string; preview: string; full_text: string
  language: string; timestamp: string; attention_level: string
  intent?: string; understanding?: string; response?: string
  question?: string; guidance?: string
  memories_used?: string[]; session_id?: string; turn_id?: string
}

export interface HistoryQueryResponse {
  answer: string
  related_conversations: string[]
  memories_found: number
  spoken_answer?: string
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => apiFetch<{ status: string; version?: string }>('/health'),
  status: () => apiFetch<StatusResponse>('/api/status'),

  conversation: (req: ConversationRequest) =>
    apiFetch<ConversationResponse>('/api/conversation', {
      method: 'POST', body: JSON.stringify(req),
    }),

  memories: (userId = 'demo_user') =>
    apiFetch<MemoryItem[]>(`/api/memory?user_id=${userId}`),

  deleteMemory: (id: string, userId = 'demo_user') =>
    apiFetch<{ success: boolean }>(`/api/memory/${id}?user_id=${userId}`, { method: 'DELETE' }),

  conversations: () => apiFetch<ConversationRecord[]>('/api/conversations'),

  saveConversation: (req: ConversationRequest) =>
    apiFetch<{ success: boolean; id: string }>('/api/conversations', {
      method: 'POST', body: JSON.stringify(req),
    }),

  deleteConversation: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/conversations/${id}`, { method: 'DELETE' }),


  // Saves full pipeline detail — used after /api/conversation response
  saveConversationFull: (payload: {
    text: string; language: string; session_id?: string; turn_id?: string
    attention_level: string; intent: string; understanding: string; response: string
    question?: string; guidance?: string; memories_used: string[]
  }) =>
    apiFetch<{ success: boolean; id: string }>('/api/conversations/full', {
      method: 'POST', body: JSON.stringify(payload),
    }),

  historyQuery: (query: string, language = 'hinglish', userId = 'demo_user') =>
    apiFetch<HistoryQueryResponse>('/api/history-query', {
      method: 'POST',
      body: JSON.stringify({ query, language, user_id: userId, limit: 5 }),
    }),

  generateHandoff: (sessionId: string, userId = 'demo_user') =>
    apiFetch<{ reported_concerns: string[]; disclaimer: string; attention_level: string }>(
      '/api/handoff',
      { method: 'POST', body: JSON.stringify({ session_id: sessionId, user_id: userId }) },
    ),

  getAuditEvents: (sessionId: string) =>
    apiFetch<{ events: unknown[]; count: number }>(`/api/handoff/events/${sessionId}`),

  // Insights
  insights: () => apiFetch<{
    conversations_analyzed: number; memories_analyzed: number
    recurring_topics: { topic: string; count: number; description: string }[]
    insights: { type: string; title: string; description: string; topics?: string[] }[]
    timeline: { date: string; time: string; title: string; preview: string; attention_level: string; id: string }[]
    last_updated: string | null; has_data: boolean
    attention_counts?: Record<string, number>
  }>('/api/insights'),

  // Calendar
  calendar: (month?: string) =>
    apiFetch<{
      month: string
      days: { date: string; conversation_count: number; memory_count: number; has_attention_event: boolean; conversations: unknown[] }[]
    }>(`/api/calendar${month ? `?month=${month}` : ''}`),

  calendarDay: (date: string) =>
    apiFetch<{
      date: string
      conversations: { id: string; time: string; type: string; title: string; preview: string; attention_level: string; understood?: unknown[]; question?: string; guidance?: string; memories_used?: string[] }[]
      summary: string
    }>(`/api/calendar/${date}`),

  // Profile / onboarding
  getProfile: (userId = 'demo_user') =>
    apiFetch<{
      user_id: string; name: string; age: number | null
      pregnancy_status: string | null; pregnancy_month: number | null
      onboarding_complete: boolean; created_at: string; updated_at: string
    }>(`/api/profile?user_id=${userId}`),

  saveProfile: (data: {
    name: string; age: number
    pregnancy_status?: string; pregnancy_month?: number; user_id?: string
  }) =>
    apiFetch<{ user_id: string; name: string; onboarding_complete: boolean }>('/api/profile', {
      method: 'POST', body: JSON.stringify({ user_id: 'demo_user', ...data }),
    }),

  // Risk Monitor
  riskAnalyze: (userId = 'demo_user') =>
    apiFetch<{
      risk_level: string; signals: { signal:string; category:string; count:number; recurring:boolean; last_seen:string; last_date:string; days_since:number|null; source_memories:string[] }[]
      trend: string; explanation: string; recommended_action: string
      requires_emergency_response: boolean; signal_count: number; memory_count: number
      recurring_signals: string[]; worsening_detected: boolean; analyzed_at: string; demo: boolean
    }>(`/api/risk/analyze?user_id=${userId}`),

  getRiskSettings: (userId = 'demo_user') =>
    apiFetch<{
      user_id: string; emergency_response_enabled: boolean
      emergency_contact_name: string; emergency_contact_phone: string
      location_sharing_enabled: boolean; automation_preference: string
    }>(`/api/risk/settings?user_id=${userId}`),

  saveRiskSettings: (data: {
    user_id?: string; emergency_response_enabled: boolean
    emergency_contact_name: string; emergency_contact_phone: string
    location_sharing_enabled: boolean; automation_preference: string
  }) =>
    apiFetch<{ success: boolean }>('/api/risk/settings', {
      method: 'POST', body: JSON.stringify({ user_id: 'demo_user', ...data }),
    }),

  triggerSOS: (data: {
    risk_level: string; signals: string[]
    location_lat?: number; location_lon?: number
    location_address?: string; nearest_hospital?: string
    user_confirmed?: boolean; demo_mode?: boolean; user_id?: string
  }) =>
    apiFetch<{ id: string; notification_status: string; demo_mode: boolean; note?: string }>(
      '/api/risk/sos',
      { method: 'POST', body: JSON.stringify({ user_id: 'demo_user', ...data }) }
    ),

  sosHistory: (userId = 'demo_user') =>
    apiFetch<{ events: { id:string; timestamp:string; risk_level:string; trigger_signals:string[]; user_confirmed:boolean; location_available:boolean; nearest_hospital:string|null; notification_status:string; demo_mode:boolean; note?:string }[]; count: number }>(
      `/api/risk/sos/history?user_id=${userId}`
    ),

  tts: async (text: string, language: string): Promise<{ audio?: Blob; demo?: boolean; text?: string }> => {
    const res = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    })
    const source = res.headers.get('X-TTS-Source')
    if (source === 'rime' && res.ok) {
      const blob = await res.blob()
      return { audio: blob }
    }
    const json = await res.json()
    return { demo: true, text: json.text }
  },
}
