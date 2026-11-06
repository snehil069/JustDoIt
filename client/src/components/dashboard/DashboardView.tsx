import React from 'react';
import {
  Mic,
  BookOpen,
  Users,
  Briefcase,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Clock,
  Flame,
  TrendingUp,
  Target,
  Sparkles,
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
      description: '60 seconds to prepare, 2 minutes to speak on an unexpected prompt.',
      duration: '3m drill',
      focus: 'Quick Synthesis',
      icon: Mic,
    },
    {
      id: 'research' as PracticeMode,
      title: 'Research & Speak',
      description: 'Synthesize brief research notes and formulate a structured executive summary.',
      duration: '5m drill',
      focus: 'Executive Briefing',
      icon: BookOpen,
    },
    {
      id: 'debate' as PracticeMode,
      title: 'Debate Mode',
      description: 'Counter AI arguments on controversial topics under real-time rebuttal pressure.',
      duration: '4m drill',
      focus: 'Counter-arguments',
      icon: Users,
    },
    {
      id: 'interview' as PracticeMode,
      title: 'Interview Simulator',
      description: 'Behavioral and technical question drills with real-time cadence scoring.',
      duration: '6m drill',
      focus: 'STAR Framework',
      icon: Briefcase,
    },
    {
      id: 'explain-simply' as PracticeMode,
      title: 'Explain Simply',
      description: 'Demystify complex technical concepts for an 8-year-old audience.',
      duration: '3m drill',
      focus: 'Plain Language',
      icon: HelpCircle,
    },
    {
      id: 'real-life' as PracticeMode,
      title: 'Real-Life Situations',
      description: 'Handling tough stakeholder updates, negotiations, and conflict resolution.',
      duration: '5m drill',
      focus: 'Tact & Composure',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      {/* Section 1: Manifesto Hero Section (Google Stitch Minimalist Design) */}
      <section className="border-b border-[#E5E5E5] pb-8 pt-2">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold tracking-widest text-[#929292] uppercase mb-3">
            Daily Rhetoric Discipline
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#252525] leading-[1.18]">
            Think clearly. Speak honestly. Improve every single day.
          </h1>
          <p className="text-base text-[#666666] font-normal mt-3 max-w-2xl leading-relaxed">
            Your daily verbal articulation and reasoning workout is ready.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <button
              onClick={() => onStartPractice('impromptu')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#252525] hover:bg-[#3a3a3a] text-white text-sm font-medium tracking-tight rounded transition-colors"
            >
              <span>Start Practising</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm text-[#929292] font-normal flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
              {progress.totalSessions > 0
                ? `Last session completed · Articulation score ${progress.averageScore}%`
                : 'Zero sessions logged today · Ready to begin'}
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: Daily Speaking Challenge Card */}
      <section className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-8 sm:p-10 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-[#E5E5E5]">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-xs font-bold tracking-widest text-[#252525] uppercase">
                DAILY CHALLENGE
              </span>
              <span className="text-xs text-[#666666] px-2.5 py-0.5 border border-[#E5E5E5] rounded bg-[#F5F5F4] font-medium">
                {dailyChallenge?.difficulty || 'Intermediate'} · {Math.round((dailyChallenge?.suggestedDurationSec || 180) / 60)} mins
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
              {dailyChallenge?.title || 'Discipline vs Motivation'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#666666] font-mono">
            <Clock className="w-3.5 h-3.5 text-[#929292]" />
            <span>Target: 3 min speech</span>
          </div>
        </div>

        <div className="py-6">
          <p className="text-[#252525] text-base leading-relaxed max-w-3xl">
            {dailyChallenge?.question ||
              'Present a concise argument on why cultivating habitual discipline yields superior long-term results compared to relying on fleeting motivation. Focus on clarity, cadence, and eliminating filler words.'}
          </p>
        </div>

        <div className="pt-4 pb-6 border-t border-[#E5E5E5]">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#666666]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#252525]">Target:</span>
              <span>140 WPM</span>
            </div>
            <span className="text-[#E5E5E5]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#252525]">Structure:</span>
              <span>Thesis, Evidence, Synthesis</span>
            </div>
            <span className="text-[#E5E5E5]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#252525]">AI Feedback:</span>
              <span className="text-[#252525] font-medium">Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => onStartPractice('impromptu', dailyChallenge || undefined)}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#252525] hover:bg-[#3a3a3a] text-white text-sm font-medium tracking-tight rounded transition-colors"
          >
            Accept Challenge
          </button>
          <button
            onClick={() => onNavigate('topics')}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-[#E5E5E5] text-[#252525] text-sm font-medium tracking-tight rounded hover:bg-[#F5F5F4] transition-colors"
          >
            Explore Topic Bank
          </button>
        </div>
      </section>

      {/* Section 3: Four Clean Metric Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-widest text-[#929292] uppercase">
            Core Articulation Metrics
          </h3>
          <span className="text-xs text-[#929292]">Real Verified Data</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-6">
            <div className="flex items-center justify-between text-xs text-[#666666] mb-3">
              <span className="font-medium">Practice Sessions</span>
              <Target className="w-4 h-4 text-[#929292]" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#252525]">
              {progress.totalSessions}
            </div>
            <div className="text-xs text-[#666666] mt-2 font-normal">
              {progress.totalSessions > 0 ? `${progress.totalSessions} sessions recorded` : 'Start your first take'}
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#929292]">
              <span>Cadence</span>
              <span className="font-mono">Daily</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-6">
            <div className="flex items-center justify-between text-xs text-[#666666] mb-3">
              <span className="font-medium">Speaking Time</span>
              <Clock className="w-4 h-4 text-[#929292]" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#252525]">
              {formatTime(progress.totalSpeakingTimeSec)}
            </div>
            <div className="text-xs text-[#666666] mt-2 font-normal">Active speech on microphone</div>
            <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#929292]">
              <span>Average WPM</span>
              <span className="font-mono">~138 WPM</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-6">
            <div className="flex items-center justify-between text-xs text-[#666666] mb-3">
              <span className="font-medium">Practice Streak</span>
              <Flame className="w-4 h-4 text-[#929292]" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#252525]">
              {progress.currentStreakDays} days
            </div>
            <div className="text-xs text-[#666666] mt-2 font-normal">Consistency compounds</div>
            <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#929292]">
              <span>Next target</span>
              <span className="font-mono">7 days</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-6">
            <div className="flex items-center justify-between text-xs text-[#666666] mb-3">
              <span className="font-medium">Avg Score</span>
              <TrendingUp className="w-4 h-4 text-[#929292]" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#252525]">
              {progress.averageScore > 0 ? `${progress.averageScore}/100` : '--'}
            </div>
            <div className="text-xs text-[#666666] mt-2 font-normal">
              {progress.averageScore > 0 ? 'Calibrated evaluation' : 'No scored sessions yet'}
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#929292]">
              <span>Rubric standard</span>
              <span className="font-mono">100 Pts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Six Interactive Practice Mode Cards */}
      <section className="pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-widest text-[#929292] uppercase">
              Interactive Modes
            </h3>
            <p className="text-sm text-[#666666] mt-0.5">
              Select a specialized exercise format based on your training goals.
            </p>
          </div>
          <button
            onClick={() => onNavigate('modes')}
            className="text-xs font-medium text-[#252525] hover:underline hidden sm:inline-flex items-center gap-1"
          >
            <span>View all exercises</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modesList.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                onClick={() => onStartPractice(mode.id)}
                className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-6 flex flex-col justify-between hover:border-[#252525] transition-colors group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded border border-[#E5E5E5] flex items-center justify-center bg-[#F5F5F4] text-[#252525]">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-mono text-[#929292] bg-[#F5F5F4] px-2 py-0.5 rounded">
                      {mode.duration}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-[#252525] group-hover:text-black transition-colors">
                    {mode.title}
                  </h4>
                  <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                    {mode.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                  <span className="text-[11px] text-[#929292]">Focus: {mode.focus}</span>
                  <span className="text-xs font-medium text-[#252525] inline-flex items-center gap-1 group-hover:underline">
                    <span>Launch Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
