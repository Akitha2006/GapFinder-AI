'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { MasteryBadge } from '@/components/Badge';
import { 
  Target, 
  HelpCircle, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Subject, TopicMastery, Quiz, RevisionTask } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [mastery, setMastery] = useState<TopicMastery[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      if (!user) return;
      try {
        const res = await fetch('/api/subjects', {
          headers: { 'x-user-id': user.id },
        });
        const data = await res.json();
        const subList = data.subjects || [];
        setSubjects(subList);
        if (subList.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subList[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadSubjects();
    }
  }, [user]);

  // Load subject specific data
  useEffect(() => {
    async function loadSubjectData() {
      if (!user || !selectedSubjectId) return;
      try {
        const [gapRes, quizRes, planRes] = await Promise.all([
          fetch(`/api/gap-report?subjectId=${selectedSubjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/quiz?subjectId=${selectedSubjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/revision-plan?subjectId=${selectedSubjectId}`, { headers: { 'x-user-id': user.id } }),
        ]);

        const gapData = await gapRes.json();
        const quizData = await quizRes.json();
        const planData = await planRes.json();

        setMastery(gapData.mastery || []);
        setQuizzes(quizData.quizzes || []);
        setTasks(planData.tasks || []);
      } catch (err) {
        console.error('Error fetching subject dashboard data:', err);
      }
    }

    if (selectedSubjectId) {
      loadSubjectData();
    }
  }, [selectedSubjectId, user]);

  if (authLoading || (loading && !subjects.length)) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading student profile and diagnostic telemetry...</span>
          </div>
        </div>
      </>
    );
  }

  // ONBOARDING SCREEN IF NO SUBJECTS EXIST
  if (subjects.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-6">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to GapFinder AI</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            You haven’t created a study workspace yet. Create your first subject, upload your syllabus and notes, and take a diagnostic quiz to reveal your knowledge gaps.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/workspace"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Subject Workspace</span>
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Calculated Metrics
  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const strongCount = mastery.filter(m => m.classification === 'strong').length;
  const mediumCount = mastery.filter(m => m.classification === 'medium').length;
  const weakCount = mastery.filter(m => m.classification === 'weak').length;
  const needsAssessmentCount = mastery.filter(m => m.classification === 'needs_more_assessment').length;
  const totalAssessed = strongCount + mediumCount + weakCount;

  const latestQuiz = quizzes.find(q => q.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspace Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Student Dashboard</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Welcome, {user?.name || 'Student'}
            </h1>
            <p className="text-xs text-slate-500">
              Active learning diagnostic overview for {activeSubject?.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">Subject:</label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <Link
              href={`/workspace/${selectedSubjectId}`}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Open Subject Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Topics Assessed</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{totalAssessed}</span>
              <span className="text-xs text-slate-400">/ {mastery.length} total</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {needsAssessmentCount} topics need assessment
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600">Weak Topics</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-rose-600">{weakCount}</div>
            <div className="mt-2 text-[11px] text-rose-600/80">&lt;50% accuracy threshold</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600">Medium Topics</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-amber-600">{mediumCount}</div>
            <div className="mt-2 text-[11px] text-amber-600/80">50% to 79% accuracy</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">Strong Topics</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">{strongCount}</div>
            <div className="mt-2 text-[11px] text-emerald-600/80">≥80% accuracy mastery</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-blue-600">Latest Quiz Score</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {latestQuiz ? `${latestQuiz.percentage}%` : 'N/A'}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total_questions} correct` : 'No completed quiz'}
            </div>
          </div>
        </div>

        {/* TWO COLUMN CONTENT */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Knowledge Gap Overview & Recommended Action */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommended Action Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-base">Recommended Next Action</h3>
              </div>

              {weakCount > 0 ? (
                <div>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    You have <span className="font-bold text-white">{weakCount} critical knowledge gap(s)</span> identified in {activeSubject.name}. Take a targeted re-quiz or execute today&apos;s scheduled remediation task.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/workspace/${selectedSubjectId}/gap-report`}
                      className="px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 shadow-xs transition-colors"
                    >
                      Inspect Knowledge Gap Report
                    </Link>
                    <Link
                      href={`/workspace/${selectedSubjectId}/quiz`}
                      className="px-4 py-2 bg-blue-800/80 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Start Diagnostic Quiz
                    </Link>
                  </div>
                </div>
              ) : needsAssessmentCount > 0 ? (
                <div>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    You have <span className="font-bold text-white">{needsAssessmentCount} topics needing assessment</span>. Take a diagnostic quiz to collect baseline evidence.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/workspace/${selectedSubjectId}/quiz`}
                      className="px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 shadow-xs transition-colors inline-block"
                    >
                      Launch Diagnostic Quiz
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    Excellent progress! All assessed topics exceed 50% accuracy. Continue following your revision schedule for spaced retention.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/workspace/${selectedSubjectId}/revision-plan`}
                      className="px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 shadow-xs transition-colors inline-block"
                    >
                      View Revision Schedule
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Topic Mastery Summary List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Topic Diagnosis Breakdown</h3>
                  <p className="text-xs text-slate-500">Based on verifiable answers from your diagnostic quizzes</p>
                </div>
                <Link
                  href={`/workspace/${selectedSubjectId}/gap-report`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Detailed Gap Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {mastery.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No topics extracted yet. Upload a syllabus in the Workspace Documents tab to begin.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {mastery.slice(0, 6).map(m => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{m.topic_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {m.total_attempted > 0
                            ? `${m.total_correct}/${m.total_attempted} correct (${m.accuracy_percentage}%)`
                            : 'No questions attempted'}
                        </p>
                      </div>
                      <MasteryBadge classification={m.classification} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Revision Plan & Recent Quizzes */}
          <div className="space-y-6">
            {/* Today's Revision Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Pending Revision Tasks</span>
                </h3>
                <Link
                  href={`/workspace/${selectedSubjectId}/revision-plan`}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Full Plan
                </Link>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl p-4">
                  No pending tasks for today.
                  <div className="mt-2">
                    <Link
                      href={`/workspace/${selectedSubjectId}/revision-plan`}
                      className="text-blue-600 font-semibold"
                    >
                      Generate or view revision schedule →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {task.topic_name || 'Revision Task'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimated_minutes}m
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {task.learning_objective}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Quiz Attempts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Recent Diagnostic Quizzes</span>
                </h3>
              </div>

              {quizzes.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No quizzes completed yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {quizzes.slice(0, 4).map(q => (
                    <Link
                      key={q.id}
                      href={`/workspace/${selectedSubjectId}/quiz/${q.id}/results`}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 flex items-center justify-between transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{q.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(q.created_at).toLocaleDateString()} • {q.difficulty.toUpperCase()}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        q.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : (q.percentage >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                      }`}>
                        {q.percentage}%
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
