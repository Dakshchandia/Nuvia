# Nuvia In-Depth Presentation Slide Deck

This presentation outlines the slide-by-slide structure, visual design descriptions, and technical specifications for Nuvia. Use these slides to construct your final presentation material.

---

## Slide 1: Title Slide
### **NUVIA — Your health, heard.**
* **Subtitle**: A voice-first, context-aware health support companion.
* **Presenter Name**: [Your Name]
* **Key Visual**: Large glowing interactive orb centered, with a clean warm-off-white background and elegant typography (Playfair Display).
* **Talking Points**:
  * Welcome to Nuvia, a system designed to humanize the interface between patients and their healthcare history.
  * Voice-first and context-aware: we enable users to speak their concerns instead of checking boxes.

---

## Slide 2: The Core Problem
### **Why Healthcare UI is Broken**
* **Visual Layout**: A split-slide design. Left side shows a screenshot of a confusing, complex medical form checklist; right side shows the core bullet points.
* **The Complexity**: Users must type detailed essays or click through endless symptom checklists, which is stressful during illnesses.
* **The Repetition**: Patients have to repeat their health history on every single session because standard apps have no memory.
* **The Anxiety**: Standard search engines return alarming, extreme diagnoses, increasing patient distress.
* **The Data Loss**: Crucial health history gets lost between separate conversation sessions.

---

## Slide 3: The Solution
### **How Nuvia Reimagines Care**
* **Visual Layout**: A simple, clean diagram showing the flow of: Speech → Context Match → Supportive Guidance → Synthesis.
* **Just Talk**: Patients explain concerns naturally using voice in English, Hindi, or Hinglish.
* **We Remember**: Qdrant Vector DB recalls past sessions (e.g., *"I remember you mentioned dizziness two days ago..."*).
* **Clinical Boundaries**: Purely supportive guidance—never issues risky diagnoses.
* **Voice Responses**: Premium speech output simulates natural, empathetic voice interactions.

---

## Slide 4: Key Technical Capabilities (Part 1)
### **Smart Voice & Language Processing**
* **Visual Layout**: Three vertical columns, each with an icon (Mic, Language flag, Volume).
* **Zero-Cost Voice Input**: Leverages browser-native `SpeechRecognition` API (multilingual, zero server costs, native in Chrome/Edge).
* **Bilingual Hinglish Support**: Native Hindi, English, and Hinglish mixed-mode understanding suitable for modern Indian speakers.
* **Empathetic Text-to-Speech (TTS)**: Dual integration using **Rime TTS** (premium voice generation) and browser-native fallback.

---

## Slide 5: Key Technical Capabilities (Part 2)
### **Advanced Context & Risk Engine**
* **Visual Layout**: Three vertical columns, each with an icon (Database, Shield, Activity).
* **Semantic Context Recall**: Vector similarity matching retrieves historical context from **Qdrant Vector DB**.
* **Payload Isolation**: Secure, per-user memory protection—User A can never access User B's memories.
* **Pregnancy-Specific Risk Engine**: Tracks symptoms alongside profile parameters (age, pregnancy month) to flag critical issues.
* **Emergency SOS Dispatch**: One-click SOS dispatch simulator showing locations, hospitals, and contact alerts.

---

## Slide 6: Feature Spotlight — Home (Dashboard)
* **Visual Layout**: Centered greeting banner ("Good morning, [User Name]"). Grid of metrics cards below, showing: Active Risk status, Nuvia Insights, Recent Memory snippet, and Recent Conversations list.
* **Core User Value**: Provides a unified command center. Instantly outlines patient status, safety warnings, and shortcuts without manual searching.
* **Technical Implementation**:
  * **API Routes Hit**: `/api/conversations` (recent logs), `/api/memory` (retrieval), `/api/insights` (latest AI summary), and `/api/risk/analyze` (computes risk level).
  * **Frontend State Variables**: `convs` (ConversationRecord list), `mems` (MemoryItem list), `insight` (dict), and `riskLevel` (string).
  * **Components**: `NuviaOrb` (idle preview), `StatusBadge` (Qdrant/Rime/AI status indicators), and `AttentionBadge`.

---

## Slide 7: Feature Spotlight — Talk to Nuvia
* **Visual Layout**: Split layout. Top/Left: Animated 3D-effect glowing Orb (NuviaOrb) with active status text. Bottom/Right: Textarea input box showing transcription status, load demo phrase button, and a step-by-step progress pipeline (Understands -> Retrieves -> Advises).
* **Core User Value**: The primary portal for voice consultations. Shows the pipeline in real-time so patients see how Nuvia evaluates concerns.
* **Technical Implementation**:
  * **API Routes Hit**: `/api/conversation` (POST input), `/api/tts` (POST speech audio), and `/api/conversations/full` (POST save logs).
  * **Frontend State Variables**: `orb` ('idle'|'listening'|'processing'|'speaking'), `step` ('input'|'understood'|'context'|'guidance'), `resp` (ConversationResponse object), and `latency` (TurnLatency object).
  * **Flow Controls**: Interactive click-handlers start browser `SpeechRecognition`. Cancels audio playback automatically if user interrupts Nuvia speaking (Barge-in detection).

---

## Slide 8: Feature Spotlight — Conversations
* **Visual Layout**: A clean filterable list layout. Each row represents a conversation card showing date, extracted symptoms as tag badges, preview snippet of what was said, and a colored severity badge (Low/Needs Attention/Urgent).
* **Core User Value**: Full history transparency. Users can trace past interactions and show transcripts directly to doctors.
* **Technical Implementation**:
  * **API Routes Hit**: GET `/api/conversations` to fetch history records, POST `/api/conversations` to save a custom text session.
  * **Frontend State Variables**: `conversations` (array of ConversationRecord), `loading` (boolean), and `searchQuery` (string).
  * **Features**: Live text searching across transcripts and filters by language and attention levels.

---

## Slide 9: Feature Spotlight — Memory Wallet
### **User Privacy and Data Sovereignty**
* **Visual Layout**: A card grid where each card shows a specific factual sentence stored by the memory service (e.g. *"User mentioned back pain three days ago"*), showing the tags, creation date, source type, and a red "Delete" trashcan icon.
* **Core User Value**: Patient privacy. Gives users full control to inspect, revoke, or delete specific factual associations that the AI has registered about them.
* **Technical Implementation**:
  * **API Routes Hit**: GET `/api/memory?user_id=demo_user` (scroll memories), DELETE `/api/memory/{id}?user_id=demo_user` (delete memory point).
  * **Frontend State Variables**: `memories` (MemoryItem array), `deletingId` (string|null), and `search` (string).
  * **Logic**: Directly maps list elements from the Qdrant DB points collection filtered by `user_id` to enforce payload isolation.

---

## Slide 10: Feature Spotlight — Timeline
* **Visual Layout**: A vertical timeline thread. Date nodes on the left; on the right are cards detailing the symptoms, duration, and safety guidance given on those specific dates.
* **Core User Value**: Visualizes progression. Helps users and doctors identify whether symptoms are deteriorating, improving, or recurring over a multi-week calendar window.
* **Technical Implementation**:
  * **API Routes Hit**: GET `/api/conversations` (uses logs to parse calendar timeline data) or GET `/api/insights`.
  * **Frontend State Variables**: `timeline` (chronological dictionary of sessions grouped by calendar date).
  * **Logic**: Sorts records chronologically and renders them using a CSS visual timeline tree.

---

## Slide 11: Feature Spotlight — Insights
* **Visual Layout**: Two-column dashboard. Left: Statistics grid displaying total conversations, keywords tracked, and top symptoms count. Right: List of AI-generated summaries showing chronic patterns (e.g. *"Headache pattern: recurring twice a week"*).
* **Core User Value**: Distills raw transcripts into analytical conclusions, warning users of chronic conditions or repeating habits.
* **Technical Implementation**:
  * **API Routes Hit**: GET `/api/insights`.
  * **Frontend State Variables**: `insightsData` (Insights object), `hasData` (boolean), and `loading` (boolean).
  * **Under-the-hood**: Python service parses history log files to compile keyword counts and runs an LLM overview analysis.

---

## Slide 12: Feature Spotlight — Risk Monitor
### **The Emergency Safety Hub**
* **Visual Layout**: High-contrast safety dashboard. Top: Massive warning banner showing risk assessment level (LOW/NEEDS ATTENTION/URGENT). Middle: Input fields to set Emergency Contact name, phone, and hospital preferences. Bottom: Large "Test SOS Dispatch" trigger.
* **Core User Value**: Automates crisis prevention. Proactively alerts users if symptoms indicate complications, mapping location details and locator resources in one click.
* **Technical Implementation**:
  * **API Routes Hit**: GET `/api/risk/analyze` (symptom checks), GET/POST `/api/risk/settings` (SOS config), and POST `/api/risk/sos` (trigger distress code).
  * **Frontend State Variables**: `riskData` (RiskData object), `settings` (EmergencySettings), `sosModalOpen` (boolean), and `dispatching` (boolean).
  * **Logic**: Intersect check logic matches profile elements (pregnancy status) with current symptoms to calculate warning level.

---

## Slide 13: Feature Spotlight — How It Works
* **Visual Layout**: Clean 3-step grid card design with responsive layout icons. Card 1: Speak (Mic), Card 2: Process (Gear), Card 3: Speak Back (Speaker).
* **Core User Value**: Simple user training. Builds platform trust by clearly illustrating how voice inputs map to AI processes.
* **Technical Implementation**:
  * **Routes Hit**: Static routing (renders instantly without server dependency).
  * **Visual Assets**: Responsive SVG vectors with subtle hover micro-animations.

---

## Slide 14: Feature Spotlight — Under the Hood
### **Technical Performance Log**
* **Visual Layout**: Dual code/json terminal screens. Left: Step-by-step audit events log. Right: Latency breakdown charts (STT ms, Qdrant search ms, LLM inference ms, TTS stream ms) and raw JSON responses.
* **Core User Value**: Developer transparency. Provides verification logs that prove system components are running and performing efficiently.
* **Technical Implementation**:
  * **API Routes Hit**: GET `/api/handoff/events/{session_id}` (fetches server orchestration logs).
  * **Frontend State Variables**: `events` (array of audit events), `selectedEvent` (object), and `autoRefresh` (boolean).

---

## Slide 15: The Resilient Pipeline (Hybrid Core)
### **Built for Zero-Downtime Healthcare**
* **Visual Layout**: Flow diagram showing how requests bypass LLM API calls or Qdrant connection blocks if limits are reached.
* **Dynamic AI Pipelines**: Uses Gemini LLM for high-accuracy JSON parsing and follow-up generation.
* **Deterministic Local Fallbacks**: If external API limits are exceeded or offline:
  * **Symptom Parser**: Falls back to regex-based dictionary lookups.
  * **Memory DB**: Falls back to a local hash-based Cosine Similarity engine.
  * **Audio output**: Falls back to local Web Speech synthesis.

---

## Slide 16: Technical Architecture
### **The Modern Health-Tech Stack**
* **Visual Layout**: Layered architectural stack diagram (Frontend -> Backend -> DB & APIs).
* **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion.
* **Backend**: FastAPI, Python, Pydantic, HTTPX.
* **Database**: Qdrant (Vector Similarity DB) via Docker Compose.
* **APIs & Models**: Gemini (Language Models) and Rime AI (Voice Synthesis).

---

## Slide 17: Live Performance & Telemetry
### **Sub-Second Voice Orchestration**
* **Visual Layout**: Real-time performance chart mapping processing times.
* **Real-time Telemetry Dashboard**: Measures exact latency of STT, Qdrant memory lookup, LLM inference, and TTS audio generation.
* **Audit Trail**: Logs step-by-step pipeline executions for developer troubleshooting and verification.
