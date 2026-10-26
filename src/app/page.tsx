'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { 
  Compass, 
  Target, 
  BrainCircuit, 
  CalendarClock, 
  FileSearch, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  Sparkles,
  Layers,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50 py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-6 shadow-sm border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Generation Personalized Academic Diagnosis</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
              Discover What You Don’t Know. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                Learn What Matters.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Stop re-reading chapters you already know. GapFinder AI analyzes your syllabus and study notes, generates diagnostic quizzes grounded strictly in your materials, pinpoints your exact knowledge gaps with verifiable evidence, and creates an adaptive revision plan.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-700 font-semibold border border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <span>Log In / Quick Demo</span>
              </Link>
            </div>

            {/* Metric pill bar */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="block text-2xl font-bold text-slate-900">100%</span>
                <span className="text-xs text-slate-500 font-medium">Document Grounded</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="block text-2xl font-bold text-rose-600">&lt;50%</span>
                <span className="text-xs text-slate-500 font-medium">Weak Topics Targeted</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="block text-2xl font-bold text-emerald-600">Dynamic</span>
                <span className="text-xs text-slate-500 font-medium">Revision Scheduling</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="block text-2xl font-bold text-indigo-600">Deterministic</span>
                <span className="text-xs text-slate-500 font-medium">Evidence Classification</span>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Why GapFinder AI</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">
                A True Academic Diagnostic Engine, Not Just Another Chatbot
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Traditional study tools give generic quizzes from internet data. GapFinder AI works strictly from your own course syllabus, lecture slides, and textbook chapters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-5">
                    <FileSearch className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Automated Topic & Subtopic Mapping</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Upload your syllabus (PDF or TXT). The system extracts units, chapters, topics, and subtopics, linking each to source material without hallucinating outside topics.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <span>Structured curriculum parsing</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-5">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Deterministic Gap Diagnosis</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Transparent mathematical classification: Strong (≥80%), Medium (50–79%), and Weak (&lt;50%). Each classification provides transparent evidence from your actual quiz answers.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-rose-700 flex items-center gap-1">
                  <span>Evidence-based reasoning</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
                    <CalendarClock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Adaptive Revision Scheduler</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Generates a day-by-day revision plan respecting your target exam date and daily available study minutes. Automatically updates when new quiz scores change your topic mastery.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <span>Dynamic time-capped study sprint</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The Workflow</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">How GapFinder AI Operates</h2>
              <p className="mt-3 text-base text-slate-600">
                A closed-loop diagnostic and learning cycle designed around active recall and spaced revision.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                  1
                </span>
                <h4 className="font-bold text-base text-slate-900">Upload Course Material</h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Provide your syllabus, lecture slides, and past papers. The server extracts text, sections, and builds vector chunks.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                  2
                </span>
                <h4 className="font-bold text-base text-slate-900">Take Diagnostic Quiz</h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Questions are generated via RAG strictly from retrieved sections of your study material with 4 plausible options.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                  3
                </span>
                <h4 className="font-bold text-base text-slate-900">Inspect Gap Diagnosis</h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Review calculated weak and medium topics with exact mathematical evidence, questions missed, and citations.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                  4
                </span>
                <h4 className="font-bold text-base text-slate-900">Follow Revision Plan</h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Execute daily scheduled tasks, mark items complete, and retake quizzes to see your knowledge gaps close over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Built for Mastery</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  Empowering Students & Instructors
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">Eliminates Revision Blind Spots</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Students stop spending 80% of study time on comfortable topics.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">Evidence Over Speculation</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Diagnoses explain the exact reason for classification with question citations.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">Grounded RAG Assistant</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Ask questions about difficult topics and receive citations directly referencing your uploaded textbook pages.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <span>Start Your First Study Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-rose-600" />
                    <span className="text-sm font-bold text-slate-900">Sample Gap Diagnostic Preview</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Weak (&lt;50%)</span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-900">Memory Allocation & Pointer Arithmetic</p>
                    <p className="text-[11px] text-slate-500 mt-1">Accuracy: 25.0% (1/4 correct) • Unit 2 Operating Systems</p>
                    <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                      Reason: Failed 3 questions regarding segmentation offset bounds.
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-900">Process Scheduling & Context Switching</p>
                    <p className="text-[11px] text-slate-500 mt-1">Accuracy: 85.0% (6/7 correct) • Unit 1 Foundations</p>
                    <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                      Strong mastery demonstrated. Scheduled for spaced retention check in 4 days.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <span className="text-white font-bold text-sm">GapFinder AI</span>
              <span className="text-xs text-slate-500">Academic Tech Suite</span>
            </div>
            <p className="text-xs text-slate-500">
              Personalized Learning and Knowledge Gap Detection • Vercel-compatible Next.js App Router Architecture
            </p>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/auth/login" className="hover:text-white transition-colors">Log In</Link>
              <Link href="/auth/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
