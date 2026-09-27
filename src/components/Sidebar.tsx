import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  Calendar,
  History,
  Settings,
  Sun,
  Moon,
  Laptop,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const avatarImg = '/src/assets/images/avatar_student_user_1790489906821.jpg';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, theme, setTheme, settings, stats } = useApp();

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutor', label: 'AI Tutor', icon: Bot, badge: 'Core' },
    { id: 'notes', label: 'Smart Notes', icon: FileText },
    { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                StudyPilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
                Intelligent Study Companion
              </p>
            </div>
          </button>
        </div>

        {/* Study streak banner widget */}
        <div className="mx-3 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Study Streak</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {stats.studyStreakDays} Days 🔥
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.studyStreakDays / 10) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span>{stats.questionsAsked} questions asked</span>
            <span className="font-mono tabular-nums">{stats.studyHours.toFixed(1)} hrs</span>
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom user profile & theme selector */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* Theme toggler */}
          <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-colors ${
                theme === 'system'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="System theme"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User profile card */}
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
          >
            <img
              src={avatarImg}
              alt={settings.profileName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {settings.profileName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.collegeMajor}
              </p>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
