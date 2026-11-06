import React, { useState } from 'react';
import { Topic, PracticeSession } from '@shared/types/index';
import { PracticeEngine } from '../practice/PracticeEngine';
import { ArrowRight } from 'lucide-react';

interface ExplainSimplyModeProps {
  topic: Topic;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
}

export const ExplainSimplyMode: React.FC<ExplainSimplyModeProps> = ({
  topic,
  onEvaluationComplete,
  onCancel,
}) => {
  const [targetAudience, setTargetAudience] = useState<string>(
    topic.modeContext?.targetAudience || '10-year-old child'
  );
  const [hasStarted, setHasStarted] = useState(false);

  const audiences = [
    { id: '10-year-old child', label: '10-Year-Old Child', desc: 'Use playground analogies, intuitive metaphors, zero jargon' },
    { id: 'elderly grandparent', label: 'Grandparent', desc: 'Connect to pre-digital concepts and everyday tactile realities' },
    { id: 'high school freshman', label: 'High School Student', desc: 'Relatable student scenarios with introductory analytical logic' },
    { id: 'non-technical CEO', label: 'Non-Technical Executive', desc: 'Focus strictly on systemic value, strategic risks, and clear ROI' },
  ];

  const enrichedTopic: Topic = {
    ...topic,
    title: `Explain Simply: ${topic.title}`,
    question: `Explain "${topic.title}" clearly to a ${targetAudience}. Avoid jargon and technical buzzwords. Use intuitive metaphors.`,
    taskExplanation: `Your explanation will be evaluated on technical accuracy, avoidance of jargon, and how well it resonates with a ${targetAudience}.`,
  };

  if (hasStarted) {
    return (
      <PracticeEngine
        topic={enrichedTopic}
        mode="explain-simply"
        onEvaluationComplete={onEvaluationComplete}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#929292] border border-[#E5E5E5] px-2 py-0.5 rounded">
              Mode 05 — Explain Simply
            </span>
            <span className="text-xs text-[#666666]">Feynman Technique Calibration</span>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-[#F5F5F4] border border-[#E5E5E5] rounded-lg text-[#252525]">
            Target: {targetAudience.toUpperCase()}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            Explain: {topic.title}
          </h1>
          <div className="bg-[#F5F5F4] p-5 rounded-lg border border-[#E5E5E5]">
            <p className="text-base sm:text-lg text-[#252525] leading-relaxed">
              "If you cannot explain it simply without relying on specialized vocabulary, you do not understand it fundamentally."
            </p>
          </div>
        </div>
      </div>

      {/* Target Audience Selector */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#252525]">
            Select Target Audience Persona
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            The evaluation engine evaluates your cognitive analogies, vocabulary simplicity, and listener engagement based on this persona.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {audiences.map((aud) => (
            <div
              key={aud.id}
              onClick={() => setTargetAudience(aud.id)}
              className={`p-5 rounded-lg border cursor-pointer transition-all space-y-2 ${
                targetAudience === aud.id
                  ? 'bg-[#F5F5F4] border-[#252525]'
                  : 'bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#252525]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#252525]">
                  {aud.label}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    targetAudience === aud.id ? 'bg-[#252525]' : 'bg-[#E5E5E5]'
                  }`}
                />
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">{aud.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
          <button
            onClick={onCancel}
            className="text-xs text-[#666666] hover:text-[#252525] transition-colors font-mono"
          >
            Cancel Session
          </button>
          <button
            onClick={() => setHasStarted(true)}
            className="px-5 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
          >
            <span>Proceed to Speaking Stage</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
