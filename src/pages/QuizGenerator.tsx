import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { geminiService } from '../services/gemini';
import { storage } from '../services/storage';
import { QuizQuestion, QuizAttempt, SubjectCategory, ALL_SUBJECTS } from '../types';
import {
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Award,
  BookOpen,
} from 'lucide-react';

export const QuizGenerator: React.FC = () => {
  const { settings, addToast, incrementStat } = useApp();

  // Configuration state
  const [subject, setSubject] = useState<SubjectCategory>(settings.defaultSubject);
  const [topic, setTopic] = useState('Data Structures & Algorithms');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [count, setCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<'Multiple Choice' | 'True/False' | 'Mixed'>('Multiple Choice');

  // Active quiz state
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [attemptSummary, setAttemptSummary] = useState<QuizAttempt | null>(null);

  const subjects = ALL_SUBJECTS;

  const handleStartQuiz = async () => {
    if (!topic.trim()) {
      addToast('Topic Required', 'Please enter a quiz topic.', 'warning');
      return;
    }

    setIsGenerating(true);
    setUserAnswers({});
    setCurrentIdx(0);
    setQuizCompleted(false);
    setAttemptSummary(null);

    try {
      const response = await geminiService.generateQuiz(subject, topic, difficulty, count, questionType);

      if (!response.questions || response.questions.length === 0) {
        throw new Error('No questions returned by the generator');
      }

      setQuizQuestions(response.questions);
      addToast('Quiz Ready', `Generated ${response.questions.length} questions. Good luck!`, 'success');
    } catch (err: any) {
      addToast('Generation Error', err?.message || 'Failed to create quiz', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (!quizQuestions) return;
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!quizQuestions) return;

    // Check if unanswered questions exist
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < quizQuestions.length) {
      if (
        !window.confirm(
          `You have answered ${answeredCount} of ${quizQuestions.length} questions. Are you sure you want to submit?`
        )
      ) {
        return;
      }
    }

    // Calculate score
    let score = 0;
    quizQuestions.forEach((q) => {
      const chosen = userAnswers[q.id];
      if (chosen === q.correctAnswer) {
        score++;
      }
    });

    const total = quizQuestions.length;
    const percentage = Math.round((score / total) * 100);

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      subject,
      topic,
      difficulty,
      questionType,
      questions: quizQuestions,
      userAnswers,
      score,
      total,
      percentage,
      completedAt: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setAttemptSummary(attempt);
    setQuizCompleted(true);
    storage.saveQuizAttempt(attempt);
    incrementStat('quizzesCompleted', 1);

    storage.addHistoryItem({
      id: `hist-quiz-${Date.now()}`,
      type: 'quiz',
      title: `${topic} Quiz (${difficulty})`,
      subtitle: `Score: ${percentage}% (${score}/${total}) · ${subject}`,
      timestamp: 'Just now',
    });

    addToast('Quiz Completed', `Your score: ${percentage}% (${score}/${total})`, 'success');
  };

  const handleTryAgain = () => {
    setUserAnswers({});
    setCurrentIdx(0);
    setQuizCompleted(false);
    setAttemptSummary(null);
  };

  const handleNewQuizConfig = () => {
    setQuizQuestions(null);
    setUserAnswers({});
    setCurrentIdx(0);
    setQuizCompleted(false);
    setAttemptSummary(null);
  };

  // 1. If in active question answering mode
  if (quizQuestions && !quizCompleted) {
    const currentQ = quizQuestions[currentIdx];
    const isAnswered = userAnswers[currentQ.id] !== undefined;
    const isLast = currentIdx === quizQuestions.length - 1;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Quiz Header & Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {subject} · {topic}
            </span>
            <span className="font-mono tabular-nums font-semibold">
              Question {currentIdx + 1} of {quizQuestions.length}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Difficulty: {difficulty}</span>
            <span>
              Answered: {Object.keys(userAnswers).length} / {quizQuestions.length}
            </span>
          </div>
        </div>

        {/* Current Question Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = userAnswers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIdx === 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewQuizConfig}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Quit Quiz
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Submit Quiz</span>
                  <Trophy className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Results Screen
  if (quizCompleted && attemptSummary) {
    const isPassing = attemptSummary.percentage >= 70;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Results Card */}
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              isPassing
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
            }`}
          >
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Quiz Completed!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {attemptSummary.subject} · {attemptSummary.topic}
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 py-3">
            <div>
              <p className="text-4xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {attemptSummary.percentage}%
              </p>
              <p className="text-xs text-slate-400">Final Score</p>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                {attemptSummary.score} / {attemptSummary.total}
              </p>
              <p className="text-xs text-slate-400">Correct Answers</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTryAgain}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={handleNewQuizConfig}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New Quiz</span>
            </button>
          </div>
        </div>

        {/* Detailed Explanations for Each Question as requested */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Detailed Question Review & Explanations</span>
          </h3>

          {attemptSummary.questions.map((q, idx) => {
            const userAnswer = attemptSummary.userAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-3 ${
                  isCorrect
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {q.question}
                    </h4>
                  </div>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 shrink-0">
                      <XCircle className="w-4 h-4" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pl-6 text-xs">
                  {q.options.map((opt, optI) => {
                    const isUserChoice = userAnswer === optI;
                    const isRightChoice = q.correctAnswer === optI;

                    let optClass = 'text-slate-600 dark:text-slate-400';
                    if (isRightChoice) {
                      optClass = 'text-emerald-700 dark:text-emerald-400 font-semibold';
                    } else if (isUserChoice && !isRightChoice) {
                      optClass = 'text-rose-600 dark:text-rose-400 font-medium line-through';
                    }

                    return (
                      <div key={optI} className={`flex items-center gap-2 ${optClass}`}>
                        <span className="font-mono text-[11px]">
                          {String.fromCharCode(65 + optI)}.
                        </span>
                        <span>{opt}</span>
                        {isRightChoice && <span>(Correct Answer)</span>}
                        {isUserChoice && !isRightChoice && <span>(Your Answer)</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation text */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    Academic Explanation:
                  </span>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Quiz Configuration Screen
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Interactive Quiz Generator</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Generate custom assessment quizzes from any syllabus topic using university-level evaluation rubrics.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectCategory)}
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Topic or Concept
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Asymptotic Notation, Normalization, or Graph Traversals"
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  difficulty === diff
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Number of questions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Number of Questions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCount(num)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  count === num
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {num} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Question Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Question Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Multiple Choice', 'True/False', 'Mixed'] as const).map((qt) => (
              <button
                key={qt}
                type="button"
                onClick={() => setQuestionType(qt)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  questionType === qt
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {qt}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isGenerating || !topic.trim()}
            onClick={handleStartQuiz}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Crafting Academic Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
