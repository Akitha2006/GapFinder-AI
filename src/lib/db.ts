import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  Subject,
  DocumentItem,
  DocumentChunk,
  Topic,
  Quiz,
  QuizQuestion,
  TopicMastery,
  RevisionPlan,
  RevisionTask,
} from '@/types';

// Ensure data directory exists for local development store
const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_STORE_FILE = path.join(DATA_DIR, 'app-store.json');

interface LocalDatabaseState {
  subjects: Subject[];
  documents: DocumentItem[];
  chunks: DocumentChunk[];
  topics: Topic[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
  mastery: TopicMastery[];
  revisionPlans: RevisionPlan[];
  revisionTasks: RevisionTask[];
}

function getInitialState(): LocalDatabaseState {
  return {
    subjects: [],
    documents: [],
    chunks: [],
    topics: [],
    quizzes: [],
    quizQuestions: [],
    mastery: [],
    revisionPlans: [],
    revisionTasks: [],
  };
}

function readLocalStore(): LocalDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_STORE_FILE)) {
      const initial = getInitialState();
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return getInitialState();
  }
}

function writeLocalStore(state: LocalDatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local store:', err);
  }
}

// ---------------------------------------------------------------------------
// Unified Database Operations
// ---------------------------------------------------------------------------

export const db = {
  // ================= SUBJECTS =================
  async getSubjects(userId: string): Promise<Subject[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const state = readLocalStore();
    return state.subjects.filter(s => s.user_id === userId);
  },

  async getSubject(id: string, userId: string): Promise<Subject | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error) return null;
      return data;
    }
    const state = readLocalStore();
    return state.subjects.find(s => s.id === id && s.user_id === userId) || null;
  },

  async createSubject(data: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> {
    const newSubject: Subject = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from('subjects')
        .insert(newSubject)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    }

    const state = readLocalStore();
    state.subjects.unshift(newSubject);
    writeLocalStore(state);
    return newSubject;
  },

  async deleteSubject(id: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      return !error;
    }
    const state = readLocalStore();
    state.subjects = state.subjects.filter(s => !(s.id === id && s.user_id === userId));
    state.documents = state.documents.filter(d => d.subject_id !== id);
    state.chunks = state.chunks.filter(c => c.subject_id !== id);
    state.topics = state.topics.filter(t => t.subject_id !== id);
    state.quizzes = state.quizzes.filter(q => q.subject_id !== id);
    state.mastery = state.mastery.filter(m => m.subject_id !== id);
    state.revisionPlans = state.revisionPlans.filter(p => p.subject_id !== id);
    state.revisionTasks = state.revisionTasks.filter(t => t.subject_id !== id);
    writeLocalStore(state);
    return true;
  },

  // ================= DOCUMENTS =================
  async getDocuments(subjectId: string, userId: string): Promise<DocumentItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const state = readLocalStore();
    return state.documents.filter(d => d.subject_id === subjectId && d.user_id === userId);
  },

  async createDocument(data: Omit<DocumentItem, 'id' | 'created_at'>): Promise<DocumentItem> {
    const newDoc: DocumentItem = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from('documents')
        .insert(newDoc)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    }

    const state = readLocalStore();
    state.documents.unshift(newDoc);
    writeLocalStore(state);
    return newDoc;
  },

  async updateDocumentStatus(
    id: string,
    userId: string,
    status: DocumentItem['status'],
    details?: { error_message?: string; extracted_text?: string; page_count?: number }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('documents')
        .update({ status, ...details })
        .eq('id', id)
        .eq('user_id', userId);
      return;
    }
    const state = readLocalStore();
    const doc = state.documents.find(d => d.id === id && d.user_id === userId);
    if (doc) {
      doc.status = status;
      if (details?.error_message !== undefined) doc.error_message = details.error_message;
      if (details?.extracted_text !== undefined) doc.extracted_text = details.extracted_text;
      if (details?.page_count !== undefined) doc.page_count = details.page_count;
      writeLocalStore(state);
    }
  },

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      return !error;
    }
    const state = readLocalStore();
    state.documents = state.documents.filter(d => !(d.id === id && d.user_id === userId));
    state.chunks = state.chunks.filter(c => c.document_id !== id);
    writeLocalStore(state);
    return true;
  },

  // ================= DOCUMENT CHUNKS =================
  async saveChunks(chunks: Array<Omit<DocumentChunk, 'id' | 'created_at'>>): Promise<void> {
    const mapped = chunks.map(c => ({
      ...c,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('document_chunks').insert(mapped);
      if (error) console.error('Error inserting chunks into Supabase:', error);
      return;
    }

    const state = readLocalStore();
    state.chunks.push(...mapped);
    writeLocalStore(state);
  },

  async getChunksBySubject(subjectId: string, userId: string): Promise<DocumentChunk[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    }
    const state = readLocalStore();
    return state.chunks.filter(c => c.subject_id === subjectId && c.user_id === userId);
  },

  // ================= TOPICS =================
  async getTopics(subjectId: string, userId: string): Promise<Topic[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const state = readLocalStore();
    return state.topics.filter(t => t.subject_id === subjectId && t.user_id === userId);
  },

  async saveTopics(topics: Array<Omit<Topic, 'id' | 'created_at'>>): Promise<Topic[]> {
    const mapped = topics.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('topics').insert(mapped).select();
      if (error) throw error;
      return data || [];
    }

    const state = readLocalStore();
    state.topics.push(...mapped);
    writeLocalStore(state);
    return mapped;
  },

  async updateTopic(id: string, userId: string, updates: Partial<Topic>): Promise<Topic | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) return null;
      return data;
    }
    const state = readLocalStore();
    const topic = state.topics.find(t => t.id === id && t.user_id === userId);
    if (!topic) return null;
    Object.assign(topic, updates);
    writeLocalStore(state);
    return topic;
  },

  async deleteTopic(id: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('topics').delete().eq('id', id).eq('user_id', userId);
      return !error;
    }
    const state = readLocalStore();
    state.topics = state.topics.filter(t => !(t.id === id && t.user_id === userId));
    writeLocalStore(state);
    return true;
  },

  // ================= QUIZZES & QUESTIONS =================
  async createQuiz(
    quizData: Omit<Quiz, 'id' | 'created_at' | 'score' | 'percentage' | 'status'>,
    questions: Array<Omit<QuizQuestion, 'id' | 'quiz_id' | 'user_answer' | 'is_correct'>>
  ): Promise<Quiz> {
    const quizId = crypto.randomUUID();
    const newQuiz: Quiz = {
      ...quizData,
      id: quizId,
      score: 0,
      percentage: 0,
      status: 'in_progress',
      created_at: new Date().toISOString(),
    };

    const newQuestions: QuizQuestion[] = questions.map(q => ({
      ...q,
      id: crypto.randomUUID(),
      quiz_id: quizId,
      user_answer: undefined,
      is_correct: undefined,
    }));

    if (isSupabaseConfigured && supabase) {
      const { data: createdQuiz, error: qErr } = await supabase
        .from('quizzes')
        .insert(newQuiz)
        .select()
        .single();
      if (qErr) throw qErr;

      const { error: qsErr } = await supabase.from('quiz_questions').insert(newQuestions);
      if (qsErr) console.error('Error inserting quiz questions:', qsErr);

      return { ...createdQuiz, questions: newQuestions };
    }

    const state = readLocalStore();
    state.quizzes.unshift(newQuiz);
    state.quizQuestions.push(...newQuestions);
    writeLocalStore(state);

    return { ...newQuiz, questions: newQuestions };
  },

  async getQuiz(id: string, userId: string): Promise<Quiz | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error || !quiz) return null;

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id);

      return { ...quiz, questions: questions || [] };
    }

    const state = readLocalStore();
    const quiz = state.quizzes.find(q => q.id === id && q.user_id === userId);
    if (!quiz) return null;
    const questions = state.quizQuestions.filter(q => q.quiz_id === id);
    return { ...quiz, questions };
  },

  async getQuizzes(subjectId: string, userId: string): Promise<Quiz[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const state = readLocalStore();
    return state.quizzes
      .filter(q => q.subject_id === subjectId && q.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async submitQuizAnswers(
    quizId: string,
    userId: string,
    submissions: Array<{ question_id: string; user_answer: string }>
  ): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> {
    const state = readLocalStore();
    const quiz = state.quizzes.find(q => q.id === quizId && q.user_id === userId);
    if (!quiz) throw new Error("Quiz not found");

    const questions = state.quizQuestions.filter(q => q.quiz_id === quizId);
    let correctCount = 0;

    for (const q of questions) {
      const sub = submissions.find(s => s.question_id === q.id);
      if (sub) {
        q.user_answer = sub.user_answer;
        q.is_correct = sub.user_answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
        if (q.is_correct) correctCount++;
      }
    }

    quiz.score = correctCount;
    quiz.percentage = questions.length > 0 ? Number(((correctCount / questions.length) * 100).toFixed(1)) : 0;
    quiz.status = 'completed';
    quiz.completed_at = new Date().toISOString();

    writeLocalStore(state);
    return { quiz, questions };
  },

  // ================= TOPIC MASTERY =================
  async getTopicMastery(subjectId: string, userId: string): Promise<TopicMastery[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('topic_mastery')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    }
    const state = readLocalStore();
    return state.mastery.filter(m => m.subject_id === subjectId && m.user_id === userId);
  },

  async saveTopicMasteryBatch(masteryList: TopicMastery[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      for (const m of masteryList) {
        await supabase
          .from('topic_mastery')
          .upsert(m, { onConflict: 'user_id,subject_id,topic_id' });
      }
      return;
    }

    const state = readLocalStore();
    for (const updated of masteryList) {
      const existingIdx = state.mastery.findIndex(
        m => m.user_id === updated.user_id && m.subject_id === updated.subject_id && m.topic_id === updated.topic_id
      );
      if (existingIdx >= 0) {
        state.mastery[existingIdx] = updated;
      } else {
        state.mastery.push(updated);
      }
    }
    writeLocalStore(state);
  },

  // ================= REVISION PLANS =================
  async getRevisionPlan(subjectId: string, userId: string): Promise<{ plan: RevisionPlan | null; tasks: RevisionTask[] }> {
    const state = readLocalStore();
    const plan = state.revisionPlans.find(p => p.subject_id === subjectId && p.user_id === userId) || null;
    const tasks = plan ? state.revisionTasks.filter(t => t.revision_plan_id === plan.id) : [];
    return { plan, tasks };
  },

  async saveRevisionPlanWithTasks(
    planData: Omit<RevisionPlan, 'id' | 'generated_at' | 'updated_at'>,
    tasksData: Array<Omit<RevisionTask, 'id' | 'revision_plan_id' | 'created_at'>>
  ): Promise<{ plan: RevisionPlan; tasks: RevisionTask[] }> {
    const state = readLocalStore();
    // Remove existing plan for this subject if any
    const existingPlan = state.revisionPlans.find(p => p.subject_id === planData.subject_id && p.user_id === planData.user_id);
    const planId = existingPlan ? existingPlan.id : crypto.randomUUID();

    const plan: RevisionPlan = {
      ...planData,
      id: planId,
      generated_at: existingPlan ? existingPlan.generated_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove old tasks
    state.revisionTasks = state.revisionTasks.filter(t => t.revision_plan_id !== planId);

    const tasks: RevisionTask[] = tasksData.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      revision_plan_id: planId,
      created_at: new Date().toISOString(),
    }));

    if (existingPlan) {
      const pIdx = state.revisionPlans.findIndex(p => p.id === planId);
      state.revisionPlans[pIdx] = plan;
    } else {
      state.revisionPlans.push(plan);
    }
    state.revisionTasks.push(...tasks);

    writeLocalStore(state);
    return { plan, tasks };
  },

  async updateRevisionTaskStatus(taskId: string, userId: string, status: RevisionTask['status']): Promise<RevisionTask | null> {
    const state = readLocalStore();
    const task = state.revisionTasks.find(t => t.id === taskId && t.user_id === userId);
    if (!task) return null;

    task.status = status;
    task.completed_at = status === 'completed' ? new Date().toISOString() : undefined;
    writeLocalStore(state);
    return task;
  },
};
