import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';
import { HistoryItem } from '../types';
import {
  History as HistoryIcon,
  Bot,
  HelpCircle,
  FileText,
  Layers,
  Calendar,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const HistoryPage: React.FC = () => {
  const { setActiveTab, launchTutorPrompt, addToast } = useApp();

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => storage.getHistory());
  const [filterType, setFilterType] = useState<string>('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteHistoryItem(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    addToast('Item Removed', 'History entry deleted.', 'info');
  };

  const handleClearAll = () => {
    historyItems.forEach((item) => storage.deleteHistoryItem(item.id));
    setHistoryItems([]);
    setIsClearModalOpen(false);
    addToast('History Cleared', 'All activity logs have been removed.', 'info');
  };

  const handleReopenItem = (item: HistoryItem) => {
    switch (item.type) {
      case 'tutor':
        launchTutorPrompt(item.title);
        break;
      case 'quiz':
        setActiveTab('quiz');
        break;
      case 'notes':
        setActiveTab('notes');
        break;
      case 'flashcards':
        setActiveTab('flashcards');
        break;
      case 'planner':
        setActiveTab('planner');
        break;
      default:
        setActiveTab('dashboard');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tutor':
        return <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'notes':
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'flashcards':
        return <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'planner':
        return <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <HistoryIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredItems = historyItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Learning Activity History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your recent academic sessions, generated study materials, and completed practice quizzes.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'tutor', label: 'AI Tutor' },
          { id: 'quiz', label: 'Quizzes' },
          { id: 'notes', label: 'Notes' },
          { id: 'flashcards', label: 'Flashcards' },
          { id: 'planner', label: 'Study Plans' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleReopenItem(item)}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="truncate">{item.subtitle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{item.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReopenItem(item)}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Reopen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <HistoryIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto stroke-[1.5]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No History Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterType === 'all'
                ? 'Your learning activities will be stored here as you use AI Tutor, Smart Notes, and Quizzes.'
                : `No activities found in category "${filterType}".`}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Activity History?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Yes, Clear History
            </button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          This will permanently remove your recorded history logs. Your saved flashcards and notes will remain intact.
        </p>
      </Modal>
    </div>
  );
};
