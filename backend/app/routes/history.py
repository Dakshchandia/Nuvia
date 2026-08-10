"""
History query — lets the user ask "have I mentioned this before?"
via voice or text. Backed by Qdrant semantic retrieval.
"""
from fastapi import APIRouter
from app.models import HistoryQueryRequest, HistoryQueryResponse
from app.services import conversation_service

router = APIRouter()


@router.post("/history-query", response_model=HistoryQueryResponse)
async def history_query(req: HistoryQueryRequest):
    return await conversation_service.answer_history_query(
        query=req.query,
        language=req.language,
        user_id=req.user_id or "demo_user",
    )
