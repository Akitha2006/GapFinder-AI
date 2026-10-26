'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Clock, 
  Trash2, 
  ArrowRight, 
  FileText, 
  Layers, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Subject } from '@/types';

export default function WorkspacesIndexPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New subject form states
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const loadSubjects = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/subjects', {
        headers: { 'x-user-id': user.id },
      });
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-student-uuid-42',
        },
        body: JSON.stringify({
          name: name.trim(),
          exam_date: examDate || undefined,
          daily_study_minutes: dailyMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }

      setName('');
      setExamDate('');
      setDailyMinutes(60);
      setIsCreating(false);
      await loadSubjects();
      router.push(`/workspace/${data.subject.id}/documents`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this study workspace and all associated documents, quizzes, and topics?')) {
      return;
    }
    try {
      await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || 'demo-student-uuid-42' },
      });
      setSubjects(subjects.filter(s => s.id !== subjectId));
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading study workspaces...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Course Workspaces</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Study Workspaces
            </h1>
            <p className="text-xs text-slate-500">
              Manage your subjects, syllabi, exam schedules, and document repositories
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Cancel' : 'Create New Subject'}</span>
          </button>
        </div>

        {/* CREATE MODAL / INLINE FORM */}
        {isCreating && (
          <div className="mt-6 p-6 rounded-2xl bg-white border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">New Study Workspace</h3>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Operating Systems & Architecture"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Study Time (Minutes)
                  </label>
                  <select
                    value={dailyMinutes}
                    onChange={e => setDailyMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes / day</option>
                    <option value={60}>60 minutes / day (Recommended)</option>
                    <option value={90}>90 minutes / day</option>
                    <option value={120}>120 minutes / day</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Creating Workspace...' : 'Create & Upload Documents'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBJECT CARDS GRID */}
        {subjects.length === 0 ? (
          <div className="mt-12 text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">No Study Workspaces Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a workspace to upload your syllabus and notes, extract topics, and start diagnosing knowledge gaps.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-6 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subject Now</span>
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(sub => {
              // Calculate countdown
              let daysLeft: number | null = null;
              if (sub.exam_date) {
                const diff = new Date(sub.exam_date).getTime() - new Date().setHours(0, 0, 0, 0);
                daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
              }

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {sub.name.slice(0, 2).toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
                        title="Delete Workspace"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {sub.name}
                    </h3>

                    <div className="mt-4 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {sub.exam_date
                            ? `Exam: ${new Date(sub.exam_date).toLocaleDateString()}`
                            : 'No exam date set'}
                        </span>
                        {daysLeft !== null && daysLeft > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {daysLeft} days left
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.daily_study_minutes} minutes daily available</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/workspace/${sub.id}/documents`}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Documents</span>
                    </Link>

                    <Link
                      href={`/workspace/${sub.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Open Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
