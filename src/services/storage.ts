import {
  ChatMessage,
  GeneratedNote,
  QuizAttempt,
  FlashcardDeck,
  StudyPlan,
  HistoryItem,
  UserStats,
  UserSettings,
} from '../types';

const STORAGE_KEYS = {
  USER_SETTINGS: 'studypilot_user_settings_v1',
  USER_STATS: 'studypilot_user_stats_v1',
  CHAT_MESSAGES: 'studypilot_chat_messages_v1',
  NOTES: 'studypilot_notes_v1',
  QUIZ_ATTEMPTS: 'studypilot_quiz_attempts_v1',
  FLASHCARD_DECKS: 'studypilot_flashcard_decks_v1',
  STUDY_PLANS: 'studypilot_study_plans_v1',
  HISTORY: 'studypilot_history_v1',
};

// Initial default settings
export const DEFAULT_SETTINGS: UserSettings = {
  profileName: 'Alex Rivera',
  collegeMajor: 'Computer Science & Engineering',
  theme: 'system',
  defaultSubject: 'Computer Science',
  preferredDifficulty: 'Medium',
  aiResponseStyle: 'Comprehensive',
};

// Initial default clean statistics for genuine tracking
export const DEFAULT_STATS: UserStats = {
  studyStreakDays: 0,
  questionsAsked: 0,
  quizzesCompleted: 0,
  studyHours: 0,
  notesCreated: 0,
  flashcardsReviewed: 0,
  lastActiveDate: '',
};

// Initial history is empty for a clean state
export const DEFAULT_HISTORY: HistoryItem[] = [];

export const storage = {
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  },

  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_STATS);
      return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  },

  saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats to localStorage', e);
    }
  },

  incrementStat(key: keyof Omit<UserStats, 'lastActiveDate'>, amount = 1): UserStats {
    const current = this.getStats();
    const today = new Date().toDateString();
    let newStreak = current.studyStreakDays;

    if (!current.lastActiveDate) {
      newStreak = 1;
    } else {
      const lastActive = new Date(current.lastActiveDate).toDateString();
      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }

    const updated: UserStats = {
      ...current,
      studyStreakDays: Math.max(newStreak, 1),
      [key]: (Number(current[key]) || 0) + amount,
      lastActiveDate: new Date().toISOString(),
    };
    this.saveStats(updated);
    return updated;
  },

  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (data) return JSON.parse(data);
      // Default demo conversation
      return [
        {
          id: 'demo-msg-1',
          sender: 'user',
          text: 'Explain normalization in DBMS and why we need 3NF vs BCNF.',
          timestamp: 'Yesterday at 4:18 PM',
          subject: 'DBMS',
          studyMode: 'standard',
        },
        {
          id: 'demo-msg-2',
          sender: 'ai',
          text: `### 📘 Academic Explanation: Database Normalization

#### 1. Simple Explanation
Normalization is a systematic database design technique used to organize tables in a way that **reduces data redundancy** and prevents insert, update, and delete **anomalies**.

#### 2. Detailed Explanation
In relational database theory, tables are decomposed into smaller, well-structured relations using functional dependencies:
- **1NF (First Normal Form):** Ensures atomic values; eliminates repeating groups or multi-valued attributes.
- **2NF (Second Normal Form):** Must be in 1NF, and eliminates partial dependencies (no non-prime attribute depends on a proper subset of a candidate key).
- **3NF (Third Normal Form):** Must be in 2NF, and eliminates transitive dependencies (non-prime attributes must only depend directly on the primary key).
- **BCNF (Boyce-Codd Normal Form):** A stricter version of 3NF where for every functional dependency \`X -> Y\`, \`X\` **must be a superkey**.

#### 3. Concrete Example
Consider a Student-Course-Advisor relation where \`Advisor -> Department\`.
If a student changes advisors, updating multiple rows could cause an inconsistency. In 3NF/BCNF, we decouple this into:
- \`Student(StudentID, CourseID, AdvisorID)\`
- \`Advisor(AdvisorID, Department)\`

#### 4. Key Takeaways
- **3NF** guarantees dependency preservation and lossless join.
- **BCNF** eliminates all redundancy from functional dependencies, but might occasionally fail to preserve all dependencies without an extra check.
- In exam questions, always identify candidate keys before classifying the normal form.`,
          timestamp: 'Yesterday at 4:19 PM',
          subject: 'DBMS',
          studyMode: 'standard',
        },
      ];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat messages', e);
    }
  },

  getNotes(): GeneratedNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNote(note: GeneratedNote): void {
    try {
      const current = this.getNotes();
      const updated = [note, ...current.filter((n) => n.id !== note.id)];
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save note', e);
    }
  },

  deleteNote(id: string): void {
    try {
      const current = this.getNotes();
      const updated = current.filter((n) => n.id !== id);
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete note', e);
    }
  },

  getQuizAttempts(): QuizAttempt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuizAttempt(attempt: QuizAttempt): void {
    try {
      const current = this.getQuizAttempts();
      const updated = [attempt, ...current];
      localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save quiz attempt', e);
    }
  },

  getFlashcardDecks(): FlashcardDeck[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASHCARD_DECKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveFlashcardDeck(deck: FlashcardDeck): void {
    try {
      const current = this.getFlashcardDecks();
      const updated = [deck, ...current.filter((d) => d.id !== deck.id)];
      localStorage.setItem(STORAGE_KEYS.FLASHCARD_DECKS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save flashcard deck', e);
    }
  },

  getStudyPlans(): StudyPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_PLANS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStudyPlan(plan: StudyPlan): void {
    try {
      const current = this.getStudyPlans();
      const updated = [plan, ...current.filter((p) => p.id !== plan.id)];
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save study plan', e);
    }
  },

  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : DEFAULT_HISTORY;
    } catch {
      return DEFAULT_HISTORY;
    }
  },

  addHistoryItem(item: HistoryItem): void {
    try {
      const current = this.getHistory();
      const updated = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save history item', e);
    }
  },

  deleteHistoryItem(id: string): void {
    try {
      const current = this.getHistory();
      const updated = current.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete history item', e);
    }
  },

  clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
  },
};
