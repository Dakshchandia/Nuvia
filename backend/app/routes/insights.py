from fastapi import APIRouter, Query
from app.services import insights_service

router = APIRouter()


@router.get("/insights")
async def get_insights():
    return insights_service.get_insights_summary()


@router.get("/calendar")
async def get_calendar(month: str = Query(default=None, description="YYYY-MM")):
    from datetime import datetime
    if not month:
        month = datetime.now().strftime("%Y-%m")
    return insights_service.get_calendar_month(month)


@router.get("/calendar/{date}")
async def get_day(date: str):
    """date = YYYY-MM-DD"""
    return insights_service.get_day_detail(date)
