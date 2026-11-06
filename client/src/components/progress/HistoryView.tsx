import React, { useState } from 'react';
import { PracticeSession, PracticeMode } from '@shared/types/index';
import { storageService } from '../../services/storage';
import {
  History,
  Trash2,
  ExternalLink,
  Volume2,
  Calendar,
  Clock,
  Award,
  Filter,
} from 'lucide-react';

interface HistoryViewProps {
  sessions: PracticeSession[];
  onOpenSession: (session: PracticeSession) => void;
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onOpenSession,
  onRefresh,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this practice session?')) {
      storageService.deleteSession(id);
      onRefresh();
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.mode === selectedFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Session History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your past speeches, transcripts, and evaluation scorecards.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">All Modes</option>
            <option value="impromptu">Impromptu</option>
            <option value="research">Research & Speak</option>
            <option value="debate">Debate</option>
            <option value="interview">Interview</option>
            <option value="explain-simply">Explain Simply</option>
            <option value="real-life">Real-Life</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const score = session.evaluation?.transcriptScore;
            return (
              <div
                key={session.id}
                onClick={() => onOpenSession(session)}
                className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {session.mode.replace('-', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {session.topic.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1 italic">
                    "{session.originalTranscript.substring(0, 100)}..."
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  {score !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {score}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                      <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                        {session.evaluation?.performanceLevel}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No sessions found</h3>
          <p className="text-xs text-slate-400">
            Start a speaking exercise from the Dashboard to record your first session.
          </p>
        </div>
      )}
    </div>
  );
};
