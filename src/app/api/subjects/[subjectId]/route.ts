import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const subject = await db.getSubject(subjectId, userId);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const docs = await db.getDocuments(subjectId, userId);
    const topics = await db.getTopics(subjectId, userId);

    return NextResponse.json({
      subject: {
        ...subject,
        documents_count: docs.length,
        topics_count: topics.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching subject';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const deleted = await db.deleteSubject(subjectId, userId);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error deleting subject';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
