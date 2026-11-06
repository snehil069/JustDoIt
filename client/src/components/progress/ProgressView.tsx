import React from 'react';
import { UserProgress, Category } from '@shared/types/index';
import {
  TrendingUp,
  Award,
  Flame,
  Clock,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Progress & Learning Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Metrics calculated strictly from verified session recordings and calibrated evaluations.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Sessions</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {progress.totalSessions}
          </div>
          <span className="text-[11px] text-slate-500">Evaluated speeches</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Speaking Time</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatTime(progress.totalSpeakingTimeSec)}
          </div>
          <span className="text-[11px] text-slate-500">Total active microphone time</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Average Score</span>
          <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 flex items-center gap-1 font-mono">
            {progress.averageScore > 0 ? progress.averageScore : '--'}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <span className="text-[11px] text-slate-500">Calibrated rubric score</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Current Streak</span>
          <div className="text-3xl font-extrabold text-amber-500 flex items-center gap-1.5">
            {progress.currentStreakDays} <span className="text-sm font-normal text-slate-400">days</span>
          </div>
          <span className="text-[11px] text-slate-500">Daily practice habit</span>
        </div>
      </div>

      {/* Score Trend Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Score History & Trend
            </h3>
          </div>
          <span className="text-xs text-slate-400">Recent Sessions</span>
        </div>

        {progress.scoreTrend.length > 0 ? (
          <div className="space-y-3">
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
              {progress.scoreTrend.map((item, i) => (
                <div key={i} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.score}
                  </span>
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                      item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-brand-500' : 'bg-amber-500'
                    }`}
                    style={{ height: `${Math.max(12, item.score)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 truncate w-full text-center">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center italic">
              Scores reflect genuine rubric performance. Consistency over weeks leads to measurable leaps in clarity.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl text-xs text-slate-400 italic">
            Complete your first speaking session to start mapping your communication score trend.
          </div>
        )}
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Category Practice Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const data = progress.categoryBreakdown[cat.id] || { completed: 0, avgScore: 0 };
            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cat.label}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {data.completed} completed
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {data.avgScore > 0 ? `${data.avgScore}/100` : '--'}
                  </div>
                  <span className="text-[10px] text-slate-400">Avg score</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
