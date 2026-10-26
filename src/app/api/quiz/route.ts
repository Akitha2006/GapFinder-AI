import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAIProvider } from '@/lib/gemini';
import { retrieveRelevantChunks } from '@/lib/rag';
import { QuizDifficulty } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('id');
    const subjectId = searchParams.get('subjectId');

    if (quizId) {
      const quiz = await db.getQuiz(quizId, userId);
      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      // If quiz is not completed yet, hide correct_answer and explanation
      if (quiz.status !== 'completed' && quiz.questions) {
        const maskedQuestions = quiz.questions.map(q => ({
          ...q,
          correct_answer: '',
          explanation: '',
        }));
        return NextResponse.json({ quiz: { ...quiz, questions: maskedQuestions } });
      }

      return NextResponse.json({ quiz });
    }

    if (subjectId) {
      const quizzes = await db.getQuizzes(subjectId, userId);
      return NextResponse.json({ quizzes });
    }

    return NextResponse.json({ error: 'Either id or subjectId is required' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error retrieving quiz';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const body = await req.json();

    const { subjectId, topicIds, count = 5, difficulty = 'medium' } = body;

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    // 1. Fetch topics
    const allTopics = await db.getTopics(subjectId, userId);
    let selectedTopics = allTopics;
    if (Array.isArray(topicIds) && topicIds.length > 0) {
      selectedTopics = allTopics.filter(t => topicIds.includes(t.id));
    }

    if (selectedTopics.length === 0) {
      // Create a fallback topic if none exist yet
      selectedTopics = [{
        id: crypto.randomUUID(),
        subject_id: subjectId,
        user_id: userId,
        topic_name: 'General Subject Mastery',
        subtopics: ['Core Definitions', 'Practical Applications'],
        created_at: new Date().toISOString(),
      }];
    }

    // 2. Retrieve grounded context chunks using RAG
    const query = selectedTopics.map(t => t.topic_name).join(' ');
    const retrievedChunks = await retrieveRelevantChunks({
      subjectId,
      userId,
      query,
      limit: 6,
    });

    // 3. Generate questions via AI Provider (Gemini or Deterministic Dev Fallback)
    const { provider, label } = getAIProvider();
    const generatedQuestions = await provider.generateQuestions({
      topics: selectedTopics.map(t => ({ id: t.id, name: t.topic_name })),
      chunks: retrievedChunks.map(c => ({
        content: c.content,
        doc_name: c.doc_name,
        page_number: c.page_number,
        section_title: c.section_title,
      })),
      count: Math.min(Math.max(Number(count) || 5, 1), 20),
      difficulty: (difficulty as QuizDifficulty) || 'medium',
    });

    // 4. Save Quiz and Questions in Database
    const quizTitle = `Diagnostic Quiz: ${selectedTopics.slice(0, 2).map(t => t.topic_name).join(', ')}${selectedTopics.length > 2 ? '...' : ''}`;

    const createdQuiz = await db.createQuiz(
      {
        user_id: userId,
        subject_id: subjectId,
        title: quizTitle,
        difficulty: (difficulty as QuizDifficulty) || 'medium',
        question_format: 'mcq',
        total_questions: generatedQuestions.length,
      },
      generatedQuestions.map(q => ({
        topic_id: q.topic_id,
        topic_name: q.topic_name,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        source_doc: q.source_doc,
        source_page: q.source_page,
      }))
    );

    // 5. Hide correct_answer before sending to student!
    const clientQuestions = (createdQuiz.questions || []).map(q => ({
      ...q,
      correct_answer: '',
      explanation: '',
    }));

    return NextResponse.json({
      quiz: { ...createdQuiz, questions: clientQuestions },
      generator: label,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating quiz';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
