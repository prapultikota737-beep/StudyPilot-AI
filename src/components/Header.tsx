import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Plus, HelpCircle, FileText, Bot } from 'lucide-react';
import { NavigationTab } from '../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { activeTab, setActiveTab, launchTutorPrompt } = useApp();

  const getBreadcrumbTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'tutor':
        return 'AI Tutor';
      case 'notes':
        return 'Smart Notes';
      case 'quiz':
        return 'Quiz Generator';
      case 'flashcards':
        return 'Flashcards';
      case 'planner':
        return 'Study Planner';
      case 'history':
        return 'Activity History';
      case 'settings':
        return 'Settings';
      default:
        return 'Home';
    }
  };

  return (
    <header className="h-16 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean breadcrumbs */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium"
          >
            StudyPilot
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {getBreadcrumbTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Header Quick Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {activeTab !== 'tutor' && (
          <button
            type="button"
            onClick={() => launchTutorPrompt('')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Tutor</span>
          </button>
        )}

        {activeTab !== 'notes' && (
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Create Notes</span>
          </button>
        )}

        {activeTab !== 'quiz' && (
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Take Quiz</span>
          </button>
        )}
      </div>
    </header>
  );
};
