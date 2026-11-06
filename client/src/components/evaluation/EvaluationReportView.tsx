import React from 'react';
import {
  EvaluationReport,
  PracticeSession,
  Topic,
  PracticeMode,
} from '@shared/types/index';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Share2,
  BookOpen,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  HelpCircle,
  FileCheck,
  Flag,
  ArrowLeft,
} from 'lucide-react';

interface EvaluationReportViewProps {
  session: PracticeSession;
  onPracticeAgain: (topic?: Topic, mode?: PracticeMode) => void;
  onNavigateHome: () => void;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  session,
  onPracticeAgain,
  onNavigateHome,
}) => {
  const report = session.evaluation;
  if (!report) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50';
    if (score >= 60) return 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-900/50';
    if (score >= 45) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50';
  };

  const getClaimBadge = (flag: string) => {
    switch (flag) {
      case 'unsupported':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      case 'needs-verification':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      case 'incorrect':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      case 'opinion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    }
  };

  const dims = report.dimensionScores;

  const dimensionsList = [
    { key: 'contentRelevance', label: 'Content Relevance & Accuracy', dim: dims.contentRelevance },
    { key: 'reasoningEvidence', label: 'Reasoning, Examples & Evidence', dim: dims.reasoningEvidence },
    { key: 'organizationStructure', label: 'Organisation & Logical Flow', dim: dims.organizationStructure },
    { key: 'clarityConstruction', label: 'Clarity & Sentence Construction', dim: dims.clarityConstruction },
    { key: 'grammar', label: 'Grammar', dim: dims.grammar },
    { key: 'vocabularyChoice', label: 'Vocabulary & Word Choice', dim: dims.vocabularyChoice },
    { key: 'fluencyFillers', label: 'Verbal Fluency & Fillers', dim: dims.fluencyFillers },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {report.isDemoMode && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
              Demo Mode Report
            </span>
          )}
          <span className="text-xs text-slate-400">
            {new Date(report.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* 1. Overall Score Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium uppercase tracking-wider">
                {session.mode.replace('-', ' ')}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {session.topic.title}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Speech Evaluation Report
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {report.mainTakeaway}
            </p>
          </div>

          {/* Calibrated Overall Score Box */}
          <div
            className={`flex-shrink-0 flex flex-col items-center justify-center p-5 rounded-2xl border ${getScoreColor(
              report.transcriptScore
            )} min-w-[140px] text-center shadow-sm`}
          >
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Score
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono my-1">
              {report.transcriptScore}
            </div>
            <span className="text-[11px] font-semibold tracking-wide">
              {report.performanceLevel}
            </span>
          </div>
        </div>

        {/* Demo Mode Notice Banner if applicable */}
        {report.isDemoMode && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>DEMO MODE:</strong> Evaluated using SpeakUp’s rule-based heuristic engine because GEMINI_API_KEY was not configured. Connect your Gemini API key in Settings to activate full generative reasoning analysis.
            </p>
          </div>
        )}

        {/* Audio player if recording retained */}
        {session.audioBlobUrl && (
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Volume2 className="w-4 h-4 text-brand-500" />
              <span>Review Your Audio Recording</span>
            </div>
            <audio controls src={session.audioBlobUrl} className="h-8 max-w-xs w-full" />
          </div>
        )}
      </div>

      {/* 2. Score Breakdown (7 Dimensions) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              7-Dimension Score Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">100 Pts Total</span>
        </div>

        <div className="space-y-4">
          {dimensionsList.map((item) => {
            const pct = Math.round((item.dim.score / item.dim.max) * 100);
            return (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.label}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {item.dim.score} / {item.dim.max} pts
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-brand-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {item.dim.feedback}
                </p>

                {item.dim.evidence && (
                  <p className="text-[11px] text-slate-400 italic">
                    Evidence: "{item.dim.evidence}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 & 4. Strengths & Priority Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              What You Did Well
            </h3>
          </div>
          <ul className="space-y-3">
            {report.strengths.map((str, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Priority Improvement Areas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Priority Weaknesses to Fix
            </h3>
          </div>
          <ul className="space-y-3">
            {report.improvementAreas.map((area, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Correct My English Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Correct My English
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {report.corrections.length} correction{report.corrections.length === 1 ? '' : 's'} identified
          </span>
        </div>

        {report.corrections.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">What I Said</th>
                  <th className="py-3 px-4 font-bold">Correct Version</th>
                  <th className="py-3 px-4 font-bold">Why It Needs Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.corrections.map((corr, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20 font-medium">
                      "{corr.whatSaid}"
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      {corr.correctVersion}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {corr.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero grammatical errors detected in the spoken sample. Outstanding phrasing!</span>
          </div>
        )}
      </div>

      {/* 6. Reasoning & Content Feedback */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Reasoning & Content Feedback
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.reasoningFeedback.strongestArgument && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Strongest Argument
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {report.reasoningFeedback.strongestArgument}
              </p>
            </div>
          )}

          {report.reasoningFeedback.weakestArgument && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Weakest Argument / Flaw
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {report.reasoningFeedback.weakestArgument}
              </p>
            </div>
          )}
        </div>

        {/* Factual claim flags */}
        {report.reasoningFeedback.unsupportedClaims && report.reasoningFeedback.unsupportedClaims.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>Claims Flagged for Fact/Evidence Scrutiny</span>
            </h4>
            <div className="space-y-2">
              {report.reasoningFeedback.unsupportedClaims.map((claimItem, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getClaimBadge(claimItem.flag)}`}>
                      {claimItem.flag}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      "{claimItem.claim}"
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    {claimItem.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.reasoningFeedback.betterExample && (
          <div className="p-4 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/40 text-xs sm:text-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Better Concrete Example You Could Have Used
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {report.reasoningFeedback.betterExample}
            </p>
          </div>
        )}
      </div>

      {/* 7. Voice & Delivery Report */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Voice & Audio Delivery Report
            </h3>
          </div>
          <span className="text-xs text-slate-400">Signal Processing</span>
        </div>

        {report.deliveryMetrics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Speaking Pace
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {report.deliveryMetrics.wordsPerMinute || '--'} <span className="text-xs font-normal">WPM</span>
                </div>
                <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 capitalize">
                  {report.deliveryMetrics.paceRating?.replace('-', ' ') || 'Normal'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filler Words
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {report.deliveryMetrics.fillerCount || 0}
                </div>
                <span className="text-[10px] text-slate-500">
                  {report.deliveryMetrics.fillerCount && report.deliveryMetrics.fillerCount > 3 ? 'Excessive fillers' : 'Clean articulation'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Noticeable Pauses
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {report.deliveryMetrics.pauseCount || 0}
                </div>
                <span className="text-[10px] text-slate-500">
                  Longest: {report.deliveryMetrics.longestPauseSec || 0}s
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Volume Stability
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 capitalize">
                  {report.deliveryMetrics.volumeConsistency || 'Normal'}
                </div>
                <span className="text-[10px] text-slate-500">
                  RMS signal checks
                </span>
              </div>
            </div>

            {/* Quality warnings if clipping or low */}
            {report.deliveryMetrics.audioQualityWarning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 text-xs text-amber-800 dark:text-amber-200">
                {report.deliveryMetrics.audioQualityWarning}
              </div>
            )}

            {/* Scientific limitations notice */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic leading-relaxed">
              Scientific Transparency Note: {report.deliveryMetrics.reliabilityNote}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs text-slate-500 italic">
            Audio signal data was not retained for this session.
          </div>
        )}
      </div>

      {/* 8. Better Way to Say It */}
      {report.betterWaysToSayIt && report.betterWaysToSayIt.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Better Way to Say It
            </h3>
          </div>

          <div className="space-y-3">
            {report.betterWaysToSayIt.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs sm:text-sm"
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    As Spoken
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                    "{item.original}"
                  </p>
                </div>
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    Polished Professional Delivery
                  </span>
                  <p className="text-slate-900 dark:text-white font-medium mt-0.5">
                    "{item.refined}"
                  </p>
                </div>
                <p className="text-xs text-slate-500 italic pt-1">
                  Why this is better: {item.whyBetter}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Personalized Exercises */}
      {report.personalizedExercises && report.personalizedExercises.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Personalized Exercises For You
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {report.personalizedExercises.map((ex, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      Drill {i + 1}
                    </span>
                    <span>{ex.durationMinutes} min</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-1">
                    {ex.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {ex.description}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  Targets: {ex.targetIssue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Recommended Next Challenge & Action Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-brand-800">
        <div className="space-y-1 max-w-xl text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
            Recommended Next Challenge
          </span>
          <h4 className="text-lg font-bold text-white">
            {report.recommendedNextChallenge?.suggestedPrompt || 'Continue Impromptu Practice'}
          </h4>
          <p className="text-xs text-brand-200 leading-relaxed">
            {report.recommendedNextChallenge?.rationale || 'Build continuous speaking endurance and clarity.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onPracticeAgain(session.topic, session.mode)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Same Topic</span>
          </button>

          <button
            onClick={() => onPracticeAgain(undefined, session.mode)}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold shadow-lg shadow-brand-500/30 transition-all flex items-center gap-1.5"
          >
            <span>Next Exercise</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
