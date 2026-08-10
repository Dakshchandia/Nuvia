"""
Risk Monitor routes — Nuvia
Risk analysis, emergency settings, SOS audit log.
All analysis uses existing Qdrant memories (user-isolated).
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.services import qdrant_service
from app.services.risk_service import analyze_risk

router = APIRouter()

# ── In-memory emergency settings + audit log ─────────────────────────────────
_emergency_settings: dict = {}
_sos_events: List[dict] = []

_DEFAULT_SETTINGS = {
    "user_id": "demo_user",
    "emergency_response_enabled": True,
    "emergency_contact_name": "",
    "emergency_contact_phone": "",
    "location_sharing_enabled": True,
    "automation_preference": "ask",   # "ask" | "auto"
}


# ── Request/response models ───────────────────────────────────────────────────

class EmergencySettings(BaseModel):
    user_id: str = "demo_user"
    emergency_response_enabled: bool = True
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    location_sharing_enabled: bool = True
    automation_preference: str = "ask"


class SOSRequest(BaseModel):
    user_id: str = "demo_user"
    risk_level: str
    signals: List[str] = []
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    location_address: Optional[str] = None
    nearest_hospital: Optional[str] = None
    user_confirmed: bool = False
    demo_mode: bool = False


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/risk/analyze")
async def analyze(user_id: str = "demo_user"):
    """
    Fetch all user memories from Qdrant and run risk analysis.
    Uses existing qdrant_service.get_all_memories() — no duplicate Qdrant setup.
    """
    memories, _ = await qdrant_service.get_all_memories(user_id=user_id)

    # Get profile for pregnancy context
    from app.routes.profile import _profiles, _DEFAULT
    profile = _profiles.get(user_id, _DEFAULT)

    result = analyze_risk(
        memories=memories,
        user_id=user_id,
        pregnancy_status=profile.get("pregnancy_status"),
        pregnancy_month=profile.get("pregnancy_month"),
    )
    return result


@router.get("/risk/settings")
async def get_settings(user_id: str = "demo_user"):
    return _emergency_settings.get(user_id, {**_DEFAULT_SETTINGS, "user_id": user_id})


@router.post("/risk/settings")
async def save_settings(req: EmergencySettings):
    _emergency_settings[req.user_id] = req.model_dump()
    return {"success": True}


@router.post("/risk/sos")
async def trigger_sos(req: SOSRequest):
    """
    Log an SOS event. If demo_mode=True, never sends real notification.
    Returns audit record.
    """
    settings = _emergency_settings.get(
        req.user_id,
        {**_DEFAULT_SETTINGS, "user_id": req.user_id}
    )

    contact_name  = settings.get("emergency_contact_name", "")
    contact_phone = settings.get("emergency_contact_phone", "")
    has_contact   = bool(contact_name and contact_phone)

    event = {
        "id": f"sos_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "user_id": req.user_id,
        "timestamp": datetime.now().isoformat(),
        "risk_level": req.risk_level,
        "trigger_signals": req.signals[:5],
        "user_confirmed": req.user_confirmed,
        "location_available": req.location_lat is not None,
        "location_address": req.location_address,
        "nearest_hospital": req.nearest_hospital,
        "contact_notified": False,
        "notification_status": "not_sent",
        "demo_mode": req.demo_mode,
    }

    if req.demo_mode:
        event["notification_status"] = "demo_simulation"
        event["note"] = "Demo mode — no real notification sent."
    elif not has_contact:
        event["notification_status"] = "no_contact_configured"
    elif not settings.get("emergency_response_enabled", True):
        event["notification_status"] = "disabled_by_user"
    else:
        # In a real system, an SMS/notification provider would be called here.
        # Credentials would be loaded from environment variables server-side.
        # For now: log as pending — real integration requires NOTIFICATION_API_KEY in .env
        event["notification_status"] = "logged_pending_provider"
        event["contact_name"] = contact_name
        event["note"] = (
            "Contact logged. To enable real SMS/notification, configure "
            "NOTIFICATION_API_KEY and NOTIFICATION_PROVIDER in backend .env"
        )

    _sos_events.insert(0, event)
    if len(_sos_events) > 100:
        _sos_events.pop()

    return event


@router.get("/risk/sos/history")
async def sos_history(user_id: str = "demo_user"):
    events = [e for e in _sos_events if e.get("user_id") == user_id]
    return {"events": events, "count": len(events)}
