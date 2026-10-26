import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAIProvider } from '@/lib/gemini';
import { retrieveRelevantChunks } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();
    const { subjectId, question } = body;

    if (!subjectId || !question || !question.trim()) {
      return NextResponse.json({ error: 'subjectId and question are required' }, { status: 400 });
    }

    const subject = await db.getSubject(subjectId, userId);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // 1. RAG retrieval of top grounded chunks
    const retrievedChunks = await retrieveRelevantChunks({
      subjectId,
      userId,
      query: question.trim(),
      limit: 4,
    });

    // 2. Generate grounded response with citations
    const { provider } = getAIProvider();
    const result = await provider.askAssistant({
      question: question.trim(),
      retrievedChunks,
      subjectName: subject.name,
    });

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      is_grounded: result.is_grounded,
      model_used: result.model_used,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error processing question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
