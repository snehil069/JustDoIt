import React from 'react';
import { PracticeMode } from '@shared/types/index';
import {
  Mic,
  BookOpen,
  Users,
  Briefcase,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ModeSelectorViewProps {
  onSelectMode: (mode: PracticeMode) => void;
}

export const ModeSelectorView: React.FC<ModeSelectorViewProps> = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'impromptu' as PracticeMode,
      code: 'MODE 01',
      title: 'Impromptu Speaking',
      subtitle: 'Think and speak on your feet without a script',
      icon: Mic,
      description:
        'The foundational daily workout: receive a random word challenge with a concrete task, open-ended question, or hypothetical situation. Speak for 1 to 5 minutes with real-time transcription and instant diagnostic feedback.',
      tags: ['Daily Core', 'Quick Reflexes', 'Fluency'],
    },
    {
      id: 'research' as PracticeMode,
      code: 'MODE 02',
      title: 'Research & Speak',
      subtitle: 'Formulate, structure, and synthesize complex thoughts',
      icon: BookOpen,
      description:
        'Trains you to research a topic with a dedicated 5-minute preparation timer and note-taking scratchpad before speaking. Evaluates your spoken understanding rather than recitation of written notes.',
      tags: ['Academic', 'Note-Taking', 'Synthesis'],
    },
    {
      id: 'debate' as PracticeMode,
      code: 'MODE 03',
      title: 'Debate Mode',
      subtitle: 'Argue, defend, and counter-scrutinize in real-time',
      icon: Users,
      description:
        'Engage in a multi-round debate against an intellectually rigorous AI opponent that actively challenges weak premises, unsupported claims, and cognitive contradictions without blindly agreeing with you.',
      tags: ['Critical Thinking', 'Rebuttal', 'Logic'],
    },
    {
      id: 'interview' as PracticeMode,
      code: 'MODE 04',
      title: 'Interview Simulator',
      subtitle: 'Master HR, behavioral STAR, and technical questioning',
      icon: Briefcase,
      description:
        'Step-by-step interview rounds where the AI analyzes your answers, probes vague claims, evaluates STAR execution (Situation, Task, Action, Result), and asks targeted follow-up questions.',
      tags: ['Career Prep', 'STAR Framework', 'Clarity'],
    },
    {
      id: 'explain-simply' as PracticeMode,
      code: 'MODE 05',
      title: 'Explain Simply',
      subtitle: 'Demystify complex technical concepts for any audience',
      icon: HelpCircle,
      description:
        'Explain intricate ideas like Blockchain, Operating Systems, or AI to a 10-year-old child or a non-technical executive. Evaluates technical accuracy, intuitive metaphors, and avoidance of unnecessary jargon.',
      tags: ['Analogies', 'Plain English', 'Clarity'],
    },
    {
      id: 'real-life' as PracticeMode,
      code: 'MODE 06',
      title: 'Real-Life Situations',
      subtitle: 'Navigate high-stakes interpersonal and team dilemmas',
      icon: ShieldAlert,
      description:
        'Practical scenarios in college life, project teams, and workplaces: handle a teammate who hasn’t contributed, respectfully disagree with authority, or address credit-stealing with tact and composure.',
      tags: ['Workplace', 'Diplomacy', 'Conflict Resolution'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Curriculum Engine</span>
            <span className="text-[#E5E5E5]">•</span>
            <span className="text-xs text-[#666666]">6 Calibrated Practice Modes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            Speaking & Thinking Practice Modes
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] max-w-2xl leading-relaxed pt-1">
            Choose a targeted module to build rhetorical agility, logical structure, and poise under live pressure. Every session produces a detailed 7-dimension diagnostic audit.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-[#929292] border border-[#E5E5E5] px-3 py-1.5 rounded-lg bg-[#F5F5F4] self-start md:self-auto">
          <span>Active Standard: CEFR C1</span>
        </div>
      </div>

      {/* Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 hover:border-[#252525] transition-all cursor-pointer flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center text-[#252525] group-hover:bg-[#252525] group-hover:text-[#FFFFFF] transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] text-[#929292] uppercase tracking-wider border border-[#E5E5E5] px-2 py-0.5 rounded">
                    {mode.code}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-[#252525] tracking-tight group-hover:text-[#252525] transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-xs font-medium text-[#666666]">
                    {mode.subtitle}
                  </p>
                  <p className="text-xs text-[#666666] leading-relaxed pt-1">
                    {mode.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {mode.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F4] border border-[#E5E5E5] text-[#666666]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between text-xs font-medium text-[#252525]">
                <span>Launch Practice Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
