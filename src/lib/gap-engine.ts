import { MasteryClassification, TopicMastery, QuizQuestion } from '@/types';

export interface GapDiagnosisConfig {
  strongThreshold: number; // e.g. 80 (80%-100%)
  mediumThreshold: number; // e.g. 50 (50%-79%)
  minEvidenceQuestions: number; // minimum questions needed for confident diagnosis, e.g. 3
}

export const DEFAULT_GAP_CONFIG: GapDiagnosisConfig = {
  strongThreshold: 80,
  mediumThreshold: 50,
  minEvidenceQuestions: 3,
};

/**
 * Deterministic Knowledge Gap Classification & Evidence Reasoning
 */
export function classifyTopicMastery(
  attempted: number,
  correct: number,
  previousAccuracy: number | null = null,
  config: GapDiagnosisConfig = DEFAULT_GAP_CONFIG
): {
  classification: MasteryClassification;
  accuracy: number;
  reasons: string[];
  trend: 'improving' | 'declining' | 'stable';
  recommendedAction: string;
} {
  const accuracy = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0;
  const reasons: string[] = [];
  let trend: 'improving' | 'declining' | 'stable' = 'stable';

  if (previousAccuracy !== null) {
    const diff = accuracy - previousAccuracy;
    if (diff > 5) {
      trend = 'improving';
      reasons.push(`Performance improved by +${diff.toFixed(1)}% compared to earlier attempts.`);
    } else if (diff < -5) {
      trend = 'declining';
      reasons.push(`Score decreased by ${Math.abs(diff).toFixed(1)}% compared to previous assessment.`);
    } else {
      trend = 'stable';
      reasons.push(`Consistent performance across attempts (fluctuation under 5%).`);
    }
  }

  // Check evidence sufficiency first
  if (attempted < config.minEvidenceQuestions) {
    reasons.push(
      `Insufficient assessment evidence: Only ${attempted} question(s) attempted so far (minimum required for confident diagnosis is ${config.minEvidenceQuestions}).`
    );
    return {
      classification: 'needs_more_assessment',
      accuracy,
      reasons,
      trend,
      recommendedAction: `Complete at least ${config.minEvidenceQuestions - attempted} more diagnostic question(s) to establish a reliable mastery baseline.`,
    };
  }

  // Deterministic Threshold Classification
  if (accuracy >= config.strongThreshold) {
    reasons.push(
      `Strong mastery demonstrated: ${correct} out of ${attempted} questions answered correctly (${accuracy}% accuracy, exceeding ${config.strongThreshold}% threshold).`
    );
    return {
      classification: 'strong',
      accuracy,
      reasons,
      trend,
      recommendedAction: `Maintain retention with periodic flash-reviews and spaced practice intervals prior to the exam.`,
    };
  }

  if (accuracy >= config.mediumThreshold) {
    reasons.push(
      `Moderate understanding: ${correct} out of ${attempted} questions answered correctly (${accuracy}% accuracy). Foundational concepts are present, but errors occurred on nuanced applications.`
    );
    return {
      classification: 'medium',
      accuracy,
      reasons,
      trend,
      recommendedAction: `Focus on problem-solving exercises and clarify edge cases or nuanced subtopics.`,
    };
  }

  // Weak Topic (< mediumThreshold)
  reasons.push(
    `Critical knowledge gap detected: Only ${correct} out of ${attempted} questions answered correctly (${accuracy}% accuracy, below the ${config.mediumThreshold}% proficiency benchmark).`
  );
  const incorrectCount = attempted - correct;
  reasons.push(
    `Failed ${incorrectCount} question(s). Re-reading fundamental syllabus definitions and core notes is urgently advised.`
  );

  return {
    classification: 'weak',
    accuracy,
    reasons,
    trend,
    recommendedAction: `Prioritize immediate revision of this topic. Review source chapter notes and retake a targeted diagnostic quiz.`,
  };
}

/**
 * Computes updated TopicMastery records given a set of answered QuizQuestions and existing mastery
 */
export function recalculateMasteryFromQuiz(
  subjectId: string,
  userId: string,
  quizQuestions: QuizQuestion[],
  existingMastery: TopicMastery[],
  topics: Array<{ id: string; topic_name: string; unit_name?: string }>,
  config: GapDiagnosisConfig = DEFAULT_GAP_CONFIG
): TopicMastery[] {
  const result: TopicMastery[] = [];

  // Group quiz questions by topic
  const questionsByTopic: Record<string, QuizQuestion[]> = {};
  for (const q of quizQuestions) {
    if (!questionsByTopic[q.topic_id]) {
      questionsByTopic[q.topic_id] = [];
    }
    questionsByTopic[q.topic_id].push(q);
  }

  // Iterate over all topics in subject to ensure complete coverage
  for (const topic of topics) {
    const existing = existingMastery.find(m => m.topic_id === topic.id);
    const questionsForThisTopic = questionsByTopic[topic.id] || [];

    const newAttempts = questionsForThisTopic.length;
    const newCorrect = questionsForThisTopic.filter(q => q.is_correct).length;

    const totalAttempted = (existing?.total_attempted || 0) + newAttempts;
    const totalCorrect = (existing?.total_correct || 0) + newCorrect;

    const previousAccuracy = existing && existing.total_attempted >= config.minEvidenceQuestions
      ? existing.accuracy_percentage
      : null;

    const diagnosis = classifyTopicMastery(totalAttempted, totalCorrect, previousAccuracy, config);

    // Build history entry
    const history = existing?.history ? [...existing.history] : [];
    if (newAttempts > 0) {
      history.push({
        date: new Date().toISOString(),
        score: newCorrect,
        total: newAttempts,
        accuracy: Number(((newCorrect / newAttempts) * 100).toFixed(1)),
      });
    }

    result.push({
      id: existing?.id || crypto.randomUUID(),
      user_id: userId,
      subject_id: subjectId,
      topic_id: topic.id,
      topic_name: topic.topic_name,
      unit_name: topic.unit_name,
      total_attempted: totalAttempted,
      total_correct: totalCorrect,
      accuracy_percentage: diagnosis.accuracy,
      classification: diagnosis.classification,
      reasons: diagnosis.reasons,
      trend: diagnosis.trend,
      history,
      last_evaluated_at: new Date().toISOString(),
    });
  }

  return result;
}
