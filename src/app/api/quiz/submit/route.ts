import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recalculateMasteryFromQuiz } from '@/lib/gap-engine';
import { generatePersonalizedRevisionPlan } from '@/lib/revision-planner';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();

    const { quizId, answers } = body;

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'quizId and answers array are required' }, { status: 400 });
    }

    // 1. Submit answers and evaluate correctness
    const { quiz, questions } = await db.submitQuizAnswers(quizId, userId, answers);

    // 2. Recalculate Topic Mastery
    const existingMastery = await db.getTopicMastery(quiz.subject_id, userId);
    const topics = await db.getTopics(quiz.subject_id, userId);

    const updatedMastery = recalculateMasteryFromQuiz(
      quiz.subject_id,
      userId,
      questions,
      existingMastery,
      topics.map(t => ({ id: t.id, topic_name: t.topic_name, unit_name: t.unit_name }))
    );

    // 3. Persist updated mastery
    await db.saveTopicMasteryBatch(updatedMastery);

    // 4. If an existing revision plan exists, dynamically adjust tasks to reflect new weaknesses
    const { plan } = await db.getRevisionPlan(quiz.subject_id, userId);
    if (plan) {
      const subject = await db.getSubject(quiz.subject_id, userId);
      if (subject) {
        const revisedTasks = generatePersonalizedRevisionPlan({
          userId,
          subjectId: quiz.subject_id,
          examDate: subject.exam_date,
          dailyStudyMinutes: subject.daily_study_minutes,
          syllabusImportance: subject.syllabus_importance,
          masteryList: updatedMastery,
          topics,
        });

        await db.saveRevisionPlanWithTasks(
          {
            user_id: userId,
            subject_id: quiz.subject_id,
          },
          revisedTasks
        );
      }
    }

    // 5. Build topic-wise performance breakdown for the results screen
    const topicBreakdown: Record<string, { topic_name: string; attempted: number; correct: number; accuracy: number }> = {};
    for (const q of questions) {
      const tName = q.topic_name || 'General';
      if (!topicBreakdown[q.topic_id]) {
        topicBreakdown[q.topic_id] = { topic_name: tName, attempted: 0, correct: 0, accuracy: 0 };
      }
      topicBreakdown[q.topic_id].attempted++;
      if (q.is_correct) topicBreakdown[q.topic_id].correct++;
    }

    for (const tid in topicBreakdown) {
      const item = topicBreakdown[tid];
      item.accuracy = item.attempted > 0 ? Number(((item.correct / item.attempted) * 100).toFixed(1)) : 0;
    }

    return NextResponse.json({
      quiz,
      questions,
      topicBreakdown,
      updatedMastery,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error submitting quiz answers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
