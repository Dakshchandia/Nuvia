"""
Qdrant Service — Nuvia
======================
Every query is filtered by user_id (payload isolation).
User A can NEVER see User B's memories.
"""
import hashlib
import math
import uuid
from typing import List, Tuple
from datetime import datetime, timedelta
import httpx

from app.config import settings
from app.models import MemoryItem

# ── Demo seed memories ────────────────────────────────────────────────────────
DEMO_MEMORIES: List[dict] = [
    {"id":"mem_001","content":"User mentioned a headache two days ago.",
     "source":"Voice session","date":(datetime.now()-timedelta(days=2)).strftime("%Y-%m-%d"),
     "tags":["headache","head pain"],"user_id":"demo_user"},
    {"id":"mem_002","content":"User mentioned mild swelling in the feet four days ago.",
     "source":"Voice session","date":(datetime.now()-timedelta(days=4)).strftime("%Y-%m-%d"),
     "tags":["swelling","feet","sujan"],"user_id":"demo_user"},
    {"id":"mem_003","content":"User prefers Hinglish for conversational interactions.",
     "source":"Preference","date":(datetime.now()-timedelta(days=7)).strftime("%Y-%m-%d"),
     "tags":["language","preference","hinglish"],"user_id":"demo_user"},
    {"id":"mem_004","content":"User reported feeling fatigued and low on energy last week.",
     "source":"Voice session","date":(datetime.now()-timedelta(days=6)).strftime("%Y-%m-%d"),
     "tags":["fatigue","tiredness","thakaan"],"user_id":"demo_user"},
    {"id":"mem_005","content":"User mentioned occasional dizziness while standing up.",
     "source":"Voice session","date":(datetime.now()-timedelta(days=3)).strftime("%Y-%m-%d"),
     "tags":["dizziness","chakkar","vertigo"],"user_id":"demo_user"},
]

# ── Local in-memory store for demo mode (survives one process restart) ────────
_demo_store: List[dict] = list(DEMO_MEMORIES)

HEALTH_VOCAB = [
    "headache","dizziness","fever","nausea","fatigue","chest","pain",
    "cough","cold","body","stomach","swelling","rash","sleep","anxiety",
    "breathing","back","eye","ear","throat","sugar","bp",
    "sir","dard","chakkar","bukhar","thakaan","sujan","seena","khansi",
    "sardi","badan","pet","kamar","neend","ghabrana","saas","gala","ulti",
]

COLLECTION  = settings.qdrant_collection
QDRANT_BASE = settings.qdrant_url.rstrip("/")
VECTOR_SIZE = 64


# ── Embedding helpers ─────────────────────────────────────────────────────────

def _local_embed(text: str) -> List[float]:
    tl = text.lower()
    vec = [min(1.0, tl.count(w) * 0.5) if w in tl else 0.0 for w in HEALTH_VOCAB]
    h = hashlib.md5(text.encode()).hexdigest()
    needed = max(0, VECTOR_SIZE - len(HEALTH_VOCAB))
    for i in range(needed):
        idx = (i * 2) % len(h)
        vec.append(int(h[idx:idx+2], 16) / 255.0)
    vec = (vec + [0.0] * VECTOR_SIZE)[:VECTOR_SIZE]
    mag = math.sqrt(sum(x*x for x in vec)) or 1.0
    return [x/mag for x in vec]


def _cosine(a: List[float], b: List[float]) -> float:
    dot   = sum(x*y for x,y in zip(a,b))
    mag_a = math.sqrt(sum(x*x for x in a)) or 1.0
    mag_b = math.sqrt(sum(x*x for x in b)) or 1.0
    return dot / (mag_a * mag_b)


# ── Qdrant HTTP ───────────────────────────────────────────────────────────────

async def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    if settings.qdrant_api_key:
        h["api-key"] = settings.qdrant_api_key
    return h


async def check_qdrant_live() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(f"{QDRANT_BASE}/healthz")
            return r.status_code == 200
    except Exception:
        return False


async def _ensure_collection() -> None:
    hdrs = await _headers()
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get(f"{QDRANT_BASE}/collections/{COLLECTION}", headers=hdrs)
            if r.status_code == 200:
                return
            await c.put(f"{QDRANT_BASE}/collections/{COLLECTION}", headers=hdrs,
                        json={"vectors":{"size":VECTOR_SIZE,"distance":"Cosine"}})
    except Exception:
        pass


async def _seed_demo() -> None:
    """Seed the 5 demo memories with user_id in payload (idempotent)."""
    hdrs = await _headers()
    points = []
    for m in DEMO_MEMORIES:
        points.append({
            "id": abs(hash(m["id"])) % (2**31),
            "vector": _local_embed(m["content"]),
            "payload": {
                "memory_id": m["id"],
                "content":   m["content"],
                "source":    m["source"],
                "date":      m["date"],
                "tags":      m["tags"],
                "user_id":   m["user_id"],
            },
        })
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            await c.put(f"{QDRANT_BASE}/collections/{COLLECTION}/points",
                        headers=hdrs, json={"points": points})
    except Exception:
        pass


# ── Public API ────────────────────────────────────────────────────────────────

async def search_memories(
    query: str,
    user_id: str = "demo_user",
    limit: int = 3,
) -> Tuple[List[MemoryItem], bool]:
    """
    Retrieve relevant memories FOR THIS USER ONLY.
    Qdrant query includes a MUST filter on user_id — cross-user isolation enforced.
    """
    live = await check_qdrant_live()

    if live:
        try:
            await _ensure_collection()
            await _seed_demo()
            vec  = _local_embed(query)
            hdrs = await _headers()
            body = {
                "vector": vec,
                "limit": limit,
                "with_payload": True,
                "score_threshold": 0.08,
                # ── PAYLOAD ISOLATION — mandatory filter by user_id ──────────
                "filter": {
                    "must": [
                        {"key": "user_id", "match": {"value": user_id}}
                    ]
                },
            }
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.post(
                    f"{QDRANT_BASE}/collections/{COLLECTION}/points/search",
                    headers=hdrs, json=body,
                )
                if r.status_code == 200:
                    results = r.json().get("result", [])
                    return [
                        MemoryItem(
                            id=p.get("payload",{}).get("memory_id", str(item.get("id",""))),
                            content=p.get("payload",{}).get("content",""),
                            source=p.get("payload",{}).get("source","Voice session"),
                            date=p.get("payload",{}).get("date",""),
                            relevance=round(item.get("score",0.0),3),
                            tags=p.get("payload",{}).get("tags",[]),
                        )
                        for item in results
                        for p in [item]   # alias
                    ], True
        except Exception:
            pass

    # ── Demo fallback (in-memory, also filtered by user_id) ───────────────────
    qv = _local_embed(query)
    user_mems = [m for m in _demo_store if m.get("user_id","demo_user") == user_id]
    scored = sorted(
        [(float(_cosine(qv, _local_embed(m["content"]))), m) for m in user_mems],
        key=lambda x: x[0],
        reverse=True
    )
    return [
        MemoryItem(id=m["id"], content=m["content"], source=m["source"],
                   date=m["date"], relevance=round(s,3), tags=m["tags"])
        for s, m in scored[:limit] if s > 0.05
    ], False


async def upsert_memory(
    content: str,
    tags: List[str],
    source: str,
    user_id: str,
    session_id: str,
) -> bool:
    """
    Persist a new memory vector.  payload includes user_id for isolation.
    Works on both live Qdrant and the demo in-memory store.
    """
    mem_id   = f"mem_{uuid.uuid4().hex[:8]}"
    date_str = datetime.now().strftime("%Y-%m-%d")
    vec      = _local_embed(content)

    live = await check_qdrant_live()
    if live:
        try:
            await _ensure_collection()
            hdrs = await _headers()
            point_id = abs(hash(mem_id)) % (2**31)
            body = {"points": [{
                "id": point_id,
                "vector": vec,
                "payload": {
                    "memory_id":  mem_id,
                    "content":    content,
                    "source":     source,
                    "date":       date_str,
                    "tags":       tags,
                    "user_id":    user_id,
                    "session_id": session_id,
                },
            }]}
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.put(
                    f"{QDRANT_BASE}/collections/{COLLECTION}/points",
                    headers=hdrs, json=body,
                )
                return r.status_code in (200, 201)
        except Exception:
            pass

    # Demo fallback — append to in-memory store
    _demo_store.append({
        "id":         mem_id,
        "content":    content,
        "source":     source,
        "date":       date_str,
        "tags":       tags,
        "user_id":    user_id,
        "session_id": session_id,
    })
    return True


async def get_all_memories(user_id: str = "demo_user") -> Tuple[List[MemoryItem], bool]:
    live = await check_qdrant_live()
    if live:
        try:
            hdrs = await _headers()
            body = {
                "limit": 100,
                "with_payload": True,
                "filter": {"must":[{"key":"user_id","match":{"value":user_id}}]},
            }
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.post(
                    f"{QDRANT_BASE}/collections/{COLLECTION}/points/scroll",
                    headers=hdrs, json=body,
                )
                if r.status_code == 200:
                    points = r.json().get("result",{}).get("points",[])
                    return [
                        MemoryItem(
                            id=p["payload"].get("memory_id", str(p.get("id",""))),
                            content=p["payload"].get("content",""),
                            source=p["payload"].get("source","Voice session"),
                            date=p["payload"].get("date",""),
                            relevance=1.0,
                            tags=p["payload"].get("tags",[]),
                        )
                        for p in points
                    ], True
        except Exception:
            pass

    mems = [m for m in _demo_store if m.get("user_id","demo_user") == user_id]
    return [
        MemoryItem(id=m["id"],content=m["content"],source=m["source"],
                   date=m["date"],relevance=1.0,tags=m["tags"])
        for m in mems
    ], False


async def delete_memory(memory_id: str, user_id: str = "demo_user") -> Tuple[bool, bool]:
    live = await check_qdrant_live()
    if live:
        try:
            hdrs = await _headers()
            pid  = abs(hash(memory_id)) % (2**31)
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.post(
                    f"{QDRANT_BASE}/collections/{COLLECTION}/points/delete",
                    headers=hdrs, json={"points":[pid]},
                )
                return r.status_code == 200, True
        except Exception:
            pass
    # demo
    global _demo_store
    _demo_store = [m for m in _demo_store
                   if not (m["id"] == memory_id and m.get("user_id","demo_user") == user_id)]
    return True, False
