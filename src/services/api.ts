import { geminiService } from './gemini';

// Re-export the primary GeminiService singleton
export { geminiService };

// Clean, strongly-typed API facade for backward compatibility
export const api = {
  checkHealth: () => geminiService.checkHealth(),
  askTutorStream: geminiService.askTutorStream.bind(geminiService),
  askTutor: geminiService.askTutor.bind(geminiService),
  generateNotes: geminiService.generateNotes.bind(geminiService),
  generateQuiz: geminiService.generateQuiz.bind(geminiService),
  generateFlashcards: geminiService.generateFlashcards.bind(geminiService),
  generateStudyPlan: geminiService.generateStudyPlan.bind(geminiService),
};
