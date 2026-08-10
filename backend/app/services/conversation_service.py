"""
Conversation Service — Nuvia
============================
Orchestration:
  1. AI understanding  (ai_service)   → rule-based fallback
  2. Qdrant retrieval  (qdrant_service)
  3. AI contextual response           → rule-based fallback
  4. Memory persistence back to Qdrant
  5. Latency telemetry
  6. Auditable event log
  7. Handoff summary generation
"""

import re
import time
import uuid
from typing import List, Dict, Tuple, Optional

from app.models import (
    UnderstoodItem, AttentionLevel, ConversationResponse,
    MemoryItem, Language, AIUnderstanding, ExtractedSymptom,
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
#  RULE-BASED FALLBACK
# ══════════════════════════════════════════════════════════════════════════════

SYMPTOM_KEYWORDS: Dict[str, List[str]] = {
    "headache":       ["headache","sir dard","sar dard","head pain","sirdard","maatha dard"],
    "dizziness":      ["dizziness","dizzy","chakkar","vertigo","ghoomna"],
    "fever":          ["fever","bukhar","temperature","garmi"],
    "nausea":         ["nausea","ulti","vomit","ji machal"],
    "fatigue":        ["fatigue","tired","thakaan","kamzori","weakness","energy nahi"],
    "chest pain":     ["chest pain","seene mein dard","seena dard","chest tight"],
    "cough":          ["cough","khansi","khaansi"],
    "cold":           ["cold","sardi","naak behna","band naak"],
    "body ache":      ["body ache","badan dard","body pain","jodo mein dard"],
    "stomach pain":   ["stomach pain","pet mein dard","pet dard","pait dard"],
    "swelling":       ["swelling","sujan","sooja"],
    "rash":           ["rash","khujli","itching","daane"],
    "sleep issues":   ["neend nahi","insomnia","so nahi pata"],
    "anxiety":        ["anxiety","ghabrahat","tension","chinta","bechain"],
    "breathing":      ["saas","breathing","breathlessness","saas phoolna"],
    "back pain":      ["kamar dard","back pain","peeth dard"],
    "throat":         ["gala dard","throat pain","gale mein dard"],
    "blood pressure": ["bp","blood pressure","hypertension"],
}

DURATION_PATTERNS = [
    (r"kal se",            "Since yesterday"),
    (r"aaj se",            "Since today"),
    (r"(\d+)\s*din se",    r"Since \1 day(s)"),
    (r"(\d+)\s*ghante se", r"Since \1 hour(s)"),
    (r"kuch ghanton se",   "Since a few hours"),
    (r"kuch dino se",      "Since a few days"),
    (r"since yesterday",   "Since yesterday"),
    (r"for (\d+) day",     r"For \1 day(s)"),
    (r"abhi bhi",          "Still ongoing"),
    (r"abhi",              "Right now"),
    (r"aaj",               "Today"),
    (r"subah se",          "Since morning"),
]

URGENCY_URGENT = [
    "chest pain","seene mein dard","heart attack","breathlessness",
    "saas nahi","unconscious","behosh","khoon","blood",
    "stroke","paralysis","seizure","fit","emergency",
]
URGENCY_NEEDS = [
    "fever","bukhar","swelling","sujan","vomit","ulti",
    "chakkar","dizziness","blood pressure","diabetes","lagatar",
]

FOLLOW_UP: Dict[str, str] = {
    "headache+dizziness": "Theek hai. Kya abhi bhi dizziness ya chakkar ho raha hai?",
    "headache":           "Headache kitna tez hai — halka ya bahut zyada?",
    "dizziness":          "Chakkar lete waqt hota hai ya khade hone par bhi?",
    "fever":              "Bukhar kitna hai? Kya temperature measure kiya?",
    "chest pain":         "Seene ka dard abhi bhi ho raha hai? Saas lene mein takleef?",
    "stomach pain":       "Pet mein dard kahan ho raha hai?",
    "default":            "Kya aur koi symptoms hain jo aap share karna chahte hain?",
}

GREETINGS = {"hi","hello","hey","good morning","good evening","good afternoon",
             "good night","kaise ho","kya haal hai","namaste","hlo","hii"}

def _is_casual(text: str) -> bool:
    return text.strip().lower() in GREETINGS or len(text.strip().split()) <= 2

def _extract_symptoms(text: str) -> List[Tuple[str, str]]:
    tl = text.lower()
    found = []
    for name, kws in SYMPTOM_KEYWORDS.items():
        for kw in kws:
            if kw in tl:
                found.append((name, kw)); break
    return found

def _extract_duration(text: str) -> str:
    tl = text.lower()
    for pat, repl in DURATION_PATTERNS:
        m = re.search(pat, tl)
        if m:
            return m.expand(repl) if r"\1" in repl else repl
    return "Recently"

def _rule_understood(text: str) -> List[UnderstoodItem]:
    symptoms = _extract_symptoms(text)
    duration = _extract_duration(text)
    tl = text.lower()
    items = []
    for i, (s, _) in enumerate(symptoms):
        detail = "Today" if (i > 0 and "aaj" in tl) else duration
        items.append(UnderstoodItem(label=s.title(), detail=detail))
    if not items:
        words = text.strip().split()
        preview = " ".join(words[:8]) + ("..." if len(words) > 8 else "")
        items.append(UnderstoodItem(label="Health concern", detail=preview))
    return items

def _rule_attention(text: str, symptoms: List[Tuple]) -> AttentionLevel:
    tl = text.lower()
    names = [s[0] for s in symptoms]
    for kw in URGENCY_URGENT:
        if kw in tl: return AttentionLevel.urgent
    if "chest pain" in names: return AttentionLevel.urgent
    for kw in URGENCY_NEEDS:
        if kw in tl: return AttentionLevel.needs_attention
    if len(symptoms) >= 2: return AttentionLevel.needs_attention
    return AttentionLevel.low

def _rule_follow_up(symptoms: List[Tuple], memories: List[MemoryItem]) -> str:
    names = [s[0] for s in symptoms]
    key = "+".join(sorted(names[:2])) if len(names) >= 2 else (names[0] if names else "default")
    q = FOLLOW_UP.get(key) or FOLLOW_UP.get(names[0] if names else "default") or FOLLOW_UP["default"]
    if memories:
        for mem in memories:
            for n in names:
                if n.lower() in mem.content.lower():
                    return f"I remember you mentioned {n} before. Has it been continuous, or did it go away and come back?"
    return q

def _rule_guidance(symptoms: List[Tuple], level: AttentionLevel, memories: List[MemoryItem]) -> str:
    names = [s[0] for s in symptoms]
    mem_note = " This also aligns with what you mentioned previously." if memories else ""
    if level == AttentionLevel.urgent:
        return ("Based on what you've shared, these symptoms may need prompt attention. "
                "Please contact a qualified healthcare professional or emergency service immediately." + mem_note)
    if level == AttentionLevel.needs_attention:
        c = ", ".join(names[:3]) if names else "your symptoms"
        return (f"Based on what you've shared about {c}, this may need attention. "
                "It would be a good idea to consult a healthcare professional if these symptoms persist or worsen." + mem_note)
    c = ", ".join(names[:2]) if names else "what you described"
    return (f"Based on what you've shared about {c}, keeping track of changes would be helpful. "
            "Rest, stay hydrated, and monitor how you feel." + mem_note)

def _rule_why(symptoms: List[Tuple], memories: List[MemoryItem], duration: str) -> List[str]:
    why = [f"{s.title()}: {duration}" for s, _ in symptoms]
    if memories: why.append("Relevant previous context retrieved from memory.")
    return why

def _ai_to_understood(ai: AIUnderstanding, text: str) -> List[UnderstoodItem]:
    items = []
    for sym in ai.understood:
        label = sym.item.title() if sym.item else "Health concern"
        detail = sym.timing or sym.duration or "Mentioned"
        items.append(UnderstoodItem(label=label, detail=detail))
    return items or _rule_understood(text)

def _ai_attention(raw: str) -> AttentionLevel:
    norm = ai_service.normalise_attention(raw)
    return {"URGENT": AttentionLevel.urgent,
            "NEEDS ATTENTION": AttentionLevel.needs_attention,
            "LOW": AttentionLevel.low}.get(norm, AttentionLevel.low)


# ══════════════════════════════════════════════════════════════════════════════
#  MEMORY AUTO-SAVE
# ══════════════════════════════════════════════════════════════════════════════

async def _maybe_save_memory(
    text: str,
    symptoms: List[Tuple],
    attention_level: AttentionLevel,
    user_id: str,
    session_id: str,
    language: Language,
) -> None:
    """Persist important conversation context back to Qdrant."""
    from app.services import qdrant_service
    if not symptoms:
        return
    # Build a concise memory string
    sym_list = ", ".join(s for s, _ in symptoms[:3])
    content = f"User mentioned {sym_list}."
    if attention_level == AttentionLevel.urgent:
        content += " (Marked as urgent.)"
    tags = [s for s, _ in symptoms] + [language.value]
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
    text: str,
    understood: List[UnderstoodItem],
    memories: List[MemoryItem],
    attention_level: AttentionLevel,
) -> HandoffSummary:
    reported = [f"{u.label}: {u.detail}" for u in understood]
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
        # Return a minimal safe response rather than crashing
        return ConversationResponse(
            understood=[UnderstoodItem(label="Duplicate", detail="This turn was already processed.")],
            memories=memories, question="", attention_level=AttentionLevel.low,
            guidance="", why=[], summary={}, demo_retrieval=demo_retrieval,
            session_id=session_id, turn_id=turn_id,
        )
    _processed_turns.add(turn_id)
    if len(_processed_turns) > 1000:
        _processed_turns.clear()  # simple sliding reset

    log_event(session_id, turn_id, "speech_received", {"text_len": len(text)})

    t_total = time.monotonic()
    ai_powered = False

    # ── Casual conversation detection ────────────────────────────────────────
    is_health = not _is_casual(text)

    # ── Step 1: Understanding ─────────────────────────────────────────────────
    t_llm = time.monotonic()
    ai_und, ai_used = await ai_service.extract_understanding(text, language)
    llm_extract_ms = (time.monotonic() - t_llm) * 1000

    understood_items: List[UnderstoodItem]
    ai_understanding: AIUnderstanding

    if ai_used and ai_und is not None:
        ai_understanding = ai_und
        understood_items = _ai_to_understood(ai_und, text)
        is_health = ai_und.is_health_related
        ai_powered = True
    else:
        understood_items = _rule_understood(text)
        symptoms_fb = _extract_symptoms(text)
        duration_fb = _extract_duration(text)
        ai_understanding = AIUnderstanding(
            understood=[ExtractedSymptom(item=s, duration=duration_fb) for s, _ in symptoms_fb],
            current_concern=", ".join(s for s, _ in symptoms_fb) or text[:60],
            keywords=[s for s, _ in symptoms_fb],
            language=language.value,
            is_health_related=is_health,
        )

    log_event(session_id, turn_id, "understanding_generated",
              {"items": len(understood_items), "ai_powered": ai_powered})

    # ── Step 2: Contextual response ───────────────────────────────────────────
    question: str
    attention_level: AttentionLevel
    guidance: str
    why: List[str]
    summary: Dict

    t_resp = time.monotonic()
    from app.routes.profile import get_user_profile_data
    profile = get_user_profile_data(user_id)

    ai_resp, ai_resp_used = await ai_service.generate_contextual_response(
        understanding=ai_understanding,
        memories=memories,
        language=language,
        profile=profile,
    )
    llm_resp_ms = (time.monotonic() - t_resp) * 1000
    llm_total_ms = llm_extract_ms + llm_resp_ms

    if ai_resp_used and ai_resp is not None:
        question        = ai_resp.question
        attention_level = _ai_attention(ai_resp.attention_level)
        guidance        = ai_resp.guidance
        why             = ai_resp.why or []
        summary         = ai_resp.summary or {}
        ai_powered      = True
    else:
        symptoms    = _extract_symptoms(text)
        duration    = _extract_duration(text)
        attention_level = _rule_attention(text, symptoms)
        # Language-aware fallback from ai_service
        from app.services.ai_service import get_fallback_guidance, get_fallback_question
        question = _rule_follow_up(symptoms, memories)
        # Override with language-aware question if rule returned English default
        default_eng = FOLLOW_UP.get("default", "Kya aur koi symptoms hain jo aap share karna chahte hain?")
        if not question or question == default_eng:
            question = get_fallback_question(language)
        guidance = get_fallback_guidance(language, attention_level.value)
        why      = _rule_why(symptoms, memories, duration)
        summary  = {"symptoms": [s[0] for s in symptoms], "duration": duration, "language": language.value}

    if not why:
        symptoms_f = _extract_symptoms(text)
        duration_f = _extract_duration(text)
        why = _rule_why(symptoms_f, memories, duration_f)

    log_event(session_id, turn_id, "response_generated",
              {"attention": attention_level.value, "ai_powered": ai_powered})

    # ── Handoff suggestion ────────────────────────────────────────────────────
    handoff_suggested = attention_level == AttentionLevel.urgent
    handoff_summary_str: Optional[str] = None
    if handoff_suggested:
        hs = await generate_handoff_summary(
            session_id, text, understood_items, memories, attention_level
        )
        handoff_summary_str = (
            f"Reported: {', '.join(hs.reported_concerns[:3])}. "
            f"{hs.disclaimer}"
        )
        log_event(session_id, turn_id, "handoff_suggested")

    # ── Persist memory back to Qdrant ─────────────────────────────────────────
    if is_health:
        syms = _extract_symptoms(text)
        try:
            await _maybe_save_memory(text, syms, attention_level, user_id, session_id, language)
            log_event(session_id, turn_id, "memory_stored", {"symptoms": len(syms)})
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
              {"total_ms": round(total_ms, 1), "ai_powered": ai_powered})

    return ConversationResponse(
        understood=understood_items,
        memories=memories,
        question=question,
        attention_level=attention_level,
        guidance=guidance,
        why=why,
        summary=summary,
        demo_retrieval=demo_retrieval,
        ai_powered=ai_powered,
        session_id=session_id,
        turn_id=turn_id,
        latency=latency,
        is_health_related=is_health,
        handoff_suggested=handoff_suggested,
        handoff_summary=handoff_summary_str,
    )
