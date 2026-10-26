import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    // 1. Quizzes history
    const quizzes = await db.getQuizzes(subjectId, userId);

    // 2. Topic mastery
    const masteryList = await db.getTopicMastery(subjectId, userId);

    // 3. Revision plan tasks
    const { tasks } = await db.getRevisionPlan(subjectId, userId);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

    // Improved vs needing attention
    const improvedTopics = masteryList.filter(m => m.trend === 'improving');
    const weakTopics = masteryList.filter(m => m.classification === 'weak');
    const strongTopics = masteryList.filter(m => m.classification === 'strong');

    // Score history array for charts
    const scoreHistory = quizzes
      .filter(q => q.status === 'completed')
      .map(q => ({
        id: q.id,
        title: q.title,
        date: q.completed_at || q.created_at,
        score: q.score,
        total: q.total_questions,
        percentage: q.percentage,
      }))
      .reverse(); // chronological

    return NextResponse.json({
      scoreHistory,
      masteryBreakdown: {
        total: masteryList.length,
        strong: strongTopics.length,
        weak: weakTopics.length,
        improved: improvedTopics.length,
      },
      taskProgress: {
        completed: completedTasks,
        total: totalTasks,
        percentage: taskCompletionRate,
      },
      improvedTopics,
      weakTopics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching progress data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
