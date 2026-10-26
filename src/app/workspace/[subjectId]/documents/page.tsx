'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SubjectSidebar } from '@/components/SubjectSidebar';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  Sparkles, 
  BookOpen,
  FileQuestion,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { Subject, DocumentItem, DocumentCategory } from '@/types';

export default function DocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('syllabus');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user || !subjectId) return;
    try {
      const [subRes, docRes] = await Promise.all([
        fetch(`/api/subjects/${subjectId}`, { headers: { 'x-user-id': user.id } }),
        fetch(`/api/documents?subjectId=${subjectId}`, { headers: { 'x-user-id': user.id } }),
      ]);
      const subData = await subRes.json();
      const docData = await docRes.json();
      setSubject(subData.subject || null);
      setDocuments(docData.documents || []);
    } catch (err) {
      console.error('Error fetching documents data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && subjectId) {
      loadData();
    }
  }, [subjectId, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'txt') {
        setUploadError('Invalid format. Please select a .pdf or .txt file.');
        setFile(null);
        return;
      }
      if (selected.size > 25 * 1024 * 1024) {
        setUploadError('File exceeds maximum size limit of 25MB.');
        setFile(null);
        return;
      }
      setUploadError(null);
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory);
      formData.append('subjectId', subjectId);

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'x-user-id': user?.id || 'demo-student-uuid-42' },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Document processing failed.');
      }

      setUploadSuccess(`"${file.name}" uploaded and processed successfully! Created ${data.chunksCreated} searchable chunks.`);
      setFile(null);
      await loadData();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Sample Material One-Click Preload for fast evaluation
  const handleLoadSampleMaterial = async () => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const sampleSyllabusText = `COURSE SYLLABUS: Operating Systems and Cloud Virtualization
Unit 1: Process Management & CPU Scheduling
- Process State Transitions and Process Control Block (PCB)
- Context Switching Overhead and Register Preservation
- Scheduling Algorithms: First-Come First-Served, Shortest Job First, Round Robin
- Multi-Level Feedback Queue Design and Starvation Prevention

Unit 2: Memory Management & Virtual Memory
- Paging Architecture, Page Tables, and Translation Lookaside Buffer (TLB)
- Demand Paging, Inverted Page Tables, and Page Fault Handling
- Page Replacement Algorithms: FIFO, Least Recently Used (LRU), Optimal
- Thrashing Phenomenon and Working Set Model

Unit 3: Concurrency, Synchronization & Deadlocks
- Critical Section Problem and Peterson's Algorithm
- Hardware Support: TestAndSet, CompareAndSwap
- Semaphores, Mutex Locks, and Classic Synchronization Problems
- Deadlock Characterization: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait
- Banker's Algorithm for Deadlock Avoidance and Resource Allocation Graphs`;

      const blob = new Blob([sampleSyllabusText], { type: 'text/plain' });
      const sampleFile = new File([blob], 'Computer_Science_Official_Syllabus.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', sampleFile);
      formData.append('category', 'syllabus');
      formData.append('subjectId', subjectId);

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'x-user-id': user?.id || 'demo-student-uuid-42' },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Also upload accompanying notes
      const sampleNotesText = `CHAPTER STUDY NOTES: Operating Systems Deep Dive
Section 1.1: Process Control Blocks (PCB)
The Process Control Block (PCB) is the primary kernel data structure representing an execution instance. It stores process state (Ready, Running, Waiting, Terminated), CPU registers, program counter, memory management limits, and open file descriptors. During a context switch, the operating system saves the PCB of the currently executing process and restores the PCB of the selected process. High context switch frequencies create significant CPU overhead without advancing user-mode computation.

Section 2.1: Virtual Memory & Page Replacement
Virtual memory decouples logical address spaces from physical DRAM through fixed-size blocks called pages (typically 4KB). The Memory Management Unit (MMU) utilizes the Translation Lookaside Buffer (TLB) as a high-speed hardware cache. When a referenced page is not present in physical RAM, a Page Fault exception traps into the kernel, initiating secondary storage disk I/O.
The Least Recently Used (LRU) algorithm replaces the page that has not been accessed for the longest duration, avoiding Belady's Anomaly which plagues FIFO replacement. Thrashing occurs when high degrees of multiprogramming cause the sum of active working sets to exceed physical memory limits, resulting in continuous page faulting.

Section 3.1: Deadlock Avoidance & Banker's Algorithm
A deadlock occurs when a set of concurrent processes are blocked because each process holds a resource and waits for another resource held by another process in the set. Dijkstra's Banker's Algorithm ensures safe state transitions by simulating resource allocations before granting requests. If an allocation would leave the system in an unsafe state where remaining resource vectors cannot satisfy any process's maximum claims, the request is delayed.`;

      const notesBlob = new Blob([sampleNotesText], { type: 'text/plain' });
      const notesFile = new File([notesBlob], 'OS_Lecture_Notes_Units_1_to_3.txt', { type: 'text/plain' });

      const notesForm = new FormData();
      notesForm.append('file', notesFile);
      notesForm.append('category', 'notes');
      notesForm.append('subjectId', subjectId);

      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'x-user-id': user?.id || 'demo-student-uuid-42' },
        body: notesForm,
      });

      setUploadSuccess('Preloaded Official Syllabus & Comprehensive Lecture Notes! Topics and vector chunks have been extracted.');
      await loadData();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to preload sample material.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document and its chunk vectors?')) return;
    try {
      await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || 'demo-student-uuid-42' },
      });
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading documents...</span>
          </div>
        </div>
      </>
    );
  }

  // Filter documents by category
  const syllabusDocs = documents.filter(d => d.category === 'syllabus');
  const notesDocs = documents.filter(d => d.category === 'notes');
  const pyqDocs = documents.filter(d => d.category === 'pyq');

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
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Document Management</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Study Documents & Syllabus</h1>
                <p className="text-xs text-slate-500">
                  Upload PDF or TXT files. All diagnostic questions and gap reports are grounded in these materials.
                </p>
              </div>

              {/* Sample Preload Button */}
              <button
                onClick={handleLoadSampleMaterial}
                disabled={uploading}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preload Sample Syllabus & Notes</span>
              </button>
            </div>

            {/* UPLOAD FORM */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload New Course Material</span>
              </h3>

              {uploadError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Category Selection Tabs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Document Category *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('syllabus')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        selectedCategory === 'syllabus'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold">1. Syllabus</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          Automatically extracts structured units & topics
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('notes')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        selectedCategory === 'notes'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold">2. Lecture Notes & Chapters</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          Source content for diagnostic question generation
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('pyq')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        selectedCategory === 'pyq'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <FileQuestion className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold">3. Previous Papers (PYQs)</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          Historical exam patterns and high-yield questions
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* File input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select File (PDF or TXT up to 25MB) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-lg p-1.5"
                  />
                  {file && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Selected: <span className="font-semibold text-slate-800">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting text & generating vectors...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload & Process Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* DOCUMENTS LIST */}
            <div className="space-y-6">
              <h3 className="font-bold text-base text-slate-900">Loaded Documents ({documents.length})</h3>

              {documents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-700">No documents uploaded yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload your course syllabus first so GapFinder AI can extract your curriculum topic map.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">{doc.name}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {doc.file_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Category: <span className="capitalize font-medium text-slate-700">{doc.category}</span> • Pages: {doc.page_count} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                          {doc.error_message && (
                            <p className="text-[11px] text-rose-600 mt-1">Error: {doc.error_message}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          doc.status === 'ready'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'processing'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : doc.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {doc.status.toUpperCase()}
                        </span>

                        <button
                          onClick={() => handleDelete(doc.id)}
                          title="Delete Document"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation footer to next step */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Step 1 of 5: Document Upload Complete
              </span>
              <button
                onClick={() => router.push(`/workspace/${subjectId}/topic-map`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Proceed to Extracted Topic Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
