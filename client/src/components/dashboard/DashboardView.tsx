import React from 'react';
import {
  Mic,
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  Compass,
  BookOpen,
  Users,
  Briefcase,
  HelpCircle,
  ShieldAlert,
  Play,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { UserProgress, Topic, PracticeMode } from '@shared/types/index';

interface DashboardViewProps {
  progress: UserProgress;
  dailyChallenge: Topic | null;
  onStartPractice: (mode: PracticeMode, topic?: Topic) => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  dailyChallenge,
  onStartPractice,
  onNavigate,
}) => {
  // Format speaking time
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const modesList = [
    {
      id: 'impromptu' as PracticeMode,
      title: 'Impromptu Speaking',
      tagline: 'Primary training: think on your feet without a script',
      icon: Mic,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Most Popular',
    },
    {
      id: 'research' as PracticeMode,
      title: 'Research & Speak',
      tagline: '5-min prep timer, structured note-taking, and oral delivery',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Academic',
    },
    {
      id: 'debate' as PracticeMode,
      title: 'Debate Mode',
      tagline: 'Multi-round interactive debate against an uncompromising AI opponent',
      icon: Users,
      color: 'from-violet-600 to-purple-600',
      badge: 'Logic & Reasoning',
    },
    {
      id: 'interview' as PracticeMode,
      title: 'Interview Simulator',
      tagline: 'Targeted STAR behavioral, HR, and technical questions with follow-ups',
      icon: Briefcase,
      color: 'from-amber-600 to-orange-600',
      badge: 'Career',
    },
    {
      id: 'explain-simply' as PracticeMode,
      title: 'Explain Simply',
      tagline: 'Demystify complex technical concepts to a 10-year-old child',
      icon: HelpCircle,
      color: 'from-pink-600 to-rose-600',
      badge: 'Clarity',
    },
    {
      id: 'real-life' as PracticeMode,
      title: 'Real-Life Situations',
      tagline: 'Navigate high-stakes team conflicts, presentations, and diplomacy',
      icon: ShieldAlert,
      color: 'from-cyan-600 to-blue-600',
      badge: 'Practical',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Speaking Habit</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Think clearly. Speak honestly. <br className="hidden sm:inline" />
            Improve every single day.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            SpeakUp doesn't give you flattery. We provide rigorous, evidence-based speech evaluation,
            pinpointing grammatical slips, vague arguments, and delivery bottlenecks.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onStartPractice('impromptu')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Practising Now</span>
            </button>

            <button
              onClick={() => onNavigate('modes')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm border border-white/10 transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Modes</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none" />
      </div>

      {/* Core Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Practice Sessions</span>
            <Target className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {progress.totalSessions}
          </div>
          <p className="text-xs text-slate-500">Evaluated speeches recorded</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Speaking Time</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatTime(progress.totalSpeakingTimeSec)}
          </div>
          <p className="text-xs text-slate-500">Total time on the mic</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Practice Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            {progress.currentStreakDays} <span className="text-sm font-normal text-slate-400">days</span>
          </div>
          <p className="text-xs text-slate-500">Consistency compounds</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Communication</span>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            {progress.averageScore > 0 ? progress.averageScore : '--'}
            <span className="text-sm font-normal text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-slate-500">Calibrated rubric score</p>
        </div>
      </div>

      {/* Daily Challenge Card & Priority Improvement Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Challenge */}
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-slate-900 dark:to-brand-950/30 p-6 rounded-2xl border border-brand-200/80 dark:border-brand-900/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-600 text-white">
                <Calendar className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Today's Curated Challenge
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200 capitalize">
              {dailyChallenge?.difficulty || 'Medium'} • {Math.round((dailyChallenge?.suggestedDurationSec || 180) / 60)} min
            </span>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {dailyChallenge?.title || 'Loading Daily Prompt...'}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {dailyChallenge?.question ||
                'Discipline vs Motivation: Explain why daily discipline consistently outperforms fleeting motivation in college life.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-brand-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verbatim filler analysis & grammar critique ready</span>
            </div>

            <button
              onClick={() => onStartPractice('impromptu', dailyChallenge || undefined)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <span>Accept Challenge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Priority Focus Areas */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Learning Focus
              </h3>
              <Target className="w-4 h-4 text-rose-500" />
            </div>

            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              Areas Needing Improvement
            </h4>

            <ul className="mt-3 space-y-2.5">
              {progress.recentWeaknesses.map((weakness, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View full progress analytics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Practice Modes Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Practice Mode</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Each mode trains distinct cognitive, rhetorical, and vocal faculties.
            </p>
          </div>
          <button
            onClick={() => onNavigate('modes')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Browse all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modesList.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                onClick={() => onStartPractice(mode.id)}
                className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-500/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mode.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {mode.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {mode.tagline}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span>Start Exercise</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
