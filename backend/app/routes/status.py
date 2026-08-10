from fastapi import APIRouter
from app.models import StatusResponse
from app.services import qdrant_service, rime_service, ai_service

router = APIRouter()


@router.get("/status", response_model=StatusResponse)
async def get_status():
    qdrant_live = await qdrant_service.check_qdrant_live()
    rime_live   = await rime_service.check_rime_live()
    ai_live     = await ai_service.check_ai_live()

    return StatusResponse(
        qdrant="live" if qdrant_live else "demo",
        rime="live"   if rime_live   else "demo",
        ai="live"     if ai_live     else "demo",
        barge_in_supported=True,
        reconnect_supported=True,
        memory_isolation=True,
    )
