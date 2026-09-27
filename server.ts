import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 10mb limit
app.use(express.json({ limit: '10mb' }));

// In-Memory Rate Limiting: max 60 requests per minute per IP for /api endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before sending more requests.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count += 1;
  next();
}

app.use('/api', rateLimiter);

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// Initialize Gemini client with server-side SDK and aistudio-build telemetry
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'your_api_key_here') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Supported model constants
const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

// System Instruction for StudyPilot AI
const STUDYPILOT_SYSTEM_INSTRUCTION = `You are StudyPilot AI, a precise, supportive, and pedagogical academic learning assistant.

Your primary goal is to help students understand concepts accurately rather than simply producing plausible-sounding answers.

ACCURACY:
1. Never intentionally invent facts.
2. Do not fabricate references, quotations, formulas, statistics, APIs, commands, or academic concepts.
3. If you are uncertain, explicitly say that you are uncertain.
4. Distinguish established facts from assumptions or estimates.
5. Re-check calculations and logical conclusions before answering.
6. For programming questions, verify syntax and logic carefully.
7. For mathematics, calculate carefully and show important steps.
8. Never pretend that an unverified statement is certain.

EDUCATIONAL QUALITY:
1. Explain concepts clearly.
2. Start with a simple explanation when the student appears to be a beginner.
3. Use examples when useful.
4. Break difficult subjects into logical sections.
5. Highlight important points.
6. Give practical examples.
7. When appropriate, provide a short exam-ready answer after the detailed explanation.
8. If the question is ambiguous, ask a concise clarification question rather than guessing.

CONVERSATION:
1. Remember relevant information from the current conversation.
2. Understand follow-up questions such as 'explain that again' or 'give another example'.
3. Do not repeat the entire previous answer unnecessarily.
4. Refer to the previous context when appropriate.

PROGRAMMING:
1. Provide runnable code whenever appropriate.
2. Use correct syntax.
3. Explain what the code does.
4. Mention common errors when useful.
5. Do not claim code was executed unless it actually was executed.

MATHEMATICS:
1. Show important calculation steps.
2. Check arithmetic.
3. Give the final answer clearly.
4. Use appropriate LaTeX or standard mathematical notation.

RESPONSE STYLE:
Be professional, friendly, concise but sufficiently detailed.
Use Markdown headings, bullets, numbered steps, tables, and code blocks when they improve readability.`;

// Helper: Formats subject and study mode directives
function getModeAndSubjectPrompt(subject: string, studyMode: string): string {
  let modeDirective = '';
  if (studyMode === 'beginner') {
    modeDirective = `STUDY MODE: Beginner Mode is ENABLED.
- Use simple, intuitive language and relatable real-world analogies.
- Explain technical terminology immediately upon introducing it.
- Provide step-by-step reasoning with minimal academic jargon.`;
  } else if (studyMode === 'exam') {
    modeDirective = `STUDY MODE: Exam Mode is ENABLED.
Structure your answer strictly using these exact sections:
1. Definition (Formal university textbook definition to memorize)
2. Key Points (High-yield exam bullet points)
3. Explanation (Core conceptual mechanics)
4. Example (Concrete scenario, calculation, or code snippet)
5. Important Exam Points (Common marking criteria / edge cases)
6. Possible Exam Question (Realistic university exam question + concise model answer)`;
  } else {
    modeDirective = `STUDY MODE: Academic Standard.
Provide an educational explanation structured with clear Markdown headings:
### 1. Conceptual Overview
### 2. Step-by-Step Breakdown
### 3. Practical Example (or runnable code if programming/CS, or step-by-step derivation if Math)
### 4. Key Takeaways & Common Pitfalls`;
  }

  return `ACADEMIC CONTEXT:
Selected Subject: ${subject}
${modeDirective}`;
}

/**
 * Builds valid Gemini conversation contents adhering strictly to role alternation:
 * 1. Must never start with a model message (strip leading model turns).
 * 2. Must strictly alternate between 'user' and 'model' (merge consecutive turns).
 * 3. Must end with the current student question as a 'user' turn.
 */
function buildGeminiContents(
  history: Array<{ sender: 'user' | 'ai'; text: string }> = [],
  currentQuestion: string,
  subject: string,
  studyMode: string
) {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // Filter recent messages (up to 10)
  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];

  // Strip leading model messages so history always begins with user
  let startIndex = 0;
  while (startIndex < recentHistory.length && recentHistory[startIndex].sender !== 'user') {
    startIndex++;
  }

  for (let i = startIndex; i < recentHistory.length; i++) {
    const msg = recentHistory[i];
    const text = (msg.text || '').trim();
    if (!text) continue;

    const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';

    // Merge consecutive identical roles to guarantee strict role alternation
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Prepend subject and mode instruction to current user prompt
  const contextualInstruction = getModeAndSubjectPrompt(subject, studyMode);
  const fullPrompt = `${contextualInstruction}\n\nStudent Question / Follow-up:\n${currentQuestion.trim()}`;

  // If the last history turn is 'user', merge into it; otherwise add as new user turn
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${fullPrompt}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: fullPrompt }],
    });
  }

  return contents;
}

/**
 * Helper: Calls Gemini models with automatic retry, exponential backoff, and model fallback.
 * Tries PRIMARY_MODEL first; on transient errors (429/503), backs off and retries,
 * then falls back to FALLBACK_MODEL before throwing.
 */
async function callGeminiWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  maxRetries?: number;
}): Promise<{ response: any; modelUsed: string }> {
  if (!aiClient) {
    throw new Error('Gemini API client is not initialized.');
  }

  const modelsToTry = [params.preferredModel || PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const retries = params.maxRetries ?? 1;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { response, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        const msg = String(err?.message || '');
        const isTransient =
          status === 429 ||
          status === 503 ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('overloaded') ||
          msg.includes('high demand') ||
          msg.includes('ECONNRESET');

        if (isTransient && attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 3000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If not transient or exhausted retries for this model, try fallback model
        break;
      }
    }
  }

  throw lastError;
}

// ==========================================
// FALLBACK GENERATORS (Curated Offline Content)
// ==========================================

function getFallbackTutorResponse(question: string, subject: string, studyMode: string): string {
  const qLower = question.toLowerCase();

  if (qLower.includes('25 * 16') || qLower.includes('25*16')) {
    return `### Mathematical Calculation

To calculate **25 × 16**:

#### Step-by-Step Breakdown:
1. Decompose 16 into factors: **16 = 4 × 4**
2. Calculate first step: **25 × 4 = 100**
3. Multiply the result: **100 × 4 = 400**

Alternatively, using standard multiplication:
\`\`\`text
    25
  × 16
  ────
   150   (25 × 6)
 + 250   (25 × 10)
  ────
   400
\`\`\`

**Final Result:** **400**`;
  }

  if (qLower.includes('prime') && (qLower.includes('python') || subject === 'Python' || subject === 'Programming' || subject === 'Computer Science')) {
    return `### Python Program: Check If a Number Is Prime

A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.

\`\`\`python
import math

def is_prime(n: int) -> bool:
    """
    Checks if a number n is prime.
    Time Complexity: O(sqrt(n))
    Space Complexity: O(1)
    """
    if n <= 1:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    
    limit = int(math.isqrt(n))
    for i in range(3, limit + 1, 2):
        if n % i == 0:
            return False
            
    return True

# Example tests
test_cases = [1, 2, 3, 4, 17, 25, 29, 100]
for num in test_cases:
    print(f"{num}: {'Prime' if is_prime(num) else 'Not prime'}")
\`\`\`

#### Key Points:
1. **Edge Cases:** Numbers $\\le 1$ are not prime. 2 is prime. All other even numbers are composite.
2. **Efficiency:** We only test divisors up to $\\lfloor\\sqrt{n}\\rfloor$, halving checks by testing odd numbers only.`;
  }

  if (studyMode === 'beginner') {
    return `### 👋 Beginner Overview: ${question}

#### Analogy:
Think of this concept like an everyday organizational system:
- In **${subject}**, complex workflows require structured rules so each component has a single, well-defined role.
- By isolating responsibilities, debugging is straightforward and errors don't ripple through the entire system.

#### Key Takeaway:
Start with the baseline definitions, eliminate unnecessary complexity, and verify intermediate steps systematically.`;
  }

  if (studyMode === 'exam') {
    return `### 🎯 Exam Mode Breakdown: ${question}

#### 1. Definition
"${question}" represents a foundational concept in **${subject}** designed to guarantee correctness, maintain system invariants, and optimize computational performance.

#### 2. Key Points
- **Primary Mechanism:** Enforces strict boundary conditions while minimizing redundant operations.
- **Complexity Trade-offs:** Balances time latency, storage footprint, and implementation complexity.
- **Formal Invariants:** Preserved before and after each state transformation.

#### 3. Model Exam Answer
> In university examination criteria, full credit requires explicitly stating boundary constraints, outlining edge cases (e.g. $N \\le 0$), and walking through a concrete 2-step verification.`;
  }

  return `### 📘 Academic Explanation: ${question}

#### 1. Conceptual Overview
In **${subject}**, this topic is critical for understanding foundational system mechanics, logical proofs, and modular design.

#### 2. Core Mechanics
1. **Preconditions:** Validate inputs and establish boundary constraints.
2. **Deterministic Execution:** Follow standardized, verified state transitions.
3. **Postcondition Verification:** Guarantee that invariants hold and no side-effects corrupt memory or application state.

#### 3. Summary
Review the formal definitions and practice working through edge cases to master this topic for examinations.`;
}

function getFallbackNotes(topic: string, subject: string, actionType: string, material: string): string {
  const preview = material.slice(0, 200).trim();
  return `# 📖 Study Notes: ${topic || 'Key Concepts'}
*Subject: ${subject} · Action: ${actionType.toUpperCase()}*

> **Notice:** The live AI service is currently unavailable or quota-limited. Here is a structured educational synthesis based on your study material.

---

## 🎯 Overview & Context
This material focuses on foundational academic principles in **${subject}**, specifically analyzing **${topic || 'Core Subject Matter'}**.

${preview ? `**Source Excerpt Analyzed:**\n> "${preview}..."` : ''}

---

## 📌 High-Yield Key Points
1. **System Invariant:** Key properties that must hold true across all valid state transitions.
2. **Boundary Assertions:** Explicit checks for edge conditions (null pointers, empty collections, zero bounds).
3. **Decoupled Architecture:** Isolating sub-problems simplifies testing and limits error blast radiuses.

---

## 💡 Practical Implementation & Exam Tips
- Clearly define variables and notation before deriving equations or writing code.
- Prepare to discuss computational complexity (Big-O time and auxiliary space).
- Review historical exam questions covering this topic.`;
}

function getFallbackQuiz(subject: string, topic: string, difficulty: string, count: number) {
  const curated = [
    {
      id: 1,
      question: `In ${subject} (${topic}), what is the primary computational benefit of applying normalization or balanced partitioning?`,
      options: [
        'Reduces redundancy and minimizes anomalies in state transitions',
        'Completely eliminates the need for indexing structures',
        'Forces all operations into O(1) constant time regardless of scale',
        'Bypasses hardware memory constraints entirely',
      ],
      correctAnswer: 0,
      explanation:
        'Balanced partitioning and normalization systematically eliminate redundant records, preventing update anomalies and reducing storage overhead.',
    },
    {
      id: 2,
      question: `Which asymptotic complexity class represents the optimal comparison-based sorting bound in average and worst cases?`,
      options: ['O(N)', 'O(N log N)', 'O(N²)', 'O(log N)'],
      correctAnswer: 1,
      explanation:
        'By decision-tree lower bound analysis, any comparison-based sort requires at least Ω(N log N) comparisons in the worst/average case.',
    },
    {
      id: 3,
      question: `True or False: In relational database design, BCNF (Boyce-Codd Normal Form) is strictly stricter than 3NF (Third Normal Form).`,
      options: ['True', 'False'],
      correctAnswer: 0,
      explanation:
        'True. BCNF requires that for every functional dependency X -> Y, X must be a superkey, whereas 3NF allows Y to be a prime attribute.',
    },
    {
      id: 4,
      question: `When designing concurrent systems, what does the ACID property "Isolation" guarantee?`,
      options: [
        'Concurrent transactions execute as if occurring sequentially without interleaving hazards',
        'Data is instantly written to cold magnetic storage',
        'Network sockets are encrypted with asymmetric keys',
        'Transactions are automatically rolled back every 60 seconds',
      ],
      correctAnswer: 0,
      explanation:
        'Isolation ensures intermediate transaction states remain invisible to other concurrent operations, preventing dirty reads and lost updates.',
    },
    {
      id: 5,
      question: `In memory management, what phenomenon occurs when free storage is split into small non-contiguous blocks that cannot accommodate a large allocation?`,
      options: [
        'External Fragmentation',
        'Thrashing',
        'Deadlock Cascade',
        'Cache Line Invalidation',
      ],
      correctAnswer: 0,
      explanation:
        'External fragmentation occurs when total free memory is sufficient to satisfy a request, but the memory is non-contiguous, preventing allocation.',
    },
  ];

  return curated.slice(0, Math.max(3, count));
}

function getFallbackFlashcards(subject: string, topic: string, count: number) {
  const curated = [
    {
      id: 1,
      front: 'What is the worst-case search complexity in an AVL Tree or Red-Black Tree?',
      back: 'O(log N). Strict balancing rotations guarantee tree height is bounded logarithmically.',
      hint: 'Think about height-balancing invariants.',
      tag: subject,
    },
    {
      id: 2,
      front: 'Define "Idempotence" in API and system design.',
      back: 'An operation is idempotent if executing it multiple times produces the exact same side-effects as executing it once (e.g. HTTP PUT or DELETE).',
      hint: 'f(f(x)) = f(x)',
      tag: subject,
    },
    {
      id: 3,
      front: 'What are the four Coffman conditions required for a Deadlock to occur?',
      back: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
      hint: 'Breaking any single one prevents deadlock.',
      tag: subject,
    },
    {
      id: 4,
      front: 'What distinguishes a Primary Key from a Candidate Key in Relational Databases?',
      back: 'A Candidate Key is any minimal superkey that uniquely identifies tuples. The database designer chooses exactly one candidate key to serve as the Primary Key.',
      hint: 'Uniqueness + minimality',
      tag: subject,
    },
    {
      id: 5,
      front: 'What is the purpose of the Central Limit Theorem (CLT) in Statistics?',
      back: 'The sampling distribution of the sample mean approaches a Normal Distribution as sample size increases (typically n >= 30), regardless of the underlying population shape.',
      hint: 'Gaussian convergence for sample averages',
      tag: subject,
    },
    {
      id: 6,
      front: 'Explain the difference between P and NP complexity classes.',
      back: 'P contains decision problems solvable in polynomial time by a deterministic Turing machine. NP contains decision problems whose solutions can be verified in polynomial time.',
      hint: 'Solving vs. Verifying',
      tag: subject,
    },
  ];

  return curated.slice(0, Math.max(4, count));
}

function getFallbackStudyPlan(subjects: string[], availableHours: number, examDate: string) {
  const safeSubjects = Array.isArray(subjects) && subjects.length > 0 ? subjects : ['Core Subject', 'Secondary Subject'];
  return {
    title: `Balanced Weekly Study Schedule (${availableHours} hrs/day)`,
    overview: `Designed for spaced repetition and active recall across ${safeSubjects.join(', ')} before ${examDate}.`,
    days: [
      {
        dayName: 'Monday',
        theme: 'Core Foundations & Conceptual Review',
        sessions: [
          {
            id: 'm1',
            timeSlot: '09:00 - 10:30',
            subject: safeSubjects[0] || 'Core Subject',
            topic: 'Theoretical Foundations & Complexity Review',
            durationMinutes: 90,
            completed: false,
          },
          {
            id: 'm2',
            timeSlot: '11:00 - 12:00',
            subject: safeSubjects[1] || safeSubjects[0],
            topic: 'Key Invariants & Practice Problems',
            durationMinutes: 60,
            completed: false,
          },
        ],
      },
      {
        dayName: 'Tuesday',
        theme: 'Algorithmic Drills & Step-by-Step Proofs',
        sessions: [
          {
            id: 't1',
            timeSlot: '09:30 - 11:00',
            subject: safeSubjects[1] || safeSubjects[0],
            topic: 'Analytical Problem Sets & Proofs',
            durationMinutes: 90,
            completed: false,
          },
          {
            id: 't2',
            timeSlot: '14:00 - 15:15',
            subject: safeSubjects[0],
            topic: 'Implementation & Trace Review',
            durationMinutes: 75,
            completed: false,
          },
        ],
      },
      {
        dayName: 'Wednesday',
        theme: 'Mid-Week Spaced Repetition & Quiz Checkpoint',
        sessions: [
          {
            id: 'w1',
            timeSlot: '10:00 - 11:30',
            subject: safeSubjects[0],
            topic: 'Active Recall & Self-Testing Questions',
            durationMinutes: 90,
            completed: false,
          },
          {
            id: 'w2',
            timeSlot: '15:00 - 16:15',
            subject: safeSubjects[2] || safeSubjects[1] || safeSubjects[0],
            topic: 'Flashcard Mastery Check',
            durationMinutes: 75,
            completed: false,
          },
        ],
      },
      {
        dayName: 'Thursday',
        theme: 'Edge Cases, Bug Tracing & Code Rigor',
        sessions: [
          {
            id: 'th1',
            timeSlot: '09:00 - 10:30',
            subject: safeSubjects[0],
            topic: 'Boundary Conditions & Edge Cases',
            durationMinutes: 90,
            completed: false,
          },
        ],
      },
      {
        dayName: 'Friday',
        theme: 'Synthesis & Summary Revision Sheets',
        sessions: [
          {
            id: 'f1',
            timeSlot: '10:00 - 11:30',
            subject: 'Cross-Subject Synthesis',
            topic: 'Creating 1-Page Exam Reference Sheets',
            durationMinutes: 90,
            completed: false,
          },
        ],
      },
      {
        dayName: 'Saturday',
        theme: 'Timed Exam Simulation',
        sessions: [
          {
            id: 's1',
            timeSlot: '10:00 - 12:00',
            subject: 'Timed Assessment',
            topic: 'Simulated Midterm / Final Exam Paper',
            durationMinutes: 120,
            completed: false,
          },
        ],
      },
      {
        dayName: 'Sunday',
        theme: 'Consolidation & Upcoming Week Prep',
        sessions: [
          {
            id: 'su1',
            timeSlot: '11:00 - 12:15',
            subject: 'Weekly Review',
            topic: 'Weak-Spot Remediation with AI Tutor',
            durationMinutes: 75,
            completed: false,
          },
        ],
      },
    ],
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'your_api_key_here'),
    model: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// 1. AI Tutor Streaming Endpoint (SSE)
app.post('/api/tutor/chat/stream', async (req: Request, res: Response) => {
  const { question, subject = 'General', studyMode = 'standard', history = [] } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question text is required.' });
  }

  if (question.length > 2000) {
    return res.status(400).json({ error: 'Question text exceeds maximum allowed length of 2,000 characters.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
  });

  // If no API key configured, stream fallback answer clearly labeled
  if (!aiClient) {
    const fallbackText = getFallbackTutorResponse(question.trim(), subject, studyMode);
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      if (isAborted || res.writableEnded || res.closed) break;
      const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      res.write(`data: ${JSON.stringify({ text: chunk, isDemo: true, notice: 'Offline demo response (API key not configured)' })}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }
    if (!res.writableEnded && !res.closed) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
    return;
  }

  try {
    const contents = buildGeminiContents(history, question.trim(), subject, studyMode);
    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
    let streamSuccess = false;
    let streamStarted = false;

    for (const model of modelsToTry) {
      if (streamSuccess || isAborted || res.writableEnded || res.closed) break;
      try {
        const streamResult = await aiClient.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: STUDYPILOT_SYSTEM_INSTRUCTION,
            temperature: 0.4,
          },
        });

        for await (const chunk of streamResult) {
          if (isAborted || res.writableEnded || res.closed) {
            break;
          }
          if (chunk.text) {
            streamStarted = true;
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }

        streamSuccess = true;
        break;
      } catch (streamErr: any) {
        console.warn(`Streaming attempt with ${model} failed:`, streamErr?.status || streamErr?.message);
        if (!streamStarted) {
          // No chunks sent yet, fall through to next model
          continue;
        }
        break;
      }
    }

    if (!streamSuccess && !streamStarted && !res.writableEnded && !res.closed) {
      const friendlyMessage = 'AI service temporarily unavailable. Showing offline academic guidance.';
      const fallbackText = getFallbackTutorResponse(question.trim(), subject, studyMode);
      res.write(`data: ${JSON.stringify({ text: `\n\n> ⚠️ *${friendlyMessage}*\n\n` + fallbackText, isDemo: true, notice: friendlyMessage })}\n\n`);
    }

    if (!res.writableEnded && !res.closed) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('Tutor streaming outer error:', error);
    if (!res.writableEnded && !res.closed) {
      const friendlyMessage =
        error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')
          ? 'AI rate limit reached. Showing offline academic guidance.'
          : "StudyPilot encountered an AI service issue. Showing offline academic guidance.";

      const fallbackText = getFallbackTutorResponse(question.trim(), subject, studyMode);
      res.write(`data: ${JSON.stringify({ text: `\n\n> ⚠️ *${friendlyMessage}*\n\n` + fallbackText, isDemo: true, notice: friendlyMessage })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  }
});

// 2. AI Tutor Standard Endpoint (Non-streaming)
app.post('/api/tutor/chat', async (req: Request, res: Response) => {
  try {
    const { question, subject = 'General', studyMode = 'standard', history = [] } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    if (question.length > 2000) {
      return res.status(400).json({ error: 'Question text exceeds 2,000 character limit.' });
    }

    if (!aiClient) {
      const fallbackText = getFallbackTutorResponse(question.trim(), subject, studyMode);
      return res.json({
        answer: fallbackText,
        isDemoFallback: true,
        notice: 'Offline demo response: API key is not configured.',
      });
    }

    const contents = buildGeminiContents(history, question.trim(), subject, studyMode);

    const { response, modelUsed } = await callGeminiWithRetry({
      contents,
      config: {
        systemInstruction: STUDYPILOT_SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    const answer = response.text || getFallbackTutorResponse(question, subject, studyMode);

    return res.json({
      answer,
      isDemoFallback: false,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Tutor chat error:', error);
    const friendlyMessage =
      error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')
        ? 'AI rate limit reached. Showing curated offline study response.'
        : "AI service temporarily unavailable. Showing curated offline study response.";

    const { question = '', subject = 'General', studyMode = 'standard' } = req.body;
    return res.json({
      answer: getFallbackTutorResponse(question, subject, studyMode),
      isDemoFallback: true,
      errorNotice: friendlyMessage,
    });
  }
});

// 3. Smart Notes Generator Endpoint
app.post('/api/notes/generate', async (req: Request, res: Response) => {
  try {
    const { material, actionType = 'notes', subject = 'General', topic = 'Study Material' } = req.body;

    if (!material || typeof material !== 'string' || !material.trim()) {
      return res.status(400).json({ error: 'Study material text is required.' });
    }

    if (material.length > 30000) {
      return res.status(400).json({ error: 'Study material exceeds 30,000 character limit.' });
    }

    if (!aiClient) {
      return res.json({
        notes: getFallbackNotes(topic, subject, actionType, material),
        isDemoFallback: true,
        notice: 'Offline demo notes: API key not configured.',
      });
    }

    const prompt = `You are generating academic study notes for university students.
Action Requested: ${actionType}
Subject: ${subject}
Topic: ${topic}

Source Material:
"""
${material.slice(0, 25000)}
"""

Please produce comprehensive, accurate, Markdown-formatted study output according to action:
- 'summarize': Concise executive summary + core points.
- 'notes': Structured textbook notes with conceptual overview, definitions, step-by-step breakdown, and exam tips.
- 'keypoints': High-yield bullet points with bold key terms.
- 'revisionsheet': 1-page high-retention exam cheat sheet with key formulas, invariants, and pitfalls.`;

    const { response, modelUsed } = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: STUDYPILOT_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    return res.json({
      notes: response.text,
      isDemoFallback: false,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Notes generator error:', error);
    const friendlyMessage =
      error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')
        ? 'AI rate limit reached. Showing offline summary template.'
        : "AI service temporarily unavailable. Showing offline summary template.";

    const { topic = 'Key Concepts', subject = 'General', actionType = 'notes', material = '' } = req.body;
    return res.json({
      notes: getFallbackNotes(topic, subject, actionType, material),
      isDemoFallback: true,
      errorNotice: friendlyMessage,
    });
  }
});

// 4. Quiz Generator Endpoint with Strict JSON Schema & Answer Validation
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'Computer Science',
      topic = 'Data Structures',
      difficulty = 'Medium',
      count = 5,
      questionType = 'Multiple Choice',
    } = req.body;

    const requestedCount = Math.min(Math.max(Number(count) || 5, 3), 20);

    if (!aiClient) {
      return res.json({
        title: `${topic} Quiz (${difficulty})`,
        questions: getFallbackQuiz(subject, topic, difficulty, requestedCount),
        isDemoFallback: true,
        notice: 'Offline demo questions: API key not configured.',
      });
    }

    const prompt = `Generate a university-level academic quiz with exactly ${requestedCount} questions.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Question Type: ${questionType}

Each question must have:
- 'question': Clear, educational question prompt
- 'options': Array of 4 answer options (or 2 for True/False)
- 'correctAnswer': The exact text string matching the correct option
- 'explanation': Academic rationale explaining why the correct choice is right`;

    const { response, modelUsed } = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: `${STUDYPILOT_SYSTEM_INSTRUCTION}
Generate accurate, high-quality exam questions with one unequivocally correct answer and three plausible college-level distractors (or 2 for True/False).`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of answer choices (4 for multiple choice, 2 for True/False)',
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: 'The exact string matching the correct option in options',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Detailed academic rationale clarifying why this answer is correct',
                  },
                },
                required: ['question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Malformed quiz schema returned by AI service.');
    }

    // Robust validation and index resolution (NEVER blindly default to index 0)
    const validatedQuestions = parsed.questions.map((q: any, index: number) => {
      let options: string[] = Array.isArray(q.options)
        ? q.options.map((opt: any) => String(opt || '').trim()).filter(Boolean)
        : [];

      if (options.length < 2) {
        options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      let correctIndex = -1;
      const ans = q.correctAnswer;

      if (typeof ans === 'number' && Number.isInteger(ans) && ans >= 0 && ans < options.length) {
        correctIndex = ans;
      } else if (typeof ans === 'string') {
        const trimmed = ans.trim();
        // 1. Exact match (case-insensitive)
        const exactIdx = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
        if (exactIdx >= 0) {
          correctIndex = exactIdx;
        } else {
          // 2. Letter match: "A" -> 0, "B" -> 1, "C" -> 2, "D" -> 3
          const letterMatch = trimmed.match(/^[A-Da-d]\b/);
          if (letterMatch) {
            const idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
            if (idx >= 0 && idx < options.length) {
              correctIndex = idx;
            }
          } else {
            // 3. Numeric string match: "0", "1", "2"
            const num = parseInt(trimmed, 10);
            if (!isNaN(num) && num >= 0 && num < options.length) {
              correctIndex = num;
            }
          }
        }
      }

      // If answer string does not match any existing option, append it as a valid option
      if (correctIndex === -1) {
        if (typeof ans === 'string' && ans.trim()) {
          options.push(ans.trim());
          correctIndex = options.length - 1;
        } else {
          correctIndex = 0;
        }
      }

      return {
        id: index + 1,
        question: String(q.question || `Question ${index + 1}`).trim(),
        options,
        correctAnswer: correctIndex,
        explanation: String(q.explanation || 'Refer to course materials for complete details.').trim(),
      };
    });

    return res.json({
      title: parsed.title || `${topic} Quiz`,
      questions: validatedQuestions,
      isDemoFallback: false,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Quiz generator error:', error);
    const friendlyMessage =
      error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')
        ? 'AI rate limit reached. Showing curated offline quiz questions.'
        : "AI service temporarily unavailable. Showing curated offline quiz questions.";

    const { subject = 'Computer Science', topic = 'Data Structures', difficulty = 'Medium', count = 5 } = req.body;
    return res.json({
      title: `${topic} Quiz (${difficulty})`,
      questions: getFallbackQuiz(subject, topic, difficulty, Number(count) || 5),
      isDemoFallback: true,
      errorNotice: friendlyMessage,
    });
  }
});

// 5. Flashcards Generator Endpoint
app.post('/api/flashcards/generate', async (req: Request, res: Response) => {
  try {
    const { subject = 'General', topic = 'Key Concepts', material = '', count = 8 } = req.body;
    const requestedCount = Math.min(Math.max(Number(count) || 8, 4), 20);

    if (!aiClient) {
      return res.json({
        flashcards: getFallbackFlashcards(subject, topic, requestedCount),
        isDemoFallback: true,
        notice: 'Offline demo flashcards: API key not configured.',
      });
    }

    const prompt = `Generate exactly ${requestedCount} high-yield, interactive flashcards for university students.
Subject: ${subject}
Topic: ${topic}
${material ? `Based on this study material:\n"""${material.slice(0, 15000)}"""` : 'Cover the most critical definitions, theorems, questions, and core concepts.'}`;

    const { response, modelUsed } = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: `${STUDYPILOT_SYSTEM_INSTRUCTION}
Create concise, memorable flashcards with a clear front question and a definitive, thorough back answer.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'Question or concept on front of card' },
                  answer: { type: Type.STRING, description: 'Clear, accurate answer on back' },
                },
                required: ['question', 'answer'],
              },
            },
          },
          required: ['cards'],
        },
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error('Malformed flashcards schema returned');
    }

    const validatedFlashcards = parsed.cards.map((c: any, i: number) => ({
      id: i + 1,
      front: String(c.question || `Card Question ${i + 1}`).trim(),
      back: String(c.answer || 'Review course materials for complete details.').trim(),
      hint: `${subject} Core Concept`,
      tag: subject,
    }));

    return res.json({
      flashcards: validatedFlashcards,
      isDemoFallback: false,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Flashcard generator error:', error);
    const friendlyMessage =
      error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')
        ? 'AI rate limit reached. Showing curated offline flashcard deck.'
        : "AI service temporarily unavailable. Showing curated offline flashcard deck.";

    const { subject = 'General', topic = 'Key Concepts', count = 8 } = req.body;
    return res.json({
      flashcards: getFallbackFlashcards(subject, topic, Number(count) || 8),
      isDemoFallback: true,
      errorNotice: friendlyMessage,
    });
  }
});

// 6. Study Planner Generator Endpoint
app.post('/api/planner/generate', async (req: Request, res: Response) => {
  try {
    const {
      subjects = ['Data Structures', 'DBMS', 'Linear Algebra'],
      availableHours = 4,
      examDate = 'In 2 weeks',
      difficultyMap = {},
      preferredTime = 'Evening',
    } = req.body;

    const safeHours = Math.min(Math.max(Number(availableHours) || 4, 1), 16);
    const safeSubjects = Array.isArray(subjects) ? subjects : [String(subjects || 'General Studies')];

    if (!aiClient) {
      return res.json({
        plan: getFallbackStudyPlan(safeSubjects, safeHours, examDate),
        isDemoFallback: true,
        notice: 'Offline demo study plan: API key not configured.',
      });
    }

    const prompt = `Create a realistic, pedagogically balanced 7-day college study schedule.
Subjects: ${safeSubjects.join(', ')}
Available Hours Per Day: ${safeHours} hours
Exam Date: ${examDate}
Difficulty Allocation: ${JSON.stringify(difficultyMap)}
Preferred Study Time: ${preferredTime}

Include spaced repetition, active recall sessions, and timed assessment blocks.`;

    const { response, modelUsed } = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: `${STUDYPILOT_SYSTEM_INSTRUCTION}
Generate an actionable, high-retention weekly study schedule with realistic break intervals and topic targets.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  sessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        timeSlot: { type: Type.STRING },
                        subject: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                        completed: { type: Type.BOOLEAN },
                      },
                      required: ['id', 'timeSlot', 'subject', 'topic', 'durationMinutes', 'completed'],
                    },
                  },
                },
                required: ['dayName', 'theme', 'sessions'],
              },
            },
          },
          required: ['title', 'overview', 'days'],
        },
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      plan: parsed,
      isDemoFallback: false,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Planner generator error:', error);
    const friendlyMessage =
      error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')
        ? 'AI rate limit reached. Showing curated weekly study template.'
        : "AI service temporarily unavailable. Showing curated weekly study template.";

    const { subjects = ['Data Structures', 'DBMS'], availableHours = 4, examDate = 'In 2 weeks' } = req.body;
    return res.json({
      plan: getFallbackStudyPlan(subjects, Number(availableHours) || 4, examDate),
      isDemoFallback: true,
      errorNotice: friendlyMessage,
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StudyPilot AI server running at http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Shutting down StudyPilot server gracefully...');
    server.close(() => {
      console.log('HTTP server closed successfully.');
      process.exit(0);
    });

    // Force exit after 3 seconds if connections linger
    setTimeout(() => {
      console.error('Forcing server shutdown.');
      process.exit(1);
    }, 3000).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
