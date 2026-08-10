"""
Conversations — stores full detail so the frontend detail panel
shows real data instead of hardcoded DETAIL_MAP.
"""
from fastapi import APIRouter
from typing import List, Optional
from datetime import datetime
import uuid

from app.models import ConversationRecord, ConversationRequest

router = APIRouter()

# In-memory store (swappable for SQLite/Postgres)
_store: List[dict] = [
    {
        "id": "conv_001",
        "preview": "Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai.",
        "full_text": "Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai.",
        "language": "hinglish",
        "timestamp": "2026-08-09T14:32:00",
        "attention_level": "NEEDS ATTENTION",
        "understood": [
            {"label": "Headache", "detail": "Since yesterday"},
            {"label": "Dizziness", "detail": "Today"},
        ],
        "question": "Theek hai. Kya abhi bhi dizziness ya chakkar ho raha hai?",
        "guidance": "Based on what you've shared about headache and dizziness, this may need attention.",
        "memories_used": ["User mentioned a headache two days ago."],
        "session_id": "sess_001",
    },
    {
        "id": "conv_002",
        "preview": "Mujhe thoda bukhar lag raha hai subah se.",
        "full_text": "Mujhe thoda bukhar lag raha hai subah se.",
        "language": "hinglish",
        "timestamp": "2026-08-08T09:15:00",
        "attention_level": "NEEDS ATTENTION",
        "understood": [{"label": "Fever", "detail": "Since morning"}],
        "question": "Bukhar kitna hai? Kya aapne temperature measure kiya?",
        "guidance": "Based on what you've shared about fever, rest and hydration are important.",
        "memories_used": [],
        "session_id": "sess_002",
    },
    {
        "id": "conv_003",
        "preview": "I have been feeling tired since last few days.",
        "full_text": "I have been feeling tired since last few days.",
        "language": "english",
        "timestamp": "2026-08-07T18:00:00",
        "attention_level": "LOW",
        "understood": [{"label": "Fatigue", "detail": "Since a few days"}],
        "question": "Is the tiredness constant, or worse at certain times of day?",
        "guidance": "Based on what you've shared, keeping track of your rest would be helpful.",
        "memories_used": [],
        "session_id": "sess_003",
    },
]


@router.get("/conversations", response_model=List[ConversationRecord])
async def get_conversations():
    return [ConversationRecord(**c) for c in _store]


@router.post("/conversations")
async def save_conversation(req: ConversationRequest):
    # Accept optional extra fields via body
    record = {
        "id": f"conv_{uuid.uuid4().hex[:6]}",
        "preview": req.text[:80] + ("..." if len(req.text) > 80 else ""),
        "full_text": req.text,
        "language": req.language.value,
        "timestamp": datetime.now().isoformat(),
        "attention_level": "LOW",
        "understood": None,
        "question": None,
        "guidance": None,
        "memories_used": None,
        "session_id": req.session_id,
    }
    _store.insert(0, record)
    return {"success": True, "id": record["id"]}


@router.post("/conversations/full")
async def save_conversation_full(payload: dict):
    """
    Called by frontend after /api/conversation to persist the full detail.
    payload keys: text, language, session_id, turn_id, attention_level,
                  understood, question, guidance, memories_used
    """
    record = {
        "id": f"conv_{uuid.uuid4().hex[:6]}",
        "preview": (payload.get("text","")[:80] + ("..." if len(payload.get("text","")) > 80 else "")),
        "full_text": payload.get("text",""),
        "language": payload.get("language","hinglish"),
        "timestamp": datetime.now().isoformat(),
        "attention_level": payload.get("attention_level","LOW"),
        "understood": payload.get("understood"),
        "question": payload.get("question"),
        "guidance": payload.get("guidance"),
        "memories_used": payload.get("memories_used"),
        "session_id": payload.get("session_id"),
        "turn_id": payload.get("turn_id"),
    }
    _store.insert(0, record)
    return {"success": True, "id": record["id"]}
