'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  Map, 
  HelpCircle, 
  Target, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Subject, DocumentItem, Topic, TopicMastery } from '@/types';

export default function SubjectHubPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mastery, setMastery] = useState<TopicMastery[]>([]);
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
        const [subRes, docRes, topRes, gapRes] = await Promise.all([
          fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/documents?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/topics?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/gap-report?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
        ]);

        const subData = await subRes.json();
        const docData = await docRes.json();
        const topData = await topRes.json();
        const gapData = await gapRes.json();

        setSubject(subData.subject || null);
        setDocuments(docData.documents || []);
        setTopics(topData.topics || []);
        setMastery(gapData.mastery || []);
      } catch (err) {
        console.error('Error loading subject workspace data:', err);
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
            <span>Loading subject workspace...</span>
          </div>
        </div>
      </>
    );
  }

  if (!subject) {
    return (
      <>
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Subject Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">This study workspace does not exist or has been deleted.</p>
          <Link href="/workspace" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
            Return to Workspaces
          </Link>
        </div>
      </>
    );
  }

  const weakCount = mastery.filter(m => m.classification === 'weak').length;
  const mediumCount = mastery.filter(m => m.classification === 'medium').length;
  const strongCount = mastery.filter(m => m.classification === 'strong').length;

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <SubjectSidebar subjectId={subjectId} subjectName={subject.name} />

        <main className="flex-1 p-6 md:p-8 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Study Hub</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{subject.name}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target Exam: {subject.exam_date ? new Date(subject.exam_date).toLocaleDateString() : 'Unscheduled'} • Daily Study Budget: {subject.daily_study_minutes} mins
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/workspace/${subjectId}/quiz`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Start Diagnostic Quiz</span>
                </Link>
              </div>
            </div>

            {/* Hub Quick Launch Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Documents */}
              <Link
                href={`/workspace/${subjectId}/documents`}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Study Documents</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Upload syllabus, lecture notes, textbook chapters, and previous question papers (PDF & TXT).
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>{documents.length} document(s) loaded</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 2: Topic Map */}
              <Link
                href={`/workspace/${subjectId}/topic-map`}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Map className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Extracted Topic Map</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Review units, topics, and subtopics parsed directly from your syllabus with source references.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>{topics.length} topics identified</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 3: Gap Report */}
              <Link
                href={`/workspace/${subjectId}/gap-report`}
                className="bg-white p-6 rounded-2xl border border-rose-100 hover:border-rose-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Knowledge Gap Report</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    View weak (&lt;50%), medium, and strong topics with mathematical evidence and reasoning.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
                  <span>{weakCount} weak topic(s) detected</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 4: Revision Plan */}
              <Link
                href={`/workspace/${subjectId}/revision-plan`}
                className="bg-white p-6 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Personalized Revision Plan</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Dynamic daily study tasks prioritized by weakness and capped by your daily study time.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Adaptive daily schedule</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 5: Explain Assistant */}
              <Link
                href={`/workspace/${subjectId}/assistant`}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Explain-This-Topic RAG</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ask questions grounded strictly in your uploaded materials with exact page and section citations.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-violet-600">
                  <span>Document-cited assistant</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 6: Progress Tracking */}
              <Link
                href={`/workspace/${subjectId}/progress`}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Progress Tracking</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Review score evolution, mastery trends, and verify that weak topics are closing.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                  <span>Quiz score history</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
