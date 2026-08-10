from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

# Resolve absolute path to .env file relative to this file's grandparent directory (backend)
backend_dir = Path(__file__).resolve().parent.parent
env_file_path = backend_dir / ".env"


class Settings(BaseSettings):
    # Server
    cors_origins: str = "http://localhost:5173,http://localhost:4173"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection: str = "nuvia_memories"

    # Rime TTS
    rime_api_key: Optional[str] = None
    rime_model: str = "mist"
    rime_speaker: str = "luna"
    rime_language: str = "en"

    # AI / LLM  (OpenAI-compatible — works with OpenAI, Groq, Together, Ollama, etc.)
    ai_api_key: Optional[str] = None
    ai_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"
    ai_timeout: float = 30.0

    # App
    debug: bool = False

    class Config:
        env_file = str(env_file_path)
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

