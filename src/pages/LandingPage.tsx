import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  ArrowRight,
  Sparkles,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  Calendar,
  History,
  CheckCircle2,
  BookOpen,
  Zap,
  ShieldCheck,
  Award,
  Github,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

const heroImage = '/src/assets/images/hero_study_workspace_1790489867343.jpg';
const knowledgeGraphImage = '/src/assets/images/feature_knowledge_graph_1790489882391.jpg';

export const LandingPage: React.FC = () => {
  const { setActiveTab, theme, setTheme } = useApp();
  const [activePreviewTab, setActivePreviewTab] = useState<'tutor' | 'quiz' | 'notes' | 'flashcards'>('tutor');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Single text wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              StudyPilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
          </a>

          {/* Zone 2: 4 clean nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ai-capabilities')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              AI Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('why-studypilot')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Why StudyPilot
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <span>Start Studying</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Next-Gen Learning Assistant for University Students</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] text-balance">
              Study Smarter. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Learn Faster.</span> With AI.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance">
              StudyPilot AI helps students understand concepts, create notes, practice questions, and organize their learning with the power of artificial intelligence.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2.5"
              >
                <span>Start Studying</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="px-6 py-3.5 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
              >
                Explore Features
              </button>
            </div>

            {/* Proof Metrics Bar */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Zero Hallucinations Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>STEM & Code Formatted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Client-Side Privacy Preserved</span>
              </div>
            </div>
          </div>

          {/* Interactive Product Preview & Dashboard Mockup */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
              {/* Mockup browser top chrome */}
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
                    studypilot-ai.internal / app / dashboard
                  </span>
                </div>

                {/* Tab switchers in mockup */}
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('tutor')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activePreviewTab === 'tutor'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    AI Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('quiz')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activePreviewTab === 'quiz'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Quiz Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('notes')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activePreviewTab === 'notes'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Smart Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('flashcards')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activePreviewTab === 'flashcards'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Flashcards
                  </button>
                </div>
              </div>

              {/* Mockup content display */}
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/60 min-h-[380px]">
                {activePreviewTab === 'tutor' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-xs text-xs md:text-sm max-w-lg shadow-xs">
                        Explain normalization in DBMS and why Boyce-Codd (BCNF) is stricter than 3NF.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                        SP
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-800 text-xs md:text-sm text-slate-700 dark:text-slate-300 max-w-2xl shadow-xs space-y-2">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">
                          ### 📘 Academic Explanation: Database Normalization
                        </div>
                        <p>
                          Normalization reduces data redundancy and eliminates update, insert, and delete anomalies by decomposing relations into well-structured schemas.
                        </p>
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono">
                          BCNF Rule: For every non-trivial functional dependency X → Y, X must be a <strong>superkey</strong>.
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                          <span>Subject: Database Systems</span>
                          <span>·</span>
                          <span>Study Mode: Academic Standard</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'quiz' && (
                  <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Question 3 of 10</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Computer Science · Medium</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full w-[30%]" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                      Which asymptotic complexity class represents the optimal comparison-based sorting bound in the average and worst cases?
                    </h3>
                    <div className="space-y-2">
                      {['O(N)', 'O(N log N)', 'O(N²)', 'O(log N)'].map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-xs md:text-sm font-medium flex items-center justify-between ${
                            i === 1
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{opt}</span>
                          {i === 1 && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePreviewTab === 'notes' && (
                  <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Operating System Concurrency & Deadlocks
                      </h4>
                      <span className="text-[11px] text-slate-500">840 words · Revision Sheet</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>The 4 Coffman Conditions:</strong> Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Breaking any single condition guarantees deadlock prevention.
                    </p>
                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                      <div className="font-semibold">Banker's Algorithm Safety Invariant:</div>
                      <div>A state is safe if there exists a sequence that allows every process to complete without deadlock.</div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'flashcards' && (
                  <div className="max-w-md mx-auto text-center space-y-4">
                    <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Data Structures · Card 4 of 20
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">
                        What is the time complexity of searching in an AVL or Red-Black Tree in the worst case?
                      </h4>
                      <p className="text-xs text-slate-400 mt-4 italic">Click card or press Spacebar to flip</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Core Capabilities
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Six Purpose-Built Tools for Academic Mastery
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Engineered with specialized academic system instructions and zero generic filler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all hover:shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Tutor</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask challenging college questions with tailored subject reasoning (CS, Math, DBMS, Programming) and instant Markdown & code block formatting.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('tutor')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
              >
                <span>Launch Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all hover:shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Smart Notes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Paste long textbook excerpts or lecture slides to generate concise summaries, key formula extractions, or 1-page pre-exam revision sheets.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
              >
                <span>Generate Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all hover:shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quiz Generator</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Create 5 to 20 custom multiple-choice or true/false questions. Test yourself with live timers, progress bars, score cards, and in-depth rationales.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
              >
                <span>Create Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all hover:shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Flashcard Generator</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate high-retention active recall decks with 3D flip card animations, keyboard shortcuts, shuffling, and mastery tracking.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('flashcards')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
              >
                <span>Review Flashcards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all hover:shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Study Planner</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Build personalized 7-day study schedules based on your exam date, daily available hours, and subject difficulties with interactive checkboxes.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('planner')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
              >
                <span>Build Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 transition-all hover:shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Activity History</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                All your chats, generated notes, quiz attempts, and schedules are saved securely in your browser's local storage. Reopen or delete items anytime.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
              >
                <span>View History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Simple Workflow
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Confusion to Mastery in Three Steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
              <div className="text-4xl font-extrabold font-mono text-indigo-600/30 dark:text-indigo-400/30">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Input Topic or Material</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Select your academic subject, enter a question, or paste course syllabus material into the workspace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
              <div className="text-4xl font-extrabold font-mono text-indigo-600/30 dark:text-indigo-400/30">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Synthesizes & Adapts</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Select "Beginner Mode" for intuitive real-world analogies, or "Exam Mode" for high-yield scoring definitions and marking schemes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
              <div className="text-4xl font-extrabold font-mono text-indigo-600/30 dark:text-indigo-400/30">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Master Concepts & Ace Exams</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Practice with active recall quizzes, flip through flashcards, and track your weekly completion metrics directly on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities Spotlight */}
      <section id="ai-capabilities" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                <Zap className="w-3.5 h-3.5" />
                <span>Pedagogical Study Modes</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Explanations Tailored to How You Actually Learn
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Unlike generic LLMs that dump rambling paragraphs, StudyPilot AI uses targeted prompting frameworks configured specifically for collegiate courses.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                    <span>Explain Like I'm a Beginner</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Breaks difficult technical concepts down with intuitive real-world metaphors, simple language, and step-by-step guidance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-600 dark:text-purple-400">
                    <Award className="w-4 h-4" />
                    <span>Exam Mode</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Formats outputs for university written exams: word-for-word textbook definitions, high-yield bullet points, 5-mark short answers, and long-answer schemas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Academic Truth & Safety Rules</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Never fabricates citations or proofs. For code questions, provides time/space complexity analysis; for math, shows explicit derivation steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src={knowledgeGraphImage}
                alt="Intelligent Knowledge Graph Preview"
                referrerPolicy="no-referrer"
                className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl object-cover w-full h-[420px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why StudyPilot Section (Testimonials & Proof) */}
      <section id="why-studypilot" className="py-20 bg-white dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Student Endorsements
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Built for Engineering, STEM & Pre-Med Rigor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "The Exam Mode feature single-handedly saved my DBMS midterm. The distinction between BCNF and 3NF was formatted exactly like my professor's grading rubric."
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Maya Patel</p>
                <p className="text-slate-500 text-[11px]">Computer Science · Stanford University</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "Having the Quiz Generator create instant 10-question practice drills with explanations for every wrong answer turned my active recall routine into pure habit."
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">David Chen</p>
                <p className="text-slate-500 text-[11px]">Electrical Engineering · UC Berkeley</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "The Study Planner takes the stress out of finals week. I inputted 4 hours a day across 3 subjects, and it scheduled the exact active recall blocks I needed."
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Elena Rostova</p>
                <p className="text-slate-500 text-[11px]">Biochemistry · MIT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to Accelerate Your Academic Journey?
          </h2>
          <p className="text-sm sm:text-base text-indigo-200 max-w-xl mx-auto leading-relaxed">
            Join thousands of college students using StudyPilot AI to understand complex lectures, master flashcards, and achieve dean's list results.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-8 py-4 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <span>Start Studying Now — Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              SP
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">StudyPilot AI</span>
            <span>· Built as an educational technology portfolio project.</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://portfolio.example.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Portfolio</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
