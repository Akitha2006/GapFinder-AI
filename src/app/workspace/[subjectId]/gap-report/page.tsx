'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { MasteryBadge } from '@/components/Badge';
import { 
  Target, 
  HelpCircle, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  Sparkles,
  BarChart3,
  Layers
} from 'lucide-react';
import { Subject, TopicMastery, MasteryClassification } from '@/types';

interface GapReportData {
  summary: {
    totalTopics: number;
    assessedCount: number;
    strongCount: number;
    mediumCount: number;
    weakCount: number;
    needsAssessmentCount: number;
    overallAverageAccuracy: number;
  };
  groups: {
    weak: TopicMastery[];
    medium: TopicMastery[];
    strong: TopicMastery[];
    needs_assessment: TopicMastery[];
  };
  mastery: TopicMastery[];
  config: {
    strongThreshold: number;
    mediumThreshold: number;
    minEvidenceQuestions: number;
  };
  disclaimer: string;
}

export default function KnowledgeGapReportPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [report, setReport] = useState<GapReportData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'weak' | 'medium' | 'strong' | 'needs_assessment'>('all');
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
        const [subRes, gapRes] = await Promise.all([
          fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
          fetch(`/api/gap-report?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
        ]);

        const subData = await subRes.json();
        const gapData = await gapRes.json();

        setSubject(subData.subject || null);
        setReport(gapData || null);
      } catch (err) {
        console.error('Error loading gap report:', err);
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
            <span>Analyzing knowledge gap evidence matrix...</span>
          </div>
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto p-8 text-center">
          <p className="text-slate-500 text-xs">Knowledge Gap Report unavailable.</p>
        </div>
      </>
    );
  }

  const { summary, groups, config, disclaimer } = report;

  // Filter topics by activeTab
  let displayedTopics: TopicMastery[] = report.mastery;
  if (activeTab === 'weak') displayedTopics = groups.weak;
  else if (activeTab === 'medium') displayedTopics = groups.medium;
  else if (activeTab === 'strong') displayedTopics = groups.strong;
  else if (activeTab === 'needs_assessment') displayedTopics = groups.needs_assessment;

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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold mb-2">
                  <Target className="w-3.5 h-3.5 text-rose-600" />
                  <span>Primary Diagnostic Feature</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">Knowledge Gap Report</h1>
                <p className="text-xs text-slate-500">
                  Mathematical topic classification with verifiable quiz evidence, question breakdowns, and tailored next actions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/workspace/${subjectId}/quiz`}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Take Diagnostic Quiz</span>
                </Link>

                <Link
                  href={`/workspace/${subjectId}/revision-plan`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Update Revision Plan</span>
                </Link>
              </div>
            </div>

            {/* Configurable Threshold Notice & Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 leading-relaxed">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950">
                  Deterministic Classification Criteria (Configurable Standards):
                </p>
                <p className="text-[11px] text-blue-800 mt-1">
                  • <strong>Strong:</strong> ≥{config.strongThreshold}% accuracy &nbsp;|&nbsp;
                  • <strong>Medium:</strong> {config.mediumThreshold}% to &lt;{config.strongThreshold}% accuracy &nbsp;|&nbsp;
                  • <strong>Weak Knowledge Gap:</strong> &lt;{config.mediumThreshold}% accuracy &nbsp;|&nbsp;
                  • <strong>Needs More Assessment:</strong> &lt;{config.minEvidenceQuestions} questions attempted.
                </p>
                <p className="text-[10px] text-blue-700/80 mt-1.5 italic">
                  {disclaimer}
                </p>
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Weak Card */}
              <button
                type="button"
                onClick={() => setActiveTab('weak')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  activeTab === 'weak'
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400 shadow-sm'
                    : 'bg-white border-rose-100 hover:border-rose-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700">Weak Topics</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-rose-600">{summary.weakCount}</div>
                <div className="mt-1 text-[11px] text-rose-600/80 font-medium">Critical revision priority</div>
              </button>

              {/* Medium Card */}
              <button
                type="button"
                onClick={() => setActiveTab('medium')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  activeTab === 'medium'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-sm'
                    : 'bg-white border-amber-100 hover:border-amber-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700">Medium Topics</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-amber-600">{summary.mediumCount}</div>
                <div className="mt-1 text-[11px] text-amber-600/80 font-medium">Needs concept consolidation</div>
              </button>

              {/* Strong Card */}
              <button
                type="button"
                onClick={() => setActiveTab('strong')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  activeTab === 'strong'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-sm'
                    : 'bg-white border-emerald-100 hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">Strong Mastery</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-600">{summary.strongCount}</div>
                <div className="mt-1 text-[11px] text-emerald-600/80 font-medium">Spaced recall scheduled</div>
              </button>

              {/* Needs Assessment Card */}
              <button
                type="button"
                onClick={() => setActiveTab('needs_assessment')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  activeTab === 'needs_assessment'
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400 shadow-sm'
                    : 'bg-white border-indigo-100 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">Needs Assessment</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-indigo-600">{summary.needsAssessmentCount}</div>
                <div className="mt-1 text-[11px] text-indigo-600/80 font-medium">&lt;{config.minEvidenceQuestions} questions attempted</div>
              </button>
            </div>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Topics ({summary.totalTopics})
              </button>
              <button
                onClick={() => setActiveTab('weak')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'weak'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Weak ({summary.weakCount})
              </button>
              <button
                onClick={() => setActiveTab('medium')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'medium'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Medium ({summary.mediumCount})
              </button>
              <button
                onClick={() => setActiveTab('strong')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'strong'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Strong ({summary.strongCount})
              </button>
              <button
                onClick={() => setActiveTab('needs_assessment')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'needs_assessment'
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                Needs Assessment ({summary.needsAssessmentCount})
              </button>
            </div>

            {/* TOPICS DETAIL LIST WITH EVIDENCE & RECOMMENDATIONS */}
            {displayedTopics.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-800">No topics in this category</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Try selecting another category or take a diagnostic quiz to collect evaluation evidence.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTopics.map(item => {
                  const isWeak = item.classification === 'weak';
                  const isMedium = item.classification === 'medium';
                  const isStrong = item.classification === 'strong';
                  const isNeeds = item.classification === 'needs_more_assessment';

                  return (
                    <div
                      key={item.id}
                      className={`p-6 rounded-2xl border bg-white shadow-xs transition-all ${
                        isWeak
                          ? 'border-rose-200'
                          : isMedium
                          ? 'border-amber-200'
                          : isStrong
                          ? 'border-emerald-200'
                          : 'border-indigo-200'
                      }`}
                    >
                      {/* Top Header of Topic Card */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {item.unit_name || 'Curriculum Topic'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                            {item.topic_name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Accuracy Pill */}
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-900">
                              {item.total_attempted > 0 ? `${item.accuracy_percentage}%` : 'N/A'}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {item.total_attempted > 0 ? `${item.total_correct}/${item.total_attempted} correct` : '0 attempted'}
                            </span>
                          </div>

                          <MasteryBadge classification={item.classification} />
                        </div>
                      </div>

                      {/* Accuracy Visual Meter */}
                      {item.total_attempted > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-medium">
                            <span>Diagnostic Accuracy Meter</span>
                            <span>{item.accuracy_percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 transition-all duration-500 ${
                                isStrong ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, item.accuracy_percentage))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Evidence & Reasoning Section */}
                      <div className="mt-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Classification Evidence Reasoning:</span>
                          {/* Trend indicator */}
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            {item.trend === 'improving' ? (
                              <span className="text-emerald-700 flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" /> Improving
                              </span>
                            ) : item.trend === 'declining' ? (
                              <span className="text-rose-700 flex items-center gap-0.5">
                                <TrendingDown className="w-3.5 h-3.5" /> Declining
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Minus className="w-3.5 h-3.5" /> Stable
                              </span>
                            )}
                          </span>
                        </div>

                        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                          {item.reasons.map((r, rIdx) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Action & Action Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">Recommended Action: </span>
                          <span className="text-slate-600">
                            {isWeak
                              ? 'Schedule immediate foundational review & targeted re-quiz'
                              : isMedium
                              ? 'Reinforce nuanced edge cases with problem-solving exercises'
                              : isStrong
                              ? 'Maintain spaced repetition checkpoints before the exam'
                              : 'Attempt at least 3 diagnostic questions for confident baseline'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/workspace/${subjectId}/assistant?q=Explain+${encodeURIComponent(item.topic_name || 'Topic')}`}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                          >
                            Ask Assistant
                          </Link>
                          <Link
                            href={`/workspace/${subjectId}/quiz`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                          >
                            <span>Targeted Quiz</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
