import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { geminiService } from '../services/gemini';
import { storage } from '../services/storage';
import { SubjectCategory, GeneratedNote, ALL_SUBJECTS } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import {
  FileText,
  Upload,
  Copy,
  Download,
  Trash2,
  Sparkles,
  Check,
  FileCheck,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

const DEMO_STUDY_MATERIAL = `Operating Systems: Process Synchronization & Concurrency

A race condition occurs when multiple processes access and manipulate the same data concurrently, and the outcome of the execution depends on the particular order in which the access takes place. To prevent race conditions, concurrent processes must be synchronized.

The Critical-Section Problem:
Each process has a segment of code called a critical section, where the process may be changing common variables, updating a table, or writing a file. The key requirement is that when one process is executing in its critical section, no other process is allowed to execute in its critical section.

A valid solution must satisfy three criteria:
1. Mutual Exclusion: If process P_i is executing in its critical section, then no other processes can be executing in their critical sections.
2. Progress: If no process is executing in its critical section and there are some processes that wish to enter their critical section, only those processes not in their remainder section can participate in deciding who enters next.
3. Bounded Waiting: There must be a bound on the number of times other processes are allowed to enter their critical sections after a process has made a request.

Deadlocks:
A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.
The Coffman Conditions (all 4 must hold simultaneously for deadlock):
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it.
4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next.

Banker's Algorithm:
Developed by Edsger Dijkstra, the Banker's algorithm tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources, and then makes an s-state check to test for possible deadlocks before deciding whether allocation should be allowed.`;

export const SmartNotes: React.FC = () => {
  const { settings, addToast, incrementStat } = useApp();

  const [material, setMaterial] = useState('');
  const [topic, setTopic] = useState('Process Synchronization & Concurrency');
  const [subject, setSubject] = useState<SubjectCategory>(settings.defaultSubject);
  const [actionType, setActionType] = useState<'summarize' | 'notes' | 'keypoints' | 'revisionsheet'>('notes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (selectedAction: 'summarize' | 'notes' | 'keypoints' | 'revisionsheet') => {
    if (!material.trim()) {
      addToast('Input Required', 'Please paste study material or load sample text.', 'warning');
      return;
    }

    setActionType(selectedAction);
    setIsGenerating(true);

    try {
      const response = await geminiService.generateNotes(material, selectedAction, subject, topic);

      const newNote: GeneratedNote = {
        id: `note-${Date.now()}`,
        title: topic || 'Study Notes',
        subject,
        topic: topic || 'Key Concepts',
        content: response.notes,
        actionType: selectedAction,
        createdAt: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        wordCount: response.notes.split(/\s+/).filter(Boolean).length,
      };

      setGeneratedNote(newNote);
      storage.saveNote(newNote);
      incrementStat('notesCreated', 1);

      storage.addHistoryItem({
        id: `hist-notes-${Date.now()}`,
        type: 'notes',
        title: topic || 'Study Notes',
        subtitle: `${subject} · ${selectedAction} · ${newNote.wordCount} words`,
        timestamp: 'Just now',
      });

      addToast('Notes Generated', 'Your academic notes are ready.', 'success');
    } catch (err: any) {
      addToast('Generation Failed', err?.message || 'Could not generate notes', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setMaterial(text);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTopic(nameWithoutExt);
        addToast('File Loaded', `Loaded ${file.name} successfully.`, 'info');
      }
    };
    reader.onerror = () => {
      addToast('Upload Error', 'Failed to read the file. Please upload a plain text or markdown file.', 'error');
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    setMaterial(DEMO_STUDY_MATERIAL);
    setTopic('Operating Systems: Synchronization & Concurrency');
    setSubject('Computer Science');
    addToast('Demo Loaded', 'Loaded sample lecture material on OS Concurrency.', 'info');
  };

  const handleCopy = () => {
    if (!generatedNote) return;
    navigator.clipboard.writeText(generatedNote.content);
    setCopied(true);
    addToast('Copied', 'Notes copied to clipboard as Markdown.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedNote) return;
    const blob = new Blob([generatedNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Downloaded', 'Notes downloaded as Markdown file.', 'success');
  };

  const handleClear = () => {
    if (window.confirm('Clear the current workspace?')) {
      setMaterial('');
      setTopic('');
      setGeneratedNote(null);
    }
  };

  const subjects = ALL_SUBJECTS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Smart Notes Generator</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transform syllabus material, slides, or transcripts into structured notes and revision sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemo}
          className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Load Demo Lecture Material</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Material Input & Configuration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Source Material
            </h2>

            {/* Topic & Subject inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Memory Hierarchy & Cache Coherence"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Study material textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Study Material / Lecture Text
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {material.length} chars
                </span>
              </div>
              <textarea
                rows={9}
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Paste your course syllabus, lecture transcript, article, or textbook excerpts here..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>

            {/* File upload trigger */}
            <div className="flex items-center justify-between pt-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Text / Markdown File</span>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {material && (
                <button
                  type="button"
                  onClick={() => setMaterial('')}
                  className="text-xs text-slate-400 hover:text-rose-500"
                >
                  Clear input
                </button>
              )}
            </div>

            {/* Action Buttons as requested in prompt */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                2. Select Generation Style
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isGenerating || !material.trim()}
                  onClick={() => handleGenerate('summarize')}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-50 text-left"
                >
                  <span className="block font-bold text-indigo-600 dark:text-indigo-400">Summarize</span>
                  <span className="text-[10px] text-slate-500 block">Executive synthesis</span>
                </button>

                <button
                  type="button"
                  disabled={isGenerating || !material.trim()}
                  onClick={() => handleGenerate('notes')}
                  className="p-2.5 rounded-xl border border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-950 dark:text-indigo-200 transition-all disabled:opacity-50 text-left"
                >
                  <span className="block font-bold text-indigo-600 dark:text-indigo-400">Generate Notes</span>
                  <span className="text-[10px] text-slate-500 block">Complete study doc</span>
                </button>

                <button
                  type="button"
                  disabled={isGenerating || !material.trim()}
                  onClick={() => handleGenerate('keypoints')}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-50 text-left"
                >
                  <span className="block font-bold text-indigo-600 dark:text-indigo-400">Extract Key Points</span>
                  <span className="text-[10px] text-slate-500 block">Core takeaways & facts</span>
                </button>

                <button
                  type="button"
                  disabled={isGenerating || !material.trim()}
                  onClick={() => handleGenerate('revisionsheet')}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all disabled:opacity-50 text-left"
                >
                  <span className="block font-bold text-indigo-600 dark:text-indigo-400">Revision Sheet</span>
                  <span className="text-[10px] text-slate-500 block">1-Page cramming guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Document Interface */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col min-h-[560px]">
            {/* Document Toolbar */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-white">Document Viewer</span>
                {generatedNote && (
                  <span className="text-slate-400">
                    · {generatedNote.wordCount} words
                  </span>
                )}
              </div>

              {/* Action buttons: Copy, Download, Clear */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!generatedNote}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  title="Copy notes"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!generatedNote}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  title="Download as Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!generatedNote && !material}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-40"
                  title="Clear document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              {isGenerating ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Synthesizing Academic Notes...
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Structuring concepts, highlighting key definitions, and assembling revision checkpoints.
                  </p>
                </div>
              ) : generatedNote ? (
                <div className="prose dark:prose-invert max-w-none">
                  <MarkdownRenderer content={generatedNote.content} />
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                  <FileText className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      No notes generated yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Paste study material on the left or click "Load Demo Lecture Material" to get started.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
