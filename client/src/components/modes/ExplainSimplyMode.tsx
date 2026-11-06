import React, { useState } from 'react';
import { Topic, PracticeSession } from '@shared/types/index';
import { PracticeEngine } from '../practice/PracticeEngine';
import { HelpCircle, Sparkles, User, ArrowRight } from 'lucide-react';

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
    { id: '10-year-old child', label: '10-Year-Old Child', desc: 'Use playground analogies, simple words, zero jargon' },
    { id: 'elderly grandparent', label: 'Grandparent', desc: 'Connect to pre-internet concepts and everyday life' },
    { id: 'high school freshman', label: 'High School Student', desc: 'Relatable teenage analogies, introductory logic' },
    { id: 'non-technical CEO', label: 'Non-Technical CEO', desc: 'Business value, risks, trade-offs, clear ROI' },
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-16">
      <div className="bg-gradient-to-r from-pink-900 to-rose-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-pink-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-semibold border border-pink-500/30">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Mode E — Explain Simply</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Explain {topic.title}
          </h1>
          <p className="mt-2 text-pink-100 text-sm leading-relaxed">
            "If you can't explain it simply, you don't understand it well enough."
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Choose Your Target Audience
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            The AI evaluator will judge whether your vocabulary, analogies, and pacing match this audience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {audiences.map((aud) => (
            <div
              key={aud.id}
              onClick={() => setTargetAudience(aud.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                targetAudience === aud.id
                  ? 'bg-pink-50 dark:bg-pink-950/40 border-pink-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-850 border-slate-200/60 dark:border-slate-800 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {aud.label}
                </span>
                {targetAudience === aud.id && (
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{aud.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onCancel} className="text-xs text-slate-500 hover:underline">
            Cancel
          </button>
          <button
            onClick={() => setHasStarted(true)}
            className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>Proceed to Speaking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
