import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { geminiService } from '../services/gemini';
import { storage } from '../services/storage';
import { ChatMessage, SubjectCategory, StudyMode, ALL_SUBJECTS } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import {
  Send,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Award,
  HelpCircle,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export const AITutor: React.FC = () => {
  const {
    settings,
    incrementStat,
    addToast,
    pendingTutorPrompt,
    clearPendingTutorPrompt,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => storage.getChatMessages());
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState<SubjectCategory>(settings.defaultSubject || 'Computer Science');
  const [studyMode, setStudyMode] = useState<StudyMode>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle pending question from dashboard or other tools
  useEffect(() => {
    if (pendingTutorPrompt && pendingTutorPrompt.question) {
      if (pendingTutorPrompt.subject) {
        setSubject(pendingTutorPrompt.subject);
      }
      handleSendMessage(pendingTutorPrompt.question, pendingTutorPrompt.subject || subject);
      clearPendingTutorPrompt();
    }
  }, [pendingTutorPrompt]);

  const handleSendMessage = async (textToSend?: string, overrideSubject?: SubjectCategory) => {
    const query = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!query || isLoading) return;

    const currentSubject = overrideSubject || subject;
    const currentMode = studyMode;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: currentSubject,
      studyMode: currentMode,
    };

    // Prepare placeholder AI message for streaming
    const aiMessageId = `ai-${Date.now()}`;
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: currentSubject,
      studyMode: currentMode,
      isStreaming: true,
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages([...updatedWithUser, initialAiMessage]);
    setInputText('');
    setIsLoading(true);

    // Multi-turn history: send last 8 messages as conversation context
    const conversationHistory = updatedWithUser.slice(-8).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    let accumulatedText = '';
    let isFallback = false;

    try {
      await geminiService.askTutorStream(
        {
          question: query,
          subject: currentSubject,
          studyMode: currentMode,
          history: conversationHistory,
        },
        (chunk: string) => {
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, text: accumulatedText, isStreaming: true }
                : msg
            )
          );
        },
        (finalText: string, notice?: string) => {
          accumulatedText = finalText;
          if (notice) isFallback = true;
          if (notice) {
            addToast('StudyPilot Info', notice, 'info');
          }
        }
      );

      // Finalize the message
      const finalAiMessage: ChatMessage = {
        id: aiMessageId,
        sender: 'ai',
        text: accumulatedText || 'Explanation completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: currentSubject,
        studyMode: currentMode,
        isStreaming: false,
        isDemoFallback: isFallback,
      };

      const finalMessages = [...updatedWithUser, finalAiMessage];
      setMessages(finalMessages);
      storage.saveChatMessages(finalMessages);

      // Increment stats and log to history
      incrementStat('questionsAsked', 1);
      storage.addHistoryItem({
        id: `hist-tutor-${Date.now()}`,
        type: 'tutor',
        title: query.length > 50 ? query.slice(0, 48) + '...' : query,
        subtitle: `${currentSubject} · Mode: ${currentMode}`,
        timestamp: 'Just now',
      });
    } catch (err: any) {
      // If streaming fails completely, try fallback askTutor
      try {
        const fallbackRes = await geminiService.askTutor(
          query,
          currentSubject,
          currentMode,
          conversationHistory
        );
        const resolvedAiMsg: ChatMessage = {
          id: aiMessageId,
          sender: 'ai',
          text: fallbackRes.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subject: currentSubject,
          studyMode: currentMode,
          isStreaming: false,
          isDemoFallback: fallbackRes.isDemoFallback,
        };
        const finalMessages = [...updatedWithUser, resolvedAiMsg];
        setMessages(finalMessages);
        storage.saveChatMessages(finalMessages);
        incrementStat('questionsAsked', 1);
      } catch (fallbackErr: any) {
        setMessages(updatedWithUser);
        addToast(
          'Academic Assistant Error',
          err?.message || 'Failed to complete query. Please check network or API connection.',
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to Clipboard', 'Academic explanation copied successfully.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (!lastUserMsg) return;

    handleSendMessage(lastUserMsg.text, lastUserMsg.subject);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([]);
      storage.saveChatMessages([]);
      addToast('Conversation Reset', 'Academic session history cleared.', 'info');
    }
  };

  // Curated subject-specific academic starters
  const subjectStarters: Record<string, string[]> = {
    'Computer Science': [
      'Explain the difference between Process and Thread with memory layouts.',
      'How does the TCP 3-way handshake work and why isn\'t 2-way sufficient?',
      'Explain Virtual Memory, Paging, and Page Faults step-by-step.',
    ],
    Python: [
      'Explain Python decorators and provide a production timing wrapper example.',
      'What is the Global Interpreter Lock (GIL) and how does it affect CPU vs I/O tasks?',
      'Explain the difference between `deepcopy` and shallow copy with mutable objects.',
    ],
    C: [
      'Explain pointer arithmetic, arrays as pointers, and common memory leak pitfalls.',
      'Show how `malloc`, `realloc`, and `free` interact with the operating system heap.',
      'Explain struct padding, memory alignment, and how `sizeof` computes struct size.',
    ],
    'C++': [
      'Explain RAII, Move Semantics (`std::move`), and rvalue references (`&&`).',
      'What is the difference between `std::unique_ptr` and `std::shared_ptr`?',
      'Explain virtual tables (vtable) and how dynamic polymorphism is implemented.',
    ],
    'Data Structures': [
      'Compare AVL Tree vs Red-Black Tree balancing criteria and rotation overhead.',
      'Explain how Dijkstra\'s Algorithm works with a Min-Heap and why negative edges fail.',
      'Show the step-by-step QuickSelect algorithm for finding the k-th smallest element.',
    ],
    DBMS: [
      'Explain 1NF, 2NF, 3NF, and BCNF with concrete relation schemas and dependencies.',
      'What are ACID properties in transaction management and how does WAL ensure Durability?',
      'Explain B+ Tree index clustering and why B+ trees are preferred over binary trees for disk storage.',
    ],
    Mathematics: [
      'Explain Eigenvalues and Eigenvectors geometrically and show how to compute them.',
      'Derive the Taylor Series expansion of f(x) = e^x around x = 0 with remainder estimation.',
      'Explain Bayes\' Theorem with a concrete medical diagnosis conditional probability problem.',
    ],
    'Discrete Mathematics': [
      'Explain Mathematical Induction vs Strong Induction with a concrete summation proof.',
      'Show how to solve the recurrence relation T(n) = 2T(n/2) + O(n) using Master Theorem.',
      'Explain Euler Paths vs Hamiltonian Cycles and their computational complexity.',
    ],
    'Web Development': [
      'Explain the Critical Rendering Path: DOM, CSSOM, Render Tree, Layout, and Paint.',
      'Explain Cross-Origin Resource Sharing (CORS) preflight requests and headers.',
      'What is the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?',
    ],
    General: [
      'Explain the scientific method and how hypothesis testing establishes statistical significance.',
      'How do Large Language Models utilize Attention mechanisms and Transformers to process text?',
      'Explain time complexity notation: Big-O, Big-Omega, and Big-Theta with rigorous definitions.',
    ],
  };

  const currentStarters = subjectStarters[subject] || subjectStarters['Computer Science'];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[880px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        {/* Subject dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="subject-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Subject:
          </label>
          <select
            id="subject-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectCategory)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {ALL_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Study Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setStudyMode('standard')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              studyMode === 'standard'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Rigorous step-by-step academic explanations with code & mathematical proofs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Academic Standard</span>
          </button>

          <button
            type="button"
            onClick={() => setStudyMode('beginner')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              studyMode === 'beginner'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Explains concepts using intuitive analogies, progressive scaffolding, and minimal initial jargon"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Beginner Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setStudyMode('exam')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              studyMode === 'exam'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Optimized for university marking schemes: high-yield keywords, exam formats, and common traps"
          >
            <Award className="w-3.5 h-3.5 text-purple-500" />
            <span>Exam Mode</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={messages.length === 0 || isLoading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Regenerate last response"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 || isLoading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-40"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                StudyPilot Academic Tutor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Powered by Gemini. Multi-turn conversation context is retained so you can ask follow-up questions, request deeper derivations, or debug programming logic.
              </p>
            </div>

            <div className="w-full pt-2 text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Suggested Academic Topics ({subject}):
              </span>
              <div className="grid grid-cols-1 gap-2">
                {currentStarters.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sample)}
                    className="p-2.5 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group"
                  >
                    <span>"{sample}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                  SP
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs md:text-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs'
                }`}
              >
                {!isUser ? (
                  <div className="space-y-3">
                    {msg.text ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs py-1">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating explanation...</span>
                      </div>
                    )}

                    {msg.isStreaming && (
                      <div className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1 align-middle" />
                    )}

                    {!msg.isStreaming && msg.text && (
                      <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          {msg.subject && <span>{msg.subject}</span>}
                          {msg.studyMode && <span>· Mode: {msg.studyMode}</span>}
                          <span>· {msg.timestamp}</span>
                          {msg.isDemoFallback && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-medium">
                              Demo Fallback
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="text-[10px] text-indigo-200 text-right mt-1">
                      {msg.timestamp}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs font-semibold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${subject} (e.g. "Explain B-Trees vs B+ Trees with disk block layout")... [Enter to send]`}
            disabled={isLoading}
            className="flex-1 max-h-32 min-h-[40px] p-2 bg-transparent text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden resize-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-all shrink-0 shadow-xs cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1 mt-1.5">
          <span>
            Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for line break.
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Gemini 3.8 Flash Engine
          </span>
        </div>
      </div>
    </div>
  );
};
