from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routes import conversation, tts, memory, status, conversations, history, handoff, insights, profile, risk


app = FastAPI(
    title="Nuvia API",
    description="Voice-first health support companion — backend API",
    version="2.0.0",
)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversation.router,  prefix="/api")
app.include_router(tts.router,           prefix="/api")
app.include_router(memory.router,        prefix="/api")
app.include_router(status.router,        prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(history.router,       prefix="/api")
app.include_router(handoff.router,       prefix="/api")
app.include_router(insights.router,      prefix="/api")
app.include_router(profile.router,      prefix="/api")
app.include_router(risk.router,         prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nuvia-api", "version": "2.0.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback, logging
    logging.getLogger("nuvia").error(traceback.format_exc())
    
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        allowed = [o.strip() for o in settings.cors_origins.split(",")]
        if origin in allowed or "*" in allowed:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
            
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
        headers=headers,
    )
