'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  Target, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  BookOpen,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Subject, Quiz, QuizQuestion } from '@/types';

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const quizId = params?.quizId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user || !subjectId || !quizId) return;
      try {
        const [subRes, quizRes] = await Promise.all([
          fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/quiz?id=${quizId}`, { headers: { 'x-user-id': user.id } }),
        ]);

        const subData = await subRes.json();
        const quizData = await quizRes.json();

        setSubject(subData.subject || null);
        setQuiz(quizData.quiz || null);
      } catch (err) {
        console.error('Error loading quiz results:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user && subjectId && quizId) {
      loadData();
    }
  }, [subjectId, quizId, user]);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Calculating diagnostic evaluation & gap telemetry...</span>
          </div>
        </div>
      </>
    );
  }

  if (!quiz) {
    return (
      <>
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto p-8 text-center">
          <p className="text-slate-500 text-xs">Diagnostic evaluation not found.</p>
          <Link href={`/workspace/${subjectId}/quiz`} className="text-blue-600 text-xs font-semibold mt-2 inline-block">
            Return to Quizzes
          </Link>
        </div>
      </>
    );
  }

  const questions = quiz.questions || [];
  const correctCount = questions.filter(q => q.is_correct).length;
  const incorrectCount = questions.length - correctCount;

  // Topic breakdown
  const topicMap: Record<string, { topicName: string; correct: number; total: number }> = {};
  for (const q of questions) {
    const tName = q.topic_name || 'General';
    if (!topicMap[q.topic_id]) {
      topicMap[q.topic_id] = { topicName: tName, correct: 0, total: 0 };
    }
    topicMap[q.topic_id].total++;
    if (q.is_correct) topicMap[q.topic_id].correct++;
  }

  // Recommended review topics: topics with accuracy < 80%
  const reviewNeeded = Object.entries(topicMap).filter(([, val]) => {
    const acc = (val.correct / val.total) * 100;
    return acc < 80;
  });

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <SubjectSidebar subjectId={subjectId} subjectName={subject?.name} />

        <main className="flex-1 p-6 md:p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Evaluation Report</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Quiz Results</h1>
                <p className="text-xs text-slate-500">
                  Completed {new Date(quiz.completed_at || quiz.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/workspace/${subjectId}/quiz`}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Diagnostic Quiz</span>
                </Link>

                <Link
                  href={`/workspace/${subjectId}/gap-report`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Open Knowledge Gap Report</span>
                </Link>
              </div>
            </div>

            {/* SCORE SUMMARY HERO */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-sm ${
                  quiz.percentage >= 80
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : quiz.percentage >= 50
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {quiz.percentage}%
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {quiz.percentage >= 80 ? 'Strong Performance' : quiz.percentage >= 50 ? 'Moderate Baseline' : 'Knowledge Gaps Detected'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {correctCount} out of {questions.length} questions answered correctly
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {correctCount} Correct
                    </span>
                    <span className="text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      {incorrectCount} Incorrect
                    </span>
                  </div>
                </div>
              </div>

              {/* Revision Prompt */}
              {reviewNeeded.length > 0 && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 max-w-sm text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Review Recommended For:</span>
                  </div>
                  <ul className="text-[11px] text-rose-800 list-disc list-inside space-y-0.5">
                    {reviewNeeded.map(([tId, info]) => (
                      <li key={tId} className="truncate">
                        {info.topicName} ({((info.correct / info.total) * 100).toFixed(0)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* TOPIC-WISE PERFORMANCE BREAKDOWN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Topic-Wise Breakdown from this Quiz</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(topicMap).map(([tId, val]) => {
                  const acc = Number(((val.correct / val.total) * 100).toFixed(1));
                  const isStrong = acc >= 80;
                  const isMedium = acc >= 50 && acc < 80;

                  return (
                    <div key={tId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{val.topicName}</span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          isStrong ? 'bg-emerald-100 text-emerald-800' : isMedium ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {acc}%
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{val.correct} / {val.total} correct</span>
                        <span>{isStrong ? 'Strong' : isMedium ? 'Medium' : 'Knowledge Gap'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUESTION-BY-QUESTION AUDIT */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">Question-by-Question Diagnostic Audit</h3>

              {questions.map((q, idx) => {
                const isCorrect = q.is_correct;

                return (
                  <div
                    key={q.id}
                    className={`p-6 rounded-2xl border bg-white shadow-xs transition-all ${
                      isCorrect ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{q.topic_name}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 mt-2 leading-relaxed">
                          {q.question_text}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </span>
                    </div>

                    {/* Answers Comparison */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className={`p-3 rounded-lg border ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        <span className="block font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Your Answer:
                        </span>
                        <p className="font-medium">{q.user_answer || '(Unanswered)'}</p>
                      </div>

                      <div className="p-3 rounded-lg border bg-emerald-50/60 border-emerald-200 text-emerald-900">
                        <span className="block font-bold text-[10px] uppercase tracking-wider text-emerald-700 mb-1">
                          Verified Correct Answer:
                        </span>
                        <p className="font-semibold">{q.correct_answer}</p>
                      </div>
                    </div>

                    {/* Explanation & Citation */}
                    {q.explanation && (
                      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <p className="text-slate-800 font-medium leading-relaxed">
                          <span className="font-bold text-slate-900">Academic Explanation: </span>
                          {q.explanation}
                        </p>
                        {q.source_doc && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Grounded Source: {q.source_doc} ({q.source_page || 'Section reference'})</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href={`/workspace/${subjectId}/revision-plan`}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                ← View updated revision plan
              </Link>

              <Link
                href={`/workspace/${subjectId}/gap-report`}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-2 transition-all"
              >
                <span>Proceed to Knowledge Gap Report</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
