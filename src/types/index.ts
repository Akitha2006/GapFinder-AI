export type DocumentCategory = 'syllabus' | 'notes' | 'pyq';
export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';
export type MasteryClassification = 'strong' | 'medium' | 'weak' | 'needs_more_assessment';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  exam_date?: string;
  daily_study_minutes: number;
  syllabus_importance?: Record<string, 'high' | 'medium' | 'low'>;
  created_at: string;
  updated_at: string;
  documents_count?: number;
  topics_count?: number;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  file_type: 'pdf' | 'txt';
  category: DocumentCategory;
  status: DocumentStatus;
  error_message?: string;
  file_path?: string;
  file_size?: number;
  extracted_text?: string;
  page_count: number;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  subject_id: string;
  user_id: string;
  chunk_index: number;
  page_number: number;
  section_title?: string;
  content: string;
  similarity?: number;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  unit_number?: string;
  unit_name?: string;
  topic_name: string;
  subtopics: string[];
  source_doc_id?: string;
  source_page?: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  topic_id: string;
  topic_name?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_doc?: string;
  source_page?: string;
  user_answer?: string;
  is_correct?: boolean;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  difficulty: QuizDifficulty;
  question_format: 'mcq';
  total_questions: number;
  score: number;
  percentage: number;
  status: 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface MasteryHistoryEntry {
  date: string;
  score: number;
  total: number;
  accuracy: number;
}

export interface TopicMastery {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string;
  topic_name?: string;
  unit_name?: string;
  total_attempted: number;
  total_correct: number;
  accuracy_percentage: number;
  classification: MasteryClassification;
  reasons: string[];
  trend: 'improving' | 'declining' | 'stable';
  history: MasteryHistoryEntry[];
  last_evaluated_at: string;
}

export interface RevisionTask {
  id: string;
  revision_plan_id: string;
  user_id: string;
  subject_id: string;
  topic_id: string;
  topic_name?: string;
  day_number: number;
  scheduled_date: string;
  learning_objective: string;
  recommended_activity: string;
  estimated_minutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string;
  created_at: string;
}

export interface RevisionPlan {
  id: string;
  user_id: string;
  subject_id: string;
  generated_at: string;
  updated_at: string;
  tasks?: RevisionTask[];
}
