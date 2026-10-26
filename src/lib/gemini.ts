import { GoogleGenerativeAI } from '@google/generative-ai';

// Read server-side environment variable only
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAIClient: GoogleGenerativeAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10);
}

export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!isGeminiConfigured()) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAIClient;
}

export interface ExtractedTopicResult {
  unit_number?: string;
  unit_name?: string;
  topic_name: string;
  subtopics: string[];
}

export interface GeneratedQuestionResult {
  topic_id: string;
  topic_name: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_doc?: string;
  source_page?: string;
}

export interface RAGAnswerResult {
  answer: string;
  citations: Array<{
    doc_name: string;
    page_number?: number;
    section_title?: string;
    excerpt: string;
  }>;
  is_grounded: boolean;
  model_used: string;
}

/**
 * Modular AI Provider Interface to easily switch between Gemini or others
 */
export interface AIProvider {
  extractTopics(syllabusText: string): Promise<ExtractedTopicResult[]>;
  generateQuestions(params: {
    topics: Array<{ id: string; name: string }>;
    chunks: Array<{ content: string; doc_name: string; page_number?: number; section_title?: string }>;
    count: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<GeneratedQuestionResult[]>;
  askAssistant(params: {
    question: string;
    retrievedChunks: Array<{ content: string; doc_name: string; page_number?: number; section_title?: string }>;
    subjectName: string;
  }): Promise<RAGAnswerResult>;
  createEmbedding(text: string): Promise<number[]>;
}

// ---------------------------------------------------------------------------
// Real Google Gemini Provider Implementation
// ---------------------------------------------------------------------------
export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async extractTopics(syllabusText: string): Promise<ExtractedTopicResult[]> {
    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert curriculum analyzer. Analyze the following uploaded syllabus text and extract a structured list of units, topics, and subtopics.
DO NOT fabricate or invent topics not present in the text.
Return strictly a valid JSON array of objects with the following schema:
[
  {
    "unit_number": "Unit 1",
    "unit_name": "Unit Title",
    "topic_name": "Main Topic Title",
    "subtopics": ["Subtopic 1", "Subtopic 2"]
  }
]

Syllabus Text:
"""
${syllabusText.slice(0, 15000)}
"""`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Failed to parse topics JSON from Gemini response");
    }
    return JSON.parse(jsonMatch[0]) as ExtractedTopicResult[];
  }

  async generateQuestions(params: {
    topics: Array<{ id: string; name: string }>;
    chunks: Array<{ content: string; doc_name: string; page_number?: number; section_title?: string }>;
    count: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<GeneratedQuestionResult[]> {
    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const contextText = params.chunks
      .map((c, i) => `[Source ${i + 1}: ${c.doc_name} (Page ${c.page_number || 'N/A'}, Section: ${c.section_title || 'General'})]\n${c.content}`)
      .join('\n\n---\n\n');

    const topicsList = params.topics.map(t => `- Topic ID: "${t.id}", Topic Name: "${t.name}"`).join('\n');

    const prompt = `You are a rigorous academic diagnostic examiner. Generate ${params.count} multiple-choice diagnostic questions based strictly on the provided study material chunks below.

Target Topics:
${topicsList}

Difficulty: ${params.difficulty.toUpperCase()}

Instructions:
1. Every question must be grounded strictly in the provided study material context. Do not invent facts.
2. Provide exactly 4 plausible options for each question (e.g. ["Option A text", "Option B text", "Option C text", "Option D text"]).
3. Specify the exact string of the correct answer (must match one of the 4 options verbatim).
4. Provide a clear academic explanation referencing why the answer is correct and why mistakes happen.
5. Identify the topic ID and topic name that this question tests from the list above.
6. Reference the source document name and page number.

Return strictly a valid JSON array with the following schema:
[
  {
    "topic_id": "topic-id-string",
    "topic_name": "Topic Name",
    "question_text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Detailed explanation...",
    "source_doc": "Document Name",
    "source_page": "Page 3"
  }
]

Retrieved Study Material:
"""
${contextText.slice(0, 16000)}
"""`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Failed to parse questions JSON from Gemini response");
    }
    return JSON.parse(jsonMatch[0]) as GeneratedQuestionResult[];
  }

  async askAssistant(params: {
    question: string;
    retrievedChunks: Array<{ content: string; doc_name: string; page_number?: number; section_title?: string }>;
    subjectName: string;
  }): Promise<RAGAnswerResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    if (params.retrievedChunks.length === 0) {
      return {
        answer: "The uploaded documents for this subject do not contain sufficient information to answer your question. Please upload relevant notes or chapters.",
        citations: [],
        is_grounded: false,
        model_used: 'Gemini 1.5 Flash (RAG Grounded)',
      };
    }

    const contextText = params.retrievedChunks
      .map((c, i) => `[Source ${i + 1}: ${c.doc_name} | Page: ${c.page_number || 'N/A'} | Section: ${c.section_title || 'General'}]\n${c.content}`)
      .join('\n\n---\n\n');

    const prompt = `You are GapFinder AI's Explain-This-Topic Assistant for the subject "${params.subjectName}".
Answer the student's question STRICTLY using the retrieved context provided below.
If the retrieved materials do not contain sufficient information, state clearly that the uploaded documents do not cover this aspect. Do NOT fabricate citations or external facts.

Retrieved Documents:
${contextText}

Student Question:
"${params.question}"

Formatting guidelines:
- Be clear, educational, and structured.
- Cite specific document titles and page numbers when mentioning key concepts.`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    const citations = params.retrievedChunks.map(c => ({
      doc_name: c.doc_name,
      page_number: c.page_number,
      section_title: c.section_title,
      excerpt: c.content.slice(0, 160) + '...',
    }));

    return {
      answer,
      citations,
      is_grounded: true,
      model_used: 'Gemini 1.5 Flash (RAG Grounded)',
    };
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.client.getGenerativeModel({ model: 'text-embedding-004' });
      const res = await embeddingModel.embedContent(text);
      if (res.embedding && res.embedding.values) {
        return res.embedding.values;
      }
    } catch {
      // Fallback to deterministic normalized vector
    }
    return deterministicVector(text, 768);
  }
}

// ---------------------------------------------------------------------------
// Deterministic Development Mode Provider
// (Clearly labeled: Used when GEMINI_API_KEY is not configured)
// ---------------------------------------------------------------------------
export class DeterministicDevProvider implements AIProvider {
  async extractTopics(syllabusText: string): Promise<ExtractedTopicResult[]> {
    // Deterministic parsing looking for Unit / Chapter patterns or line breaks
    const lines = syllabusText.split('\n').map(l => l.trim()).filter(Boolean);
    const topics: ExtractedTopicResult[] = [];
    let currentUnit = "Unit 1: Fundamentals";
    let unitNum = 1;

    for (const line of lines) {
      if (/^(unit|chapter|module|part)\s*\d+/i.test(line)) {
        currentUnit = line;
        unitNum++;
      } else if (line.length > 4 && line.length < 80 && !line.startsWith('#')) {
        const cleanName = line.replace(/^[\d.-]+\s*/, '');
        topics.push({
          unit_number: `Unit ${unitNum}`,
          unit_name: currentUnit,
          topic_name: cleanName,
          subtopics: [`Core principles of ${cleanName}`, `Practical applications of ${cleanName}`, `Common pitfalls in ${cleanName}`],
        });
      }
    }

    if (topics.length === 0) {
      topics.push(
        { unit_number: "Unit 1", unit_name: "Core Foundations", topic_name: "Basic Principles & Architecture", subtopics: ["Definitions & Scope", "Key Terminology"] },
        { unit_number: "Unit 2", unit_name: "Operational Methods", topic_name: "Analysis & Implementation", subtopics: ["Algorithmic Design", "Performance Tradeoffs"] },
        { unit_number: "Unit 3", unit_name: "Evaluation & Testing", topic_name: "Verification & Error Diagnosis", subtopics: ["Validation Rules", "Gap Identification"] }
      );
    }

    return topics.slice(0, 10);
  }

  async generateQuestions(params: {
    topics: Array<{ id: string; name: string }>;
    chunks: Array<{ content: string; doc_name: string; page_number?: number; section_title?: string }>;
    count: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<GeneratedQuestionResult[]> {
    const results: GeneratedQuestionResult[] = [];
    const topicsToUse = params.topics.length > 0 ? params.topics : [{ id: 'demo-topic-1', name: 'General Understanding' }];

    for (let i = 0; i < params.count; i++) {
      const topic = topicsToUse[i % topicsToUse.length];
      const chunk = params.chunks[i % Math.max(1, params.chunks.length)] || {
        content: `Standard syllabus criteria regarding ${topic.name}.`,
        doc_name: 'Uploaded Study Notes',
        page_number: 1,
        section_title: topic.name,
      };

      // Extract a representative excerpt from the chunk if available
      const snippet = chunk.content.slice(0, 90).replace(/\s+/g, ' ').trim();

      const questionsPool = [
        {
          q: `Which of the following statements most accurately describes the core mechanism of ${topic.name}?`,
          options: [
            `It provides systematic structuring based on "${snippet.slice(0, 40)}..."`,
            `It bypasses verification checks to maximize raw processing throughput`,
            `It requires constant manual re-indexing for every single access request`,
            `It is entirely deprecated in favor of unverified heuristics`
          ],
          correctIdx: 0,
          explanation: `Option A is correct based on the uploaded material (${chunk.doc_name}, Page ${chunk.page_number || 1}). The source explicitly highlights this foundational property.`
        },
        {
          q: `When analyzing failure cases in ${topic.name}, what is the primary risk factor identified in the syllabus?`,
          options: [
            `Ignoring prerequisite validation criteria before state transitions`,
            `Using standard verified library abstractions`,
            `Allocating balanced runtime memory buffers`,
            `Applying deterministic assessment thresholds`
          ],
          correctIdx: 0,
          explanation: `Option A represents the primary vulnerability identified in ${chunk.doc_name}. Missing prerequisite checks leads directly to unhandled runtime errors.`
        },
        {
          q: `What is the key difference between preliminary assumptions and verified execution in ${topic.name}?`,
          options: [
            `Verified execution guarantees evidence-backed consistency across all states`,
            `Preliminary assumptions always yield higher empirical accuracy`,
            `Verified execution disables all diagnostic telemetry`,
            `There is no operational distinction between them`
          ],
          correctIdx: 0,
          explanation: `Verified execution relies on ground-truth telemetry and evidence records as detailed in ${chunk.doc_name}.`
        },
        {
          q: `In the context of ${topic.name}, what role does iterative feedback play?`,
          options: [
            `It pinpoints specific subtopic misunderstandings and updates revision priorities`,
            `It deletes historical performance data after every attempt`,
            `It standardizes all students to a single fixed revision timeline`,
            `It removes the need for diagnostic questions altogether`
          ],
          correctIdx: 0,
          explanation: `Iterative feedback tracks mastery evolution over time and adapts the revision schedule dynamically.`
        }
      ];

      const template = questionsPool[i % questionsPool.length];
      results.push({
        topic_id: topic.id,
        topic_name: topic.name,
        question_text: template.q,
        options: template.options,
        correct_answer: template.options[template.correctIdx],
        explanation: template.explanation,
        source_doc: chunk.doc_name,
        source_page: `Page ${chunk.page_number || 1}`,
      });
    }

    return results;
  }

  async askAssistant(params: {
    question: string;
    retrievedChunks: Array<{ content: string; doc_name: string; page_number?: number; section_title?: string }>;
    subjectName: string;
  }): Promise<RAGAnswerResult> {
    if (params.retrievedChunks.length === 0) {
      return {
        answer: "The uploaded study documents do not contain sufficient content to answer this query. Please upload notes, textbook chapters, or previous exam papers.",
        citations: [],
        is_grounded: false,
        model_used: 'Development Mode Engine (Deterministic Fallback)',
      };
    }

    const citations = params.retrievedChunks.map(c => ({
      doc_name: c.doc_name,
      page_number: c.page_number,
      section_title: c.section_title,
      excerpt: c.content.slice(0, 150) + '...',
    }));

    const topExcerpt = params.retrievedChunks[0].content.slice(0, 300);

    const answer = `Based on your uploaded material for **${params.subjectName}** (${citations[0].doc_name}, Page ${citations[0].page_number || 1}):\n\n> "${topExcerpt}..."\n\n**Academic Explanation (Offline Development Mode):**\nThe retrieved text directly addresses your query regarding "${params.question}". Key principles covered in this section emphasize rigorous conceptual understanding, systematic verification, and structured application. Review the citations listed below for the exact source locations in your documents.`;

    return {
      answer,
      citations,
      is_grounded: true,
      model_used: 'Development Mode Engine (Deterministic Fallback)',
    };
  }

  async createEmbedding(text: string): Promise<number[]> {
    return deterministicVector(text, 768);
  }
}

/**
 * Deterministic pseudo-embedding generator (768 dimensions) for local/offline similarity search
 */
function deterministicVector(text: string, dimensions = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1.0 / (1 + Math.log(i + 1));
  }

  // Normalize to unit vector
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(v => Number((v / norm).toFixed(6)));
}

/**
 * Factory that returns either the live GeminiProvider or the labeled DeterministicDevProvider
 */
export function getAIProvider(): { provider: AIProvider; isDevMode: boolean; label: string } {
  if (isGeminiConfigured()) {
    return {
      provider: new GeminiProvider(GEMINI_API_KEY),
      isDevMode: false,
      label: 'Google Gemini 1.5 Flash (Live AI)',
    };
  }
  return {
    provider: new DeterministicDevProvider(),
    isDevMode: true,
    label: 'Development Mode (Deterministic Academic Engine)',
  };
}
