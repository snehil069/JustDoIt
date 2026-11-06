import React from 'react';
import { PracticeMode, Topic } from '@shared/types/index';
import {
  Mic,
  BookOpen,
  Users,
  Briefcase,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ModeSelectorViewProps {
  onSelectMode: (mode: PracticeMode) => void;
}

export const ModeSelectorView: React.FC<ModeSelectorViewProps> = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'impromptu' as PracticeMode,
      title: 'Mode A — Impromptu Speaking',
      subtitle: 'Think and speak on your feet without a script',
      icon: Mic,
      gradient: 'from-blue-600 to-indigo-600',
      description:
        'The foundational daily workout: receive a random word challenge with a concrete task, open-ended question, or hypothetical situation. Speak for 1 to 5 minutes with real-time transcription and instant diagnostic feedback.',
      tags: ['Daily Core', 'Quick Reflexes', 'Fluency'],
    },
    {
      id: 'research' as PracticeMode,
      title: 'Mode B — Research & Speak',
      subtitle: 'Formulate, structure, and synthesize complex thoughts',
      icon: BookOpen,
      gradient: 'from-emerald-600 to-teal-600',
      description:
        'Trains you to research a topic with a dedicated 5-minute preparation timer and note-taking scratchpad before speaking. Evaluates your spoken understanding rather than recitation of written notes.',
      tags: ['Academic', 'Note-Taking', 'Synthesis'],
    },
    {
      id: 'debate' as PracticeMode,
      title: 'Mode C — Debate Mode',
      subtitle: 'Argue, defend, and counter-scrutinize in real-time',
      icon: Users,
      gradient: 'from-violet-600 to-purple-600',
      description:
        'Engage in a multi-round debate against an intellectually rigorous AI opponent that actively challenges weak premises, unsupported claims, and cognitive contradictions without blindly agreeing with you.',
      tags: ['Critical Thinking', 'Rebuttal', 'Logic'],
    },
    {
      id: 'interview' as PracticeMode,
      title: 'Mode D — Interview Simulator',
      subtitle: 'Master HR, behavioral STAR, and technical questioning',
      icon: Briefcase,
      gradient: 'from-amber-600 to-orange-600',
      description:
        'Step-by-step interview rounds where the AI analyzes your answers, probes vague claims, evaluates STAR execution (Situation, Task, Action, Result), and asks targeted follow-up questions.',
      tags: ['Career Prep', 'STAR Framework', 'Clarity'],
    },
    {
      id: 'explain-simply' as PracticeMode,
      title: 'Mode E — Explain Simply',
      subtitle: 'Demystify complex technical concepts for any audience',
      icon: HelpCircle,
      gradient: 'from-pink-600 to-rose-600',
      description:
        'Explain intricate ideas like Blockchain, Operating Systems, or AI to a 10-year-old child or a non-technical executive. Evaluates technical accuracy, intuitive metaphors, and avoidance of unnecessary jargon.',
      tags: ['Intuitive Analogies', 'No Jargon', 'Communication'],
    },
    {
      id: 'real-life' as PracticeMode,
      title: 'Mode F — Real-Life Situations',
      subtitle: 'Navigate high-stakes interpersonal and team dilemmas',
      icon: ShieldAlert,
      gradient: 'from-cyan-600 to-blue-600',
      description:
        'Practical scenarios in college life, project teams, and workplaces: handle a teammate who hasn’t contributed, respectfully disagree with authority, or address credit-stealing with tact and composure.',
      tags: ['Workplace', 'Diplomacy', 'Conflict Resolution'],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Speaking & Thinking Practice Modes
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select a targeted practice mode to build confidence, structure, and rhetorical agility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-brand-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mode.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1">
                    {mode.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                    {mode.subtitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400">
                <span>Enter Training Mode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
