import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePersonalizedRevisionPlan } from '@/lib/revision-planner';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    const { plan, tasks } = await db.getRevisionPlan(subjectId, userId);
    return NextResponse.json({ plan, tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching revision plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();
    const { subjectId } = body;

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    const subject = await db.getSubject(subjectId, userId);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const topics = await db.getTopics(subjectId, userId);
    const masteryList = await db.getTopicMastery(subjectId, userId);

    const generatedTasks = generatePersonalizedRevisionPlan({
      userId,
      subjectId,
      examDate: subject.exam_date,
      dailyStudyMinutes: subject.daily_study_minutes,
      syllabusImportance: subject.syllabus_importance,
      masteryList,
      topics,
    });

    const { plan, tasks } = await db.saveRevisionPlanWithTasks(
      { user_id: userId, subject_id: subjectId },
      generatedTasks
    );

    return NextResponse.json({ plan, tasks }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating revision plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: 'taskId and status are required' }, { status: 400 });
    }

    const updatedTask = await db.updateRevisionTaskStatus(taskId, userId, status);
    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating revision task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
