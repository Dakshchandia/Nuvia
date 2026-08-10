"""
Insights Service — derives conversation patterns from stored data.
Never diagnoses. Describes conversation patterns only.
"""
from typing import List, Dict, Any, Optional
from collections import Counter
from app.routes.conversations import _store as CONV_STORE


def _get_conversations() -> List[dict]:
    return list(CONV_STORE)


def get_insights_summary() -> Dict[str, Any]:
    convs = _get_conversations()
    if not convs:
        return {
            "conversations_analyzed": 0,
            "memories_analyzed": 0,
            "recurring_topics": [],
            "insights": [],
            "timeline": [],
            "last_updated": None,
            "has_data": False,
        }

    # Topic frequency from understood items
    topic_counts: Counter = Counter()
    for c in convs:
        understood = c.get("understood") or []
        for u in understood:
            label = u.get("label", "").lower()
            if label and label not in ("health concern", "duplicate"):
                topic_counts[label] += 1

    # Also count from memories_used text
    mem_topics: Counter = Counter()
    for c in convs:
        mems = c.get("memories_used") or []
        for m in mems:
            m_lower = m.lower()
            for kw in ["headache", "dizziness", "fever", "fatigue", "cough", "sleep", "anxiety", "swelling"]:
                if kw in m_lower:
                    mem_topics[kw] += 1

    # Merge
    all_topics = topic_counts + mem_topics
    recurring = [
        {"topic": t, "count": c, "description": _topic_description(t, c)}
        for t, c in all_topics.most_common(5) if c >= 1
    ]

    # Attention level counts
    attention_counts = Counter(c.get("attention_level", "LOW") for c in convs)

    # Insights
    insights = _build_insights(convs, recurring, attention_counts)

    # Recent timeline (last 5 conversations)
    timeline = [
        {
            "date": c.get("timestamp", "")[:10],
            "time": c.get("timestamp", "")[11:16],
            "title": _conv_title(c),
            "preview": c.get("preview", "")[:80],
            "attention_level": c.get("attention_level", "LOW"),
            "id": c.get("id", ""),
        }
        for c in sorted(convs, key=lambda x: x.get("timestamp",""), reverse=True)[:10]
    ]

    from datetime import datetime
    return {
        "conversations_analyzed": len(convs),
        "memories_analyzed": sum(len(c.get("memories_used") or []) for c in convs),
        "recurring_topics": recurring,
        "insights": insights,
        "timeline": timeline,
        "last_updated": datetime.now().isoformat(),
        "has_data": True,
        "attention_counts": dict(attention_counts),
    }


def _conv_title(c: dict) -> str:
    understood = c.get("understood") or []
    if understood:
        labels = [u.get("label","") for u in understood[:2] if u.get("label")]
        if labels:
            return " + ".join(labels)
    preview = c.get("preview","")
    return preview[:40] + ("..." if len(preview) > 40 else "") if preview else "Voice session"


def _topic_description(topic: str, count: int) -> str:
    freq = "Frequently mentioned" if count >= 3 else "Mentioned several times" if count >= 2 else "Mentioned"
    return f"{freq} across your conversations."


def _build_insights(
    convs: List[dict],
    recurring: List[dict],
    attention_counts: Counter,
) -> List[Dict[str, Any]]:
    insights = []

    if recurring:
        top = recurring[0]
        insights.append({
            "type": "pattern",
            "title": f"{top['topic'].title()} has appeared in multiple conversations",
            "description": f"This is a conversation pattern, not a medical diagnosis.",
            "topics": [r["topic"] for r in recurring[:3]],
        })

    urgent = attention_counts.get("URGENT", 0)
    needs  = attention_counts.get("NEEDS ATTENTION", 0)
    if urgent > 0:
        insights.append({
            "type": "attention",
            "title": f"{urgent} conversation{'s' if urgent > 1 else ''} flagged as potentially urgent",
            "description": "These are conversational support classifications only. Please consult a healthcare professional.",
        })
    elif needs > 0:
        insights.append({
            "type": "attention",
            "title": f"{needs} conversation{'s' if needs > 1 else ''} may need attention",
            "description": "Consider following up with a healthcare professional if concerns persist.",
        })

    return insights


def get_calendar_month(month_str: str) -> Dict[str, Any]:
    """
    month_str: "2026-08"
    Returns day-level summary for that month.
    """
    convs = _get_conversations()
    days: Dict[str, Dict] = {}

    for c in convs:
        ts = c.get("timestamp", "")
        if not ts.startswith(month_str):
            continue
        date = ts[:10]
        if date not in days:
            days[date] = {"date": date, "conversation_count": 0, "memory_count": 0, "has_attention_event": False, "conversations": []}
        days[date]["conversation_count"] += 1
        days[date]["memory_count"] += len(c.get("memories_used") or [])
        if c.get("attention_level") in ("NEEDS ATTENTION", "URGENT"):
            days[date]["has_attention_event"] = True
        days[date]["conversations"].append({
            "id": c.get("id"),
            "time": ts[11:16],
            "preview": c.get("preview","")[:60],
            "attention_level": c.get("attention_level","LOW"),
        })

    return {"month": month_str, "days": list(days.values())}


def get_day_detail(date_str: str) -> Dict[str, Any]:
    """
    date_str: "2026-08-08"
    Returns all events for that day.
    """
    convs = _get_conversations()
    day_convs = [c for c in convs if c.get("timestamp","")[:10] == date_str]

    if not day_convs:
        return {"date": date_str, "conversations": [], "memory_events": [], "summary": f"No conversations with Nuvia on {date_str}."}

    events = []
    for c in sorted(day_convs, key=lambda x: x.get("timestamp","")):
        events.append({
            "id": c.get("id"),
            "time": c.get("timestamp","")[11:16],
            "type": "conversation",
            "title": _conv_title(c),
            "preview": c.get("preview","")[:100],
            "full_text": c.get("full_text",""),
            "understood": c.get("understood"),
            "question": c.get("question"),
            "guidance": c.get("guidance"),
            "memories_used": c.get("memories_used"),
            "attention_level": c.get("attention_level","LOW"),
        })

    count = len(day_convs)
    summary = f"You had {count} conversation{'s' if count > 1 else ''} with Nuvia on this day."
    if day_convs:
        topics = []
        for c in day_convs:
            for u in (c.get("understood") or []):
                lbl = u.get("label","")
                if lbl and lbl not in topics:
                    topics.append(lbl)
        if topics:
            summary += f" Topics included: {', '.join(topics[:3])}."

    return {"date": date_str, "conversations": events, "summary": summary}
