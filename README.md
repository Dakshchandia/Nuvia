# NUVIA — Your health, heard.

> Voice-first, context-aware health support companion.

---

## Product overview

Nuvia lets people explain health concerns naturally through voice. Instead of filling forms or clicking through symptom checklists, you just talk. Nuvia listens, understands, retrieves relevant previous context from Qdrant, asks a contextual follow-up, provides supportive guidance, and speaks the response back using Rime TTS.

**Nuvia is not a diagnosis engine.** It provides support and guidance using careful language — never claiming "You have X condition."

---

## The problem

- Long health forms
- Symptom checklists
- Typing everything
- Repeating yourself every visit
- Generic responses
- Lost context between conversations

---

## The solution

```
USER SPEAKS
     ↓
NUVIA UNDERSTANDS
     ↓
RELEVANT CONTEXT RETRIEVED FROM QDRANT
     ↓
NUVIA ASKS A CONTEXTUAL FOLLOW-UP
     ↓
NUVIA PROVIDES CAREFUL SUPPORTIVE GUIDANCE
     ↓
RIME SPEAKS THE RESPONSE BACK
     ↓
CONVERSATION CONTINUES
```

---

## Core workflow (exact demo flow)

1. Open the landing page at `http://localhost:5173`
2. Click **Talk to Nuvia** → opens the app dashboard
3. Navigate to **Talk to Nuvia**
4. Tap the orb or click **Load demo phrase**
5. Demo phrase: `"Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai."`
6. Click **Understand this**
7. **STEP 01** shows: Headache (Since yesterday) + Dizziness (Today)
8. Click **Yes, continue**
9. **STEP 02** shows Qdrant memory: "User mentioned a headache two days ago."
10. **STEP 03** shows: Follow-up question + Support level + Guidance + Why
11. Click **Speak with Nuvia** → Rime TTS (or browser speech fallback) reads the response
12. Orb enters SPEAKING state during playback

---

## Features

- Voice input via browser SpeechRecognition (abstraction allows Whisper swap)
- Structured extraction: symptoms, duration, timing, keywords
- Qdrant vector similarity retrieval across conversation memories
- Contextual follow-up question generation
- Attention level: LOW / NEEDS ATTENTION / URGENT
- Explainability: "Why Nuvia is saying this"
- Rime TTS with browser speechSynthesis fallback
- Full demo mode — works without any API keys
- Multilingual: English, Hindi, Hinglish
- Responsive — mobile, tablet, desktop

---

## Architecture

```
USER (speaks)
     ↓
Browser SpeechRecognition
     ↓
React Frontend (TypeScript + Vite + Tailwind)
     ↓
FastAPI Backend (Python)
     ↓
Conversation Engine (extraction + guidance)
     ↓
Qdrant Retrieval (vector similarity search)
     ↓
Rime TTS (natural voice synthesis)
     ↓
Audio playback
     ↓
USER (hears Nuvia)
```

---

## Tech stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS |
| Animations  | Framer Motion                     |
| Icons       | Lucide React                      |
| Routing     | React Router v6                   |
| Backend     | Python, FastAPI, Pydantic, HTTPX  |
| Memory      | Qdrant (vector similarity)        |
| Voice input | Browser SpeechRecognition API     |
| Voice output| Rime TTS API                      |
| Infra       | Docker Compose                    |

---

## Project structure

```
nuvia/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/         # Landing page sections
│   │   │   ├── NuviaOrb.tsx     # Animated orb (idle/listening/processing/speaking)
│   │   │   ├── StatusBadge.tsx  # Live/Demo badges
│   │   │   └── AttentionBadge.tsx
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts
│   │   │   └── useStatus.ts
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx    # Sidebar + mobile nav
│   │   ├── lib/
│   │   │   └── api.ts           # Typed API client
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── TalkPage.tsx     # Core experience
│   │   │   ├── ConversationsPage.tsx
│   │   │   ├── MemoryPage.tsx
│   │   │   ├── HowItWorksPage.tsx
│   │   │   └── UnderTheHoodPage.tsx
│   │   └── App.tsx
│   ├── .env
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── conversation.py
│   │   │   ├── tts.py
│   │   │   ├── memory.py
│   │   │   ├── status.py
│   │   │   └── conversations.py
│   │   ├── services/
│   │   │   ├── conversation_service.py  # Extraction + guidance
│   │   │   ├── qdrant_service.py        # Memory retrieval
│   │   │   └── rime_service.py          # TTS
│   │   ├── config.py
│   │   ├── models.py
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker Desktop (for Qdrant)

---

### 1. Frontend

```bash
cd nuvia/frontend
npm install
npm run dev
# → http://localhost:5173
```

**Build for production:**
```bash
npm run build
```

**TypeScript check:**
```bash
npm run typecheck
```

---

### 2. Backend

```bash
cd nuvia/backend

# Copy env
cp .env.example .env

# Install dependencies
python -m pip install -r requirements.txt

# Start server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

---

### 3. Qdrant (Docker)

```bash
cd nuvia
docker compose up -d
# Qdrant → http://localhost:6333
# Dashboard → http://localhost:6333/dashboard
```

Without Docker, Nuvia falls back to local demo memory retrieval automatically.

---

## Environment variables

### Backend (`backend/.env`)

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=nuvia_memories
RIME_API_KEY=
RIME_MODEL=mist
RIME_SPEAKER=luna
RIME_LANGUAGE=en
DEBUG=false
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8001
```

---

## Rime TTS setup

1. Sign up at [rime.ai](https://rime.ai)
2. Get your API key
3. Set `RIME_API_KEY` in `backend/.env`
4. Optionally set `RIME_MODEL`, `RIME_SPEAKER`, `RIME_LANGUAGE`

Without a key, Nuvia uses browser `speechSynthesis` as fallback. The UI clearly labels this as "Rime demo mode".

---

## API endpoints

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/health`               | Health check             |
| GET    | `/api/status`           | Live/demo service status |
| POST   | `/api/conversation`     | Process user input       |
| POST   | `/api/tts`              | Text to speech           |
| GET    | `/api/memory`           | List all memories        |
| DELETE | `/api/memory/{id}`      | Delete a memory          |
| GET    | `/api/conversations`    | List conversations       |
| POST   | `/api/conversations`    | Save a conversation      |

### POST /api/conversation

Request:
```json
{
  "text": "Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai.",
  "language": "hinglish"
}
```

Response:
```json
{
  "understood": [
    { "label": "Headache", "detail": "Since yesterday" },
    { "label": "Dizziness", "detail": "Today" }
  ],
  "memories": [...],
  "question": "Theek hai. Kya abhi bhi dizziness ya chakkar ho raha hai?",
  "attention_level": "NEEDS ATTENTION",
  "guidance": "Based on what you've shared...",
  "why": ["Headache: Since yesterday", "Relevant previous context retrieved"],
  "summary": { ... },
  "demo_retrieval": true
}
```

---

## Demo mode

Nuvia works fully without any external API keys:

- **Voice input**: Browser SpeechRecognition (works natively in Chrome/Edge)
- **Qdrant**: Falls back to local cosine similarity across 5 seeded demo memories
- **Rime TTS**: Falls back to browser `speechSynthesis`

Status badges always accurately reflect Live vs Demo. Nothing is faked.

---

## Security

- Rime API key is server-side only — never sent to the frontend
- CORS restricted to development origins
- `.env` files are in `.gitignore`
- No hardcoded secrets anywhere in the codebase

---

## Limitations

- Conversation extraction is rule-based (keyword matching), not ML-based
- Local embeddings are deterministic hash-based (not semantic) — suitable for demo
- No user authentication in prototype
- Conversation history is in-memory on the backend (resets on restart)

---

## Future improvements

- Replace local embeddings with sentence-transformers or OpenAI embeddings
- Add Whisper STT for higher-accuracy multilingual voice input
- Persistent conversation storage (PostgreSQL or SQLite)
- User authentication and per-user memory namespacing
- Full LLM integration for contextual response generation
- Streaming TTS response
- Mobile app (React Native)

---

## Running everything

```bash
# Terminal 1 — Qdrant
cd nuvia && docker compose up -d

# Terminal 2 — Backend
cd nuvia/backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# Terminal 3 — Frontend
cd nuvia/frontend && npm run dev
```

Open http://localhost:5173

---

*NUVIA — Just talk. Nuvia listens.*
