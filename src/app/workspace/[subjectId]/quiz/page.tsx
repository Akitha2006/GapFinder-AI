'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Clock, 
  Loader2,
  FileText
} from 'lucide-react';
import { Subject, Topic, Quiz, QuizQuestion, QuizDifficulty } from '@/types';

export default function DiagnosticQuizPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz Setup Config
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

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
      const fetchedTopics = topData.topics || [];
      setTopics(fetchedTopics);
      // Select all by default
      setSelectedTopicIds(fetchedTopics.map((t: Topic) => t.id));
    } catch (err) {
      console.error('Error fetching quiz setup data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && subjectId) {
      loadData();
    }
  }, [subjectId, user]);

  const toggleTopic = (id: string) => {
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length > 1) {
        setSelectedTopicIds(selectedTopicIds.filter(t => t !== id));
      }
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-student-uuid-42',
        },
        body: JSON.stringify({
          subjectId,
          topicIds: selectedTopicIds,
          count: questionCount,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate diagnostic quiz');
      }

      setActiveQuiz(data.quiz);
      setActiveQuestions(data.quiz.questions || []);
      setCurrentIndex(0);
      setSelectedAnswers({});
    } catch (err: unknown) {
      setGenerationError(err instanceof Error ? err.message : 'Error launching quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      const submissions = activeQuestions.map(q => ({
        question_id: q.id,
        user_answer: selectedAnswers[q.id] || '',
      }));

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-student-uuid-42',
        },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          answers: submissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate quiz');
      }

      // Navigate to Quiz Results page
      router.push(`/workspace/${subjectId}/quiz/${activeQuiz.id}/results`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error evaluating quiz');
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading diagnostic examination engine...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <SubjectSidebar subjectId={subjectId} subjectName={subject?.name} />

        <main className="flex-1 p-6 md:p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Examination</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Diagnostic Quiz</h1>
                <p className="text-xs text-slate-500">
                  Multiple-choice diagnostic questions grounded strictly in your uploaded materials
                </p>
              </div>
            </div>

            {/* QUIZ SETUP SCREEN (When not running an active quiz) */}
            {!activeQuiz ? (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Configure Diagnostic Assessment</h3>
                    <p className="text-xs text-slate-500">Select curriculum topics and difficulty for genuine gap detection</p>
                  </div>
                </div>

                {generationError && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                )}

                <form onSubmit={handleStartQuiz} className="space-y-6">
                  {/* Topic Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Select Topics to Assess ({selectedTopicIds.length} of {topics.length} selected)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedTopicIds.length === topics.length) {
                            setSelectedTopicIds(topics.slice(0, 1).map(t => t.id));
                          } else {
                            setSelectedTopicIds(topics.map(t => t.id));
                          }
                        }}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        {selectedTopicIds.length === topics.length ? 'Deselect Extra' : 'Select All Topics'}
                      </button>
                    </div>

                    {topics.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                        No topics extracted yet. Upload your syllabus first or the system will run a generalized subject diagnostic.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                        {topics.map(t => {
                          const isSelected = selectedTopicIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTopic(t.id)}
                              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between border transition-all ${
                                isSelected
                                  ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate mr-2">{t.topic_name}</span>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Difficulty & Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                              difficulty === d
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Number of Diagnostic Questions
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 15].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setQuestionCount(n)}
                            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                              questionCount === n
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {n} Questions
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Format: Multiple Choice (4 Options) with Grounded Citations
                    </span>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Retrieving chunks & generating grounded questions...</span>
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-4 h-4" />
                          <span>Generate Diagnostic Quiz</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ACTIVE QUIZ RUNNER INTERFACE */
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">
                      Question {currentIndex + 1} of {activeQuestions.length}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                      {activeQuestions[currentIndex]?.topic_name || 'Curriculum Diagnostic'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {Object.keys(selectedAnswers).length} / {activeQuestions.length} answered
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question Card */}
                {activeQuestions[currentIndex] && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Topic: {activeQuestions[currentIndex].topic_name}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2 leading-relaxed">
                        {activeQuestions[currentIndex].question_text}
                      </h3>
                      {activeQuestions[currentIndex].source_doc && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Retrieved from: {activeQuestions[currentIndex].source_doc} ({activeQuestions[currentIndex].source_page || 'Section Reference'})</span>
                        </p>
                      )}
                    </div>

                    {/* Options (A, B, C, D) */}
                    <div className="space-y-3">
                      {activeQuestions[currentIndex].options.map((opt, oIdx) => {
                        const optLetter = ['A', 'B', 'C', 'D'][oIdx] || `${oIdx + 1}`;
                        const isChosen = selectedAnswers[activeQuestions[currentIndex].id] === opt;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(activeQuestions[currentIndex].id, opt)}
                            className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium border flex items-start gap-3 transition-all ${
                              isChosen
                                ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold ring-1 ring-blue-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isChosen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {optLetter}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      {currentIndex < activeQuestions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentIndex(currentIndex + 1)}
                          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Next Question</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSubmitModal(true)}
                          className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Diagnostic Quiz</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMIT CONFIRMATION MODAL */}
            {showSubmitModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Submit Diagnostic Examination?</h3>
                      <p className="text-xs text-slate-500">
                        {Object.keys(selectedAnswers).length} of {activeQuestions.length} questions answered
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Submitting will evaluate your answers against the syllabus ground truth, compute your topic-level performance, and update your Knowledge Gap Report and Personalized Revision Schedule.
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Continue Quiz
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitQuiz}
                      className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? 'Evaluating...' : 'Confirm Submission'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
