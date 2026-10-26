'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Map, 
  HelpCircle, 
  Target, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  subjectId: string;
  subjectName?: string;
}

export function SubjectSidebar({ subjectId, subjectName }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      label: 'Workspace Hub',
      href: `/workspace/${subjectId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Documents & Notes',
      href: `/workspace/${subjectId}/documents`,
      icon: FileText,
    },
    {
      label: 'Extracted Topic Map',
      href: `/workspace/${subjectId}/topic-map`,
      icon: Map,
    },
    {
      label: 'Diagnostic Quiz',
      href: `/workspace/${subjectId}/quiz`,
      icon: HelpCircle,
    },
    {
      label: 'Knowledge Gap Report',
      href: `/workspace/${subjectId}/gap-report`,
      icon: Target,
      highlight: true,
    },
    {
      label: 'Personalized Revision Plan',
      href: `/workspace/${subjectId}/revision-plan`,
      icon: Calendar,
    },
    {
      label: 'Explain-This-Topic RAG',
      href: `/workspace/${subjectId}/assistant`,
      icon: MessageSquare,
    },
    {
      label: 'Progress & Mastery',
      href: `/workspace/${subjectId}/progress`,
      icon: TrendingUp,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
      <div>
        {/* Back Link */}
        <Link
          href="/workspace"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          All Subjects
        </Link>

        {/* Subject Header */}
        <div className="mb-6 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Active Workspace</span>
          <h2 className="text-base font-bold text-slate-900 truncate" title={subjectName || 'Study Workspace'}>
            {subjectName || 'Subject Workspace'}
          </h2>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {links.map(link => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname?.startsWith(link.href);

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : link.highlight
                    ? 'text-blue-700 bg-blue-50/70 hover:bg-blue-100/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : link.highlight ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-700">Deterministic Diagnosis</p>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
            Gap classifications rely on verifiable quiz evidence, not model guessing.
          </p>
        </div>
      </div>
    </aside>
  );
}
