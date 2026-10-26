'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { 
  Map, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Subject, Topic } from '@/types';

export default function TopicMapPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Topic State
  const [isAdding, setIsAdding] = useState(false);
  const [unitNumber, setUnitNumber] = useState('Unit 1');
  const [unitName, setUnitName] = useState('Core Foundations');
  const [topicName, setTopicName] = useState('');
  const [subtopicsText, setSubtopicsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing single topic
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user || !subjectId) return;
    try {
      const [subRes, topRes] = await Promise.all([
        fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
        fetch(`/api/topics?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
      ]);
      const subData = await subRes.json();
      const topData = await topRes.json();
      setSubject(subData.subject || null);
      setTopics(topData.topics || []);
    } catch (err) {
      console.error('Error fetching topic map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && subjectId) {
      loadData();
    }
  }, [subjectId, user]);

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    setSaving(true);
    setError(null);

    const subtopics = subtopicsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingTopic) {
        // Edit
        const res = await fetch('/api/topics', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || 'demo-student-uuid-42',
          },
          body: JSON.stringify({
            id: editingTopic.id,
            unit_number: unitNumber,
            unit_name: unitName,
            topic_name: topicName.trim(),
            subtopics,
          }),
        });
        if (!res.ok) throw new Error('Failed to update topic');
      } else {
        // Create
        const res = await fetch('/api/topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || 'demo-student-uuid-42',
          },
          body: JSON.stringify({
            subject_id: subjectId,
            unit_number: unitNumber,
            unit_name: unitName,
            topic_name: topicName.trim(),
            subtopics,
          }),
        });
        if (!res.ok) throw new Error('Failed to save topic');
      }

      setTopicName('');
      setSubtopicsText('');
      setIsAdding(false);
      setEditingTopic(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving topic');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setUnitNumber(topic.unit_number || 'Unit 1');
    setUnitName(topic.unit_name || 'Core Foundations');
    setTopicName(topic.topic_name);
    setSubtopicsText(topic.subtopics?.join('\n') || '');
    setIsAdding(true);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to remove this topic from the topic map?')) return;
    try {
      await fetch(`/api/topics?id=${topicId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || 'demo-student-uuid-42' },
      });
      setTopics(topics.filter(t => t.id !== topicId));
    } catch (err) {
      console.error('Error deleting topic:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading extracted topic map...</span>
          </div>
        </div>
      </>
    );
  }

  // Group topics by Unit
  const unitsMap: Record<string, { unitName: string; topics: Topic[] }> = {};
  for (const t of topics) {
    const uKey = t.unit_number || 'Unit 1';
    if (!unitsMap[uKey]) {
      unitsMap[uKey] = { unitName: t.unit_name || 'Core Units', topics: [] };
    }
    unitsMap[uKey].topics.push(t);
  }

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
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Curriculum Grounding</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Extracted Topic Map</h1>
                <p className="text-xs text-slate-500">
                  Units, topics, and subtopics extracted from your uploaded syllabus. Review or edit anytime.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditingTopic(null);
                    setTopicName('');
                    setSubtopicsText('');
                    setIsAdding(!isAdding);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAdding ? 'Cancel' : 'Add Custom Topic'}</span>
                </button>

                <button
                  onClick={() => router.push(`/workspace/${subjectId}/quiz`)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Take Diagnostic Quiz</span>
                </button>
              </div>
            </div>

            {/* ADD / EDIT TOPIC MODAL/FORM */}
            {isAdding && (
              <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingTopic ? 'Edit Topic' : 'Add New Topic to Syllabus Map'}
                  </h3>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSaveTopic} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unit Number
                      </label>
                      <input
                        type="text"
                        value={unitNumber}
                        onChange={e => setUnitNumber(e.target.value)}
                        placeholder="e.g. Unit 2"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unit Title
                      </label>
                      <input
                        type="text"
                        value={unitName}
                        onChange={e => setUnitName(e.target.value)}
                        placeholder="e.g. Memory Management"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Topic Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={topicName}
                      onChange={e => setTopicName(e.target.value)}
                      placeholder="e.g. Paging and Translation Lookaside Buffer"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subtopics (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={subtopicsText}
                      onChange={e => setSubtopicsText(e.target.value)}
                      placeholder="Page tables&#10;TLB hit ratio&#10;Inverted page tables"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingTopic(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingTopic ? 'Update Topic' : 'Save Topic'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TOPICS TREE VIEW */}
            {topics.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                <Map className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-900">No Topics Extracted Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Upload your syllabus document in the Documents tab, or click &quot;Add Custom Topic&quot; above to build your curriculum map.
                </p>
                <button
                  onClick={() => router.push(`/workspace/${subjectId}/documents`)}
                  className="mt-6 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs inline-flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Go to Document Upload</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(unitsMap).map(([unitKey, unit]) => (
                  <div key={unitKey} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Unit Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                          {unitKey.replace(/[^0-9]/g, '') || 'U'}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{unitKey}: {unit.unitName}</h3>
                          <span className="text-[11px] text-slate-500">{unit.topics.length} topic(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Topics in this unit */}
                    <div className="divide-y divide-slate-100">
                      {unit.topics.map(t => (
                        <div key={t.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{t.topic_name}</h4>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                  Source: Syllabus
                                </span>
                              </div>

                              {/* Subtopics Pills */}
                              {t.subtopics && t.subtopics.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {t.subtopics.map((sub, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                                      {sub}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(t)}
                                title="Edit Topic"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(t.id)}
                                title="Delete Topic"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
