'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { MasteryBadge } from '@/components/Badge';
import { 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  Target, 
  Calendar, 
  AlertTriangle, 
  ArrowRight, 
  BarChart3,
  Sparkles,
  Layers
} from 'lucide-react';
import { Subject, TopicMastery } from '@/types';

interface ProgressData {
  scoreHistory: Array<{
    id: string;
    title: string;
    date: string;
    score: number;
    total: number;
    percentage: number;
  }>;
  masteryBreakdown: {
    total: number;
    strong: number;
    weak: number;
    improved: number;
  };
  taskProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  improvedTopics: TopicMastery[];
  weakTopics: TopicMastery[];
}

export default function ProgressTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user || !subjectId) return;
      try {
        const [subRes, progRes] = await Promise.all([
          fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/progress?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
        ]);

        const subData = await subRes.json();
        const progData = await progRes.json();

        setSubject(subData.subject || null);
        setProgress(progData || null);
      } catch (err) {
        console.error('Error loading progress tracking:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user && subjectId) {
      loadData();
    }
  }, [subjectId, user]);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Calculating historical telemetry & progression charts...</span>
          </div>
        </div>
      </>
    );
  }

  if (!progress) {
    return (
      <>
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto p-8 text-center">
          <p className="text-slate-500 text-xs">Progress data unavailable.</p>
        </div>
      </>
    );
  }

  const { scoreHistory, masteryBreakdown, taskProgress, improvedTopics, weakTopics } = progress;

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <SubjectSidebar subjectId={subjectId} subjectName={subject?.name} />

        <main className="flex-1 p-6 md:p-8 bg-slate-50">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Longitudinal Mastery</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Progress & Growth Tracking</h1>
                <p className="text-xs text-slate-500">
                  Track actual quiz scores over time, verify knowledge gap closure, and monitor revision task completion
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/workspace/${subjectId}/quiz`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Take Diagnostic Quiz</span>
                </Link>
              </div>
            </div>

            {/* KEY METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Quizzes Completed</span>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{scoreHistory.length}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {scoreHistory.length > 0 ? `Latest: ${scoreHistory[scoreHistory.length - 1].percentage}%` : 'No attempts yet'}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Revision Plan Progress</span>
                <div className="mt-2 text-3xl font-extrabold text-emerald-600">{taskProgress.percentage}%</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {taskProgress.completed} of {taskProgress.total} tasks completed
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Improved Topics</span>
                <div className="mt-2 text-3xl font-extrabold text-blue-600">{improvedTopics.length}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {weakTopics.length} knowledge gaps still open
                </div>
              </div>
            </div>

            {/* SCORE HISTORY TIMELINE CHART */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Historical Diagnostic Scores</h3>
                  <p className="text-xs text-slate-500">Progression across completed quizzes</p>
                </div>
              </div>

              {scoreHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No completed quizzes yet. Take your first diagnostic quiz to build your progress timeline.
                </div>
              ) : (
                <div className="space-y-4">
                  {scoreHistory.map((sh, sIdx) => (
                    <div key={sh.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          Attempt {sIdx + 1}: {sh.title}
                        </span>
                        <span className="font-extrabold text-slate-900">{sh.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                        <div
                          className={`h-3 transition-all duration-500 ${
                            sh.percentage >= 80 ? 'bg-emerald-500' : (sh.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                          }`}
                          style={{ width: `${Math.max(5, sh.percentage)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        {new Date(sh.date).toLocaleDateString()} • {sh.score}/{sh.total} correct
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* IMPROVED TOPICS VS STILL WEAK TOPICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Improved Topics */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Topics Showing Measurable Improvement</h3>
                </div>

                {improvedTopics.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No score increases recorded yet. Retake a quiz on your weak topics to see improvements reflected here!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {improvedTopics.map(it => (
                      <div key={it.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{it.topic_name}</p>
                          <p className="text-[11px] text-emerald-700">Accuracy: {it.accuracy_percentage}%</p>
                        </div>
                        <MasteryBadge classification={it.classification} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Still Open Knowledge Gaps */}
              <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-sm text-slate-900">Critical Topics Still Needing Attention</h3>
                </div>

                {weakTopics.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Great news! No critical knowledge gaps currently detected below the 50% threshold.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {weakTopics.map(wt => (
                      <div key={wt.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{wt.topic_name}</p>
                          <p className="text-[11px] text-rose-700">Accuracy: {wt.accuracy_percentage}% ({wt.total_correct}/{wt.total_attempted})</p>
                        </div>
                        <MasteryBadge classification={wt.classification} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
