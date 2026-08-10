"""
Human handoff — generates a safe, non-diagnostic summary
the user can share with a healthcare professional.
"""
from fastapi import APIRouter
from app.models import HandoffRequest, HandoffSummary, UnderstoodItem, AttentionLevel
from app.services import qdrant_service, conversation_service
from datetime import datetime

router = APIRouter()


@router.post("/handoff", response_model=HandoffSummary)
async def generate_handoff(req: HandoffRequest):
    user_id = req.user_id or "demo_user"
    memories, _ = await qdrant_service.get_all_memories(user_id=user_id)

    # Build understood items from memory content
    understood = [
        UnderstoodItem(label="Concern", detail=m.content)
        for m in memories[:5]
    ]

    summary = await conversation_service.generate_handoff_summary(
        session_id=req.session_id,
        text="",
        understood=understood,
        memories=memories[:5],
        attention_level=AttentionLevel.needs_attention,
    )
    return summary


@router.get("/handoff/events/{session_id}")
async def get_audit_events(session_id: str):
    """Returns auditable event log for a session (judge/debug use)."""
    events = conversation_service.get_events(session_id)
    return {"session_id": session_id, "events": events, "count": len(events)}
