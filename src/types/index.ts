export type NavigationTab =
  | 'landing'
  | 'dashboard'
  | 'tutor'
  | 'notes'
  | 'quiz'
  | 'flashcards'
  | 'planner'
  | 'history'
  | 'settings';

export type SubjectCategory =
  | 'Computer Science'
  | 'Python'
  | 'C'
  | 'C++'
  | 'Data Structures'
  | 'DBMS'
  | 'Mathematics'
  | 'Discrete Mathematics'
  | 'Web Development'
  | 'General';

export const ALL_SUBJECTS: SubjectCategory[] = [
  'Computer Science',
  'Python',
  'C',
  'C++',
  'Data Structures',
  'DBMS',
  'Mathematics',
  'Discrete Mathematics',
  'Web Development',
  'General',
];

export type StudyMode = 'standard' | 'beginner' | 'exam';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  subject?: SubjectCategory;
  studyMode?: StudyMode;
  isStreaming?: boolean;
  isDemoFallback?: boolean;
}

export interface GeneratedNote {
  id: string;
  title: string;
  subject: SubjectCategory;
  topic: string;
  content: string;
  actionType: 'summarize' | 'notes' | 'keypoints' | 'revisionsheet';
  createdAt: string;
  wordCount: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'Multiple Choice' | 'True/False' | 'Mixed';
  questions: QuizQuestion[];
  userAnswers: Record<number, number>; // questionId -> optionIndex
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint: string;
  tag: string;
}

export interface FlashcardDeck {
  id: string;
  subject: string;
  topic: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  timeSlot: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  completed: boolean;
}

export interface StudyDay {
  dayName: string;
  theme: string;
  sessions: StudySession[];
}

export interface StudyPlan {
  id: string;
  title: string;
  overview: string;
  examDate: string;
  availableHours: number;
  days: StudyDay[];
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  type: 'tutor' | 'quiz' | 'notes' | 'flashcards' | 'planner';
  title: string;
  subtitle: string;
  timestamp: string;
  dataRef?: any;
}

export interface UserStats {
  studyStreakDays: number;
  questionsAsked: number;
  quizzesCompleted: number;
  studyHours: number;
  notesCreated: number;
  flashcardsReviewed: number;
  lastActiveDate: string;
}

export interface UserSettings {
  profileName: string;
  collegeMajor: string;
  theme: 'light' | 'dark' | 'system';
  defaultSubject: SubjectCategory;
  preferredDifficulty: 'Easy' | 'Medium' | 'Hard';
  aiResponseStyle: 'Comprehensive' | 'Concise' | 'Step-by-Step';
}
