import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationTab, UserSettings, UserStats, SubjectCategory } from '../types';
import { storage } from '../services/storage';
import { api } from '../services/api';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isDarkMode: boolean;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  stats: UserStats;
  incrementStat: (key: keyof Omit<UserStats, 'lastActiveDate'>, amount?: number) => void;
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  hasApiKey: boolean;
  pendingTutorPrompt: { question: string; subject?: SubjectCategory } | null;
  launchTutorPrompt: (question: string, subject?: SubjectCategory) => void;
  clearPendingTutorPrompt: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [stats, setStats] = useState<UserStats>(() => storage.getStats());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [pendingTutorPrompt, setPendingTutorPrompt] = useState<{
    question: string;
    subject?: SubjectCategory;
  } | null>(null);

  // Determine effective theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document
  useEffect(() => {
    let dark = false;
    if (settings.theme === 'dark') {
      dark = true;
    } else if (settings.theme === 'light') {
      dark = false;
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Check health & API key on start
  useEffect(() => {
    api.checkHealth().then((health) => {
      setHasApiKey(health.hasApiKey);
    });
  }, []);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    const updated = { ...settings, theme };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
    addToast('Settings Saved', 'Your preferences have been updated.', 'success');
  };

  const incrementStat = (key: keyof Omit<UserStats, 'lastActiveDate'>, amount = 1) => {
    const updated = storage.incrementStat(key, amount);
    setStats(updated);
  };

  const addToast = (
    title: string,
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const launchTutorPrompt = (question: string, subject?: SubjectCategory) => {
    setPendingTutorPrompt({ question, subject });
    setActiveTab('tutor');
  };

  const clearPendingTutorPrompt = () => {
    setPendingTutorPrompt(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme: settings.theme,
        setTheme,
        isDarkMode,
        settings,
        updateSettings,
        stats,
        incrementStat,
        toasts,
        addToast,
        removeToast,
        hasApiKey,
        pendingTutorPrompt,
        launchTutorPrompt,
        clearPendingTutorPrompt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
