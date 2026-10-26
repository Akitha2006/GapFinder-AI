'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Bot, 
  User as UserIcon, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Subject, TopicMastery } from '@/types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    doc_name: string;
    page_number?: number;
    section_title?: string;
    excerpt: string;
  }>;
  is_grounded?: boolean;
  model_used?: string;
  timestamp: string;
}

export default function AssistantPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [mastery, setMastery] = useState<TopicMastery[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        setMastery(gapData.mastery || []);

        // Initial welcome message
        setMessages([
          {
            id: 'welcome-msg',
            sender: 'assistant',
            content: `Hello! I am your Explain-This-Topic RAG Assistant for **${subData.subject?.name || 'this subject'}**. I answer questions strictly using the documents, notes, and past papers you have uploaded. Ask me to clarify any difficult concept or review your weak topics!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        console.error('Error loading assistant context:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user && subjectId) {
      loadData();
    }
  }, [subjectId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setSending(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-student-uuid-42',
        },
        body: JSON.stringify({
          subjectId,
          question: textToSend.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        is_grounded: data.is_grounded,
        model_used: data.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unable to retrieve grounded content.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Connecting grounded RAG vector index...</span>
          </div>
        </div>
      </>
    );
  }

  // Weak topics for prompt suggestions
  const weakTopics = mastery.filter(m => m.classification === 'weak');

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <SubjectSidebar subjectId={subjectId} subjectName={subject?.name} />

        <main className="flex-1 p-6 md:p-8 bg-slate-50 flex flex-col">
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col space-y-4">
            {/* Header */}
            <div className="pb-4 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Supporting RAG Assistant</span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Explain-This-Topic Assistant</h1>
              <p className="text-xs text-slate-500">
                Ground-truth academic answers derived strictly from your course documents with page citations
              </p>
            </div>

            {/* Suggested prompts based on weak topics */}
            {weakTopics.length > 0 && (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[11px] font-bold text-rose-900 block mb-1.5">
                  Suggested inquiries based on your detected knowledge gaps:
                </span>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.slice(0, 3).map(wt => (
                    <button
                      key={wt.id}
                      onClick={() => handleSend(`Can you explain ${wt.topic_name} in detail with examples from the uploaded material?`)}
                      className="text-[11px] font-medium px-2.5 py-1 bg-white border border-rose-200 hover:border-rose-400 text-rose-800 rounded-lg shadow-2xs transition-all flex items-center gap-1 text-left"
                    >
                      <Sparkles className="w-3 h-3 text-rose-500" />
                      <span>Explain {wt.topic_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT MESSAGES WINDOW */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto space-y-6 shadow-xs max-h-[550px]">
              {messages.map(msg => {
                const isUser = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                      isUser ? 'bg-slate-800' : 'bg-blue-600'
                    }`}>
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Source Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Grounded Document Citations ({msg.citations.length})
                          </span>

                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.citations.map((c, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-600"
                              >
                                <span className="font-bold text-slate-800">{c.doc_name}</span>
                                {c.page_number && <span className="ml-1 text-slate-500">(Page {c.page_number})</span>}
                                {c.section_title && <span className="ml-1 text-slate-500">• Section: {c.section_title}</span>}
                                <p className="text-[10px] text-slate-500 italic mt-0.5">&quot;{c.excerpt}&quot;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={`text-[10px] mt-2 flex items-center justify-between ${
                        isUser ? 'text-blue-100' : 'text-slate-400'
                      }`}>
                        <span>{msg.model_used || ''}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Retrieving document vectors & formulating grounded answer...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BOX */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder="Ask anything about your syllabus, lecture notes, or weak topics..."
                disabled={sending}
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              <button
                type="submit"
                disabled={sending || !inputQuery.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
