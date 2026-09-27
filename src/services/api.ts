import { geminiService } from './gemini';

// Re-export geminiService for centralized AI architecture
export { geminiService };

// Backward-compatible alias
export const api = {
  checkHealth: () => geminiService.checkHealth(),
  askTutor: (
    question: string,
    subject?: any,
    studyMode?: any,
    history?: any
  ) => geminiService.askTutor({ question, subject, studyMode, history }),
  generateNotes: (
    material: string,
    actionType?: any,
    subject?: any,
    topic?: string
  ) => geminiService.generateNotes({ material, actionType, subject, topic }),
  generateQuiz: (
    subject: string,
    topic: string,
    difficulty?: any,
    count?: number,
    questionType?: any
  ) => geminiService.generateQuiz({ subject, topic, difficulty, count, questionType }),
  generateFlashcards: (
    subject: string,
    topic: string,
    material?: string,
    count?: number
  ) => geminiService.generateFlashcards({ subject, topic, material, count }),
  generateStudyPlan: (
    subjects: string[],
    availableHours: number,
    examDate: string,
    difficultyMap?: Record<string, string>,
    preferredTime?: string
  ) => geminiService.generateStudyPlan({ subjects, availableHours, examDate, difficultyMap, preferredTime }),
};
