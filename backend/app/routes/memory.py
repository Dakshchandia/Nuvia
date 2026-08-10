from fastapi import APIRouter, HTTPException
from typing import List
from app.models import MemoryItem, MemoryCreateRequest
from app.services import qdrant_service

router = APIRouter()


@router.get("/memory", response_model=List[MemoryItem])
async def get_memories(user_id: str = "demo_user"):
    memories, _ = await qdrant_service.get_all_memories(user_id=user_id)
    return memories


@router.post("/memory")
async def create_memory(req: MemoryCreateRequest):
    ok = await qdrant_service.upsert_memory(
        content=req.content,
        tags=req.tags,
        source=req.source,
        user_id=req.user_id,
        session_id=req.session_id or "manual",
    )
    return {"success": ok}


@router.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str, user_id: str = "demo_user"):
    success, is_live = await qdrant_service.delete_memory(memory_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete memory")
    return {"success": True, "live": is_live}
