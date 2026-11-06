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
  CheckCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
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
    setFinalTranscript,
  } = useSpeechRecognition();

  // Timestamp-based drift-free timer
  const timerStartRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const latestAudioAnalysisRef = useRef<AudioAnalysisOutput | null>(null);
  const currentSessionIdRef = useRef<string>(`session-${Date.now()}`);

  // Duration options in seconds
  const durationOptions = [60, 120, 180, 300, 600];

  useEffect(() => {
    setRemainingSec(selectedDurationSec);
  }, [selectedDurationSec]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start speaking session
  const handleStartRecording = async () => {
    setErrorMessage(null);
    resetTranscript();

    const micGranted = await startRecording();
    if (!micGranted) {
      setErrorMessage(
        'Microphone access was denied or could not be initialized. Please check your browser microphone permissions.'
      );
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

  // Stop recording
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

  // Execute Evaluation
  const executeEvaluation = async (audioAnalysis?: AudioAnalysisOutput | null) => {
    const transcriptToEvaluate = fullTranscript.trim();

    if (!transcriptToEvaluate) {
      setSessionState('error');
      setErrorMessage(
        'No speech was captured. Please ensure your microphone is working, speaks clearly, and try recording again.'
      );
      return;
    }

    try {
      setSessionState('processing');
      const settings = storageService.getSettings();

      const report: EvaluationReport = await api.evaluateSpeech({
        sessionId: currentSessionIdRef.current,
        topic,
        mode,
        transcript: transcriptToEvaluate,
        durationSec: elapsedSec || 30,
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
        startedAt: new Date(Date.now() - (elapsedSec || 30) * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        speakingDurationSec: elapsedSec || 30,
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

  const timerProgress = selectedDurationSec > 0 ? (elapsedSec / selectedDurationSec) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Topic Card Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider">
              {topic.category.replace('-', ' ')}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium capitalize">
              {topic.difficulty} Difficulty
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium capitalize">
              {topic.format.replace('-', ' ')}
            </span>
          </div>

          {sessionState === 'topic_ready' && onSkipTopic && (
            <button
              onClick={onSkipTopic}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline"
            >
              Skip this topic
            </button>
          )}
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {topic.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
            {topic.question}
          </p>
        </div>

        {topic.taskExplanation && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
            Coach Tip: {topic.taskExplanation}
          </p>
        )}

        {/* Hints accordion */}
        {topic.hints && topic.hints.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowHints(!showHints)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHints ? 'Hide Speaking Angles' : 'Need Ideas? View Angles'}</span>
            </button>

            {showHints && (
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/40 text-xs text-slate-600 dark:text-slate-300 animate-fadeIn">
                {topic.hints.map((hint, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Speaking Timer & Waveform Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Duration selector when idle */}
        {sessionState === 'topic_ready' && (
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Target Duration</span>
            </div>
            <div className="flex items-center gap-1.5">
              {durationOptions.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedDurationSec(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDurationSec === sec
                      ? 'bg-brand-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Timer Display */}
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <div className="relative flex items-center justify-center">
            {/* Countdown / Elapsed Big Numbers */}
            <div className="text-center">
              <span
                className={`text-5xl sm:text-6xl font-extrabold tracking-tight font-mono ${
                  sessionState === 'recording'
                    ? remainingSec < 30
                      ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                      : 'text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {sessionState === 'recording' ? formatTime(remainingSec) : formatTime(selectedDurationSec)}
              </span>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                {sessionState === 'recording' ? 'Remaining' : 'Target Speaking Duration'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {sessionState === 'recording' && (
            <div className="w-full max-w-md h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, timerProgress)}%` }}
              />
            </div>
          )}
        </div>

        {/* Waveform Visualizer */}
        <WaveformVisualizer isRecording={isRecording} volume={currentVolume} />

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {sessionState === 'topic_ready' && (
            <>
              <button
                onClick={handleStartRecording}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Start Speaking</span>
              </button>
              <button
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {sessionState === 'recording' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleStopRecording}
                className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Finish & Analyze Response</span>
              </button>
            </div>
          )}

          {sessionState === 'error' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => executeEvaluation(latestAudioAnalysisRef.current)}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Evaluation</span>
              </button>
              <button
                onClick={() => setSessionState('topic_ready')}
                className="px-5 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium"
              >
                Start Over
              </button>
            </div>
          )}
        </div>

        {/* Processing State Indicator */}
        {sessionState === 'processing' && (
          <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-pulse">
            <div className="inline-flex p-3 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Evaluating Your Speech
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Running signal analysis, checking reasoning integrity, detecting filler words, and
                compiling exact grammatical corrections...
              </p>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Mic Permission Warning */}
        {micPermissionDenied && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-200 text-xs">
            <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Microphone Permission Required</p>
              <p className="mt-0.5">
                Please click the microphone/lock icon in your browser URL bar and choose "Allow" to enable live speech recording.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Verbatim Transcription Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Live Verbatim Transcript
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {fullTranscript.split(/\s+/).filter(Boolean).length} words captured
          </span>
        </div>

        <div className="min-h-[120px] max-h-[220px] overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          {finalTranscript && <span>{finalTranscript}</span>}
          {interimText && <span className="text-brand-500 font-medium italic"> {interimText}</span>}
          {!finalTranscript && !interimText && (
            <span className="text-slate-400 italic">
              {sessionState === 'recording'
                ? 'Listening... Speak clearly into your microphone.'
                : 'Your speech transcript will appear here in real-time as you speak.'}
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400 italic">
          Note: Fillers and hesitations ("um", "like", false starts) are intentionally preserved to ensure accurate, honest fluency feedback.
        </p>
      </div>

      {/* Audio Playback when recording is stopped */}
      {audioUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Volume2 className="w-4 h-4 text-brand-500" />
            <span>Recorded Speech Playback</span>
          </div>
          <audio controls src={audioUrl} className="h-8 max-w-sm w-full" />
        </div>
      )}
    </div>
  );
};
