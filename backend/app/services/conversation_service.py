"""
Conversation Service — Nuvia
============================
Orchestration:
  1. AI understanding  (ai_service)
  2. Qdrant retrieval  (qdrant_service)
  3. AI contextual response
  4. Memory persistence back to Qdrant
  5. Latency telemetry
  6. Auditable event log
  7. Handoff summary generation
"""

import time
import uuid
from typing import List, Dict, Optional

from app.models import (
    AttentionLevel, ConversationResponse,
    MemoryItem, Language, AIUnderstanding,
    TurnLatency, HandoffSummary, HistoryQueryResponse,
)
from app.services import ai_service

# ── In-memory audit event log (demo) ─────────────────────────────────────────
_event_log: List[Dict] = []
# Seen turn_ids — prevent duplicate processing
_processed_turns: set = set()


def log_event(session_id: str, turn_id: str, event: str, data: Optional[Dict] = None):
    _event_log.append({
        "session_id": session_id,
        "turn_id": turn_id,
        "event": event,
        "data": data or {},
    })
    if len(_event_log) > 500:
        _event_log.pop(0)


def get_events(session_id: str) -> List[Dict]:
    return [e for e in _event_log if e["session_id"] == session_id]


# ══════════════════════════════════════════════════════════════════════════════
#  MEMORY AUTO-SAVE
# ══════════════════════════════════════════════════════════════════════════════

async def _maybe_save_memory(
    text: str,
    intent: str,
    keywords: List[str],
    attention_level: AttentionLevel,
    user_id: str,
    session_id: str,
    language: Language,
) -> None:
    """Persist important conversation context back to Qdrant."""
    from app.services import qdrant_service
    if not keywords and not intent:
        return
    
    # Build a concise memory string
    content = intent if intent else text[:100]
    if attention_level == AttentionLevel.urgent:
        content += " (Marked as urgent.)"
        
    tags = keywords[:3] + [language.value]
    if attention_level != AttentionLevel.low:
        tags.append(attention_level.value.lower().replace(" ", "_"))
        
    await qdrant_service.upsert_memory(
        content=content,
        tags=tags,
        source="conversation",
        user_id=user_id,
        session_id=session_id,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  HANDOFF SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

async def generate_handoff_summary(
    session_id: str,
    intent: str,
    understanding: str,
    memories: List[MemoryItem],
    attention_level: AttentionLevel,
) -> HandoffSummary:
    reported = [intent, understanding]
    history = [m.content for m in memories[:3]]
    return HandoffSummary(
        session_id=session_id,
        generated_at=__import__("datetime").datetime.now().isoformat(),
        reported_concerns=reported,
        relevant_history=history,
        attention_level=attention_level.value,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  HISTORY QUERY (voice can ask about past conversations)
# ══════════════════════════════════════════════════════════════════════════════

async def answer_history_query(
    query: str,
    language: Language,
    user_id: str,
) -> HistoryQueryResponse:
    from app.services import qdrant_service
    t0 = time.monotonic()
    memories, _ = await qdrant_service.search_memories(
        query, user_id=user_id, limit=5
    )
    qdrant_ms = (time.monotonic() - t0) * 1000

    if not memories:
        answer = "I couldn't find any previous conversations about that."
        spoken = answer
    else:
        count = len(memories)
        topics = "; ".join(m.content for m in memories[:2])
        answer = f"I found {count} relevant previous conversation(s). For example: {topics}"
        spoken = f"I found {count} relevant conversation{'s' if count != 1 else ''} about that."

    return HistoryQueryResponse(
        answer=answer,
        related_conversations=[m.id for m in memories],
        memories_found=len(memories),
        spoken_answer=spoken,
    )


def _ai_attention(raw: str) -> AttentionLevel:
    norm = ai_service.normalise_attention(raw)
    return {"URGENT": AttentionLevel.urgent,
            "NEEDS ATTENTION": AttentionLevel.needs_attention,
            "LOW": AttentionLevel.low}.get(norm, AttentionLevel.low)


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════════════════

async def process_conversation(
    text: str,
    language: Language,
    memories: List[MemoryItem],
    demo_retrieval: bool,
    session_id: Optional[str] = None,
    turn_id: Optional[str] = None,
    user_id: str = "demo_user",
    qdrant_ms: float = 0.0,
) -> ConversationResponse:
    """Full orchestration with latency tracking, dedup, and memory persistence."""

    session_id = session_id or str(uuid.uuid4())
    turn_id    = turn_id    or str(uuid.uuid4())

    # Duplicate turn prevention
    if turn_id in _processed_turns:
        log_event(session_id, turn_id, "duplicate_turn_skipped")
        return ConversationResponse(
            intent="Duplicate", understanding="Duplicate turn.",
            response="I already processed that.", memories=memories,
            question=None, attention_level=AttentionLevel.low,
            guidance=None, why=[], summary={}, demo_retrieval=demo_retrieval,
            session_id=session_id, turn_id=turn_id,
        )
    _processed_turns.add(turn_id)
    if len(_processed_turns) > 1000:
        _processed_turns.clear()

    log_event(session_id, turn_id, "speech_received", {"text_len": len(text)})
    t_total = time.monotonic()

    # ── Step 1: Understanding ─────────────────────────────────────────────────
    t_llm = time.monotonic()
    ai_und, ai_used = await ai_service.extract_understanding(text, language)
    llm_extract_ms = (time.monotonic() - t_llm) * 1000

    if not ai_used or not ai_und:
        # Fallback if AI is offline
        ai_und = AIUnderstanding(intent="Unknown", keywords=[], is_health_related=False)
        
    is_health = ai_und.is_health_related

    log_event(session_id, turn_id, "understanding_generated",
              {"intent": ai_und.intent, "ai_powered": ai_used})

    # ── Step 2: Contextual response ───────────────────────────────────────────
    t_resp = time.monotonic()
    from app.routes.profile import get_user_profile_data
    profile = get_user_profile_data(user_id)

    ai_resp, ai_resp_used = await ai_service.generate_contextual_response(
        understanding=ai_und,
        memories=memories,
        language=language,
        profile=profile,
    )
    llm_resp_ms = (time.monotonic() - t_resp) * 1000
    llm_total_ms = llm_extract_ms + llm_resp_ms

    if ai_resp_used and ai_resp:
        response_text = ai_resp.response
        intent_text = ai_resp.intent
        understanding_text = ai_resp.understanding
        question = ai_resp.question
        guidance = ai_resp.guidance
        attention_level = _ai_attention(ai_resp.attention_level)
        why = ai_resp.why or []
        summary = {"language": language.value}
        emergency = ai_resp.emergency
    else:
        # Fallback if AI offline
        intent_text = "System offline"
        understanding_text = "I couldn't process your request."
        response_text = "I'm sorry, my AI services are currently unavailable."
        question = None
        guidance = None
        attention_level = AttentionLevel.low
        why = ["AI service offline"]
        summary = {}
        emergency = False

    log_event(session_id, turn_id, "response_generated",
              {"attention": attention_level.value, "ai_powered": ai_resp_used})

    # ── Handoff suggestion ────────────────────────────────────────────────────
    handoff_suggested = emergency or attention_level == AttentionLevel.urgent
    handoff_summary_str: Optional[str] = None
    if handoff_suggested:
        hs = await generate_handoff_summary(
            session_id, intent_text, understanding_text, memories, attention_level
        )
        handoff_summary_str = (
            f"Reported: {hs.reported_concerns[0]}. "
            f"{hs.disclaimer}"
        )
        log_event(session_id, turn_id, "handoff_suggested")

    # ── Persist memory back to Qdrant ─────────────────────────────────────────
    if is_health and ai_used:
        try:
            await _maybe_save_memory(text, ai_und.intent, ai_und.keywords, attention_level, user_id, session_id, language)
            log_event(session_id, turn_id, "memory_stored", {"keywords": len(ai_und.keywords)})
        except Exception as e:
            log_event(session_id, turn_id, "memory_store_failed", {"error": str(e)})

    # ── Latency ───────────────────────────────────────────────────────────────
    total_ms = (time.monotonic() - t_total) * 1000
    latency = TurnLatency(
        turn_id=turn_id,
        qdrant_ms=round(qdrant_ms, 1),
        llm_ms=round(llm_total_ms, 1),
        total_ms=round(total_ms, 1),
    )

    log_event(session_id, turn_id, "turn_complete",
              {"total_ms": round(total_ms, 1), "ai_powered": ai_resp_used})

    return ConversationResponse(
        intent=intent_text,
        understanding=understanding_text,
        memories=memories,
        response=response_text,
        question=question,
        attention_level=attention_level,
        guidance=guidance,
        why=why,
        summary=summary,
        demo_retrieval=demo_retrieval,
        ai_powered=ai_resp_used,
        session_id=session_id,
        turn_id=turn_id,
        latency=latency,
        is_health_related=is_health,
        handoff_suggested=handoff_suggested,
        handoff_summary=handoff_summary_str,
    )

