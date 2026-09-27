import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { geminiService } from '../services/gemini';
import { storage } from '../services/storage';
import { Flashcard, SubjectCategory, ALL_SUBJECTS } from '../types';
import {
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Shuffle,
  RotateCw,
  CheckCircle2,
  Bookmark,
  Lightbulb,
  Plus,
} from 'lucide-react';

export const Flashcards: React.FC = () => {
  const { settings, addToast, incrementStat } = useApp();

  const [subject, setSubject] = useState<SubjectCategory>(settings.defaultSubject);
  const [topic, setTopic] = useState('Data Structures & Algorithms');
  const [material, setMaterial] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Deck state
  const [cards, setCards] = useState<Flashcard[]>(() => {
    const saved = storage.getFlashcardDecks();
    if (saved.length > 0 && saved[0].cards.length > 0) {
      return saved[0].cards;
    }
    // Default starter cards
    return [
      {
        id: 1,
        front: 'What is the worst-case Time Complexity of searching in an AVL or Red-Black Tree?',
        back: 'O(log N). Because strict self-balancing rotations ensure tree height never degrades past O(log N).',
        hint: 'Guaranteed logarithmic height bounds',
        tag: 'Data Structures',
      },
      {
        id: 2,
        front: 'What does Idempotence mean in API and Distributed Systems design?',
        back: 'An operation is idempotent if executing it multiple times produces the exact same side-effects as running it once (e.g., HTTP PUT or DELETE).',
        hint: 'f(f(x)) = f(x)',
        tag: 'Systems Architecture',
      },
      {
        id: 3,
        front: 'What are the 4 Coffman Conditions required for Deadlock to occur in an OS?',
        back: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
        hint: 'Breaking any single one prevents deadlock.',
        tag: 'Operating Systems',
      },
      {
        id: 4,
        front: 'What is the difference between 3NF and BCNF in Relational Databases?',
        back: 'In 3NF, the right side of a functional dependency X → Y can be a prime attribute. In BCNF, X must ALWAYS be a superkey without exception.',
        hint: 'BCNF is strictly stricter than 3NF.',
        tag: 'DBMS',
      },
      {
        id: 5,
        front: 'What is the Central Limit Theorem in Statistics?',
        back: 'The sampling distribution of the sample mean approaches a Normal (Gaussian) distribution as sample size grows (n ≥ 30), regardless of the shape of the underlying population.',
        hint: 'Bell curve convergence for large samples',
        tag: 'Mathematics',
      },
      {
        id: 6,
        front: 'What distinguishes P from NP in Computational Complexity theory?',
        back: 'P: Decision problems solvable in polynomial time.\nNP: Decision problems whose solutions can be verified in polynomial time.',
        hint: 'Solving vs. Verifying',
        tag: 'Theory of Computation',
      },
    ];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [showConfig, setShowConfig] = useState(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    incrementStat('flashcardsReviewed', 1);
  };

  const handlePrevious = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    addToast('Shuffled', 'Flashcard deck randomized.', 'info');
  };

  const toggleMastered = (cardId: number) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
        addToast('Mastered!', 'Card marked as mastered.', 'success');
      }
      return next;
    });
  };

  const handleGenerateCards = async () => {
    if (!topic.trim()) {
      addToast('Topic Required', 'Please enter a topic for flashcards.', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await geminiService.generateFlashcards(subject, topic, material, 8);

      if (!response.flashcards || response.flashcards.length === 0) {
        throw new Error('No flashcards returned');
      }

      setCards(response.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredIds(new Set());
      setShowConfig(false);

      storage.saveFlashcardDeck({
        id: `deck-${Date.now()}`,
        subject,
        topic,
        cards: response.flashcards,
        createdAt: new Date().toISOString(),
      });

      storage.addHistoryItem({
        id: `hist-fc-${Date.now()}`,
        type: 'flashcards',
        title: `${topic} Flashcards`,
        subtitle: `${subject} · ${response.flashcards.length} cards`,
        timestamp: 'Just now',
      });

      addToast('Flashcards Ready', `Generated ${response.flashcards.length} active recall cards.`, 'success');
    } catch (err: any) {
      addToast('Generation Error', err?.message || 'Failed to generate flashcards', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentCard = cards[currentIndex];
  const isMastered = currentCard ? masteredIds.has(currentCard.id) : false;

  const subjects = ALL_SUBJECTS;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Interactive Flashcards</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active recall cards with flip animations, memory hints, and spaced repetition tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            title="Randomize card order"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Close Generator' : 'Generate New Deck'}</span>
          </button>
        </div>
      </div>

      {/* Generator Configuration Drawer (if open) */}
      {showConfig && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-4 animate-fade-in">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Generate Flashcard Deck with Gemini</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Operating Systems or Linear Algebra"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Optional Study Notes / Material
            </label>
            <textarea
              rows={3}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Paste specific definitions or leave blank for AI to generate canonical concepts..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="button"
            disabled={isGenerating || !topic.trim()}
            onClick={handleGenerateCards}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating Active Recall Cards...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Deck (8 Cards)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress & Deck Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Card {currentIndex + 1} of {cards.length}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {masteredIds.size} / {cards.length} Mastered
          </span>
          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${(masteredIds.size / (cards.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3D Flip Flashcard */}
      {currentCard && (
        <div
          className="perspective-1000 w-full min-h-[340px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-full min-h-[340px] transition-transform duration-500 transform-style-3d rounded-2xl ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* FRONT FACE */}
            <div className="absolute inset-0 backface-hidden p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {currentCard.tag || subject}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMastered(currentCard.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isMastered
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={isMastered ? 'Marked as mastered' : 'Mark as mastered'}
                >
                  <Bookmark className={`w-4 h-4 ${isMastered ? 'fill-emerald-600' : ''}`} />
                </button>
              </div>

              <div className="my-auto text-center px-4 space-y-4">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                  {currentCard.front}
                </h3>

                {currentCard.hint && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Hint: {currentCard.hint}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <span className="flex items-center gap-1 text-[11px]">
                  <RotateCw className="w-3 h-3" />
                  <span>Click card or press <strong>Space</strong> to reveal answer</span>
                </span>
                <span className="font-mono">{currentIndex + 1}/{cards.length}</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-slate-900 text-white shadow-xl flex flex-col justify-between select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Concept Answer & Explanation
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentCard.tag || subject}
                </span>
              </div>

              <div className="my-auto px-4 py-2 space-y-3">
                <p className="text-sm sm:text-base leading-relaxed text-slate-100 whitespace-pre-wrap">
                  {currentCard.back}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="text-[11px]">Click or press <strong>Space</strong> to flip back</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMastered(currentCard.id);
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    isMastered
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isMastered ? 'Mastered' : 'Mark Mastered'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls: Previous, Next, Keyboard indicators */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handlePrevious}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous Card</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Use <strong>←</strong> / <strong>→</strong> keys to navigate</span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span>Next Card</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
