import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  FileText,
  HelpCircle,
  Layers,
  Calendar,
  ArrowRight,
  Flame,
  MessageSquare,
  Trophy,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { SubjectCategory } from '../types';

export const DashboardHome: React.FC = () => {
  const { settings, stats, setActiveTab, launchTutorPrompt } = useApp();

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const toolCards = [
    {
      id: 'tutor',
      title: 'AI Tutor',
      description: 'Ask questions and understand complex concepts with tailored academic explanations.',
      icon: Bot,
      color: 'from-indigo-600 to-indigo-700',
      actionText: 'Ask Tutor',
      tab: 'tutor' as const,
    },
    {
      id: 'notes',
      title: 'Smart Notes',
      description: 'Turn lecture transcripts, slides, or textbook excerpts into structured study notes.',
      icon: FileText,
      color: 'from-purple-600 to-purple-700',
      actionText: 'Generate Notes',
      tab: 'notes' as const,
    },
    {
      id: 'quiz',
      title: 'Quiz Generator',
      description: 'Create customized practice quizzes to test your mastery before exams.',
      icon: HelpCircle,
      color: 'from-emerald-600 to-emerald-700',
      actionText: 'Take Quiz',
      tab: 'quiz' as const,
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Generate interactive 3D active recall flashcards with memory hints and tags.',
      icon: Layers,
      color: 'from-amber-600 to-amber-700',
      actionText: 'Study Cards',
      tab: 'flashcards' as const,
    },
    {
      id: 'planner',
      title: 'Study Planner',
      description: 'Build a personalized 7-day revision schedule mapped around your exam targets.',
      icon: Calendar,
      color: 'from-sky-600 to-sky-700',
      actionText: 'View Schedule',
      tab: 'planner' as const,
    },
  ];

  const quickPrompts: Array<{ label: string; subject: SubjectCategory }> = [
    { label: 'Explain normalization in DBMS and BCNF vs 3NF', subject: 'DBMS' },
    { label: 'How does Dijkstra algorithm work with min-heaps?', subject: 'Data Structures' },
    { label: 'Explain the difference between P and NP complexity', subject: 'Computer Science' },
    { label: 'Derive Bayes Theorem and give an intuitive example', subject: 'Mathematics' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent border border-indigo-200/60 dark:border-indigo-900/40">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {settings.profileName.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ready to continue learning? Select an AI tool below or jump right into your study session.
          </p>
        </div>

        <button
          type="button"
          onClick={() => launchTutorPrompt('')}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask AI Question</span>
        </button>
      </div>

      {/* Real-time local statistics as requested in prompt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.studyStreakDays} <span className="text-xs font-normal text-slate-500">days</span>
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Active learning streak</span>
          </p>
        </div>

        {/* Questions Asked */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Questions Asked</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.questionsAsked}
          </p>
          <p className="text-[11px] text-slate-500">In-depth AI tutor consultations</p>
        </div>

        {/* Quizzes Completed */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quizzes Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.quizzesCompleted}
          </p>
          <p className="text-[11px] text-slate-500">Active recall sessions</p>
        </div>

        {/* Study Hours */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Hours</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.studyHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
          </p>
          <p className="text-[11px] text-slate-500">Total verified study focus</p>
        </div>
      </div>

      {/* 5 Core Feature Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Study Tools & Workspaces
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {toolCards.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tool.tab)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 py-1"
                  >
                    <span>{tool.actionText}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Concept Launchers */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Quick Conceptual Drills
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Click any prompt to launch a structured explanation in AI Tutor immediately:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => launchTutorPrompt(p.label, p.subject)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                  {p.subject}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {p.label}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
