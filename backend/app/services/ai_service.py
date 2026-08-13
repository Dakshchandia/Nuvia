"""
Nuvia AI Service — Multilingual
================================
Language flows through every call:
  extract_understanding(text, language) → JSON in user's language
  generate_contextual_response(understanding, memories, language) → response in user's language
"""
import json, re, logging
from typing import List, Optional, Tuple
import httpx

from app.config import settings
from app.models import AIUnderstanding, AIContextualResponse, ExtractedSymptom, MemoryItem, Language

logger = logging.getLogger("nuvia.ai")

# ── Per-language system prompts ───────────────────────────────────────────────

_EXTRACT_BASE = """You are Nuvia, a voice-first health support companion.
Extract the core intent and search keywords from what the user said.
Rules:
- NEVER invent symptoms or history.
- Set is_health_related=false for casual greetings like "hello", "hi", "kaise ho".
- Extract 1-3 keywords to search the user's past memory (e.g. "headache", "stress", "pregnancy").
Return ONLY valid JSON. Start with { and end with }.
Schema:
{
  "intent": "<brief summary of what the user is saying>",
  "keywords": ["<kw1>", "<kw2>"],
  "is_health_related": true
}"""

_RESPOND_BASE = """You are Nuvia, a voice-first health support companion.
Analyze the user's message and any relevant memory to provide a dynamic response.
Rules:
- Give a natural, conversational response in the "response" field. This will be spoken directly to the user.
- If appropriate, ask ONE follow-up question in the "question" field. Omit if not needed.
- Provide guidance in the "guidance" field if appropriate. Omit if not needed.
- Assign a risk/support level: LOW, WATCH, ELEVATED, or URGENT.
- NEVER diagnose. NEVER say "You have [disease]". Use "This can sometimes be associated with...".
- Set emergency=true ONLY for severe, immediately life-threatening symptoms (e.g., severe chest pain, unable to breathe).
Return ONLY valid JSON. Start with { and end with }.
Schema:
{
  "intent": "<short summary of user intent>",
  "understanding": "<what you understand from the situation>",
  "response": "<conversational response to speak to user>",
  "question": "<optional follow-up question, or null>",
  "attention_level": "<LOW|WATCH|ELEVATED|URGENT>",
  "guidance": "<optional guidance, or null>",
  "why": ["<reason1>", "<reason2>"],
  "emergency": false
}"""

_LANG_INSTRUCTIONS = {
    Language.english: {
        "extract": "The user is speaking English. Respond and extract in English.",
        "respond": "Respond in natural conversational English. Keep it concise for voice.",
        "system_respond": _RESPOND_BASE + "\nLanguage: Respond in natural English.",
    },
    Language.hindi: {
        "extract": "The user is speaking Hindi. Extract in Hindi where appropriate.",
        "respond": "Respond in natural Hindi (Devanagari). Conversational, concise, suitable for spoken audio. Never switch to English for the response.",
        "system_respond": _RESPOND_BASE + "\nLanguage: Respond entirely in natural Hindi. Use conversational Hindi suitable for voice. Do not respond in English.",
    },
    Language.hinglish: {
        "extract": "The user is speaking Hinglish (mixed Hindi + English). Preserve the natural mix.",
        "respond": "Respond in natural conversational Hinglish — mix Hindi and English the way a bilingual Indian speaker would. Do not force formal Hindi. Keep it short and natural for voice.",
        "system_respond": _RESPOND_BASE + "\nLanguage: Respond in natural Hinglish. Mix Hindi and English naturally. Example: 'Theek hai. Aapko kal se headache hai aur aaj dizziness bhi. Kya yeh pehle bhi hua hai?'",
    },
}

# ── Rule-based fallback responses per language ────────────────────────────────

_FALLBACK_QUESTION = {
    Language.english:  "Could you tell me more about when this started and if anything makes it better or worse?",
    Language.hindi:    "Kya aap bata sakte hain ki yeh kab se shuru hua aur kya kisi cheez se aaram milta hai?",
    Language.hinglish: "Aur koi symptoms hain? Ya kab se ho raha hai yeh?",
}

_FALLBACK_GUIDANCE = {
    Language.english:  "Based on what you've shared, keeping track of any changes would be helpful. Rest, stay hydrated, and monitor how you feel.",
    Language.hindi:    "Aapne jo bataya uske aadhar par, badlaav par nazar rakhna faydemand hoga. Aaraam karein, paani piyen aur apna khayal rakhein.",
    Language.hinglish: "Aapne jo share kiya uske hisaab se symptoms track karna helpful hoga. Aaraam karein aur hydrated rahein.",
}

_FALLBACK_GUIDANCE_URGENT = {
    Language.english:  "Based on what you've shared, please contact a qualified healthcare professional or emergency service immediately.",
    Language.hindi:    "Aapne jo bataya uske aadhar par, kripya turant kisi qualified doctor ya emergency service se sampark karein.",
    Language.hinglish: "Aapne jo share kiya uske hisaab se, please abhi ek qualified healthcare professional ya emergency service se contact karein.",
}

_FALLBACK_GUIDANCE_NEEDS = {
    Language.english:  "Based on what you've shared, this may need attention. Consult a healthcare professional if symptoms persist.",
    Language.hindi:    "Aapne jo bataya uske aadhar par, yeh dhyan dene wali baat ho sakti hai. Agar lakshan bane rahen to doctor se mile.",
    Language.hinglish: "Aapne jo share kiya uske hisaab se, yeh attention ki zaroorat ho sakti hai. Agar symptoms bane rahen to doctor se milein.",
}

def get_fallback_question(lang: Language) -> str:
    return _FALLBACK_QUESTION.get(lang, _FALLBACK_QUESTION[Language.english])

def get_fallback_guidance(lang: Language, level: str) -> str:
    if "URGENT" in level.upper():
        return _FALLBACK_GUIDANCE_URGENT.get(lang, _FALLBACK_GUIDANCE_URGENT[Language.english])
    if "NEEDS" in level.upper() or "ATTENTION" in level.upper():
        return _FALLBACK_GUIDANCE_NEEDS.get(lang, _FALLBACK_GUIDANCE_NEEDS[Language.english])
    return _FALLBACK_GUIDANCE.get(lang, _FALLBACK_GUIDANCE[Language.english])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_configured() -> bool:
    return bool(settings.ai_api_key and settings.ai_api_key.strip())

def _headers() -> dict:
    return {"Authorization": f"Bearer {settings.ai_api_key}", "Content-Type": "application/json"}

def _extract_json(raw: str) -> dict:
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    start = raw.find("{"); end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON in: {raw[:200]}")
    return json.loads(raw[start:end])

async def _chat(messages: list, temperature: float = 0.3) -> str:
    base = settings.ai_base_url.rstrip("/")
    url  = f"{base}/chat/completions"
    is_gemini = "googleapis.com" in base
    payload: dict = {"model": settings.ai_model, "messages": messages,
                     "temperature": temperature, "max_tokens": 1024}
    if not is_gemini:
        payload["response_format"] = {"type": "json_object"}
    async with httpx.AsyncClient(timeout=settings.ai_timeout) as c:
        r = await c.post(url, headers=_headers(), json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


# ── Public API ────────────────────────────────────────────────────────────────

async def check_ai_live() -> bool:
    return _is_configured()

async def extract_understanding(
    text: str, language: Language,
) -> Tuple[Optional[AIUnderstanding], bool]:
    if not _is_configured():
        return None, False
    lang_inst = _LANG_INSTRUCTIONS.get(language, _LANG_INSTRUCTIONS[Language.english])
    system = _EXTRACT_BASE
    user_msg = f"{lang_inst['extract']}\n\nUser said: {text}"
    try:
        raw  = await _chat([{"role":"system","content":system}, {"role":"user","content":user_msg}])
        data = _extract_json(raw)
        return AIUnderstanding.model_validate(data), True
    except Exception as exc:
        logger.warning("AI extraction failed: %s", exc)
        return None, False

async def generate_contextual_response(
    understanding: AIUnderstanding,
    memories: List[MemoryItem],
    language: Language,
    profile: Optional[dict] = None,
) -> Tuple[Optional[AIContextualResponse], bool]:
    if not _is_configured():
        return None, False
    lang_inst = _LANG_INSTRUCTIONS.get(language, _LANG_INSTRUCTIONS[Language.english])
    und_txt  = json.dumps(understanding.model_dump(exclude_none=True), ensure_ascii=False)
    mem_txt  = "No relevant previous memories." if not memories else (
        "Relevant memories:\n" + "\n".join(f'- "{m.content}" ({m.date})' for m in memories)
    )
    profile_txt = ""
    if profile:
        profile_txt = f"User Profile Context:\nName: {profile.get('name')}\nAge: {profile.get('age')}\nPregnant: {profile.get('pregnancy_status')}"
        if profile.get('pregnancy_status') == 'yes' and profile.get('pregnancy_month'):
            profile_txt += f" (Month of pregnancy: {profile.get('pregnancy_month')})"
        profile_txt += "\n\n"
    user_msg = f"{profile_txt}User understanding:\n{und_txt}\n\n{mem_txt}\n\nLanguage instruction: {lang_inst['respond']}"
    try:
        raw  = await _chat([
            {"role":"system","content":lang_inst["system_respond"]},
            {"role":"user",  "content":user_msg}
        ])
        data = _extract_json(raw)
        return AIContextualResponse.model_validate(data), True
    except Exception as exc:
        logger.warning("AI contextual response failed: %s", exc)
        return None, False

def normalise_attention(raw: str) -> str:
    r = raw.upper().replace("-","_").replace(" ","_")
    if "URGENT"   in r: return "URGENT"
    if "NEEDS"    in r or "ATTENTION" in r: return "NEEDS ATTENTION"
    return "LOW"
