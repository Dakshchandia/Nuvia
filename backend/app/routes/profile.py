"""
User profile — name, age, pregnancy context.
Stored in-memory for prototype; architecture allows DB swap.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

# In-memory store keyed by user_id
_profiles: dict = {}

_DEFAULT = {
    "user_id": "demo_user",
    "name": "",
    "age": None,
    "pregnancy_status": None,   # "yes" | "no" | None
    "pregnancy_month": None,    # 1-9 | None
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat(),
    "onboarding_complete": False,
}


class ProfileCreate(BaseModel):
    user_id: str = "demo_user"
    name: str
    age: int
    pregnancy_status: Optional[str] = None   # "yes" | "no"
    pregnancy_month: Optional[int] = None


class ProfileResponse(BaseModel):
    user_id: str
    name: str
    age: Optional[int] = None
    pregnancy_status: Optional[str] = None
    pregnancy_month: Optional[int] = None
    onboarding_complete: bool
    created_at: str
    updated_at: str


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = "demo_user"):
    p = _profiles.get(user_id, {**_DEFAULT, "user_id": user_id})
    return ProfileResponse(**p)


@router.post("/profile", response_model=ProfileResponse)
async def save_profile(req: ProfileCreate):
    existing = _profiles.get(req.user_id, {**_DEFAULT, "user_id": req.user_id})
    profile = {
        **existing,
        "name": req.name.strip(),
        "age": req.age,
        "pregnancy_status": req.pregnancy_status,
        "pregnancy_month": req.pregnancy_month if req.pregnancy_status == "yes" else None,
        "onboarding_complete": True,
        "updated_at": datetime.now().isoformat(),
    }
    _profiles[req.user_id] = profile
    return ProfileResponse(**profile)


def get_user_profile_data(user_id: str = "demo_user") -> dict:
    return _profiles.get(user_id, {**_DEFAULT, "user_id": user_id})

