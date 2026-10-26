import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_GAP_CONFIG } from '@/lib/gap-engine';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    const topics = await db.getTopics(subjectId, userId);
    const masteryList = await db.getTopicMastery(subjectId, userId);

    // Merge topics that haven't been quizzed yet as 'needs_more_assessment'
    const fullMasteryList = topics.map(t => {
      const existing = masteryList.find(m => m.topic_id === t.id);
      if (existing) return existing;
      return {
        id: crypto.randomUUID(),
        user_id: userId,
        subject_id: subjectId,
        topic_id: t.id,
        topic_name: t.topic_name,
        unit_name: t.unit_name,
        total_attempted: 0,
        total_correct: 0,
        accuracy_percentage: 0,
        classification: 'needs_more_assessment' as const,
        reasons: [`No diagnostic quiz attempted yet for this topic. Minimum required questions: ${DEFAULT_GAP_CONFIG.minEvidenceQuestions}.`],
        trend: 'stable' as const,
        history: [],
        last_evaluated_at: new Date().toISOString(),
      };
    });

    const strong = fullMasteryList.filter(m => m.classification === 'strong');
    const medium = fullMasteryList.filter(m => m.classification === 'medium');
    const weak = fullMasteryList.filter(m => m.classification === 'weak');
    const needsAssessment = fullMasteryList.filter(m => m.classification === 'needs_more_assessment');

    const assessedTopics = fullMasteryList.filter(m => m.total_attempted >= DEFAULT_GAP_CONFIG.minEvidenceQuestions);
    const avgAccuracy = assessedTopics.length > 0
      ? Number((assessedTopics.reduce((acc, m) => acc + m.accuracy_percentage, 0) / assessedTopics.length).toFixed(1))
      : 0;

    return NextResponse.json({
      summary: {
        totalTopics: fullMasteryList.length,
        assessedCount: assessedTopics.length,
        strongCount: strong.length,
        mediumCount: medium.length,
        weakCount: weak.length,
        needsAssessmentCount: needsAssessment.length,
        overallAverageAccuracy: avgAccuracy,
      },
      groups: {
        weak,
        medium,
        strong,
        needs_assessment: needsAssessment,
      },
      mastery: fullMasteryList,
      config: DEFAULT_GAP_CONFIG,
      disclaimer: "These mastery levels are deterministic learning diagnostic indicators based on your specific quiz attempts. They serve to guide personalized study prioritization and do not represent formal intelligence or certified final achievement.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching gap report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
