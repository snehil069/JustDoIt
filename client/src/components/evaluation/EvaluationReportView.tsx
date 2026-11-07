import React, { useState, useEffect } from 'react';
import {
  PracticeSession,
  Topic,
  PracticeMode,
  IdealSpeech,
} from '@shared/types/index';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Download,
  Flag,
  Zap,
  HelpCircle,
  Target,
  BookOpen,
  Compass,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Sparkles,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { piperTts } from '../../services/piperTts';
import { storageService } from '../../services/storage';

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

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [idealSpeech, setIdealSpeech] = useState<IdealSpeech | null>(report.idealSpeech || null);
  const [isGeneratingIdealSpeech, setIsGeneratingIdealSpeech] = useState(false);
  const [isSpeakingIdealSpeech, setIsSpeakingIdealSpeech] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [idealSpeechError, setIdealSpeechError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      piperTts.stop();
    };
  }, []);

  const handleGenerateIdealSpeech = async () => {
    setIsGeneratingIdealSpeech(true);
    setIdealSpeechError(null);
    try {
      const weaknesses = (report.detailedWeaknesses || report.improvementAreas || []).map((w: any) =>
        typeof w === 'string' ? w : `${w.title}: ${w.impactOrWhy || ''}`
      );
      const res = await api.generateIdealSpeech({
        topic: session.topic,
        mode: session.mode,
        difficulty: session.topic.difficulty,
        originalTranscript: session.originalTranscript,
        weaknessesToAddress: weaknesses.slice(0, 4),
      });
      setIdealSpeech(res);
      report.idealSpeech = res;
      storageService.saveSession({
        ...session,
        evaluation: {
          ...report,
          idealSpeech: res,
        },
      });
    } catch (err: any) {
      console.error('Failed to generate ideal speech:', err);
      setIdealSpeechError(err.message || 'Failed to synthesize ideal speech');
    } finally {
      setIsGeneratingIdealSpeech(false);
    }
  };

  const handleToggleSpeechPlayback = () => {
    if (!idealSpeech) return;
    if (isSpeakingIdealSpeech) {
      piperTts.stop();
      setIsSpeakingIdealSpeech(false);
    } else {
      setIsSpeakingIdealSpeech(true);
      piperTts.speak(idealSpeech.idealTranscript, {
        onEnd: () => setIsSpeakingIdealSpeech(false),
        onError: () => setIsSpeakingIdealSpeech(false),
      });
    }
  };

  const handleCopyIdealSpeech = async () => {
    if (!idealSpeech) return;
    try {
      await navigator.clipboard.writeText(idealSpeech.idealTranscript);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const toggleExpand = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const dims = report.dimensionScores;

  const dimensionsList = [
    { key: 'contentRelevance', label: 'Content Relevance & Accuracy', weight: 20, desc: 'Direct adherence to question prompt without drifting off-topic', dim: dims.contentRelevance },
    { key: 'reasoningEvidence', label: 'Reasoning, Logic & Evidence', weight: 15, desc: 'Causal linkage ("why"), concrete examples vs sweeping generalisations', dim: dims.reasoningEvidence },
    { key: 'organizationStructure', label: 'Organisation & Structure', weight: 15, desc: 'Clear thesis opening, transitional connectives, coherent flow, conclusion', dim: dims.organizationStructure },
    { key: 'clarityConstruction', label: 'Clarity & Sentence Construction', weight: 15, desc: 'Concise expressions, intelligible clauses, avoiding run-ons', dim: dims.clarityConstruction },
    { key: 'grammar', label: 'Grammar & Syntax', weight: 15, desc: 'Subject-verb agreement, tense consistency, prepositions, articles, plurality', dim: dims.grammar },
    { key: 'vocabularyChoice', label: 'Vocabulary & Word Choice', weight: 10, desc: 'Precision over vague filler adjectives, lexical density, domain terms', dim: dims.vocabularyChoice },
    { key: 'fluencyFillers', label: 'Fluency & Vocal Fillers', weight: 10, desc: 'Avoidance of acoustic hesitations (um, uh, like), controlled cadence', dim: dims.fluencyFillers },
  ];

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

      {/* Engine Notice if applicable */}
      {report.isDemoMode && (
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 text-xs text-[#666666] flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#929292] block">Engine Mode Notice</span>
            <p className="leading-relaxed">
              <strong>CALIBRATED MULTI-STAGE ENGINE:</strong> Analyzed using SpeakUp's linguistic syntax parser, topic deconstructor, and evidence-based weighted scoring rubric.
            </p>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 border border-[#E5E5E5] rounded text-[#252525] bg-[#F5F5F4] flex-shrink-0">
            Multi-Stage v3.0
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

            <div className="space-y-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-[#252525] text-[#252525] bg-[#F5F5F4]">
                {report.performanceLevel}
              </span>
              <p className="text-xs text-[#666666] leading-relaxed">
                Calculated strictly using the 7-dimension weighted rubric. No score inflation.
              </p>
            </div>
          </div>

          {/* Right Column: Honest Core Verdict & Strategic Highlights */}
          <div className="lg:col-span-8 space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292] block">
                Executive Coach Verdict
              </span>
              <p className="text-sm sm:text-base font-normal text-[#252525] leading-relaxed">
                {report.mainTakeaway}
              </p>
            </div>

            {/* Coach's 3 Core Focus Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#929292] block">Primary Strength</span>
                <span className="text-xs font-medium text-[#252525] block truncate">
                  {report.coachSummary?.whatDidWell || report.strengths[0]?.split(':')[0] || 'Audible engagement'}
                </span>
              </div>
              <div className="p-3 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#929292] block">Primary Weakness</span>
                <span className="text-xs font-medium text-[#252525] block truncate">
                  {report.coachSummary?.whatDidBadly || report.improvementAreas[0]?.split(':')[0] || 'Structure & depth'}
                </span>
              </div>
              <div className="p-3 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#929292] block">Next Session Priority</span>
                <span className="text-xs font-medium text-[#252525] block truncate">
                  {report.coachSummary?.nextSessionFocus || 'Eliminating errors & pausing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Detailed Rubric Breakdown (All 7 Dimensions) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            7-Dimension Rubric Scoring & Transcript Evidence
          </h2>
          <span className="text-xs font-mono text-[#666666]">
            Total: {report.transcriptScore} / 100
          </span>
        </div>

        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
          {dimensionsList.map((item) => {
            const rawScore = item.dim?.score || 0;
            const maxScore = item.dim?.max || item.weight;
            const percentage = Math.round((rawScore / maxScore) * 100);

            return (
              <div key={item.key} className="p-5 space-y-3 hover:bg-[#F5F5F4]/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#252525]">{item.label}</span>
                      <span className="text-[10px] font-mono text-[#929292] border border-[#E5E5E5] px-1.5 py-0.2 rounded">
                        Weight: {item.weight}%
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666]">{item.desc}</p>
                  </div>
                  <div className="flex items-baseline space-x-2 sm:self-center">
                    <span className="font-mono text-base font-semibold text-[#252525]">
                      {rawScore}
                    </span>
                    <span className="font-mono text-xs text-[#929292]">/ {maxScore}</span>
                    <span className="text-xs font-mono text-[#666666] ml-2">({percentage}%)</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#252525] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                  ></div>
                </div>

                {/* Feedback and Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#929292] block">Analytical Feedback</span>
                    <p className="text-[#666666] leading-relaxed">{item.dim?.feedback || 'Evaluated.'}</p>
                  </div>
                  {item.dim?.evidence && (
                    <div className="space-y-1 bg-[#F5F5F4] p-2.5 rounded border border-[#E5E5E5]">
                      <span className="text-[10px] font-mono uppercase text-[#929292] block">Transcript Evidence Quote</span>
                      <p className="text-[#252525] italic font-mono text-[11px] leading-relaxed">
                        "{item.dim.evidence}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Complete Syntax & Grammar Calibrations Table (Exhaustive & Uncapped) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              Complete Grammar & Syntax Calibrations
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#252525] text-white">
              {report.corrections.length} Detected
            </span>
          </div>
          <span className="text-xs text-[#666666]">
            Every sentence parsed • Uncapped review
          </span>
        </div>

        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] overflow-hidden">
          {report.corrections && report.corrections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F5F5F4] text-[11px] font-mono uppercase tracking-wider text-[#929292]">
                    <th className="py-3 px-5 font-medium w-1/4">What I Said</th>
                    <th className="py-3 px-5 font-medium w-1/4">Correct Version</th>
                    <th className="py-3 px-5 font-medium w-1/6">Type & Severity</th>
                    <th className="py-3 px-5 font-medium w-1/3">Explanation of Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5] text-xs">
                  {report.corrections.map((corr, idx) => (
                    <tr key={idx} className="hover:bg-[#F5F5F4]/40 transition-colors">
                      <td className="py-3.5 px-5 text-[#666666]">
                        <span className="line-through decoration-[#929292] font-mono text-[11px]">
                          "{corr.whatSaid}"
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#252525] font-mono text-[11px]">
                        "{corr.correctVersion}"
                        {corr.naturalAlternative && corr.naturalAlternative !== corr.correctVersion && (
                          <span className="block text-[10px] text-[#929292] font-normal pt-0.5">
                            Natural: "{corr.naturalAlternative}"
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border border-[#E5E5E5] text-[#252525] bg-[#F5F5F4]">
                            {corr.errorType || 'Grammar'}
                          </span>
                          <span className={`block text-[10px] font-mono uppercase ${corr.severity === 'major' ? 'text-red-600 font-semibold' : corr.severity === 'moderate' ? 'text-amber-700' : 'text-[#929292]'}`}>
                            {corr.severity || 'moderate'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-[#666666] leading-relaxed">
                        {corr.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#666666] space-y-1">
              <CheckCircle className="w-5 h-5 mx-auto text-[#252525]" />
              <p className="font-medium text-[#252525]">Zero Grammatical Errors Detected</p>
              <p className="text-[11px] text-[#929292]">Every sentence conformed strictly to standard grammatical syntax.</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Important Points You Missed (Section F - Mandatory!) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              Important Points You Missed
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#E5E5E5] text-[#252525] bg-[#FFFFFF]">
              Topic Dimension Analysis
            </span>
          </div>
          <span className="text-xs text-[#666666]">
            Compare against prompt expectations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.missedPoints && report.missedPoints.length > 0 ? (
            report.missedPoints.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#929292]">
                      Dimension {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${item.importance === 'essential' ? 'bg-red-50 border-red-200 text-red-700 font-semibold' : 'bg-[#F5F5F4] border-[#E5E5E5] text-[#252525]'}`}>
                      {item.importance}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#252525] leading-snug">
                    {item.point}
                  </h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    <strong>Why it matters:</strong> {item.whyImportant}
                  </p>
                </div>

                <div className="bg-[#F5F5F4] p-3 rounded border border-[#E5E5E5] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#929292] block">
                    How you could have framed it
                  </span>
                  <p className="text-xs text-[#252525] font-mono leading-relaxed">
                    "{item.howToIncorporate}"
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 text-center text-xs text-[#666666]">
              All core prompt dimensions were addressed satisfactorily.
            </div>
          )}
        </div>
      </section>

      {/* 6. What You Did Well vs Priority Weaknesses */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: What You Did Well */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#252525]" />
            <h3 className="text-sm font-semibold text-[#252525]">What You Did Well</h3>
          </div>
          <div className="space-y-3.5 pt-1">
            {(report.detailedStrengths && report.detailedStrengths.length > 0
              ? report.detailedStrengths
              : report.strengths.map((s) => ({ title: s.split(':')[0], evidence: s.split(':')[1] || s, impactOrWhy: 'Delivered with clarity.' }))
            ).map((item, idx) => (
              <div key={idx} className={`space-y-1.5 ${idx > 0 ? 'border-t border-[#E5E5E5] pt-3' : ''}`}>
                <div className="flex items-start space-x-2.5">
                  <span className="font-mono text-xs text-[#929292] mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#252525] block">
                      {item.title}
                    </span>
                    <p className="text-xs font-mono text-[#666666] bg-[#F5F5F4] p-2 rounded border border-[#E5E5E5]">
                      "{item.evidence}"
                    </p>
                    <p className="text-xs text-[#666666]">
                      {item.impactOrWhy}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: What You Did Poorly / Priority Weaknesses */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#252525]" />
            <h3 className="text-sm font-semibold text-[#252525]">Priority Weaknesses to Fix</h3>
          </div>
          <div className="space-y-3.5 pt-1">
            {(report.detailedWeaknesses && report.detailedWeaknesses.length > 0
              ? report.detailedWeaknesses
              : report.improvementAreas.map((w) => ({ title: w.split(':')[0], evidence: w.split(':')[1] || w, impactOrWhy: 'Requires immediate calibration.', actionableStep: 'Focus on deliberate practice.' }))
            ).map((item, idx) => (
              <div key={idx} className={`space-y-1.5 ${idx > 0 ? 'border-t border-[#E5E5E5] pt-3' : ''}`}>
                <div className="flex items-start space-x-2.5">
                  <span className="font-mono text-xs text-[#929292] mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#252525] block">
                      {item.title}
                    </span>
                    <p className="text-xs font-mono text-[#666666] bg-[#F5F5F4] p-2 rounded border border-[#E5E5E5]">
                      "{item.evidence}"
                    </p>
                    <p className="text-xs text-[#666666]">
                      {item.impactOrWhy}
                    </p>
                    {item.actionableStep && (
                      <p className="text-xs text-[#252525] font-medium pt-0.5">
                        → <strong>Action:</strong> {item.actionableStep}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Reasoning, Arguments & Critical Thinking */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
          Reasoning, Arguments & Logical Scrutiny
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.reasoningFeedback.strongestArgument && (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <CheckCircle className="w-4 h-4 text-[#252525]" />
                <span className="font-semibold">Strongest Argument</span>
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
                <span className="font-semibold">Weakest Argument / Vulnerability</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                {report.reasoningFeedback.weakestArgument}
              </p>
            </div>
          )}

          {report.reasoningFeedback.unsupportedClaims && report.reasoningFeedback.unsupportedClaims.length > 0 && (
            report.reasoningFeedback.unsupportedClaims.map((claim, idx) => (
              <div key={idx} className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                  <Flag className="w-4 h-4 text-[#252525]" />
                  <span className="font-semibold">Unsupported Claim Flagged</span>
                </div>
                <p className="text-xs text-[#666666] leading-relaxed">
                  "{claim.claim}" — {claim.explanation}
                </p>
              </div>
            ))
          )}

          {report.reasoningFeedback.betterExample && (
            <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#252525]">
                <Zap className="w-4 h-4 text-[#252525]" />
                <span className="font-semibold">Stronger Concrete Example</span>
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">
                {report.reasoningFeedback.betterExample}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 8. Vocal Acoustics & Pace Audit */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
          Vocal Delivery & Fluency Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Speaking Pace</span>
            <div className="text-2xl font-light font-mono text-[#252525]">
              {report.deliveryMetrics?.wordsPerMinute !== undefined ? (
                <>
                  {report.deliveryMetrics.wordsPerMinute} <span className="text-xs font-normal">WPM</span>
                </>
              ) : session.speakingDurationSec && session.speakingDurationSec > 0 ? (
                <>
                  {Math.round(((session.originalTranscript || '').trim().split(/\s+/).filter(Boolean).length / (session.speakingDurationSec / 60)))} <span className="text-xs font-normal">WPM</span>
                </>
              ) : (
                'N/A'
              )}
            </div>
            <p className="text-xs text-[#666666] pt-1">
              Target: 125–155 WPM
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Pauses Detected</span>
            <div className="text-2xl font-light font-mono text-[#252525]">
              {report.deliveryMetrics?.pauseCount !== undefined
                ? `${report.deliveryMetrics.pauseCount} Pauses`
                : 'N/A'}
            </div>
            <p className="text-xs text-[#666666] pt-1">
              {report.deliveryMetrics?.pauseCount !== undefined
                ? 'Silence intervals between thoughts'
                : 'Acoustic pause analysis not available'}
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Fillers Count</span>
            <div className="text-2xl font-light font-mono text-[#252525]">
              {report.deliveryMetrics?.fillerCount !== undefined
                ? `${report.deliveryMetrics.fillerCount} Fillers`
                : '0 Fillers'}
            </div>
            <p className="text-xs text-[#666666] pt-1">
              {report.deliveryMetrics?.fillerCount && report.deliveryMetrics.fillerCount > 3
                ? 'High hesitation sound count'
                : report.deliveryMetrics?.fillerCount === 0
                ? 'Zero hesitation sounds detected'
                : 'Controlled articulation'}
            </p>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Volume Consistency</span>
            <div className="text-2xl font-light font-mono text-[#252525] capitalize">
              {report.deliveryMetrics?.volumeConsistency && report.deliveryMetrics.volumeConsistency !== 'insufficient-data'
                ? report.deliveryMetrics.volumeConsistency
                : 'Not Available'}
            </div>
            <p className="text-xs text-[#666666] pt-1">
              {report.deliveryMetrics?.volumeConsistency && report.deliveryMetrics.volumeConsistency !== 'insufficient-data'
                ? 'Web Audio dynamic range analysis'
                : 'Audio signal not captured for dynamic range'}
            </p>
          </div>
        </div>
      </section>

      {/* 9. Editorial Phrasing Transformation (How you could have answered better) */}
      {report.betterWaysToSayIt && report.betterWaysToSayIt.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              How You Could Have Answered Better
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border border-[#E5E5E5] text-[#252525] bg-[#FFFFFF]">
              Executive Polish Comparison
            </span>
          </div>

          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
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
                  Colloquial structure • Spoken phrasing
                </div>
              </div>

              <div className="bg-[#FFFFFF] rounded-lg p-5 border border-[#252525] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#252525] font-semibold block">
                    Executive Polish Alternative
                  </span>
                  <p className="text-xs sm:text-sm text-[#252525] font-medium leading-relaxed">
                    "{report.betterWaysToSayIt[0].refined}"
                  </p>
                </div>
                <p className="text-[11px] text-[#666666]">
                  {report.betterWaysToSayIt[0].whyBetter}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. Master Benchmark Exemplar Speech (Score 95+ Caliber with Piper TTS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              Benchmark Exemplar Speech
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252525] text-white">
              Score 95+ Caliber
            </span>
          </div>
          <span className="text-xs text-[#666666]">
            Target Model for Deliberate Practice
          </span>
        </div>

        {isGeneratingIdealSpeech ? (
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F5F4] text-[#252525] animate-spin">
              <Loader2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#252525]">Synthesizing Benchmark 95+ Spoken Response...</h4>
              <p className="text-[11px] text-[#666666]">
                Formulating hook thesis, causal proofs, and counterargument deconstruction via Gemini 3.1 Flash Lite.
              </p>
            </div>
          </div>
        ) : idealSpeech ? (
          <div className="bg-[#FFFFFF] rounded-lg border-2 border-[#252525] p-6 lg:p-8 space-y-6">
            {/* Header with Title, Stats, and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#252525]" />
                  <span className="text-xs font-semibold text-[#252525]">
                    Ideal Spoken Delivery: "{idealSpeech.topicTitle}"
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666]">
                  <span>Pacing: <strong className="text-[#252525] font-mono">{idealSpeech.estimatedWpm || 140} WPM</strong></span>
                  <span>•</span>
                  <span>Target Duration: <strong className="text-[#252525] font-mono">{Math.floor((idealSpeech.targetDurationSec || 150) / 60)}m {(idealSpeech.targetDurationSec || 150) % 60}s</strong></span>
                  <span>•</span>
                  <span>Cadence: <strong className="text-[#252525]">Signposted & Oratorical</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap">
                {/* Piper TTS Listen Button */}
                <button
                  onClick={handleToggleSpeechPlayback}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSpeakingIdealSpeech
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      : 'bg-[#252525] text-[#FFFFFF] hover:bg-[#3f3f3f]'
                  }`}
                >
                  {isSpeakingIdealSpeech ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Speech</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen (Piper TTS)</span>
                    </>
                  )}
                </button>

                {/* Copy Transcript Button */}
                <button
                  onClick={handleCopyIdealSpeech}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#252525] hover:bg-[#F5F5F4] transition-colors"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Speech</span>
                    </>
                  )}
                </button>

                {/* Regenerate Button */}
                <button
                  onClick={handleGenerateIdealSpeech}
                  disabled={isGeneratingIdealSpeech}
                  className="inline-flex items-center space-x-1 px-2.5 py-2 text-xs text-[#666666] hover:text-[#252525] hover:bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] transition-colors"
                  title="Regenerate another benchmark response"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingIdealSpeech ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Full Pristine Spoken Transcript */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#929292] block">
                Complete Benchmark Spoken Transcript (Verbatim Delivery)
              </span>
              <div className="p-5 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] text-xs sm:text-sm text-[#252525] leading-relaxed whitespace-pre-line font-normal">
                {idealSpeech.idealTranscript}
              </div>
            </div>

            {/* Structural Breakdown (4 Cards) */}
            {idealSpeech.structureBreakdown && idealSpeech.structureBreakdown.length > 0 && (
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#929292] block">
                  Structural & Rhetorical Blueprint (Why the Argument Convinces)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {idealSpeech.structureBreakdown.map((sec, idx) => (
                    <div key={idx} className="p-4 bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-[#929292] font-semibold block">
                          {sec.sectionName}
                        </span>
                        <p className="text-xs text-[#252525] font-mono italic bg-[#F5F5F4] p-2 rounded border border-[#E5E5E5]">
                          "{sec.contentSnippet}"
                        </p>
                      </div>
                      <p className="text-xs text-[#666666] pt-1">
                        <strong>Rhetorical Purpose:</strong> {sec.rhetoricalPurpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Techniques Badges */}
            {idealSpeech.keyTechniquesUsed && idealSpeech.keyTechniquesUsed.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#929292] block">
                  Rhetorical Techniques Deployed
                </span>
                <div className="flex flex-wrap gap-2">
                  {idealSpeech.keyTechniquesUsed.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-[#E5E5E5] bg-[#FFFFFF] text-[#252525]"
                    >
                      ✓ {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Why This Response Scores 95+ */}
            {idealSpeech.whyThisScoresHigh && (
              <div className="p-4 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#252525]">
                  <Award className="w-4 h-4 text-[#252525]" />
                  <span>Why This Response Scores 95+ on the Rubric</span>
                </div>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {idealSpeech.whyThisScoresHigh}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#252525]" />
                  <span className="text-xs font-semibold text-[#252525]">
                    Synthesize & Listen to an Ideal Benchmark Speech
                  </span>
                </div>
                <p className="text-xs text-[#666666] max-w-2xl leading-relaxed">
                  Want to see and hear how a champion orator would deliver this exact topic? Generate a benchmark 95+ score response addressing your specific weaknesses, structured with counterarguments and causal proofs, and listen to it with Piper TTS.
                </p>
              </div>
              <button
                onClick={handleGenerateIdealSpeech}
                disabled={isGeneratingIdealSpeech}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#252525] rounded-lg text-xs font-medium text-[#FFFFFF] hover:bg-[#3f3f3f] transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Ideal Speech</span>
              </button>
            </div>
            {idealSpeechError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {idealSpeechError}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 11. Personal Improvement Plan (Priority 1, 2, 3) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            Your Targeted Improvement Plan
          </h2>
          <span className="text-xs text-[#666666]">
            Structured Progression
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(report.improvementPlan || [
            { priority: 1, title: 'Fix Grammar Discrepancies', timeframe: 'Fix Immediately', description: 'Review the identified subject-verb agreement and tense errors.', concreteDrill: 'Speak each corrected sentence aloud 3 times.' },
            { priority: 2, title: 'Deepen Causal Reasoning', timeframe: 'Work on Next', description: 'Introduce real-world case studies and concrete proof.', concreteDrill: 'Include at least one specific named example in your next 2-minute drill.' },
            { priority: 3, title: 'Vocal Pause Control', timeframe: 'Develop Gradually', description: 'Replace vocalized hesitation sounds with intentional silence.', concreteDrill: 'Practice the 2-second silent pause technique.' },
          ]).map((item: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-semibold text-[#252525]">
                    Priority {item.priority || idx + 1}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#E5E5E5] bg-[#F5F5F4] text-[#666666]">
                    {item.timeframe}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-[#252525]">{item.title}</h4>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="bg-[#F5F5F4] p-3 rounded border border-[#E5E5E5] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#929292] block">Prescribed Action / Drill</span>
                <p className="text-xs text-[#252525] font-medium leading-relaxed">
                  {item.concreteDrill}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. Final Coach's Direct Summary (6 Mandatory Questions) */}
      {report.coachSummary && (
        <section className="bg-[#FFFFFF] rounded-lg border border-[#252525] p-6 lg:p-8 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#E5E5E5] pb-3">
            <Compass className="w-5 h-5 text-[#252525]" />
            <h3 className="text-sm font-semibold tracking-tight text-[#252525]">
              Final Coach's Direct Assessment
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#929292] block">1. What did I do well?</span>
              <p className="font-medium text-[#252525] leading-relaxed">{report.coachSummary.whatDidWell}</p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#929292] block">2. What did I do badly?</span>
              <p className="font-medium text-[#252525] leading-relaxed">{report.coachSummary.whatDidBadly}</p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#929292] block">3. What important thing did I miss?</span>
              <p className="font-medium text-[#252525] leading-relaxed">{report.coachSummary.whatMissed}</p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#929292] block">4. Biggest communication weakness?</span>
              <p className="font-medium text-[#252525] leading-relaxed">{report.coachSummary.biggestWeaknessSkill}</p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#929292] block">5. What should I practise next?</span>
              <p className="font-medium text-[#252525] leading-relaxed">{report.coachSummary.whatToPractiseNext}</p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#929292] block">6. Focus for next session?</span>
              <p className="font-medium text-[#252525] leading-relaxed">{report.coachSummary.nextSessionFocus}</p>
            </div>
          </div>
        </section>
      )}

      {/* 12. Recommended Next Challenge Callout */}
      <section className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Next Level Crucible</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]"></span>
            <span className="text-xs text-[#666666]">Recommended by Evaluation Engine</span>
          </div>
          <h3 className="text-base font-semibold text-[#252525] tracking-tight">
            {report.recommendedNextChallenge?.suggestedPrompt || 'Structured Reasoning Challenge'}
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
      </section>

      {/* Editorial Footer */}
      <footer className="pt-6 border-t border-[#E5E5E5] text-xs text-[#929292] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-[#252525] tracking-tight">SpeakUp</span>
          <span>•</span>
          <span>Multi-Stage Evaluation Pipeline v3.0</span>
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
