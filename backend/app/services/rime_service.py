"""
Rime TTS Service — Multilingual
================================
Language-specific model/speaker configuration:
  English  → mist  model, luna    speaker, lang=en
  Hindi    → arcana model, ananya  speaker, lang=hi
  Hinglish → arcana model, ananya  speaker, lang=hi (handles code-switching)

Rime API reference: https://docs.rime.ai
"""
import httpx
from typing import Optional, Tuple, Dict, Any
from app.config import settings

RIME_API_BASE = "https://users.rime.ai/v1/rime-tts"

# ── Per-language Rime configuration ──────────────────────────────────────────
# Uses actual Rime model/speaker/lang identifiers.
# arcana model supports Hindi and multilingual content.
# mist model is English-optimised.

VOICE_CONFIG: Dict[str, Dict[str, Any]] = {
    "english": {
        "modelId":  settings.rime_model or "mist",    # env override respected
        "speaker":  settings.rime_speaker or "luna",
        "lang":     "en",
    },
    "hindi": {
        "modelId":  "arcana",
        "speaker":  "ananya",
        "lang":     "hi",
    },
    "hinglish": {
        "modelId":  "arcana",
        "speaker":  "ananya",
        "lang":     "hi",    # arcana handles Hindi/Hinglish naturally
    },
}


def _is_configured() -> bool:
    return bool(settings.rime_api_key and settings.rime_api_key.strip())


def get_voice_config(language: str) -> Dict[str, Any]:
    """Return the Rime config for the given language."""
    return VOICE_CONFIG.get(language.lower(), VOICE_CONFIG["english"])


async def synthesize(text: str, language: str = "english") -> Tuple[Optional[bytes], bool, str]:
    """
    Returns (audio_bytes, is_live, content_type).
    Uses language-specific model/speaker/lang.
    """
    if not _is_configured():
        return None, False, ""

    cfg = get_voice_config(language)

    headers = {
        "Authorization": f"Bearer {settings.rime_api_key}",
        "Content-Type":  "application/json",
        "Accept":        "audio/mp3",
    }

    payload = {
        "text":         text,
        "modelId":      cfg["modelId"],
        "speaker":      cfg["speaker"],
        "lang":         cfg["lang"],
        "samplingRate": 22050,
        "speedAlpha":   1.0,
        "reduceLatency": True,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(RIME_API_BASE, headers=headers, json=payload)
            if r.status_code == 200:
                return r.content, True, r.headers.get("content-type", "audio/mpeg")
            print(f"[Rime] Error {r.status_code}: {r.text[:200]}")
            return None, False, ""
    except Exception as e:
        print(f"[Rime] Exception: {e}")
        return None, False, ""


async def check_rime_live() -> bool:
    return _is_configured()
