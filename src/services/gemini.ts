import {
  SubjectCategory,
  StudyMode,
  QuizQuestion,
  Flashcard,
  StudyDay,
} from '../types';

export interface TutorStreamParams {
  question: string;
  subject?: SubjectCategory;
  studyMode?: StudyMode;
  history?: Array<{ sender: 'user' | 'ai'; text: string }>;
}

export interface NotesParams {
  material: string;
  actionType?: 'summarize' | 'notes' | 'keypoints' | 'revisionsheet';
  subject?: SubjectCategory;
  topic?: string;
}

export interface QuizParams {
  subject: string;
  topic: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  count?: number;
  questionType?: 'Multiple Choice' | 'True/False' | 'Mixed';
}

export interface FlashcardsParams {
  subject: string;
  topic: string;
  material?: string;
  count?: number;
}

export interface PlannerParams {
  subjects: string[];
  availableHours: number;
  examDate: string;
  difficultyMap?: Record<string, string>;
  preferredTime?: string;
}

export interface HealthStatus {
  status: string;
  hasApiKey: boolean;
  model: string;
}

class GeminiService {
  /**
   * Performs backend health check
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check request failed');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false, model: 'gemini-3.8-flash' };
    }
  }

  /**
   * Streams AI Tutor responses progressively using Server-Sent Events (SSE).
   * Supports AbortController signal for instant cancellation (Stop Generation).
   */
  async askTutorStream(
    params: TutorStreamParams,
    onChunk: (chunk: string) => void,
    onDone?: (fullText: string, notice?: string) => void,
    onError?: (error: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    let accumulated = '';
    let serverNotice: string | undefined;

    try {
      const response = await fetch('/api/tutor/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: params.question,
          subject: params.subject || 'General',
          studyMode: params.studyMode || 'standard',
          history: params.history || [],
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      }

      if (!response.body) {
        throw new Error('Streaming response body not supported by browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === '[DONE]') {
              onDone?.(accumulated, serverNotice);
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.notice) {
                serverNotice = parsed.notice;
              }
              if (parsed.text) {
                accumulated += parsed.text;
                onChunk(parsed.text);
              }
            } catch (jsonErr: any) {
              if (jsonErr.message && !jsonErr.message.includes('JSON')) {
                throw jsonErr;
              }
            }
          }
        }
      }

      onDone?.(accumulated, serverNotice);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onDone?.(accumulated, serverNotice);
        return;
      }
      if (onError) {
        onError(
          err?.message || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      } else {
        throw err;
      }
    }
  }

  /**
   * Non-streaming AI Tutor question fallback.
   * Supports either an object or individual arguments.
   */
  async askTutor(
    paramOrQuestion: TutorStreamParams | string,
    subject?: SubjectCategory,
    studyMode?: StudyMode,
    history?: Array<{ sender: 'user' | 'ai'; text: string }>
  ): Promise<{ answer: string; isDemoFallback?: boolean; notice?: string }> {
    const payload =
      typeof paramOrQuestion === 'string'
        ? {
            question: paramOrQuestion,
            subject: subject || 'General',
            studyMode: studyMode || 'standard',
            history: history || [],
          }
        : {
            question: paramOrQuestion.question,
            subject: paramOrQuestion.subject || 'General',
            studyMode: paramOrQuestion.studyMode || 'standard',
            history: paramOrQuestion.history || [],
          };

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      }

      return await res.json();
    } catch (err: any) {
      throw new Error(
        err?.message || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
      );
    }
  }

  /**
   * Generates academic notes, summaries, keypoints, or revision sheets from source text.
   * Supports either an object or individual arguments.
   */
  async generateNotes(
    paramOrMaterial: NotesParams | string,
    actionType?: 'summarize' | 'notes' | 'keypoints' | 'revisionsheet',
    subject?: SubjectCategory,
    topic?: string
  ): Promise<{ notes: string; isDemoFallback?: boolean }> {
    const payload =
      typeof paramOrMaterial === 'string'
        ? {
            material: paramOrMaterial,
            actionType: actionType || 'notes',
            subject: subject || 'General',
            topic: topic || 'Study Material',
          }
        : {
            material: paramOrMaterial.material,
            actionType: paramOrMaterial.actionType || 'notes',
            subject: paramOrMaterial.subject || 'General',
            topic: paramOrMaterial.topic || 'Study Material',
          };

    try {
      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      }

      return await res.json();
    } catch (err: any) {
      throw new Error(
        err?.message || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
      );
    }
  }

  /**
   * Generates structured assessment quiz questions with answers and rationales.
   * Supports either an object or individual arguments.
   */
  async generateQuiz(
    paramOrSubject: QuizParams | string,
    topic?: string,
    difficulty?: 'Easy' | 'Medium' | 'Hard',
    count?: number,
    questionType?: 'Multiple Choice' | 'True/False' | 'Mixed'
  ): Promise<{ title?: string; questions: QuizQuestion[]; isDemoFallback?: boolean }> {
    const payload =
      typeof paramOrSubject === 'string'
        ? {
            subject: paramOrSubject,
            topic: topic || 'General Topic',
            difficulty: difficulty || 'Medium',
            count: count || 5,
            questionType: questionType || 'Multiple Choice',
          }
        : {
            subject: paramOrSubject.subject,
            topic: paramOrSubject.topic,
            difficulty: paramOrSubject.difficulty || 'Medium',
            count: paramOrSubject.count || 5,
            questionType: paramOrSubject.questionType || 'Multiple Choice',
          };

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      }

      const data = await res.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Received empty or malformed quiz questions from AI service.');
      }

      return data;
    } catch (err: any) {
      throw new Error(
        err?.message || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
      );
    }
  }

  /**
   * Generates active recall flashcard decks with question and answer.
   * Supports either an object or individual arguments.
   */
  async generateFlashcards(
    paramOrSubject: FlashcardsParams | string,
    topic?: string,
    material?: string,
    count?: number
  ): Promise<{ flashcards: Flashcard[]; isDemoFallback?: boolean }> {
    const payload =
      typeof paramOrSubject === 'string'
        ? {
            subject: paramOrSubject,
            topic: topic || 'General Topic',
            material: material || '',
            count: count || 8,
          }
        : {
            subject: paramOrSubject.subject,
            topic: paramOrSubject.topic,
            material: paramOrSubject.material || '',
            count: paramOrSubject.count || 8,
          };

    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      }

      const data = await res.json();
      if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        throw new Error('Received empty or malformed flashcard deck from AI service.');
      }

      return data;
    } catch (err: any) {
      throw new Error(
        err?.message || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
      );
    }
  }

  /**
   * Generates balanced 7-day personalized study schedules.
   * Supports either an object or individual arguments.
   */
  async generateStudyPlan(
    paramOrSubjects: PlannerParams | string[],
    availableHours?: number,
    examDate?: string,
    difficultyMap?: Record<string, string>,
    preferredTime?: string
  ): Promise<{
    plan: {
      title: string;
      overview: string;
      days: StudyDay[];
    };
    isDemoFallback?: boolean;
  }> {
    const payload = Array.isArray(paramOrSubjects)
      ? {
          subjects: paramOrSubjects,
          availableHours: availableHours || 4,
          examDate: examDate || 'Upcoming Exam',
          difficultyMap: difficultyMap || {},
          preferredTime: preferredTime || 'Evening',
        }
      : {
          subjects: paramOrSubjects.subjects,
          availableHours: paramOrSubjects.availableHours,
          examDate: paramOrSubjects.examDate,
          difficultyMap: paramOrSubjects.difficultyMap || {},
          preferredTime: paramOrSubjects.preferredTime || 'Evening',
        };

    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
        );
      }

      const data = await res.json();
      if (!data.plan || !data.plan.days || !Array.isArray(data.plan.days)) {
        throw new Error('Received incomplete study timetable from AI service.');
      }

      return data;
    } catch (err: any) {
      throw new Error(
        err?.message || "StudyPilot couldn't reach the AI service. Please check your connection and try again."
      );
    }
  }
}

export const geminiService = new GeminiService();
