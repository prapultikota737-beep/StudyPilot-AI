import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { geminiService } from '../services/gemini';
import { storage } from '../services/storage';
import { StudyPlan, StudyDay, StudySession } from '../types';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  BookOpen,
  CalendarCheck,
} from 'lucide-react';

export const StudyPlanner: React.FC = () => {
  const { addToast, incrementStat } = useApp();

  // Inputs
  const [subjectsList, setSubjectsList] = useState<string[]>([
    'Data Structures & Algorithms',
    'Database Management Systems',
    'Linear Algebra',
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [availableHours, setAvailableHours] = useState<number>(4);
  const [examDate, setExamDate] = useState('In 2 weeks (Midterms)');
  const [preferredTime, setPreferredTime] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Flexible'>('Evening');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Plan
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(() => {
    const saved = storage.getStudyPlans();
    if (saved.length > 0) return saved[0];
    return null;
  });

  const handleAddSubject = () => {
    if (!newSubjectInput.trim()) return;
    if (subjectsList.includes(newSubjectInput.trim())) return;
    setSubjectsList((prev) => [...prev, newSubjectInput.trim()]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjectsList((prev) => prev.filter((s) => s !== sub));
  };

  const handleGeneratePlan = async () => {
    if (subjectsList.length === 0) {
      addToast('Subjects Required', 'Please add at least one subject to plan.', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await geminiService.generateStudyPlan(
        subjectsList,
        availableHours,
        examDate,
        {},
        preferredTime
      );

      const generated = response.plan;
      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        title: generated.title || `7-Day Revision Plan (${availableHours} hrs/day)`,
        overview: generated.overview || 'Personalized schedule structured for balanced retention.',
        examDate,
        availableHours,
        days: generated.days,
        createdAt: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      setActivePlan(newPlan);
      storage.saveStudyPlan(newPlan);

      storage.addHistoryItem({
        id: `hist-plan-${Date.now()}`,
        type: 'planner',
        title: newPlan.title,
        subtitle: `${subjectsList.length} subjects · Target: ${examDate}`,
        timestamp: 'Just now',
      });

      addToast('Study Plan Ready', 'Your schedule has been generated.', 'success');
    } catch (err: any) {
      addToast('Generation Error', err?.message || 'Failed to create plan', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSession = (dayIdx: number, sessionIdx: number) => {
    if (!activePlan) return;

    const updatedDays = [...activePlan.days];
    const session = updatedDays[dayIdx].sessions[sessionIdx];
    const newStatus = !session.completed;
    session.completed = newStatus;

    const updatedPlan = {
      ...activePlan,
      days: updatedDays,
    };

    setActivePlan(updatedPlan);
    storage.saveStudyPlan(updatedPlan);

    if (newStatus) {
      const hours = session.durationMinutes / 60;
      incrementStat('studyHours', Number(hours.toFixed(1)));
      addToast('Session Completed! 🎉', `Logged ${hours.toFixed(1)} hours of focus time.`, 'success');
    }
  };

  const handleExportPlan = () => {
    if (!activePlan) return;

    let text = `# ${activePlan.title}\n\n`;
    text += `Target: ${activePlan.examDate} | Daily Allocation: ${activePlan.availableHours} hours\n`;
    text += `${activePlan.overview}\n\n---\n\n`;

    activePlan.days.forEach((day) => {
      text += `## ${day.dayName} (${day.theme})\n`;
      day.sessions.forEach((s) => {
        text += `- [${s.completed ? 'x' : ' '}] ${s.timeSlot} → **${s.subject}**: ${s.topic} (${s.durationMinutes} min)\n`;
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-schedule-${activePlan.examDate.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Exported', 'Study plan exported as Markdown file.', 'success');
  };

  // Calculate overall plan completion
  const totalSessions = activePlan
    ? activePlan.days.reduce((acc, d) => acc + d.sessions.length, 0)
    : 0;
  const completedSessions = activePlan
    ? activePlan.days.reduce((acc, d) => acc + d.sessions.filter((s) => s.completed).length, 0)
    : 0;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>AI Study Planner</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalized weekly timetable optimized for spaced repetition and balanced cognitive load.
          </p>
        </div>

        {activePlan && (
          <button
            type="button"
            onClick={handleExportPlan}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Timetable</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Planner Config */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Schedule Parameters
            </h2>

            {/* Target Subjects List */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Subjects
              </label>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {subjectsList.map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <span className="truncate">{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub)}
                      className="text-slate-400 hover:text-rose-500 ml-2"
                      title="Remove subject"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subject Input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubject();
                    }
                  }}
                  placeholder="Add another course..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  title="Add course"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Available Hours */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Study Hours
                </label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {availableHours} hours / day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Target Exam Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Exam Date or Timeline
              </label>
              <input
                type="text"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                placeholder="e.g. In 2 weeks or Oct 15"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Preferred Study Window */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peak Focus Window
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['Morning', 'Afternoon', 'Evening', 'Flexible'] as const).map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => setPreferredTime(win)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                      preferredTime === win
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {win}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Plan Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isGenerating || subjectsList.length === 0}
                onClick={handleGeneratePlan}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Optimizing Cognitive Timetable...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Personalized Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timetable Days Display */}
        <div className="lg:col-span-8 space-y-4">
          {activePlan ? (
            <div className="space-y-4">
              {/* Plan Overview & Progress Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {activePlan.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target: {activePlan.examDate} · {activePlan.availableHours} hrs daily
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {completedSessions} / {totalSessions} Sessions ({progressPercent}%)
                    </span>
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 leading-relaxed">
                  {activePlan.overview}
                </p>
              </div>

              {/* Day-by-Day Timetable Cards */}
              <div className="space-y-3">
                {activePlan.days.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-indigo-600" />
                        <span>{day.dayName}</span>
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {day.theme}
                      </span>
                    </div>

                    {/* Sessions list */}
                    <div className="space-y-2">
                      {day.sessions.map((session, sIdx) => (
                        <div
                          key={session.id || sIdx}
                          onClick={() => handleToggleSession(dayIdx, sIdx)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            session.completed
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-500 line-through'
                              : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={session.completed}
                              onChange={() => {}} // handled by parent div click
                              className="w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none accent-indigo-600"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {session.timeSlot}
                                </span>
                                <span className="font-bold">
                                  → {session.subject}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {session.topic}
                              </p>
                            </div>
                          </div>

                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {session.durationMinutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Active Study Plan
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Configure your available study hours and courses on the left, then click "Generate Personalized Plan" to build your weekly timetable.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
