import React, { useState, useEffect, useRef } from 'react';
import { Topic, PracticeSession } from '@shared/types/index';
import { PracticeEngine } from '../practice/PracticeEngine';
import {
  Clock,
  BookOpen,
  Edit3,
  ArrowRight,
  Lightbulb,
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
  const [prepDurationSec] = useState<number>(300); // 5 minutes default
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Preparation Phase Header Card */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#929292] border border-[#E5E5E5] px-2 py-0.5 rounded">
              Mode 02 — Research & Speak
            </span>
            <span className="text-xs text-[#666666]">Phase 1: Synthesis & Ideation</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#F5F5F4] px-3.5 py-1.5 rounded-lg border border-[#E5E5E5] font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-[#252525]" />
            <span className="text-[#252525] font-semibold">Prep Countdown: {formatTime(remainingPrepSec)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            {topic.title}
          </h1>
          <div className="bg-[#F5F5F4] p-5 rounded-lg border border-[#E5E5E5]">
            <p className="text-base sm:text-lg text-[#252525] leading-relaxed">
              {topic.question}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#666666]">
            Take structured notes below. When the timer expires or when you click Ready, you will articulate your thesis without reading verbatim.
          </p>
          <button
            onClick={handleStartSpeakingEarly}
            className="px-4 py-2 rounded-lg bg-[#252525] text-[#FFFFFF] hover:bg-[#3f3f3f] font-medium text-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <span>Ready to Speak</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Subtopics & Scratchpad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Guidelines & Hints */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#929292]">
              <Lightbulb className="w-3.5 h-3.5 text-[#252525]" />
              <span>Suggested Subtopics</span>
            </div>
            <ul className="space-y-2 text-xs text-[#666666]">
              {topic.hints?.map((hint, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="w-1 h-1 rounded-full bg-[#252525] mt-1.5 flex-shrink-0" />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2 text-xs text-[#666666]">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#929292] block">
              Evaluation Criteria
            </span>
            <p>1. Do not read your notes verbatim.</p>
            <p>2. Frame concepts in your natural spoken vocabulary.</p>
            <p>3. The engine assesses understanding and rhetorical synthesis, not note recitation.</p>
          </div>
        </div>

        {/* Right Column: Scratchpad Notes Area */}
        <div className="md:col-span-2 bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-[#252525]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
                Synthesis Scratchpad
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[#929292]">
              {userNotes.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Jot down bullet points, key facts, statistical anchors, or a 3-point structure (Premise -> Evidence -> Synthesis)..."
            className="w-full h-64 p-4 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] text-xs sm:text-sm text-[#252525] placeholder-[#929292] focus:outline-none focus:border-[#252525] font-mono leading-relaxed resize-none"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onCancel}
              className="text-xs text-[#666666] hover:text-[#252525] font-medium transition-colors"
            >
              Cancel Session
            </button>
            <button
              onClick={handleStartSpeakingEarly}
              className="px-5 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
            >
              <span>Begin Oral Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
