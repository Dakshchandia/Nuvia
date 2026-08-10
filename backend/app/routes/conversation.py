import time
from fastapi import APIRouter, HTTPException
from app.models import ConversationRequest, ConversationResponse
from app.services import qdrant_service, conversation_service

router = APIRouter()


@router.post("/conversation", response_model=ConversationResponse)
async def handle_conversation(req: ConversationRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    user_id = req.user_id or "demo_user"

    # Qdrant retrieval with timing
    t0 = time.monotonic()
    memories, is_live = await qdrant_service.search_memories(
        req.text, user_id=user_id, limit=3
    )
    qdrant_ms = (time.monotonic() - t0) * 1000

    response = await conversation_service.process_conversation(
        text=req.text,
        language=req.language,
        memories=memories,
        demo_retrieval=not is_live,
        session_id=req.session_id,
        turn_id=req.turn_id,
        user_id=user_id,
        qdrant_ms=qdrant_ms,
    )

    return response
