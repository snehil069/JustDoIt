# SpeakUp 🎙️

> **Think. Explore. Speak. Improve.**  
> An AI-powered speaking, thinking, and communication training platform for college students, beginners, and young professionals.

---

## 🌟 Overview

**SpeakUp** is not a generic chatbot or a praise generator. It is a daily speaking gymnasium that delivers **honest, evidence-based speech evaluation**, pinpointing real grammatical slips, weak reasoning, excessive filler words, and delivery bottlenecks.

### The Learning Cycle
$$\text{Choose Challenge} \longrightarrow \text{Think} \longrightarrow \text{Speak} \longrightarrow \text{Transcribe} \longrightarrow \text{Evaluate} \longrightarrow \text{Correct} \longrightarrow \text{Practise Again}$$

---

## 🚀 Key Features

### 1. Six Practice Modes
- **Mode A — Impromptu Speaking**: Pick a Random Word Challenge (with a concrete speaking task), an Open-Ended Question, or a Hypothetical Situation. Speak for 1 to 10 minutes with live transcription.
- **Mode B — Research & Speak**: 5-minute preparation timer with a dedicated research notes scratchpad, followed by oral explanation (notes are strictly kept separate from spoken transcript).
- **Mode C — Debate Mode**: Interactive multi-round debate partner. Argue For or Against a motion against an uncompromising AI opponent that challenges weak premises, assumptions, and contradictions.
- **Mode D — Interview Simulator**: Realistic HR, Behavioral STAR, and Technical interview rounds with probing follow-up questions.
- **Mode E — Explain Simply**: Demystify complex concepts (e.g. Blockchain, Quantum Computing, EVs) to a specific target audience (e.g. a 10-year-old child or a non-technical CEO).
- **Mode F — Real-Life Situations**: Navigate high-stakes scenarios: handling a slacking teammate, disagreeing with a professor, or introducing yourself to unfamiliar groups.

### 2. Honest, Calibrated Evaluation Rubric
SpeakUp scores every speech across a 100-point weighted rubric:

| Dimension | Weight | Description |
|---|---:|---|
| Content Relevance & Accuracy | 20 | Direct answers, factual precision, distinguishing facts from opinions |
| Reasoning, Examples & Evidence | 15 | Structured arguments, concrete evidence, avoiding broad generalisations |
| Organisation & Logical Flow | 15 | Opening thesis, transitions, body points, conclusion |
| Clarity & Sentence Construction | 15 | Run-on sentences, awkward phrasing, clear expression |
| Grammar | 15 | Real errors only (subject-verb agreement, tenses, articles, prepositions) |
| Vocabulary & Word Choice | 10 | Precision and natural phrasing over big, pretentious words |
| Verbal Fluency & Fillers | 10 | Frequency of "um", "uh", "you know", "like", and hesitations |
| **Total** | **100** | **Calibrated score (weak speeches receive 35–55, not inflated 90s)** |

### 3. Detailed Diagnostic Report
- **"Correct My English" Table**: Verbatim mistake quote $\rightarrow$ Corrected version $\rightarrow$ Clear grammatical rule explanation.
- **Reasoning Critique**: Strongest argument, weakest premise, missing angles, and unsupported factual claims flagged.
- **Voice & Delivery Metrics**: Words per minute (WPM), pause count, longest pause, silence percentage, volume stability, and clipping warnings.
- **Scientific Limitation Transparency**: Honest disclosures when acoustic metrics cannot be inferred from text alone.
- **Better Way to Say It**: Polished, professional alternatives for 1–2 actual sentences spoken.
- **3 Personalized Exercises**: Targeted 2-to-3 minute drills based on your recorded weaknesses.
- **Recommended Next Challenge**: One-click transition to the next exercise.

### 4. Audio Signal Analysis & Speech-to-Text
- **Dual-Engine Speech Recognition**:
  - **Browser Web Speech API**: Zero-config, zero-latency transcription out of the box in Chrome, Edge, and Brave.
  - **Deepgram Nova-2 Live**: WebSocket audio streaming tuned for Indian English accents and technical vocabulary.
- **Verbatim Disfluency Preservation**: Fillers, false starts, and repetitions are preserved to ensure honest fluency diagnosis.
- **Web Audio API Signal Processor**: Live RMS loudness meter, silence interval detector, and audio clipping detector.

### 5. Progress Analytics & Session History
- Tracks daily practice streaks, total speaking minutes, average score, and score trends over time.
- Review past session reports and replay recordings.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Web Audio API, Web Speech API.
- **Backend**: Node.js, Express, TypeScript, WebSockets (`ws`), `@google/generative-ai`, `@deepgram/sdk`.
- **Persistence**: LocalStorage & IndexedDB (structured for easy Supabase integration).

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.19)
- npm or pnpm

### 1. Clone & Install Dependencies

```bash
# In the project root:
cd client && npm install
cd ../server && npm install
```

### 2. Environment Configuration

Copy `.env.example` in the root:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

# Optional: Add your Google Gemini API key for live generative evaluation
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Add your Deepgram API key for Nova-2 STT
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

> **Note on Demo Mode**: If no API keys are provided, SpeakUp automatically runs in **Demo Mode**, utilizing its rule-based heuristic linguistic evaluator. Demo results are always clearly labelled and never misrepresented as real AI analysis.

### 3. Running the Application

You can start both client and server:

```bash
# Terminal 1: Start Backend Server
cd server
npm run dev

# Terminal 2: Start Vite Client
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Testing

To run the automated backend test suite verifying all 7 core API endpoints:

```bash
node server/test-api.js
```

This tests:
1. `GET /api/health` — Provider connectivity
2. `GET /api/topics/categories` — Curated categories
3. `GET /api/topics/random` — Topic filter and generation
4. `POST /api/audio/analyze` — Signal analysis (WPM, silence, fillers)
5. `POST /api/evaluate` — Calibrated evaluation and exact grammar corrections
6. `POST /api/debate/turn` — Multi-round debate counterargument generation
7. `POST /api/interview/turn` — STAR interview question-and-answer flow

---

## 🔒 Privacy & Security

- All API keys are securely stored and managed on the backend.
- Raw audio is not permanently uploaded or retained without explicit user permission.
- No biometric voice profiling or emotional inference is performed.

---

## 📄 License
MIT License.
