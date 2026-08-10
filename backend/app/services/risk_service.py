"""
Risk Intelligence Service — Nuvia
==================================
Analyses all of a user's Qdrant memories for health risk signals.
Uses the existing AI service for contextual understanding.
Falls back to a rule-based engine when AI is unavailable.

IMPORTANT: This is a SUPPORT tool. It NEVER diagnoses conditions.
Risk levels are conversational support classifications, not medical diagnoses.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter

from app.models import MemoryItem


# ── Risk level constants ──────────────────────────────────────────────────────
RISK_LOW      = "low"
RISK_WATCH    = "watch"
RISK_ELEVATED = "elevated"
RISK_URGENT   = "urgent"

# ── Symptom keyword groups ────────────────────────────────────────────────────
URGENT_SIGNALS = [
    "chest pain","seene mein dard","heart attack","breathlessness",
    "saas nahi","unconscious","behosh","khoon","blood","stroke",
    "paralysis","seizure","fit","emergency","bahut zyada dard",
    "can't breathe","cannot breathe","severe pain",
]

ELEVATED_SIGNALS = [
    "swelling","sujan","dizziness","chakkar","fever","bukhar",
    "vomit","ulti","blood pressure","hypertension",
    "diabetes","sugar","persistent","recurring","worsening",
    "chest","seena","tight","shortness",
]

WATCH_SIGNALS = [
    "headache","sir dard","fatigue","thakaan","tiredness","nausea",
    "stomach","pet","back","kamar","sleep","neend","anxiety","tension",
    "cough","khansi","cold","sardi","pain","dard",
]


def _days_ago(date_str: str) -> int:
    """How many days ago was this memory date?"""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return max(0, (datetime.now() - d).days)
    except Exception:
        return 999


def _extract_signals(memories: List[MemoryItem]) -> Dict[str, Any]:
    """
    Scan all memories and extract health signals.
    Returns grouped signal data for risk assessment.
    """
    signal_counts: Counter = Counter()
    signal_dates: Dict[str, List[str]] = {}
    urgent_found: List[str] = []
    elevated_found: List[str] = []
    watch_found: List[str] = []

    for mem in memories:
        content_lower = mem.content.lower()
        # Skip non-health memories
        if mem.source == "Preference":
            continue

        for kw in URGENT_SIGNALS:
            if kw in content_lower:
                signal_counts[kw] += 1
                signal_dates.setdefault(kw, []).append(mem.date)
                if kw not in urgent_found:
                    urgent_found.append(kw)

        for kw in ELEVATED_SIGNALS:
            if kw in content_lower:
                signal_counts[kw] += 1
                signal_dates.setdefault(kw, []).append(mem.date)
                if kw not in elevated_found:
                    elevated_found.append(kw)

        for kw in WATCH_SIGNALS:
            if kw in content_lower and kw not in elevated_found:
                signal_counts[kw] += 1
                signal_dates.setdefault(kw, []).append(mem.date)
                if kw not in watch_found:
                    watch_found.append(kw)

        # Also use tags
        for tag in mem.tags:
            tl = tag.lower()
            for kw in URGENT_SIGNALS + ELEVATED_SIGNALS + WATCH_SIGNALS:
                if kw in tl and tl not in signal_counts:
                    signal_counts[tl] += 1
                    signal_dates.setdefault(tl, []).append(mem.date)

    return {
        "urgent_found":   urgent_found,
        "elevated_found": elevated_found,
        "watch_found":    watch_found,
        "signal_counts":  dict(signal_counts),
        "signal_dates":   signal_dates,
    }


def _detect_recurrence(signal_dates: Dict[str, List[str]]) -> List[str]:
    """Detect signals mentioned on multiple days (recurring pattern)."""
    recurring = []
    for signal, dates in signal_dates.items():
        unique_days = set(dates)
        if len(unique_days) >= 2:
            recurring.append(signal)
    return recurring


def _detect_worsening(memories: List[MemoryItem]) -> bool:
    """
    Simple temporal worsening detection:
    if symptom count in recent 3 days > symptom count in previous 4-7 days.
    """
    recent_count = 0
    earlier_count = 0
    now = datetime.now()
    for mem in memories:
        days = _days_ago(mem.date)
        sym_count = sum(
            1 for kw in WATCH_SIGNALS + ELEVATED_SIGNALS
            if kw in mem.content.lower()
        )
        if days <= 3:
            recent_count += sym_count
        elif days <= 7:
            earlier_count += sym_count
    return recent_count > earlier_count > 0


def _build_signals_list(
    signals: Dict[str, Any],
    memories: List[MemoryItem],
    recurring: List[str],
) -> List[Dict]:
    """Build structured signal cards for the UI."""
    result = []
    seen = set()
    # Priority: urgent > elevated > watch
    for kw_list, category in [
        (signals["urgent_found"],   "urgent"),
        (signals["elevated_found"], "elevated"),
        (signals["watch_found"],    "watch"),
    ]:
        for kw in kw_list[:5]:  # cap at 5 per category
            if kw in seen:
                continue
            seen.add(kw)
            dates = signals["signal_dates"].get(kw, [])
            count = signals["signal_counts"].get(kw, 1)
            last_date = max(dates) if dates else ""
            days_since = _days_ago(last_date) if last_date else None

            result.append({
                "signal":    kw,
                "category":  category,
                "count":     count,
                "recurring": kw in recurring,
                "last_date": last_date,
                "days_since": days_since,
                "last_seen": (
                    "Today" if days_since == 0
                    else "Yesterday" if days_since == 1
                    else f"{days_since} days ago" if days_since is not None
                    else ""
                ),
                "source_memories": [
                    m.id for m in memories
                    if kw in m.content.lower() or kw in " ".join(m.tags).lower()
                ][:3],
            })

    # Sort: urgent first, then by count desc
    order = {"urgent": 0, "elevated": 1, "watch": 2}
    result.sort(key=lambda x: (order.get(x["category"], 3), -x["count"]))
    return result[:8]  # max 8 signals shown


def analyze_risk(
    memories: List[MemoryItem],
    user_id: str,
    pregnancy_status: Optional[str] = None,
    pregnancy_month: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Main risk analysis function.
    Returns structured risk assessment from existing Qdrant memories.
    Does NOT diagnose. Only classifies conversational support level.
    """
    if not memories:
        return {
            "risk_level": RISK_LOW,
            "signals": [],
            "trend": "stable",
            "explanation": "No memories to analyze yet. Start talking with Nuvia.",
            "recommended_action": "Continue conversations with Nuvia to build context.",
            "requires_emergency_response": False,
            "signal_count": 0,
            "memory_count": 0,
            "analyzed_at": datetime.now().isoformat(),
            "demo": False,
        }

    # Filter to health-related memories only
    health_mems = [m for m in memories if m.source != "Preference"]
    signals_data = _extract_signals(health_mems)
    recurring     = _detect_recurrence(signals_data["signal_dates"])
    worsening     = _detect_worsening(health_mems)
    signal_cards  = _build_signals_list(signals_data, health_mems, recurring)

    # ── Risk level determination ──────────────────────────────────────────────
    # URGENT: any explicitly urgent signal
    if signals_data["urgent_found"]:
        risk_level = RISK_URGENT
        trend = "worsening" if worsening else "recurring"
        explanation = (
            f"Potentially serious signal(s) detected: "
            f"{', '.join(signals_data['urgent_found'][:2])}. "
            "These signals in your conversation history may warrant immediate attention."
        )
        recommended_action = (
            "Consider contacting a qualified healthcare professional "
            "or emergency service without delay."
        )
        requires_emergency = True

    # ELEVATED: elevated signals + recurrence or worsening
    elif signals_data["elevated_found"] and (len(recurring) >= 1 or worsening):
        risk_level = RISK_ELEVATED
        trend = "worsening" if worsening else "recurring"
        explanation = (
            f"Elevated signals found: {', '.join(signals_data['elevated_found'][:2])}. "
            f"{'These appear to be recurring.' if recurring else ''} "
            "Based on your recent conversations, this pattern may need professional attention."
        )
        recommended_action = (
            "Consider speaking with a qualified healthcare professional, "
            "especially if these symptoms persist or worsen."
        )
        requires_emergency = False

    # WATCH: watch signals appearing multiple times
    elif len(watch_signals_used := [s for s in signal_cards if s["count"] >= 2]) >= 1:
        risk_level = RISK_WATCH
        trend = "recurring" if recurring else "stable"
        names = ", ".join(s["signal"] for s in watch_signals_used[:2])
        explanation = (
            f"Some patterns may need attention: {names}. "
            "These have appeared in multiple conversations. "
            "This is a conversational pattern — not a medical assessment."
        )
        recommended_action = "Keep monitoring. If symptoms persist, consider speaking with a healthcare professional."
        requires_emergency = False

    # LOW: normal
    else:
        risk_level = RISK_LOW
        trend = "stable"
        explanation = (
            "No concerning patterns detected in your recent conversations. "
            "Your memory context looks stable."
        )
        recommended_action = "Continue talking with Nuvia to keep your context updated."
        requires_emergency = False

    # Pregnancy context modifier
    if pregnancy_status == "yes" and pregnancy_month and pregnancy_month >= 7:
        if risk_level == RISK_WATCH:
            risk_level = RISK_ELEVATED
            explanation += " Note: Given your pregnancy context, closer monitoring is recommended."

    return {
        "risk_level": risk_level,
        "signals": signal_cards,
        "trend": trend,
        "explanation": explanation,
        "recommended_action": recommended_action,
        "requires_emergency_response": requires_emergency,
        "signal_count": len(signal_cards),
        "memory_count": len(health_mems),
        "recurring_signals": recurring[:5],
        "worsening_detected": worsening,
        "analyzed_at": datetime.now().isoformat(),
        "demo": False,
    }
