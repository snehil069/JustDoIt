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
  RefreshCw,
} from 'lucide-react';

interface PracticeEngineProps {
  topic: Topic;
  mode: PracticeMode;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
  onSkipTopic?: () => void;
  onGenerateAnotherTopic?: () => void;
  researchNotes?: string;
}

export const PracticeEngine: React.FC<PracticeEngineProps> = ({
  topic: initialTopic,
  mode,
  onEvaluationComplete,
  onCancel,
  onSkipTopic,
  onGenerateAnotherTopic,
  researchNotes,
}) => {
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState<boolean>(false);

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  const [sessionState, setSessionState] = useState<
    'topic_ready' | 'preparing' | 'recording' | 'transcribing' | 'processing' | 'completed' | 'error'
  >('topic_ready');

  const [selectedDurationSec, setSelectedDurationSec] = useState<number>(topic.suggestedDurationSec || 180);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [remainingSec, setRemainingSec] = useState<number>(selectedDurationSec);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual editing and testing support
  const [customTranscript, setCustomTranscript] = useState<string>('');
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);

  // Last recorded audio blob for retry
  const lastRecordedAudioBlob = useRef<Blob | null>(null);

  // Audio & Speech hooks
  const {
    isRecording,
    currentVolume,
    audioUrl,
    audioBlob,
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
    setSelectedDurationSec(topic.suggestedDurationSec || 180);
    setRemainingSec(topic.suggestedDurationSec || 180);
  }, [topic]);

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

  const handleGenerateAnotherTopicInternal = async () => {
    if (isGeneratingTopic) return;
    setIsGeneratingTopic(true);
    setErrorMessage(null);
    try {
      if (onGenerateAnotherTopic) {
        onGenerateAnotherTopic();
      } else {
        const nextTopic = await api.generateAITopic({
          category: topic.category,
          difficulty: topic.difficulty,
          mode,
        });
        setTopic(nextTopic);
      }
      setSessionState('topic_ready');
      setCustomTranscript('');
      setIsEditingTranscript(false);
      resetTranscript();
    } catch (err) {
      console.error('Failed to generate another topic:', err);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    resetTranscript();
    setCustomTranscript('');
    setIsEditingTranscript(false);
    lastRecordedAudioBlob.current = null;

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
    setSessionState('transcribing');
    setErrorMessage(null);

    try {
      const stopResult = await stopRecording();
      lastRecordedAudioBlob.current = stopResult.audioBlob;
      latestAudioAnalysisRef.current = stopResult.audioAnalysis;

      // 1. Transcribe audio using Gemini Developer API
      const result = await api.transcribeAudio(stopResult.audioBlob, stopResult.audioAnalysis.durationSec);
      const verbatimSpeech = (result.transcript || '').trim();

      if (result.noSpeech || !verbatimSpeech) {
        // If audio transcription returned no speech, but live recognition captured words cleanly, use that
        const cleanLiveSpeech = (latestTranscriptRef.current || fullTranscript).trim();
        if (cleanLiveSpeech) {
          setCustomTranscript(cleanLiveSpeech);
          latestTranscriptRef.current = cleanLiveSpeech;
          await executeEvaluation(cleanLiveSpeech, stopResult.audioAnalysis);
          return;
        }

        setSessionState('error');
        setErrorMessage(
          'No audible speech was detected in your recording. Please ensure your microphone is unmuted, speak clearly, and try recording again.'
        );
        return;
      }

      // Display actual spoken words
      setCustomTranscript(verbatimSpeech);
      latestTranscriptRef.current = verbatimSpeech;

      // 2. Proceed to evaluation with verified verbatim transcript
      await executeEvaluation(verbatimSpeech, stopResult.audioAnalysis);
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      // If audio transcription had an issue, fallback to fullTranscript if available or show error with retry
      const fallbackSpeech = (latestTranscriptRef.current || fullTranscript).trim();
      if (fallbackSpeech) {
        setCustomTranscript(fallbackSpeech);
        await executeEvaluation(fallbackSpeech, latestAudioAnalysisRef.current);
      } else {
        setSessionState('error');
        setErrorMessage(
          `Audio transcription failed (${err?.message || 'Network error'}). You can click "Retry Transcription" or record again.`
        );
      }
    }
  }, [stopListening, stopRecording, fullTranscript]);

  const handleRetryTranscription = async () => {
    if (!lastRecordedAudioBlob.current) {
      setErrorMessage('No recorded audio available to retry.');
      return;
    }

    try {
      setSessionState('transcribing');
      setErrorMessage(null);

      const result = await api.transcribeAudio(lastRecordedAudioBlob.current, elapsedSec);
      const verbatimSpeech = (result.transcript || '').trim();

      if (result.noSpeech || !verbatimSpeech) {
        setSessionState('error');
        setErrorMessage(
          'No audible speech was detected in this recording. Please try speaking again.'
        );
        return;
      }

      setCustomTranscript(verbatimSpeech);
      latestTranscriptRef.current = verbatimSpeech;

      await executeEvaluation(verbatimSpeech, latestAudioAnalysisRef.current);
    } catch (err: any) {
      console.error('Retry transcription error:', err);
      setSessionState('error');
      setErrorMessage(`Retry failed: ${err?.message || 'Error transcribing audio.'}`);
    }
  };

  const executeEvaluation = async (
    transcriptOverride?: string,
    audioAnalysis?: AudioAnalysisOutput | null
  ) => {
    const transcriptToEvaluate = (
      transcriptOverride ||
      customTranscript ||
      fullTranscript ||
      latestTranscriptRef.current
    ).trim();

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

      const calculatedDuration =
        elapsedSec > 5
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
                  sessionState === 'recording'
                    ? 'bg-[#252525] pulse-dot'
                    : sessionState === 'transcribing'
                    ? 'bg-[#252525] animate-ping'
                    : 'bg-[#929292]'
                }`}
              />
              <span className="text-xs font-semibold tracking-tight text-[#252525]">
                {sessionState === 'recording'
                  ? 'Recording · Microphone Active'
                  : sessionState === 'transcribing'
                  ? 'Transcribing Audio...'
                  : sessionState === 'processing'
                  ? 'Analyzing Speech...'
                  : 'Ready to Record'}
              </span>
              <span className="text-[#E5E5E5]">|</span>
              <span className="text-[11px] font-mono text-[#666666] bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-0.5 rounded">
                Gemini Developer Audio Engine
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

          {/* Minimal hairline progress indicator */}
          <div className="w-full bg-[#F5F5F4] h-0.5 rounded-full overflow-hidden">
            <div
              className="bg-[#252525] h-full transition-all duration-300"
              style={{ width: `${sessionState === 'recording' ? Math.min(100, timerProgress) : 0}%` }}
            />
          </div>
        </section>

        {/* Topic & Prompt Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#929292] font-medium">
              DAILY RHETORIC DRILL · SPONTANEOUS SYNTHESIS
            </span>
            <div className="flex items-center gap-2">
              {sessionState === 'topic_ready' && (
                <button
                  type="button"
                  onClick={handleGenerateAnotherTopicInternal}
                  disabled={isGeneratingTopic}
                  className="px-2.5 py-1 rounded border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F4] text-xs text-[#252525] font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-[#252525] ${isGeneratingTopic ? 'animate-spin' : ''}`} />
                  <span>Generate Another Topic</span>
                </button>
              )}
              {sessionState === 'topic_ready' && onSkipTopic && (
                <button
                  onClick={onSkipTopic}
                  className="text-[11px] text-[#666666] hover:text-[#252525] hover:underline"
                >
                  Skip
                </button>
              )}
            </div>
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
              Verbatim Audio STT
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

        {/* Real-time Waveform Indicator while recording */}
        {sessionState === 'recording' && (
          <div className="border border-[#E5E5E5] rounded p-4 bg-[#FAFAFA] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#666666]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#929292]">Audio Signal Level</span>
              <span className="font-mono text-[11px]">{Math.round(currentVolume * 100)}%</span>
            </div>
            <WaveformVisualizer isRecording={isRecording} volume={currentVolume} />
          </div>
        )}

        {/* Live Audio Ingestion / Transcript Display Area */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292] font-medium">
              Spoken Transcript (Verbatim Audio Record)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLoadSampleGrammarMistakes}
                className="text-[11px] font-medium text-[#252525] hover:underline"
              >
                + Try Sample Response
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                className="text-[11px] font-medium text-[#666666] hover:text-[#252525] underline"
              >
                {isEditingTranscript ? 'Done Editing' : 'Edit / Type'}
              </button>
            </div>
          </div>

          <div className="min-h-[140px] bg-[#FAFAFA] border border-[#E5E5E5] rounded p-4 flex flex-col justify-between gap-4">
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
                          ? 'Listening and capturing audio... Speak clearly into your microphone.'
                          : sessionState === 'transcribing'
                          ? 'Transcribing audio buffer with Gemini...'
                          : 'Your spoken transcript will appear here verbatim after recording. You can also click "+ Try Sample Response" or "Edit / Type" anytime.'}
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

              {effectiveTranscript &&
                sessionState !== 'recording' &&
                sessionState !== 'transcribing' &&
                sessionState !== 'processing' && (
                  <button
                    type="button"
                    onClick={() => executeEvaluation(effectiveTranscript, latestAudioAnalysisRef.current)}
                    className="px-3 py-1 bg-[#252525] hover:bg-[#3a3a3a] text-white rounded text-xs font-sans font-medium transition-colors"
                  >
                    Analyze This Transcript &rarr;
                  </button>
                )}
            </div>
          </div>
        </section>

        {/* Transcribing State Indicator */}
        {sessionState === 'transcribing' && (
          <div className="p-6 bg-[#FAFAFA] rounded border border-[#E5E5E5] text-center space-y-3">
            <Sparkles className="w-5 h-5 text-[#252525] animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-[#252525]">
              Transcribing Your Spoken Audio with Gemini AI...
            </h4>
            <p className="text-xs text-[#666666] max-w-md mx-auto">
              Uploading high-fidelity audio buffer and extracting exact spoken words without silent grammar rewrites.
            </p>
          </div>
        )}

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

        {/* Error notification with Retry options */}
        {errorMessage && (
          <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded text-xs text-[#252525] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#929292] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Notice</p>
                <p className="text-[#666666] mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              {lastRecordedAudioBlob.current && (
                <button
                  type="button"
                  onClick={handleRetryTranscription}
                  className="px-3 py-1.5 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F4] text-[#252525] rounded font-medium text-xs transition-colors"
                >
                  Retry Transcription
                </button>
              )}
              <button
                type="button"
                onClick={handleStartRecording}
                className="px-3 py-1.5 bg-[#252525] hover:bg-[#3f3f3f] text-white rounded font-medium text-xs transition-colors"
              >
                Record Again
              </button>
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

            {sessionState === 'error' && !lastRecordedAudioBlob.current && (
              <button
                onClick={() => executeEvaluation()}
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
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Finish & Transcribe Response</span>
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
