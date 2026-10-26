import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const subjects = await db.getSubjects(userId);
    return NextResponse.json({ subjects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch subjects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const created = await db.createSubject({
      user_id: userId,
      name: body.name.trim(),
      exam_date: body.exam_date || undefined,
      daily_study_minutes: Number(body.daily_study_minutes) || 60,
      syllabus_importance: body.syllabus_importance || {},
    });

    return NextResponse.json({ subject: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create subject';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
