import { TopicMastery, Topic, RevisionTask, TaskPriority } from '@/types';

export interface PlanGenerationInput {
  userId: string;
  subjectId: string;
  examDate?: string;
  dailyStudyMinutes: number;
  syllabusImportance?: Record<string, 'high' | 'medium' | 'low'>;
  masteryList: TopicMastery[];
  topics: Topic[];
}

export function generatePersonalizedRevisionPlan(input: PlanGenerationInput): Array<Omit<RevisionTask, 'id' | 'revision_plan_id' | 'created_at'>> {
  const {
    userId,
    subjectId,
    examDate,
    dailyStudyMinutes,
    syllabusImportance = {},
    masteryList,
    topics,
  } = input;

  // Calculate available days until exam
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalDays = 7; // Default 7-day revision window if exam date not provided or passed
  if (examDate) {
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      totalDays = Math.min(diffDays, 30); // Cap at 30 days for actionable revision sprints
    }
  }

  // Task duration granularity: either 30 or 45 mins
  const taskDuration = dailyStudyMinutes >= 90 ? 45 : (dailyStudyMinutes >= 60 ? 30 : 25);
  const tasksPerDay = Math.max(1, Math.floor(dailyStudyMinutes / taskDuration));

  // Categorize topics by mastery classification
  const weakTopics: Topic[] = [];
  const mediumTopics: Topic[] = [];
  const strongTopics: Topic[] = [];
  const unassessedTopics: Topic[] = [];

  for (const topic of topics) {
    const mastery = masteryList.find(m => m.topic_id === topic.id);
    if (!mastery || mastery.classification === 'needs_more_assessment') {
      unassessedTopics.push(topic);
    } else if (mastery.classification === 'weak') {
      weakTopics.push(topic);
    } else if (mastery.classification === 'medium') {
      mediumTopics.push(topic);
    } else {
      strongTopics.push(topic);
    }
  }

  // Weight topics by syllabus importance
  const scoreTopic = (t: Topic, basePriority: number) => {
    const imp = syllabusImportance[t.id] || 'medium';
    const impMultiplier = imp === 'high' ? 1.5 : (imp === 'low' ? 0.8 : 1.0);
    return basePriority * impMultiplier;
  };

  // Sort Weak by importance
  weakTopics.sort((a, b) => scoreTopic(b, 3) - scoreTopic(a, 3));
  unassessedTopics.sort((a, b) => scoreTopic(b, 2.5) - scoreTopic(a, 2.5));
  mediumTopics.sort((a, b) => scoreTopic(b, 2) - scoreTopic(a, 2));
  strongTopics.sort((a, b) => scoreTopic(b, 1) - scoreTopic(a, 1));

  // Build scheduled queue:
  // Heavily prioritize Weak topics (multiple sessions), Unassessed (diagnostic session), Medium (practice), Strong (retention check)
  interface QueueItem {
    topic: Topic;
    objective: string;
    activity: string;
    priority: TaskPriority;
    type: 'weak' | 'unassessed' | 'medium' | 'strong';
  }

  const queue: QueueItem[] = [];

  // Weak topics get 2 distinct sessions: Foundational review + Diagnostic re-quiz
  for (const t of weakTopics) {
    queue.push({
      topic: t,
      objective: `Remediate core knowledge gaps and master prerequisite definitions in ${t.topic_name}`,
      activity: `Read uploaded source notes, create flashcards for key terms, and summarize weak subtopics`,
      priority: 'high',
      type: 'weak',
    });
    queue.push({
      topic: t,
      objective: `Targeted problem-solving & mistake reconciliation for ${t.topic_name}`,
      activity: `Solve previous questions and take a 5-question re-quiz to verify gap closure`,
      priority: 'high',
      type: 'weak',
    });
  }

  // Unassessed topics need baseline assessment
  for (const t of unassessedTopics) {
    queue.push({
      topic: t,
      objective: `Establish initial mastery baseline for ${t.topic_name}`,
      activity: `Skim unit syllabus notes and take a diagnostic quiz to collect evaluation evidence`,
      priority: 'high',
      type: 'unassessed',
    });
  }

  // Medium topics need concept consolidation
  for (const t of mediumTopics) {
    queue.push({
      topic: t,
      objective: `Advance from moderate accuracy to mastery in ${t.topic_name}`,
      activity: `Work through complex problem sets, edge cases, and previous exam question papers`,
      priority: 'medium',
      type: 'medium',
    });
  }

  // Strong topics need spaced repetition
  for (const t of strongTopics) {
    queue.push({
      topic: t,
      objective: `Spaced retention check & rapid review for ${t.topic_name}`,
      activity: `Quick 15-minute active recall session and speed formula / definition check`,
      priority: 'low',
      type: 'strong',
    });
  }

  // If no topics at all, fallback
  if (queue.length === 0) {
    return [];
  }

  // Distribute queue items across available days
  const tasks: Array<Omit<RevisionTask, 'id' | 'revision_plan_id' | 'created_at'>> = [];
  let queueIndex = 0;

  for (let day = 1; day <= totalDays; day++) {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + (day - 1));
    const dateStr = scheduledDate.toISOString().split('T')[0];

    for (let slot = 0; slot < tasksPerDay; slot++) {
      if (queueIndex >= queue.length) {
        // If we ran through all items, repeat highest priority weak topics for reinforcement
        queueIndex = 0;
      }

      const item = queue[queueIndex % queue.length];
      queueIndex++;

      tasks.push({
        user_id: userId,
        subject_id: subjectId,
        topic_id: item.topic.id,
        topic_name: item.topic.topic_name,
        day_number: day,
        scheduled_date: dateStr,
        learning_objective: item.objective,
        recommended_activity: item.activity,
        estimated_minutes: taskDuration,
        priority: item.priority,
        status: 'pending',
      });
    }
  }

  return tasks;
}
