import React from 'react';
import { UserProgress, Category } from '@shared/types/index';
import { TrendingUp, BarChart3, ArrowLeft } from 'lucide-react';

interface ProgressViewProps {
  progress: UserProgress;
  onNavigateHome: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ progress, onNavigateHome }) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const categories: Array<{ id: Category; label: string }> = [
    { id: 'everyday-life', label: 'Everyday Life' },
    { id: 'college-life', label: 'College & Student Life' },
    { id: 'tech-engineering', label: 'Tech & Engineering' },
    { id: 'computer-science', label: 'Computer Science' },
    { id: 'general-awareness', label: 'General Awareness' },
    { id: 'society-affairs', label: 'Society & Affairs' },
    { id: 'communication-personality', label: 'Communication' },
    { id: 'career-professional', label: 'Career & Professional' },
    { id: 'creative-thinking', label: 'Creative Thinking' },
    { id: 'critical-thinking', label: 'Critical Thinking' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header Bar */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 text-xs font-medium text-[#252525] hover:text-[#666666] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-4 w-[1px] bg-[#E5E5E5] hidden sm:block"></div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold tracking-tight text-[#252525]">SpeakUp</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#929292] border border-[#E5E5E5] px-1.5 py-0.5 rounded">
              Performance Ledger
            </span>
          </div>
        </div>

        <div className="font-mono text-xs text-[#666666]">
          Cumulative Articulation: {formatTime(progress.totalSpeakingTimeSec)}
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E5E5E5] space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Total Sessions</span>
          <div className="text-3xl font-light font-mono text-[#252525]">
            {progress.totalSessions}
          </div>
          <span className="text-xs text-[#666666] block">Verified speech evaluations</span>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E5E5E5] space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Speaking Time</span>
          <div className="text-3xl font-light font-mono text-[#252525]">
            {formatTime(progress.totalSpeakingTimeSec)}
          </div>
          <span className="text-xs text-[#666666] block">Active microphone signal</span>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E5E5E5] space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Average Score</span>
          <div className="text-3xl font-light font-mono text-[#252525] flex items-baseline space-x-1">
            <span>{progress.averageScore > 0 ? progress.averageScore : '--'}</span>
            <span className="text-xs font-normal text-[#929292]">/100</span>
          </div>
          <span className="text-xs text-[#666666] block">7-dimension rubric mean</span>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E5E5E5] space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Current Streak</span>
          <div className="text-3xl font-light font-mono text-[#252525] flex items-baseline space-x-1">
            <span>{progress.currentStreakDays}</span>
            <span className="text-xs font-normal text-[#929292]">days</span>
          </div>
          <span className="text-xs text-[#666666] block">Daily practice cadence</span>
        </div>
      </div>

      {/* Score History & Trend */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-[#252525] tracking-tight">
              Score History & Dialectical Trend
            </h3>
            <span className="text-xs text-[#666666]">Chronological progression across completed sessions</span>
          </div>
          <span className="font-mono text-xs text-[#929292]">Standardized Scale 0–100</span>
        </div>

        {progress.scoreTrend.length > 0 ? (
          <div className="space-y-3">
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-[#E5E5E5] overflow-x-auto">
              {progress.scoreTrend.map((item, i) => (
                <div key={i} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-[#252525] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.score}
                  </span>
                  <div
                    className="w-full max-w-[24px] rounded-t bg-[#252525] group-hover:bg-[#3f3f3f] transition-all"
                    style={{ height: `${Math.max(12, item.score)}%` }}
                  />
                  <span className="text-[10px] text-[#929292] font-mono truncate w-full text-center">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#666666] text-center pt-1 leading-relaxed">
              Scores reflect calibrated rubric evaluations. Weekly endurance building drives progressive structural clarity.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] text-xs text-[#929292] font-mono">
            Complete your first speaking session to map your performance trend line.
          </div>
        )}
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-[#252525] tracking-tight">
            Curriculum Category Breakdown
          </h3>
          <span className="text-xs text-[#666666]">Granular performance records across 10 subject domains</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const data = progress.categoryBreakdown[cat.id] || { completed: 0, avgScore: 0 };
            return (
              <div
                key={cat.id}
                className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-between hover:border-[#252525] transition-colors"
              >
                <div>
                  <span className="text-xs font-medium text-[#252525] block">
                    {cat.label}
                  </span>
                  <span className="text-[11px] text-[#666666] font-mono mt-0.5 block">
                    {data.completed} completed
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium font-mono text-[#252525]">
                    {data.avgScore > 0 ? `${data.avgScore}/100` : '--'}
                  </div>
                  <span className="text-[10px] text-[#929292] font-mono">Avg Score</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
