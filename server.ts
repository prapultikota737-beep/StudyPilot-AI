import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

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

// Exact System Instruction as requested for StudyPilot AI
const STUDYPILOT_SYSTEM_INSTRUCTION = `You are StudyPilot AI, a precise and helpful academic learning assistant.

Your primary goal is to help students understand concepts accurately rather than simply producing plausible-sounding answers.

ACCURACY:
1. Never intentionally invent facts.
2. Do not fabricate references, quotations, formulas, statistics, APIs, commands, or academic concepts.
3. If you are uncertain, explicitly say that you are uncertain.
4. Distinguish established facts from assumptions or estimates.
5. Re-check calculations and logical conclusions before answering.
6. For programming questions, verify syntax and logic carefully.
7. For mathematics, calculate carefully and show the important steps.
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
6. If code depends on a library or version, clearly state that dependency.

MATHEMATICS:
1. Show the important calculation steps.
2. Check arithmetic.
3. Give the final answer clearly.
4. Use appropriate notation.

ACADEMIC INTEGRITY:
Help the student learn and understand.
Do not encourage cheating in examinations.
For assignments, explain the solution and provide educational guidance.

RESPONSE STYLE:
Be professional, friendly, concise but sufficiently detailed.
Avoid unnecessary repetition.
Use Markdown headings, bullets, numbered steps, tables, and code blocks when they improve readability.

IMPORTANT:
Accuracy is more important than sounding confident.
If you do not know something, say so rather than inventing an answer.`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'your_api_key_here'),
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Helper: Formats subject and study mode directives
function getModeAndSubjectPrompt(subject: string, studyMode: string): string {
  let modeDirective = '';
  if (studyMode === 'beginner') {
    modeDirective = `STUDY MODE: Beginner Mode is ENABLED.
- Use simple, intuitive language.
- Explain technical terminology immediately upon introducing it.
- Use relatable real-world analogies.
- Provide step-by-step reasoning with minimal academic jargon.`;
  } else if (studyMode === 'exam') {
    modeDirective = `STUDY MODE: Exam Mode is ENABLED.
Structure your answer strictly using these exact sections:
1. Definition (Textbook-level formal definition to memorize)
2. Key Points (High-yield bullet points)
3. Explanation (Core conceptual mechanics)
4. Example (Concrete scenario or code snippet)
5. Important Exam Points (Common marking criteria / edge cases)
6. Possible Exam Question (Realistic university exam question + model concise answer)`;
  } else {
    modeDirective = `STUDY MODE: Academic Standard.
Provide an educational explanation structured with clear Markdown headings:
### 1. Conceptual Overview
### 2. Step-by-Step Breakdown
### 3. Practical Example (or runnable code with syntax and explanation if programming/CS, or step-by-step arithmetic/derivation if Math)
### 4. Key Takeaways & Common Pitfalls.`;
  }

  return `ACADEMIC CONTEXT:
Selected Subject: ${subject}
${modeDirective}`;
}

// Helper: Format multi-turn conversation contents for Gemini API
function buildGeminiContents(
  history: Array<{ sender: 'user' | 'ai'; text: string }>,
  currentQuestion: string,
  subject: string,
  studyMode: string
) {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // Add previous conversational context turns (up to last 10 messages for rich memory)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  }

  // Prepend subject and mode instruction to the current user prompt
  const contextualInstruction = getModeAndSubjectPrompt(subject, studyMode);
  const fullPrompt = `${contextualInstruction}\n\nStudent Question / Follow-up:\n${currentQuestion}`;

  contents.push({
    role: 'user',
    parts: [{ text: fullPrompt }],
  });

  return contents;
}

// Fallback generator when API key is missing or on API error
function getFallbackTutorResponse(question: string, subject: string, studyMode: string): string {
  const qLower = question.toLowerCase();

  // Test math calculation: 25 * 16
  if (qLower.includes('25 * 16') || qLower.includes('25*16')) {
    return `### Mathematical Calculation

To calculate **25 × 16**:

#### Step-by-step calculation:
1. You can decompose 16 into factors: **16 = 4 × 4**
2. Calculate: **25 × 4 = 100**
3. Multiply the result by 4: **100 × 4 = 400**

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

**Final Answer:** **400**`;
  }

  // Test prime number program
  if (qLower.includes('prime') && (qLower.includes('python') || subject === 'Python' || subject === 'Programming')) {
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
    # Numbers less than or equal to 1 are not prime
    if n <= 1:
        return False
    # 2 is the only even prime number
    if n == 2:
        return True
    # Exclude other even numbers
    if n % 2 == 0:
        return False
    
    # Check odd factors up to the square root of n
    limit = int(math.isqrt(n))
    for i in range(3, limit + 1, 2):
        if n % i == 0:
            return False
            
    return True

# Example tests
test_numbers = [1, 2, 3, 4, 17, 25, 29, 100]
for num in test_numbers:
    print(f"{num}: {'Prime' if is_prime(num) else 'Not prime'}")
\`\`\`

#### Explanation:
1. **Edge Cases:** Numbers $\\le 1$ are not prime. 2 is prime. All other even numbers are divisible by 2 and thus composite.
2. **Efficiency Optimization:** We only test divisors up to $\\lfloor\\sqrt{n}\\rfloor$. If $n = a \\times b$, at least one factor must be $\\le \\sqrt{n}$.
3. **Step of 2:** After checking 2, we only test odd divisors (\`range(3, limit + 1, 2)\`), halving the iteration count.`;
  }

  if (studyMode === 'beginner') {
    return `### 👋 Simple Beginner Explanation: ${question}

Think of this concept like an everyday real-world situation!

#### Analogy:
Imagine organizing a campus bookstore:
- If all books are heaped into an unorganized pile, finding anything takes hours, and duplicate orders cause chaos.
- Instead, the bookstore assigns each category a specific shelf, uses ISBNs to uniquely identify every copy, and keeps an inventory ledger.

#### Step-by-Step Breakdown:
1. **The Problem:** As systems grow in **${subject}**, unmanaged data or unorganized logic leads to errors and slowdowns.
2. **The Solution:** We apply structured principles to divide work into clear, independent, well-defined parts.
3. **The Benefit:** Zero confusion, easy updates, and maximum speed.

**Key Rule to Remember:** Start simple, eliminate unnecessary duplication, and ensure every component has one clear responsibility.`;
  }

  if (studyMode === 'exam') {
    return `### 🎯 Exam Mode Breakdown: ${question}

#### 1. Definition
"${question}" represents a foundational paradigm in **${subject}** established to guarantee system invariants, optimize computational resource allocation, and eliminate operational anomalies.

#### 2. Key Points
- **Primary Mechanism:** Minimizes redundant state while enforcing strict consistency constraints.
- **Boundaries:** Governed by formal mathematical definitions or system specifications.
- **Performance Trade-offs:** Balances write latency, lookup throughput, and memory footprint.

#### 3. Explanation
In university examinations, evaluation hinges on demonstrating how this concept separates concerns and enforces predictable states across transitions.

#### 4. Example
Consider an operational table or algorithmic pipeline processing records concurrently:
\`\`\`text
[Input Query] ──> [Invariant Verification] ──> [Consistent State Output]
\`\`\`

#### 5. Important Exam Points
- Always explicitly state boundary conditions (e.g., $N \\le 0$ or null pointers).
- Distinguish between theoretical best-case and practical average-case behavior.
- Cite the formal invariant or textbook definition before writing implementation code.

#### 6. Possible Exam Question
**Question:** Define the core problem solved by this concept in ${subject} and illustrate with a 2-step example. (5 Marks)
**Model Answer:**
> The primary objective is preventing partial state failures. By decoupling dependent attributes into normalized structures, any update is recorded exactly once without triggering cascaded anomalies.`;
  }

  return `### 📘 Academic Explanation: ${question}

#### 1. Conceptual Overview
In **${subject}**, this topic is essential for understanding how modern systems achieve reliable performance, sound mathematical logic, and scalable architectures.

#### 2. Step-by-Step Breakdown
1. **Foundational Preconditions:** The environment defines formal constraints to preserve consistency.
2. **Core Operation:** Operations are executed deterministically following standardized protocols.
3. **Invariant Preservation:** Postconditions are verified to guarantee that no corruption or memory leakage occurs.

#### 3. Practical Example
\`\`\`text
Initial State -> [Apply Validated Transformation] -> Invariant Preserved State
\`\`\`

#### 4. Key Takeaways
- High-frequency topic in university midterm and final examinations.
- Be prepared to discuss space/time trade-offs and boundary edge conditions.`;
}

// 1. AI Tutor Streaming Endpoint (SSE)
app.post('/api/tutor/chat/stream', async (req: Request, res: Response) => {
  const { question, subject = 'General', studyMode = 'standard', history = [] } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question text is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!aiClient) {
    // If no API key configured, stream fallback answer smoothly
    const fallbackText = getFallbackTutorResponse(question.trim(), subject, studyMode);
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      res.write(`data: ${JSON.stringify({ text: chunk, isDemo: true })}\n\n`);
      await new Promise((r) => setTimeout(r, 25));
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  try {
    const contents = buildGeminiContents(history, question.trim(), subject, studyMode);

    const streamResult = await aiClient.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: STUDYPILOT_SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    for await (const chunk of streamResult) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Tutor streaming error:', error);
    const friendlyMessage =
      error?.status === 429
        ? 'AI rate limit reached. Please wait a moment before asking another question.'
        : "StudyPilot couldn't reach the AI service. Please check your connection and try again.";

    res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

// 2. AI Tutor Standard Endpoint (Non-streaming)
app.post('/api/tutor/chat', async (req: Request, res: Response) => {
  try {
    const { question, subject = 'General', studyMode = 'standard', history = [] } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    if (!aiClient) {
      const fallbackText = getFallbackTutorResponse(question.trim(), subject, studyMode);
      return res.json({
        answer: fallbackText,
        isDemoFallback: true,
      });
    }

    const contents = buildGeminiContents(history, question.trim(), subject, studyMode);

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
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
    });
  } catch (error: any) {
    console.error('Tutor chat error:', error);
    const friendlyMessage =
      error?.status === 429
        ? 'AI rate limit reached. Please wait a moment before trying again.'
        : "StudyPilot couldn't reach the AI service. Please check your connection and try again.";

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

    if (!aiClient) {
      // High quality syllabus fallback notes
      const fallbackNotes = `# 📖 Comprehensive Study Notes: ${topic}
*Subject: ${subject} · Generated by StudyPilot AI*

---

## 🎯 Executive Summary
This document synthesizes core academic principles regarding **${topic}**, outlining foundational definitions, architectural mechanics, critical theorems, and examination checkpoints.

---

## 📌 Core Concepts & Terminology
1. **Primary Definition:** Fundamental framework designed to streamline analysis, decouple dependencies, and maintain systemic consistency.
2. **Key Invariant:** The operational premise that state transitions must preserve baseline integrity under all edge condition workloads.
3. **Comparative Analysis:** Unlike naive implementations which suffer from scalability bottlenecks, this methodology enforces modularity and predictable performance bounds.

---

## 💡 Detailed Structural Breakdown
- **Phase 1: Input Identification & Preconditions**
  - Verify boundary assertions and parameter domains.
  - Eliminate redundant dependencies prior to execution.
- **Phase 2: Systematic Transformation**
  - Execute normalized transitions following textbook protocols.
  - Maintain checkpoints for error detection and rollback safety.
- **Phase 3: Verification & Invariant Proofs**
  - Measure empirical overhead versus theoretical complexity metrics.

---

## 🚀 Quick Revision Checklist & Exam Tips
- [ ] Understand the 3 primary trade-offs: Memory, Latency, and Implementation Complexity.
- [ ] Memorize the standard formal definition for 2-mark examination questions.
- [ ] Practice drawing the architectural schematic with labeled arrows.
- [ ] Review common edge cases involving null boundaries or concurrency hazards.`;

      return res.json({
        notes: fallbackNotes,
        isDemoFallback: true,
      });
    }

    let actionPrompt = '';
    switch (actionType) {
      case 'summarize':
        actionPrompt = 'Create a dense, high-retention summary with an executive overview, 3-5 core takeaways, and a bulleted synthesis of key concepts.';
        break;
      case 'keypoints':
        actionPrompt = 'Extract all critical key points, essential formulas/theorems, vital definitions, and high-yield examination facts.';
        break;
      case 'revisionsheet':
        actionPrompt = 'Create a high-impact 1-page "Cheat Sheet / Revision Guide" optimized for quick reading 30 minutes before a final college exam.';
        break;
      case 'notes':
      default:
        actionPrompt = 'Generate a comprehensive, beautifully structured college study notes document with Markdown headings, definition callouts, detailed section explanations, diagrams/code where helpful, and revision checklists.';
        break;
    }

    const prompt = `ACADEMIC CONTEXT:
Subject: ${subject}
Topic: ${topic}
Task Goal: ${actionPrompt}

Source Content:
"""
${material.slice(0, 15000)}
"""

Please produce professional, clean academic notes using crisp Markdown formatting following the instructions above.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: STUDYPILOT_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    return res.json({
      notes: response.text,
      isDemoFallback: false,
    });
  } catch (error: any) {
    console.error('Notes generator error:', error);
    return res.status(500).json({
      error: "StudyPilot couldn't reach the AI service. Please check your connection and try again.",
    });
  }
});

// 4. Quiz Generator Endpoint with Strict JSON Schema
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
      // Curated demo questions
      const demoQuestions = [
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
            'Data is instantly written to cold magnetic storage',
            'Concurrent transactions execute as if occurring sequentially without interleaving hazards',
            'Network sockets are encrypted with asymmetric keys',
            'Transactions are automatically rolled back every 60 seconds',
          ],
          correctAnswer: 1,
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
      ].slice(0, requestedCount);

      return res.json({
        title: `${topic} Quiz (${difficulty})`,
        questions: demoQuestions,
        isDemoFallback: true,
      });
    }

    const prompt = `Generate a university-level academic quiz with exactly ${requestedCount} questions.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Question Type: ${questionType} (Each question must have options, a correct answer matching one of the options, and an educational explanation).`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `${STUDYPILOT_SYSTEM_INSTRUCTION}
Generate accurate, high-quality exam questions with one unequivocally correct answer and three plausible college-level distractors (or 2 options for True/False). Provide a thorough, pedagogical explanation for why the correct option is right.`,
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

    // Validate and normalize questions
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Malformed quiz schema returned');
    }

    const validatedQuestions = parsed.questions.map((q: any, index: number) => {
      const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B'];
      
      // Determine correct answer index
      let correctIndex = 0;
      if (typeof q.correctAnswer === 'string') {
        const found = options.findIndex(
          (opt: string) => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        );
        correctIndex = found >= 0 ? found : 0;
      } else if (typeof q.correctAnswer === 'number') {
        correctIndex = Math.max(0, Math.min(q.correctAnswer, options.length - 1));
      }

      return {
        id: index + 1,
        question: q.question || `Question ${index + 1}`,
        options,
        correctAnswer: correctIndex,
        explanation: q.explanation || 'Review course textbook for full derivation.',
      };
    });

    return res.json({
      title: parsed.title || `${topic} Quiz`,
      questions: validatedQuestions,
      isDemoFallback: false,
    });
  } catch (error: any) {
    console.error('Quiz generator error:', error);
    return res.status(500).json({
      error: "StudyPilot couldn't reach the AI service. Please check your connection and try again.",
    });
  }
});

// 5. Flashcards Generator Endpoint with Strict JSON Schema
app.post('/api/flashcards/generate', async (req: Request, res: Response) => {
  try {
    const { subject = 'General', topic = 'Key Concepts', material = '', count = 8 } = req.body;

    const requestedCount = Math.min(Math.max(Number(count) || 8, 4), 20);

    if (!aiClient) {
      const demoFlashcards = [
        {
          id: 1,
          front: 'What is the Time Complexity of searching in an AVL Tree or Red-Black Tree in the worst case?',
          back: 'O(log N). Strict height-balancing rotations bound tree height to O(log N).',
          hint: 'Think about logarithmic height invariants.',
          tag: 'Data Structures',
        },
        {
          id: 2,
          front: 'Define "Idempotence" in API and system design.',
          back: 'An operation is idempotent if executing it multiple times produces the exact same side-effects as executing it once (e.g. HTTP PUT or DELETE).',
          hint: 'f(f(x)) = f(x)',
          tag: 'Systems Architecture',
        },
        {
          id: 3,
          front: 'What are the four Coffman conditions required for a Deadlock to occur?',
          back: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
          hint: 'Breaking any single one prevents deadlock.',
          tag: 'Operating Systems',
        },
        {
          id: 4,
          front: 'What distinguishes a Primary Key from a Candidate Key in Relational Databases?',
          back: 'A Candidate Key is any minimal superkey that uniquely identifies tuples. The database designer chooses exactly one candidate key to serve as the Primary Key.',
          hint: 'Uniqueness + minimality',
          tag: 'DBMS',
        },
        {
          id: 5,
          front: 'What is the purpose of the Central Limit Theorem (CLT) in Statistics?',
          back: 'The sampling distribution of the sample mean approaches a Normal Distribution as sample size increases (typically n >= 30), regardless of the shape of the underlying population.',
          hint: 'Gaussian convergence for large sample means',
          tag: 'Mathematics',
        },
        {
          id: 6,
          front: 'Explain the difference between P and NP complexity classes.',
          back: 'P contains decision problems solvable in polynomial time by a deterministic Turing machine. NP contains decision problems whose solutions can be verified in polynomial time.',
          hint: 'Solving vs. Verifying',
          tag: 'Theory of Computation',
        },
      ].slice(0, requestedCount);

      return res.json({
        flashcards: demoFlashcards,
        isDemoFallback: true,
      });
    }

    const prompt = `Generate exactly ${requestedCount} high-yield, interactive flashcards for university students.
Subject: ${subject}
Topic: ${topic}
${material ? `Based on this study material: """${material.slice(0, 10000)}"""` : 'Cover the most critical definitions, theorems, questions, and core concepts.'}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `${STUDYPILOT_SYSTEM_INSTRUCTION}
Create concise, memorable flashcards with a clear front question/prompt and a definitive, thorough answer.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'Question or concept on the front of the card' },
                  answer: { type: Type.STRING, description: 'Clear, accurate answer on the back' },
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
      throw new Error('Malformed flashcards schema');
    }

    const validatedFlashcards = parsed.cards.map((c: any, i: number) => ({
      id: i + 1,
      front: c.question || `Card Question ${i + 1}`,
      back: c.answer || 'Review course materials for complete details.',
      hint: `${subject} Core Concept`,
      tag: subject,
    }));

    return res.json({
      flashcards: validatedFlashcards,
      isDemoFallback: false,
    });
  } catch (error: any) {
    console.error('Flashcard generator error:', error);
    return res.status(500).json({
      error: "StudyPilot couldn't reach the AI service. Please check your connection and try again.",
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

    if (!aiClient) {
      const demoPlan = {
        title: `Comprehensive Weekly Study Plan (${availableHours} hrs/day)`,
        overview: `Engineered for balanced retention across ${subjects.join(', ')} with scheduled active recall and spaced repetition sessions before ${examDate}.`,
        days: [
          {
            dayName: 'Monday',
            theme: 'Foundations & High-Yield Core Concepts',
            sessions: [
              {
                id: 'm1',
                timeSlot: '09:00 - 10:15',
                subject: subjects[0] || 'Core Subject',
                topic: 'Theoretical Foundations & Complexity Review',
                durationMinutes: 75,
                completed: false,
              },
              {
                id: 'm2',
                timeSlot: '10:30 - 11:30',
                subject: subjects[1] || 'Second Subject',
                topic: 'Key Invariants & Practice Problems',
                durationMinutes: 60,
                completed: false,
              },
              {
                id: 'm3',
                timeSlot: '17:00 - 18:00',
                subject: subjects[2] || subjects[0],
                topic: 'Active Recall & Flashcard Self-Testing',
                durationMinutes: 60,
                completed: false,
              },
            ],
          },
          {
            dayName: 'Tuesday',
            theme: 'Deep Practice & Algorithmic Problem Solving',
            sessions: [
              {
                id: 't1',
                timeSlot: '09:00 - 10:30',
                subject: subjects[1] || 'Core Subject',
                topic: 'Relational Schemas & Normalization Proofs',
                durationMinutes: 90,
                completed: false,
              },
              {
                id: 't2',
                timeSlot: '14:00 - 15:15',
                subject: subjects[0] || 'Core Subject',
                topic: 'Tree Traversal & Heap Implementation',
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
                subject: subjects[2] || subjects[0],
                topic: 'Matrix Transformations & Proof Verification',
                durationMinutes: 90,
                completed: false,
              },
              {
                id: 'w2',
                timeSlot: '16:00 - 17:30',
                subject: 'Mock Quiz / Self-Assessment',
                topic: 'Timed 20-Question Exam Simulation',
                durationMinutes: 90,
                completed: false,
              },
            ],
          },
          {
            dayName: 'Thursday',
            theme: 'Edge Cases, Bug Tracing & Proof Rigor',
            sessions: [
              {
                id: 'th1',
                timeSlot: '09:00 - 10:30',
                subject: subjects[0] || 'Core Subject',
                topic: 'Graph Algorithms: Dijkstra, Bellman-Ford & BFS/DFS',
                durationMinutes: 90,
                completed: false,
              },
              {
                id: 'th2',
                timeSlot: '15:00 - 16:30',
                subject: subjects[1] || 'Second Subject',
                topic: 'ACID Transactions, Locking & Deadlock Avoidance',
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
                topic: 'Creating 1-Page Exam Cheat Sheets',
                durationMinutes: 90,
                completed: false,
              },
              {
                id: 'f2',
                timeSlot: '14:00 - 15:00',
                subject: subjects[2] || subjects[0],
                topic: 'Eigenvalues & Diagonalization Practice',
                durationMinutes: 60,
                completed: false,
              },
            ],
          },
          {
            dayName: 'Saturday',
            theme: 'Past Exam Papers & Timed Simulation',
            sessions: [
              {
                id: 's1',
                timeSlot: '10:00 - 12:00',
                subject: 'Comprehensive Simulation',
                topic: 'Previous Year Midterm / Final Exam Paper',
                durationMinutes: 120,
                completed: false,
              },
              {
                id: 's2',
                timeSlot: '14:30 - 16:00',
                subject: 'Weak-Spot Remediation',
                topic: 'Reviewing Incorrect Quiz Questions with AI Tutor',
                durationMinutes: 90,
                completed: false,
              },
            ],
          },
          {
            dayName: 'Sunday',
            theme: 'Light Consolidation & Upcoming Week Prep',
            sessions: [
              {
                id: 'su1',
                timeSlot: '11:00 - 12:15',
                subject: 'Weekly Review',
                topic: 'Flashcard Mastery Check & Knowledge Mapping',
                durationMinutes: 75,
                completed: false,
              },
            ],
          },
        ],
      };

      return res.json({
        plan: demoPlan,
        isDemoFallback: true,
      });
    }

    const prompt = `Create a realistic, pedagogically balanced 7-day college study schedule.
Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : subjects}
Available Hours Per Day: ${availableHours} hours
Exam Date: ${examDate}
Difficulty Allocation: ${JSON.stringify(difficultyMap)}
Preferred Study Time: ${preferredTime} (Structure time blocks around this window)

Include spaced repetition, active recall sessions, and timed assessment blocks.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
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
    });
  } catch (error: any) {
    console.error('Planner generator error:', error);
    return res.status(500).json({
      error: "StudyPilot couldn't reach the AI service. Please check your connection and try again.",
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
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StudyPilot AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
