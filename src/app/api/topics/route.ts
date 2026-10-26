import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId parameter is required' }, { status: 400 });
    }

    const topics = await db.getTopics(subjectId, userId);
    return NextResponse.json({ topics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching topics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();

    if (!body.subject_id || !body.topic_name) {
      return NextResponse.json({ error: 'subject_id and topic_name are required' }, { status: 400 });
    }

    const created = await db.saveTopics([{
      subject_id: body.subject_id,
      user_id: userId,
      unit_number: body.unit_number || 'Unit 1',
      unit_name: body.unit_name || 'General Unit',
      topic_name: body.topic_name.trim(),
      subtopics: Array.isArray(body.subtopics) ? body.subtopics : [],
      source_doc_id: body.source_doc_id || undefined,
      source_page: body.source_page || undefined,
    }]);

    return NextResponse.json({ topic: created[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Topic id is required' }, { status: 400 });
    }

    const updated = await db.updateTopic(body.id, userId, {
      topic_name: body.topic_name,
      unit_name: body.unit_name,
      unit_number: body.unit_number,
      subtopics: body.subtopics,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Topic not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ topic: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Topic id is required' }, { status: 400 });
    }

    const deleted = await db.deleteTopic(id, userId);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error deleting topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
