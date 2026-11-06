import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Topic,
  PracticeMode,
  PracticeSession,
  EvaluationReport,
} from '@shared/types/index';
import { useAudioRecorder, AudioAnalysisOutput } from '../../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { WaveformVisualizer } from '../common/WaveformVisualizer';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  Volume2,
  FileText,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  X,
} from 'lucide-react';

interface PracticeEngineProps {
  topic: Topic;
  mode: PracticeMode;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
  onSkipTopic?: () => void;
  researchNotes?: string;
}

export const PracticeEngine: React.FC<PracticeEngineProps> = ({
  topic,
  mode,
  onEvaluationComplete,
  onCancel,
  onSkipTopic,
  researchNotes,
}) => {
  const [sessionState, setSessionState] = useState<
    'topic_ready' | 'preparing' | 'recording' | 'processing' | 'completed' | 'error'
  >('topic_ready');

  const [selectedDurationSec, setSelectedDurationSec] = useState<number>(topic.suggestedDurationSec || 180);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [remainingSec, setRemainingSec] = useState<number>(selectedDurationSec);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual editing and testing support
  const [customTranscript, setCustomTranscript] = useState<string>('');
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);

  // Audio & Speech hooks
  const {
    isRecording,
    currentVolume,
    audioUrl,
    micPermissionDenied,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const {
    isListening,
    interimText,
    finalTranscript,
    fullTranscript,
    isSupported,
    recognitionError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Keep custom transcript in sync with live speech unless user is manually editing
  useEffect(() => {
    if (!isEditingTranscript && fullTranscript) {
      setCustomTranscript(fullTranscript);
    }
  }, [fullTranscript, isEditingTranscript]);

  const effectiveTranscript = (customTranscript || fullTranscript).trim();
  const latestTranscriptRef = useRef(effectiveTranscript);
  useEffect(() => {
    latestTranscriptRef.current = effectiveTranscript;
  }, [effectiveTranscript]);

  // Timestamp-based drift-free timer
  const timerStartRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const latestAudioAnalysisRef = useRef<AudioAnalysisOutput | null>(null);
  const currentSessionIdRef = useRef<string>(`session-${Date.now()}`);

  const durationOptions = [60, 120, 180, 300, 600];

  useEffect(() => {
    setRemainingSec(selectedDurationSec);
  }, [selectedDurationSec]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const wordCount = effectiveTranscript.split(/\s+/).filter(Boolean).length;
  const currentWpm = elapsedSec > 4 ? Math.round((wordCount / elapsedSec) * 60) : 0;
  const fillerCount = (effectiveTranscript.match(/\b(um|uh|erm|like|you know|basically|actually)\b/gi) || []).length;

  const handleStartRecording = async () => {
    setErrorMessage(null);
    resetTranscript();
    setCustomTranscript('');
    setIsEditingTranscript(false);

    const micGranted = await startRecording();
    if (!micGranted) {
      setErrorMessage(
        'Microphone access was denied or could not be initialized. You can still type or paste your response directly into the transcript box below to receive your evaluation!'
      );
      setIsEditingTranscript(true);
      return;
    }

    startListening();
    setSessionState('recording');
    setElapsedSec(0);
    setRemainingSec(selectedDurationSec);

    timerStartRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const actualElapsed = Math.floor((now - timerStartRef.current) / 1000);
      setElapsedSec(actualElapsed);

      const actualRemaining = Math.max(0, selectedDurationSec - actualElapsed);
      setRemainingSec(actualRemaining);

      if (actualRemaining <= 0) {
        handleStopRecording();
      }
    }, 250);
  };

  const handleStopRecording = useCallback(async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    stopListening();
    const audioAnalysis = stopRecording();
    latestAudioAnalysisRef.current = audioAnalysis;

    setSessionState('processing');
    await executeEvaluation(audioAnalysis);
  }, [stopListening, stopRecording]);

  const executeEvaluation = async (audioAnalysis?: AudioAnalysisOutput | null) => {
    const transcriptToEvaluate = (customTranscript || fullTranscript || latestTranscriptRef.current).trim();

    if (!transcriptToEvaluate) {
      setSessionState('error');
      setErrorMessage(
        'No speech was captured yet. Please speak into your microphone, or type/paste your answer directly in the box below to test!'
      );
      return;
    }

    try {
      setSessionState('processing');
      const settings = storageService.getSettings();

      const calculatedDuration = elapsedSec > 5 
        ? elapsedSec 
        : Math.max(20, Math.round((transcriptToEvaluate.split(/\s+/).filter(Boolean).length / 130) * 60));

      const report: EvaluationReport = await api.evaluateSpeech({
        sessionId: currentSessionIdRef.current,
        topic,
        mode,
        transcript: transcriptToEvaluate,
        durationSec: calculatedDuration,
        researchNotes,
        rawAudioAnalysis: audioAnalysis
          ? {
              durationSec: audioAnalysis.durationSec,
              wordCount: transcriptToEvaluate.split(/\s+/).filter(Boolean).length,
              transcript: transcriptToEvaluate,
              volumeRmsSeries: audioAnalysis.volumeRmsSeries,
              silenceIntervalsSec: audioAnalysis.silenceIntervalsSec,
              clippingEventsCount: audioAnalysis.clippingEventsCount,
            }
          : undefined,
      });

      const session: PracticeSession = {
        id: currentSessionIdRef.current,
        userId: 'local-user-1',
        mode,
        topic,
        status: 'completed',
        startedAt: new Date(Date.now() - calculatedDuration * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        speakingDurationSec: calculatedDuration,
        originalTranscript: transcriptToEvaluate,
        researchNotes,
        audioSaved: settings.retainAudioRecordings,
        audioBlobUrl: audioUrl || undefined,
        transcriptionProvider: settings.preferredSttProvider,
        aiProvider: settings.isDemoMode ? 'demo' : settings.preferredAiProvider,
        evaluation: report,
      };

      storageService.saveSession(session);
      setSessionState('completed');
      onEvaluationComplete(session);
    } catch (err: any) {
      console.error('Evaluation processing failed:', err);
      setSessionState('error');
      setErrorMessage(
        err?.message ||
          'Failed to generate speech evaluation from the server. Your transcript is saved below, and you can retry.'
      );
    }
  };

  const handleLoadSampleGrammarMistakes = () => {
    const sample = `I think AI is good for students because he have many advantages. We didn't went to class yesterday but every students are using ChatGPT now. According to me it is a honest mistake if they copy code. The teacher don't understand that technology change quickly.`;
    setCustomTranscript(sample);
    setIsEditingTranscript(true);
    setErrorMessage(null);
  };

  const timerProgress = selectedDurationSec > 0 ? (elapsedSec / selectedDurationSec) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Minimal Top Header Context */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
          <span className="font-medium text-[#666666] capitalize">
            {topic.category.replace('-', ' ')} · {topic.difficulty} Difficulty
          </span>
        </div>

        <button
          onClick={onCancel}
          className="text-[#666666] hover:text-[#252525] flex items-center gap-1 transition-colors"
        >
          <span>Exit Session</span>
          <span className="font-mono text-[10px] text-[#929292] border border-[#E5E5E5] px-1 py-0.5 rounded">
            Esc
          </span>
        </button>
      </div>

      {/* Primary Focused Session Card (Google Stitch Design) */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-6 sm:p-9 shadow-none flex flex-col gap-7">
        {/* Status & Target Bar */}
        <section className="flex flex-col gap-4 border-b border-[#E5E5E5] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Mic Status */}
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  sessionState === 'recording' ? 'bg-[#252525] pulse-dot' : 'bg-[#929292]'
                }`}
              />
              <span className="text-xs font-semibold tracking-tight text-[#252525]">
                {sessionState === 'recording'
                  ? 'Recording · Microphone Active'
                  : 'Ready to Record'}
              </span>
              <span className="text-[#E5E5E5]">|</span>
              <span className="text-[11px] font-mono text-[#666666] bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-0.5 rounded">
                Deepgram Nova-2 STT
              </span>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] font-medium text-[#929292]">
                Target duration: {formatTime(selectedDurationSec)}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
                  {sessionState === 'recording' ? formatTime(remainingSec) : formatTime(selectedDurationSec)}
                </span>
                <span className="text-[11px] font-mono text-[#929292]">
                  {sessionState === 'recording' ? 'remaining' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Thin Linear Progress Bar */}
          <div className="w-full bg-[#E5E5E5] h-[2px] rounded-full overflow-hidden">
            <div
              className="bg-[#252525] h-full transition-all duration-300"
              style={{ width: `${sessionState === 'recording' ? Math.min(100, timerProgress) : 0}%` }}
            />
          </div>
        </section>

        {/* Topic & Prompt Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#929292] font-medium">
              DAILY RHETORIC DRILL · SPONTANEOUS SYNTHESIS
            </span>
            {sessionState === 'topic_ready' && onSkipTopic && (
              <button
                onClick={onSkipTopic}
                className="text-[11px] text-[#666666] hover:text-[#252525] hover:underline"
              >
                Skip this challenge
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#252525]">
            {topic.title}
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-[#666666] font-normal pt-1 max-w-3xl">
            {topic.question}
          </p>

          {/* Guidance tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#666666] bg-[#FAFAFA] border border-[#E5E5E5] px-2.5 py-1 rounded">
              <span className="w-1 h-1 rounded-full bg-[#929292]" />
              Target: 140 WPM
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#666666] bg-[#FAFAFA] border border-[#E5E5E5] px-2.5 py-1 rounded">
              <span className="w-1 h-1 rounded-full bg-[#929292]" />
              Structure: Thesis, Evidence, Synthesis
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#666666] bg-[#FAFAFA] border border-[#E5E5E5] px-2.5 py-1 rounded">
              <span className="w-1 h-1 rounded-full bg-[#929292]" />
              AI Cadence Tracking
            </span>
          </div>

          {/* Optional hints toggle */}
          {topic.hints && topic.hints.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-xs text-[#666666] hover:text-[#252525] underline"
              >
                {showHints ? 'Hide speaking angles' : 'View speaking angles'}
              </button>
              {showHints && (
                <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#FAFAFA] rounded border border-[#E5E5E5] text-xs text-[#666666]">
                  {topic.hints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#252525] mt-1.5 flex-shrink-0" />
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Acoustic Visualizer */}
        <section className="flex flex-col gap-2 pt-1 pb-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#929292]">
            <span>VOICE FREQUENCY SPECTRUM</span>
            <span>REAL-TIME RMS AUDIO</span>
          </div>
          <WaveformVisualizer isRecording={isRecording} volume={currentVolume} barCount={48} />
        </section>

        {/* Live Speech Transcript Box */}
        <section className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#252525] font-semibold">
                Live Speech Transcription & Input
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLoadSampleGrammarMistakes}
                className="text-[11px] font-mono underline text-[#666666] hover:text-[#252525] transition-colors"
                title="Loads a prepared response with grammatical errors to instantly test the engine"
              >
                + Try Sample Response (With Errors)
              </button>

              <button
                type="button"
                onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#E5E5E5] text-[#252525] hover:bg-[#F5F5F4] transition-colors"
              >
                {isEditingTranscript ? 'View Live Mode' : 'Edit / Type'}
              </button>

              <span className="text-[11px] font-mono text-[#929292]">
                {wordCount} words
              </span>
            </div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded p-5 flex flex-col justify-between gap-4 min-h-[140px]">
            {isEditingTranscript ? (
              <textarea
                value={customTranscript}
                onChange={(e) => setCustomTranscript(e.target.value)}
                placeholder="Type or paste your speech response here to analyze it directly..."
                className="w-full h-28 bg-white border border-[#E5E5E5] rounded p-3 text-sm leading-relaxed text-[#252525] focus:outline-none focus:border-[#252525] resize-y font-normal"
              />
            ) : (
              <p className="text-sm leading-relaxed text-[#666666]">
                {customTranscript ? (
                  <span>{customTranscript} </span>
                ) : (
                  <>
                    {finalTranscript && <span>{finalTranscript} </span>}
                    {interimText && (
                      <span className="text-[#252525] font-medium bg-[#E5E5E5]/40 px-0.5 rounded">
                        {interimText}
                      </span>
                    )}
                    {!finalTranscript && !interimText && (
                      <span className="text-[#929292] italic">
                        {sessionState === 'recording'
                          ? 'Listening... Speak clearly into your microphone.'
                          : 'Transcript will appear here in real-time as you speak. You can also click "+ Try Sample Response" or "Edit / Type" anytime.'}
                      </span>
                    )}
                  </>
                )}
              </p>
            )}

            {/* Inline Real-time Metrics & Direct Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E5E5] text-xs font-mono text-[#666666]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#929292]">Words:</span>
                  <span className="font-medium text-[#252525]">{wordCount}</span>
                </div>
                <span className="text-[#E5E5E5]">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#929292]">Pace:</span>
                  <span className="font-medium text-[#252525]">{currentWpm} WPM</span>
                </div>
                <span className="text-[#E5E5E5]">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#929292]">Fillers:</span>
                  <span className="font-medium text-[#252525]">{fillerCount}</span>
                </div>
              </div>

              {effectiveTranscript && sessionState !== 'recording' && sessionState !== 'processing' && (
                <button
                  type="button"
                  onClick={() => executeEvaluation(latestAudioAnalysisRef.current)}
                  className="px-3 py-1 bg-[#252525] hover:bg-[#3a3a3a] text-white rounded text-xs font-sans font-medium transition-colors"
                >
                  Analyze This Transcript &rarr;
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Processing State Indicator */}
        {sessionState === 'processing' && (
          <div className="p-6 bg-[#FAFAFA] rounded border border-[#E5E5E5] text-center space-y-3">
            <Sparkles className="w-5 h-5 text-[#252525] animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-[#252525]">
              Analyzing Speech & Synthesizing Honest Diagnosis
            </h4>
            <p className="text-xs text-[#666666] max-w-md mx-auto">
              Running signal processing, checking logical coherence, detecting filler words, and compiling exact grammatical corrections...
            </p>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded text-xs text-[#252525] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#929292] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="text-[#666666] mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Bottom Primary Controls Inside Card */}
        <section className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-2">
            {sessionState === 'topic_ready' && (
              <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                <Clock className="w-3.5 h-3.5 text-[#929292]" />
                <span>Duration:</span>
                {durationOptions.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedDurationSec(sec)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                      selectedDurationSec === sec
                        ? 'bg-[#252525] text-white font-bold'
                        : 'bg-[#FAFAFA] text-[#666666] border border-[#E5E5E5] hover:border-[#252525]'
                    }`}
                  >
                    {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                  </button>
                ))}
              </div>
            )}

            {sessionState === 'error' && (
              <button
                onClick={() => executeEvaluation(latestAudioAnalysisRef.current)}
                className="px-4 py-2 rounded bg-[#252525] text-white text-xs font-medium"
              >
                Retry Evaluation
              </button>
            )}
          </div>

          <div>
            {sessionState === 'topic_ready' && (
              <button
                onClick={handleStartRecording}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#252525] hover:bg-[#3a3a3a] text-white text-xs font-medium px-6 py-2.5 rounded transition-colors"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Start Speaking</span>
              </button>
            )}

            {sessionState === 'recording' && (
              <button
                onClick={handleStopRecording}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#252525] hover:bg-[#151515] text-white text-xs font-medium px-6 py-2.5 rounded transition-colors"
              >
                <span>Finish & Analyze Response</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Audio Playback Bar if recorded */}
      {audioUrl && (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#252525]">
            <Volume2 className="w-4 h-4 text-[#929292]" />
            <span>Audio Take Review</span>
          </div>
          <audio controls src={audioUrl} className="h-8 max-w-sm w-full" />
        </div>
      )}
    </div>
  );
};
