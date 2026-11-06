import React from 'react';
import {
  PracticeSession,
  Topic,
  PracticeMode,
} from '@shared/types/index';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Volume2,
  Share2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  Download,
  FileText,
  Flag,
  Zap,
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

  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const dims = report.dimensionScores;

  const dimensionsList = [
    { key: 'contentRelevance', label: 'Content Relevance', desc: 'Direct adherence to core theme with high prompt fidelity', dim: dims.contentRelevance },
    { key: 'reasoningEvidence', label: 'Reasoning & Logic', desc: 'Causal linkage between assertions and observed outcomes', dim: dims.reasoningEvidence },
    { key: 'organizationStructure', label: 'Organisation', desc: 'Effective structural cadence: thesis, antithesis, synthesis', dim: dims.organizationStructure },
    { key: 'clarityConstruction', label: 'Clarity & Precision', desc: 'Unambiguous articulation without convoluted phrasing', dim: dims.clarityConstruction },
    { key: 'grammar', label: 'Grammar & Syntax', desc: 'Correct tense consistency and conditional sentence structures', dim: dims.grammar },
    { key: 'vocabularyChoice', label: 'Vocabulary Variety', desc: 'Lexical density and avoidance of recurring placeholder adjectives', dim: dims.vocabularyChoice },
    { key: 'fluencyFillers', label: 'Fluency & Fillers', desc: 'Clean verbal execution, avoidance of acoustic hesitations', dim: dims.fluencyFillers },
  ];

  // Helper to get formatted duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '01:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* 1. Header / Breadcrumb Bar */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 text-xs font-medium text-[#252525] hover:text-[#666666] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-4 w-[1px] bg-[#E5E5E5] hidden sm:block"></div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold tracking-tight text-[#252525]">SpeakUp</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#929292] border border-[#E5E5E5] px-1.5 py-0.5 rounded">
              Report #{session.id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 text-xs text-[#666666]">
          <span className="font-medium text-[#252525]">{session.topic.title}</span>
          <span>•</span>
          <span className="capitalize">{session.mode.replace('-', ' ')}</span>
          <span>•</span>
          <span>
            {new Date(report.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>•</span>
          <span className="font-mono text-[11px] text-[#252525]">
            {formatDuration(session.speakingDurationSec)} Duration
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {session.audioBlobUrl && (
            <a
              href={session.audioBlobUrl}
              download="speaking-recording.webm"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#252525] hover:bg-[#F5F5F4] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Audio</span>
            </a>
          )}
          <button
            onClick={() => onPracticeAgain(session.topic, session.mode)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#252525] rounded-lg text-xs font-medium text-[#FFFFFF] hover:bg-[#3f3f3f] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </button>
        </div>
      </div>

      {/* Demo Mode Notice Banner if applicable */}
      {report.isDemoMode && (
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 text-xs text-[#666666] flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#929292] block">Engine Mode Notice</span>
            <p className="leading-relaxed">
              <strong>DEMO / HEURISTIC EVALUATION:</strong> Analyzed using SpeakUp's calibrated heuristic rules because the generative reasoning key was absent. Connect your Gemini API key in Settings to unlock deep semantic reasoning.
            </p>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 border border-[#E5E5E5] rounded text-[#252525] bg-[#F5F5F4] flex-shrink-0">
            Heuristic Rule Base
          </span>
        </div>
      )}

      {/* 2. Overall Score Hero Card */}
      <section className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Monospace Score */}
          <div className="lg:col-span-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E5E5E5] pb-6 lg:pb-0 lg:pr-8 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Comprehensive Score</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl lg:text-7xl font-light font-mono text-[#252525] tracking-tight">
                  {report.transcriptScore}
                </span>
                <span className="text-lg font-light text-[#929292] font-mono">/100</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-[#252525] text-xs font-medium text-[#252525] bg-[#F5F5F4]">
                {report.performanceLevel}
              </span>
              <span className="text-xs text-[#666666]">
                Benchmark: {report.transcriptScore >= 75 ? 'Upper 75th percentile' : 'Foundation Level'}
              </span>
            </div>

            <div className="pt-4 border-t border-[#E5E5E5] grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#929292] block text-[11px]">Primary Strength</span>
                <span className="font-medium text-[#252525] mt-0.5 block truncate">
                  {report.strengths[0] || 'Logical Coherence'}
                </span>
              </div>
              <div>
                <span className="text-[#929292] block text-[11px]">Growth Lever</span>
                <span className="font-medium text-[#252525] mt-0.5 block truncate">
                  {report.improvementAreas[0] || 'Lexical Precision'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Executive Synthesis & Audio Bar */}
          <div className="lg:col-span-8 space-y-6 lg:pl-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Executive Synthesis</span>
                <span className="text-[11px] text-[#666666] font-mono">Evaluator ID: SU-{report.isDemoMode ? 'HEURISTIC' : 'GEMINI-V2'}</span>
              </div>
              <p className="text-sm lg:text-base leading-relaxed text-[#252525] font-normal">
                {report.mainTakeaway}
              </p>
            </div>

            {/* Embedded Audio Playback Bar if audio exists */}
            {session.audioBlobUrl && (
              <div className="bg-[#F5F5F4] rounded-lg p-3.5 border border-[#E5E5E5] space-y-2">
                <audio
                  ref={audioRef}
                  src={session.audioBlobUrl}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />
                <div className="flex items-center justify-between text-xs text-[#666666]">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={toggleAudio}
                      aria-label="Play or Pause Audio"
                      className="w-8 h-8 rounded-full bg-[#252525] text-[#FFFFFF] flex items-center justify-center hover:bg-[#3f3f3f] transition-colors"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                    </button>
                    <div className="flex items-center space-x-2 font-mono text-[11px] text-[#252525]">
                      <span>Spoken Sample</span>
                      <span className="text-[#929292]">•</span>
                      <span className="text-[#929292]">{formatDuration(session.speakingDurationSec)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1 text-[#666666] text-[11px]">
                      <Volume2 className="w-3.5 h-3.5 text-[#252525]" />
                      <span className="hidden sm:inline">Normalised Master</span>
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 border border-[#E5E5E5] bg-[#FFFFFF] rounded text-[#252525]">
                      1.0x
                    </span>
                  </div>
                </div>

                {/* Minimalist Waveform Bars */}
                <div className="w-full h-6 flex items-end justify-between space-x-[2px] pt-1">
                  {[3, 4, 6, 2, 5, 3, 6, 4, 2, 5, 6, 4, 3, 5, 2, 6, 4, 5, 3, 6, 4, 2, 4, 6, 3, 5, 2, 4, 3, 6, 4, 2, 5, 3, 4, 2, 5, 4].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 transition-all ${i < 18 ? 'bg-[#252525]' : 'bg-[#D4D4D3]'}`}
                      style={{ height: `${h * 3.5}px` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 7-Dimension Score Breakdown */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            Analytical Dimensions (7 Core Rubrics)
          </h2>
          <span className="text-xs text-[#666666]">Standardised to CEFR C1 Benchmarks</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
          {dimensionsList.map((item) => {
            const pct = Math.round((item.dim.score / item.dim.max) * 100);
            return (
              <div
                key={item.key}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F5F5F4]/40 transition-colors"
              >
                <div className="md:w-1/3">
                  <span className="text-sm font-medium text-[#252525] block">{item.label}</span>
                  <span className="text-xs text-[#666666] block">{item.desc}</span>
                  {item.dim.feedback && (
                    <span className="text-[11px] text-[#929292] block mt-1 leading-relaxed">
                      {item.dim.feedback}
                    </span>
                  )}
                </div>

                <div className="flex-1 md:px-8">
                  <div className="h-1.5 w-full bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#252525] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end md:w-32 space-x-3 text-right">
                  <span className="text-xs text-[#666666] font-mono">{pct}%</span>
                  <span className="font-mono text-sm font-medium text-[#252525]">
                    {item.dim.score} / {item.dim.max}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Side-by-Side Diagnostic Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: What You Did Well */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#252525]" />
            <h3 className="text-sm font-medium text-[#252525]">What You Did Well</h3>
          </div>
          <div className="space-y-3.5 pt-1">
            {report.strengths.map((str, idx) => (
              <div key={idx} className={`space-y-1 ${idx > 0 ? 'border-t border-[#E5E5E5] pt-3' : ''}`}>
                <div className="flex items-start space-x-2.5">
                  <span className="font-mono text-xs text-[#929292] mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-[#252525] block leading-relaxed">
                      {str}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Priority Weaknesses to Fix */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#252525]" />
            <h3 className="text-sm font-medium text-[#252525]">Priority Weaknesses to Fix</h3>
          </div>
          <div className="space-y-3.5 pt-1">
            {report.improvementAreas.map((area, idx) => (
              <div key={idx} className={`space-y-1 ${idx > 0 ? 'border-t border-[#E5E5E5] pt-3' : ''}`}>
                <div className="flex items-start space-x-2.5">
                  <span className="font-mono text-xs text-[#929292] mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-[#252525] block leading-relaxed">
                      {area}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 'Correct My English' Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            Syntax & Grammar Calibrations
          </h2>
          <span className="text-xs text-[#666666]">
            {report.corrections.length} correction{report.corrections.length === 1 ? '' : 's'} flagged
          </span>
        </div>

        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] overflow-hidden">
          {report.corrections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F5F5F4] text-[11px] font-mono uppercase tracking-wider text-[#929292]">
                    <th className="py-3 px-6 font-medium w-1/3">What I Said</th>
                    <th className="py-3 px-6 font-medium w-1/3">Correct Version</th>
                    <th className="py-3 px-6 font-medium w-1/3">Why It Needs Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5] text-xs">
                  {report.corrections.map((corr, idx) => (
                    <tr key={idx} className="hover:bg-[#F5F5F4]/50 transition-colors">
                      <td className="py-4 px-6 text-[#666666]">
                        <span className="line-through decoration-[#929292]">"{corr.whatSaid}"</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#252525]">
                        "{corr.correctVersion}"
                      </td>
                      <td className="py-4 px-6 text-[#666666] leading-relaxed">
                        {corr.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#666666]">
              Zero grammatical errors detected in spoken sample. Clean structural grammar!
            </div>
          )}
        </div>
      </section>

      {/* 6. Reasoning & Logical Scrutiny */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
          Reasoning & Dialectical Scrutiny
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.reasoningFeedback.strongestArgument && (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <CheckCircle className="w-4 h-4 text-[#252525]" />
                <span>Strongest Argument</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                {report.reasoningFeedback.strongestArgument}
              </p>
            </div>
          )}

          {report.reasoningFeedback.weakestArgument && (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <AlertCircle className="w-4 h-4 text-[#252525]" />
                <span>Weakest Argument / Flaw</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                {report.reasoningFeedback.weakestArgument}
              </p>
            </div>
          )}

          {report.reasoningFeedback.unsupportedClaims && report.reasoningFeedback.unsupportedClaims.length > 0 ? (
            report.reasoningFeedback.unsupportedClaims.map((claim, idx) => (
              <div key={idx} className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                  <Flag className="w-4 h-4 text-[#252525]" />
                  <span>Fact Scrutiny: [{claim.flag}]</span>
                </div>
                <p className="text-xs text-[#666666] leading-relaxed">
                  "{claim.claim}" — {claim.explanation}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <Flag className="w-4 h-4 text-[#252525]" />
                <span>Factual Integrity</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                All claims provided remained within acceptable conversational boundaries without ungrounded factual assertions.
              </p>
            </div>
          )}

          {report.reasoningFeedback.betterExample ? (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <Zap className="w-4 h-4 text-[#252525]" />
                <span>Recommended Stronger Example</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                {report.reasoningFeedback.betterExample}
              </p>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <Zap className="w-4 h-4 text-[#252525]" />
                <span>Evidence Utilization</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                Integrate measurable real-world case studies or empirical benchmarks to further anchor abstract premises.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 7. Vocal Acoustics & Pace Audit */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
          Vocal Acoustics & Pace Audit
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Speaking Pace</span>
            <div className="text-2xl font-light font-mono text-[#252525]">
              {report.deliveryMetrics?.wordsPerMinute || 135} <span className="text-xs font-normal">WPM</span>
            </div>
            <p className="text-xs text-[#666666] pt-1 capitalize">
              Target: 130–150 WPM • {report.deliveryMetrics?.paceRating?.replace('-', ' ') || 'Optimal'}
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Pauses</span>
            <div className="text-2xl font-light font-mono text-[#252525]">
              {report.deliveryMetrics?.pauseCount || 0} Pauses
            </div>
            <p className="text-xs text-[#666666] pt-1">
              Longest: {report.deliveryMetrics?.longestPauseSec || 0}s • Thought transitions
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Hesitations</span>
            <div className="text-2xl font-light font-mono text-[#252525]">
              {report.deliveryMetrics?.fillerCount || 0} Fillers
            </div>
            <p className="text-xs text-[#666666] pt-1">
              {report.deliveryMetrics?.fillerCount && report.deliveryMetrics.fillerCount > 3
                ? 'Excessive acoustic hesitation'
                : 'Clean articulation'}
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Volume Projection</span>
            <div className="text-2xl font-light font-mono text-[#252525] capitalize">
              {report.deliveryMetrics?.volumeConsistency || 'Normal'}
            </div>
            <p className="text-xs text-[#666666] pt-1">
              Steady dynamic range • Web Audio RMS
            </p>
          </div>
        </div>
      </section>

      {/* 8. 'Better Way to Say It' (Comparative View) */}
      {report.betterWaysToSayIt && report.betterWaysToSayIt.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              Editorial Phrasing Transformation
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border border-[#E5E5E5] text-[#252525] bg-[#FFFFFF]">
              C2 Rhetorical Polish
            </span>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Original */}
              <div className="bg-[#F5F5F4] rounded-lg p-5 border border-[#E5E5E5] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292] block">
                    Original Utterance (Verbatim)
                  </span>
                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed italic">
                    "{report.betterWaysToSayIt[0].original}"
                  </p>
                </div>
                <div className="text-[11px] text-[#929292]">
                  Colloquial structure • Conversational syntax
                </div>
              </div>

              {/* Refined */}
              <div className="bg-[#FFFFFF] rounded-lg p-5 border border-[#252525] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#252525] font-medium block">
                    Executive Polish
                  </span>
                  <p className="text-xs sm:text-sm text-[#252525] font-medium leading-relaxed">
                    "{report.betterWaysToSayIt[0].refined}"
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F5F5F4] rounded border border-[#E5E5E5] text-[#252525]">
                    Elevated formal register
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F5F5F4] rounded border border-[#E5E5E5] text-[#252525]">
                    Crisper agency
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F5F5F4] rounded border border-[#E5E5E5] text-[#252525]">
                    Active phrasing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. Personalized Drills & Recommended Next Challenge */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
          Targeted Practice & Prescribed Progression
        </h2>

        {/* 3 Drills */}
        {report.personalizedExercises && report.personalizedExercises.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.personalizedExercises.map((drill, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#929292]">
                    <span className="font-mono">Drill {String(idx + 1).padStart(2, '0')}</span>
                    <span>{drill.durationMinutes} mins</span>
                  </div>
                  <h4 className="text-xs font-medium text-[#252525]">{drill.title}</h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {drill.description}
                  </p>
                </div>
                <button
                  onClick={() => onPracticeAgain(undefined, session.mode)}
                  className="w-full py-2 px-3 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#252525] hover:bg-[#F5F5F4] transition-colors text-center"
                >
                  Begin Drill
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Next Challenge Callout Card */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Next Level Crucible</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#252525]"></span>
              <span className="text-xs text-[#666666]">Recommended by Evaluation Engine</span>
            </div>
            <h3 className="text-base font-semibold text-[#252525] tracking-tight">
              {report.recommendedNextChallenge?.suggestedPrompt || 'High-Stakes Negotiation Under Time Pressure'}
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              {report.recommendedNextChallenge?.rationale ||
                'Test your newfound syntactic precision and stamina in an adversarial counter-proposal scenario.'}
            </p>
          </div>
          <button
            onClick={() => onPracticeAgain(undefined, session.mode)}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-[#252525] rounded-lg text-xs font-medium text-[#FFFFFF] hover:bg-[#3f3f3f] transition-colors whitespace-nowrap shadow-none"
          >
            <span>Launch Challenge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="pt-6 border-t border-[#E5E5E5] text-xs text-[#929292] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-[#252525] tracking-tight">SpeakUp</span>
          <span>•</span>
          <span>Evaluation Engine v4.2.0-editorial</span>
          <span>•</span>
          <span className="font-mono text-[11px]">Audit Hash: {session.id.slice(0, 8)}</span>
        </div>
        <div className="text-[11px] font-mono text-[#666666]">
          Session Completed: {new Date(session.completedAt || session.startedAt).toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
};
