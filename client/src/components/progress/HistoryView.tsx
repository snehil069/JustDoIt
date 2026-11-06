import React, { useState } from 'react';
import { PracticeSession } from '@shared/types/index';
import { storageService } from '../../services/storage';
import {
  History,
  Trash2,
  Calendar,
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
    if (confirm('Delete this recorded practice session?')) {
      storageService.deleteSession(id);
      onRefresh();
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.mode === selectedFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Chronological Archive</span>
            <span className="text-[#E5E5E5]">•</span>
            <span className="text-xs text-[#666666]">{sessions.length} Sessions Logged</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            Practice History & Audits
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] max-w-2xl leading-relaxed pt-1">
            Review past recorded speeches, full verbatim transcripts, and 7-dimension diagnostic reports.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-[#929292]" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-xs text-[#252525] focus:outline-none focus:border-[#252525]"
          >
            <option value="all">All Practice Modes</option>
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
                className="group bg-[#FFFFFF] p-5 lg:p-6 rounded-lg border border-[#E5E5E5] hover:border-[#252525] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded border border-[#E5E5E5] bg-[#F5F5F4] text-[#252525] text-[10px] font-mono uppercase tracking-wider">
                      {session.mode.replace('-', ' ')}
                    </span>
                    <span className="text-[11px] text-[#929292] font-mono flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#929292]" />
                      <span>
                        {new Date(session.startedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>

                  <h3 className="font-semibold text-[#252525] text-base group-hover:text-[#252525] transition-colors">
                    {session.topic.title}
                  </h3>

                  <p className="text-xs text-[#666666] line-clamp-1 italic font-mono">
                    "{session.originalTranscript.substring(0, 110)}..."
                  </p>
                </div>

                <div className="flex items-center space-x-6 self-end sm:self-center">
                  {score !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-light font-mono text-[#252525]">
                        {score}
                        <span className="text-xs font-normal text-[#929292]">/100</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
                        {session.evaluation?.performanceLevel}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 text-[#929292] hover:text-[#252525] rounded-lg hover:bg-[#F5F5F4] transition-colors"
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
        <div className="p-12 text-center bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] space-y-2">
          <History className="w-6 h-6 text-[#929292] mx-auto" />
          <h3 className="font-medium text-sm text-[#252525]">No recorded sessions found</h3>
          <p className="text-xs text-[#666666]">
            Start a speaking exercise from the Dashboard to record and archive your first session.
          </p>
        </div>
      )}
    </div>
  );
};
