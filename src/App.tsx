import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { DashboardHome } from './pages/DashboardHome';
import { AITutor } from './pages/AITutor';
import { SmartNotes } from './pages/SmartNotes';
import { QuizGenerator } from './pages/QuizGenerator';
import { Flashcards } from './pages/Flashcards';
import { StudyPlanner } from './pages/StudyPlanner';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If on landing page, show full-bleed landing view
  if (activeTab === 'landing') {
    return (
      <>
        <LandingPage />
        <ToastContainer />
      </>
    );
  }

  // Render selected dashboard page
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />;
      case 'tutor':
        return <AITutor />;
      case 'notes':
        return <SmartNotes />;
      case 'quiz':
        return <QuizGenerator />;
      case 'flashcards':
        return <Flashcards />;
      case 'planner':
        return <StudyPlanner />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
