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

_store: List[dict] = []


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
        "intent": None,
        "understanding": None,
        "response": None,
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
                  intent, understanding, response, question, guidance, memories_used
    """
    record = {
        "id": f"conv_{uuid.uuid4().hex[:6]}",
        "preview": (payload.get("text","")[:80] + ("..." if len(payload.get("text","")) > 80 else "")),
        "full_text": payload.get("text",""),
        "language": payload.get("language","hinglish"),
        "timestamp": datetime.now().isoformat(),
        "attention_level": payload.get("attention_level","LOW"),
        "intent": payload.get("intent"),
        "understanding": payload.get("understanding"),
        "response": payload.get("response"),
        "question": payload.get("question"),
        "guidance": payload.get("guidance"),
        "memories_used": payload.get("memories_used"),
        "session_id": payload.get("session_id"),
        "turn_id": payload.get("turn_id"),
    }
    _store.insert(0, record)
    return {"success": True, "id": record["id"]}

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    for i, c in enumerate(_store):
        if c.get("id") == conversation_id:
            del _store[i]
            return {"success": True}
    return {"success": False, "error": "Not found"}
