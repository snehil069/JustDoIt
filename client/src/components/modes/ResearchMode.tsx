import React, { useState, useEffect, useRef } from 'react';
import { Topic, PracticeSession } from '@shared/types/index';
import { PracticeEngine } from '../practice/PracticeEngine';
import {
  Clock,
  BookOpen,
  Edit3,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface ResearchModeProps {
  topic: Topic;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
}

export const ResearchMode: React.FC<ResearchModeProps> = ({
  topic,
  onEvaluationComplete,
  onCancel,
}) => {
  const [phase, setPhase] = useState<'prep' | 'speaking'>('prep');
  const [prepDurationSec, setPrepDurationSec] = useState<number>(300); // 5 minutes default
  const [remainingPrepSec, setRemainingPrepSec] = useState<number>(300);
  const [userNotes, setUserNotes] = useState<string>('');

  const prepTimerStartRef = useRef<number>(Date.now());
  const prepIntervalRef = useRef<any>(null);

  useEffect(() => {
    prepTimerStartRef.current = Date.now();
    prepIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - prepTimerStartRef.current) / 1000);
      const remaining = Math.max(0, prepDurationSec - elapsed);
      setRemainingPrepSec(remaining);

      if (remaining <= 0) {
        clearInterval(prepIntervalRef.current);
        setPhase('speaking');
      }
    }, 250);

    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    };
  }, [prepDurationSec]);

  const handleStartSpeakingEarly = () => {
    if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    setPhase('speaking');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (phase === 'speaking') {
    return (
      <PracticeEngine
        topic={topic}
        mode="research"
        researchNotes={userNotes}
        onEvaluationComplete={onEvaluationComplete}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Preparation Phase Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mode B — Research & Speak</span>
          </div>

          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prep Timer: {formatTime(remainingPrepSec)}</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {topic.title}
          </h1>
          <p className="mt-2 text-emerald-100 text-sm leading-relaxed max-w-2xl">
            {topic.question}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-emerald-200/80 italic">
            You have {formatTime(remainingPrepSec)} to formulate your thoughts and jot down notes before oral delivery begins.
          </p>
          <button
            onClick={handleStartSpeakingEarly}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Ready to Speak</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Subtopics & Research Questions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Suggested Subtopics</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {topic.hints?.map((hint, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <h4 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Rules of Delivery
            </h4>
            <p>1. Do not read your notes word-for-word.</p>
            <p>2. Explain concepts in your own natural vocabulary.</p>
            <p>3. AI will evaluate whether you understood the ideas rather than reciting memorized text.</p>
          </div>
        </div>

        {/* User Research Notes Area */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Your Preparation Notes
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {userNotes.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Jot down bullet points, key facts, statistics, or an outline (Introduction -> 3 Core Points -> Conclusion)..."
            className="w-full h-64 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed resize-none"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              Cancel Session
            </button>
            <button
              onClick={handleStartSpeakingEarly}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Begin Speaking Stage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
