from fastapi import APIRouter
from fastapi.responses import Response, JSONResponse
from app.models import TTSRequest
from app.services import rime_service

router = APIRouter()


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    if not req.text or not req.text.strip():
        return JSONResponse(status_code=400, content={"detail": "Text cannot be empty"})

    # Language passed through — rime_service picks correct model/speaker/lang
    audio_bytes, is_live, content_type = await rime_service.synthesize(
        text=req.text,
        language=req.language.value,  # "english" | "hindi" | "hinglish"
    )

    if audio_bytes and is_live:
        cfg = rime_service.get_voice_config(req.language.value)
        return Response(
            content=audio_bytes,
            media_type=content_type or "audio/mpeg",
            headers={
                "X-TTS-Source":   "rime",
                "X-Rime-Model":   cfg["modelId"],
                "X-Rime-Speaker": cfg["speaker"],
                "X-Rime-Lang":    cfg["lang"],
            },
        )

    return JSONResponse(
        status_code=200,
        content={
            "demo":     True,
            "message":  "Rime TTS not configured. Use browser speech synthesis.",
            "text":     req.text,
            "language": req.language.value,
        },
        headers={"X-TTS-Source": "demo"},
    )
