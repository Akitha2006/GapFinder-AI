'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/Badge';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  RotateCcw, 
  Clock, 
  Target, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Subject, RevisionPlan, RevisionTask } from '@/types';

export default function RevisionPlanPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user || !subjectId) return;
    try {
      const [subRes, planRes] = await Promise.all([
        fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
        fetch(`/api/revision-plan?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
      ]);

      const subData = await subRes.json();
      const planData = await planRes.json();

      setSubject(subData.subject || null);
      setPlan(planData.plan || null);
      setTasks(planData.tasks || []);
    } catch (err) {
      console.error('Error loading revision plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && subjectId) {
      loadData();
    }
  }, [subjectId, user]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/revision-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-student-uuid-42',
        },
        body: JSON.stringify({ subjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPlan(data.plan);
      setTasks(data.tasks || []);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error generating plan');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as 'pending' | 'completed' } : t));

    try {
      await fetch('/api/revision-plan', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-student-uuid-42',
        },
        body: JSON.stringify({
          taskId,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert if error
      await loadData();
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Scheduling personalized revision sprint...</span>
          </div>
        </div>
      </>
    );
  }

  // Calculate distinct days
  const distinctDays = Array.from(new Set(tasks.map(t => t.day_number))).sort((a, b) => a - b);
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const filteredTasks = filterDay === 'all'
    ? tasks
    : tasks.filter(t => t.day_number === filterDay);

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
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Adaptive Scheduling</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Personalized Revision Plan</h1>
                <p className="text-xs text-slate-500">
                  Targeted study activities prioritized by diagnostic knowledge gaps and allocated to your daily study budget
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing schedule...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{tasks.length > 0 ? 'Regenerate Adaptive Plan' : 'Generate Revision Plan'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SCHEDULE SUMMARY / PROGRESS BAR */}
            {tasks.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Sprint Completion Progress</h3>
                    <p className="text-xs text-slate-500">
                      {completedTasksCount} of {tasks.length} revision tasks completed ({progressPercent}%)
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Daily Study Time: <span className="font-bold text-slate-900">{subject?.daily_study_minutes || 60}m</span> • Sprint Window: <span className="font-bold text-slate-900">{distinctDays.length} Days</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* NO PLAN GENERATED YET */}
            {tasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-900">No Revision Schedule Generated Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the button below to generate a tailored day-by-day revision schedule based on your current knowledge gaps and target exam deadline.
                </p>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Personalized Plan Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Day Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setFilterDay('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filterDay === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Days ({tasks.length} tasks)
                  </button>
                  {distinctDays.map(d => {
                    const dayTasks = tasks.filter(t => t.day_number === d);
                    const isAllDone = dayTasks.every(t => t.status === 'completed');

                    return (
                      <button
                        key={d}
                        onClick={() => setFilterDay(d)}
                        className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                          filterDay === d
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>Day {d}</span>
                        {isAllDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* TASKS TIMELINE */}
                <div className="space-y-3">
                  {filteredTasks.map(task => {
                    const isCompleted = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/30 border-emerald-200 opacity-80'
                            : 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Complete Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-300 hover:text-blue-500" />
                            )}
                          </button>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                Day {task.day_number} • {new Date(task.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {task.topic_name}
                              </span>
                              <PriorityBadge priority={task.priority} />
                              <span className="text-[11px] text-slate-500 font-medium ml-auto flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {task.estimated_minutes} mins
                              </span>
                            </div>

                            <p className={`text-xs font-semibold leading-relaxed mt-1 ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              Objective: {task.learning_objective}
                            </p>

                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-semibold text-slate-700">Recommended Activity: </span>
                              {task.recommended_activity}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
