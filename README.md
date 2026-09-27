# StudyPilot AI — Intelligent Academic Learning Companion

> **Study Smarter. Learn Faster. With AI.**  
> An intelligent, full-stack educational technology web application engineered specifically for university and college students to master complex lecture materials, generate structured revision notes, practice interactive quizzes, study 3D flashcards, and organize personalized study timetables.

---

## 🌟 Overview & Product Purpose

**StudyPilot AI** bridges the gap between chaotic college course materials and structured exam readiness. Rather than acting as a generic conversational chatbot, StudyPilot AI uses targeted pedagogical prompting frameworks designed for STEM, Computer Science, Mathematics, and humanities curricula.

### Key Capabilities:
- **AI Tutor:** Interactive academic Q&A with tailored subject reasoning (CS, Math, DBMS, Programming, General) and specialized study modes:
  - **Academic Standard:** Four-tier explanation (Simple Overview, Detailed Mechanism, Concrete Example/Code, Key Takeaways).
  - **Explain Like I'm a Beginner:** Real-world analogies, step-by-step reasoning, minimal academic jargon.
  - **Exam Mode:** Word-for-word textbook definitions, high-yield bullet points, 5-mark short answers, and long-answer schemas.
- **Smart Notes Generator:** Paste lecture transcripts or upload plain text/markdown documents to generate comprehensive college notes, executive summaries, formula sheets, or 1-page pre-exam revision guides.
- **Interactive Quiz Generator:** Custom multiple-choice or true/false drill generator (5 to 20 questions) with real-time scoring, progress bars, correct/incorrect badges, and pedagogical answer explanations.
- **Interactive Flashcards:** 3D flip active recall cards with keyboard shortcuts (Space to flip, arrows to navigate), shuffle controls, and mastery tracking.
- **AI Study Planner:** Balanced 7-day personalized timetables mapped around daily available study hours, target exam dates, and course difficulty, with interactive session completion checkboxes.
- **Activity History:** Automatic client-side persistence for recent tutor consultations, quiz attempts, and generated notes with 1-click re-opening and deletion.
- **Personalized Student Settings:** Theme selection (Light/Dark/System), default subject selection, difficulty preference, and profile management.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons |
| **Backend** | Express 4, Node.js (via `tsx`), Full-Stack Dev Server |
| **AI Integration** | `@google/genai` TypeScript SDK (Model: `gemini-3.8-flash`) |
| **Persistence** | LocalStorage Persistence Engine with fallback mock caches |
| **Typography** | Plus Jakarta Sans, JetBrains Mono |

---

## 🏛️ Project Architecture

```
/
├── index.html                   # HTML entry point with synchronized metadata & fonts
├── metadata.json                # AI Studio capability registry (MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API)
├── package.json                 # Dependencies and execution scripts
├── server.ts                    # Full-stack Express server integrating @google/genai SDK
├── tsconfig.json                # TypeScript strict configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── main.tsx                 # React DOM mount point
│   ├── App.tsx                  # Root layout & active tab dispatcher
│   ├── index.css                # Base Tailwind layer, 3D flip card utilities, custom scrollbars
│   ├── types/
│   │   └── index.ts             # Domain models (Chat, Note, Quiz, Flashcard, Plan, Settings)
│   ├── services/
│   │   ├── api.ts               # Frontend API client communicating with /api/*
│   │   └── storage.ts           # Local persistence service with demo statistics & history
│   ├── context/
│   │   └── AppContext.tsx       # Global state (theme, active tab, user stats, toast notifications)
│   ├── components/
│   │   ├── Header.tsx           # Contextual top bar with breadcrumbs and action triggers
│   │   ├── Sidebar.tsx          # Navigation sidebar with streak meter and user profile
│   │   ├── MarkdownRenderer.tsx # Zero-dependency Markdown parser with code blocks & copy buttons
│   │   ├── Toast.tsx            # Accessible toast notification container
│   │   └── Modal.tsx            # Accessible confirmation dialogs
│   └── pages/
│       ├── LandingPage.tsx      # High-conversion marketing landing page with interactive preview
│       ├── DashboardHome.tsx    # Student hub with real-time statistics and tool cards
│       ├── AITutor.tsx          # Core academic chat interface with study mode selectors
│       ├── SmartNotes.tsx       # Document synthesizer with file upload and download options
│       ├── QuizGenerator.tsx    # Multi-step examination simulator with explanations
│       ├── Flashcards.tsx       # 3D interactive flip card review deck
│       ├── StudyPlanner.tsx     # Timetable scheduler with session progress checkboxes
│       ├── HistoryPage.tsx      # Filterable activity archive with reopen capabilities
│       └── SettingsPage.tsx     # Student preferences, theme switcher, and data reset
```

---

## 🧠 How the AI Works

StudyPilot AI enforces strict academic system guidelines to prevent AI hallucinations and provide collegiate-level educational value:

1. **Server-Side Security:** All `@google/genai` SDK invocations happen exclusively in `server.ts`. API keys are never leaked to client bundles or browser consoles.
2. **Subject Adaptation:** The AI prompt dynamically includes the active subject domain (`Computer Science`, `Mathematics`, `Database Systems`, etc.) and enforces rigorous notation conventions (e.g. Big-O analysis for algorithms, relational algebra for databases).
3. **Structured JSON Schemas:** For quizzes, flashcards, and timetables, the backend specifies strict `responseSchema` definitions using the `@google/genai` `Type` enum, guaranteeing valid JSON arrays and preventing parsing failures.
4. **Resilient Demonstration Fallback:** If an API key is not yet attached in AI Studio Secrets or if a transient network error occurs, the server automatically serves curated university syllabus content with an informative banner, ensuring the application remains 100% interactive and crash-free.

---

## 🚀 Installation & Local Development

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Environment Variables
Create a `.env` file in the project root:
```bash
# Gemini API Key (obtain from Google AI Studio)
GEMINI_API_KEY="your-gemini-api-key-here"

# Development server port
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
The full-stack application will launch at `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🛡️ Security & Privacy Practices

- **Zero Client-Side Key Exposure:** All Gemini model transactions run through the local Express proxy.
- **Local Client-Side Storage:** Chat conversations, notes, quiz scores, and study plans are stored locally in the student's browser via `localStorage`. No private student study material is logged or sent to third-party analytics trackers.
- **Academic Disclaimer:** StudyPilot AI is an educational study aid; users are prompted to verify institutional syllabus specifics with their course instructors.

---

## 🔮 Future Improvements

- [ ] PDF and lecture slide slide-deck OCR parsing for direct notes ingestion.
- [ ] Voice-enabled tutoring sessions using Gemini Live audio API.
- [ ] Export study schedules directly to Google Calendar (.ics).
- [ ] Multi-student peer study rooms with collaborative flashcard decks.

---

## 👤 Author & Academic Attribution

- **Project:** StudyPilot AI
- **Purpose:** University Software Engineering & AI Portfolio Project
- **Built With:** Google AI Studio, React, TypeScript, and Tailwind CSS
