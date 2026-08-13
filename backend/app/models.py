from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class Language(str, Enum):
    english = "english"
    hindi = "hindi"
    hinglish = "hinglish"


class AttentionLevel(str, Enum):
    low = "LOW"
    needs_attention = "NEEDS ATTENTION"
    urgent = "URGENT"


# ── Conversation state machine ────────────────────────────────────────────────
class ConvState(str, Enum):
    idle = "IDLE"
    listening = "LISTENING"
    processing_speech = "PROCESSING_SPEECH"
    understanding = "UNDERSTANDING"
    waiting_confirmation = "WAITING_FOR_CONFIRMATION"
    retrieving_context = "RETRIEVING_CONTEXT"
    generating_response = "GENERATING_RESPONSE"
    speaking = "SPEAKING"
    interrupted = "INTERRUPTED"
    recovering = "RECOVERING"
    completed = "COMPLETED"
    error = "ERROR"


# ── Request/Response models ───────────────────────────────────────────────────

class ConversationRequest(BaseModel):
    text: str
    language: Language = Language.hinglish
    session_id: Optional[str] = None
    turn_id: Optional[str] = None          # client-generated, prevents duplicate processing
    user_id: Optional[str] = "demo_user"   # future auth hook


class UnderstoodItem(BaseModel):
    label: str
    detail: str


class MemoryItem(BaseModel):
    id: str
    content: str
    source: str
    date: str
    relevance: float
    tags: List[str] = []


# ── AI internal models ────────────────────────────────────────────────────────

class ExtractedSymptom(BaseModel):
    item: str
    duration: Optional[str] = None
    timing: Optional[str] = None


class AIUnderstanding(BaseModel):
    intent: str
    keywords: List[str] = Field(default_factory=list)
    is_health_related: bool = True


class AIContextualResponse(BaseModel):
    intent: str
    understanding: str
    response: str
    question: Optional[str] = None
    attention_level: str
    guidance: Optional[str] = None
    why: List[str] = Field(default_factory=list)
    emergency: bool = False


# ── Latency telemetry ─────────────────────────────────────────────────────────

class TurnLatency(BaseModel):
    turn_id: str
    stt_ms: Optional[float] = None
    qdrant_ms: Optional[float] = None
    llm_ms: Optional[float] = None
    rime_ms: Optional[float] = None
    total_ms: Optional[float] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


# ── Conversation audit event ──────────────────────────────────────────────────

class ConversationEvent(BaseModel):
    session_id: str
    turn_id: str
    event: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    data: Optional[Dict[str, Any]] = None


# ── Full conversation response ────────────────────────────────────────────────

class ConversationResponse(BaseModel):
    intent: str
    understanding: str
    memories: List[MemoryItem]
    response: str
    question: Optional[str] = None
    attention_level: AttentionLevel
    guidance: Optional[str] = None
    why: List[str]
    summary: Dict[str, Any]
    demo_retrieval: bool
    ai_powered: bool = True
    session_id: Optional[str] = None
    turn_id: Optional[str] = None
    latency: Optional[TurnLatency] = None
    is_health_related: bool = True
    handoff_suggested: bool = False        # True when urgent escalation is advised
    handoff_summary: Optional[str] = None


# ── TTS ───────────────────────────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    language: Language = Language.hinglish
    session_id: Optional[str] = None
    turn_id: Optional[str] = None


# ── Status ────────────────────────────────────────────────────────────────────

class StatusResponse(BaseModel):
    qdrant: str   # "live" | "demo"
    rime: str     # "live" | "demo"
    ai: str       # "live" | "demo"
    barge_in_supported: bool = True
    reconnect_supported: bool = True
    memory_isolation: bool = True


# ── Memory management ─────────────────────────────────────────────────────────

class MemoryCreateRequest(BaseModel):
    content: str
    tags: List[str] = []
    source: str = "conversation"
    user_id: str = "demo_user"
    session_id: Optional[str] = None


# ── Conversation record (persisted) ──────────────────────────────────────────

class ConversationRecord(BaseModel):
    id: str
    preview: str
    full_text: str
    language: str
    timestamp: str
    attention_level: str
    # Rich detail stored so detail panel works with real data
    intent: Optional[str] = None
    understanding: Optional[str] = None
    response: Optional[str] = None
    question: Optional[str] = None
    guidance: Optional[str] = None
    memories_used: Optional[List[str]] = None
    session_id: Optional[str] = None
    turn_id: Optional[str] = None
    latency: Optional[Dict[str, Any]] = None


# ── Handoff ───────────────────────────────────────────────────────────────────

class HandoffRequest(BaseModel):
    session_id: str
    conversation_ids: List[str] = Field(default_factory=list)
    user_id: str = "demo_user"


class HandoffSummary(BaseModel):
    session_id: str
    generated_at: str
    reported_concerns: List[str]
    relevant_history: List[str]
    attention_level: str
    disclaimer: str = (
        "This is a summary of what was shared conversationally with Nuvia. "
        "It does not constitute a medical diagnosis. "
        "Please consult a qualified healthcare professional."
    )


# ── History query ─────────────────────────────────────────────────────────────

class HistoryQueryRequest(BaseModel):
    query: str
    language: Language = Language.hinglish
    user_id: str = "demo_user"
    limit: int = 5


class HistoryQueryResponse(BaseModel):
    answer: str
    related_conversations: List[str] = Field(default_factory=list)
    memories_found: int = 0
    spoken_answer: Optional[str] = None  # shorter version for TTS
