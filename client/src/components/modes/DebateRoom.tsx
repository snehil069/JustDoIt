import React, { useState, useRef } from 'react';
import { Topic, PracticeSession, DebateTurn, EvaluationReport } from '@shared/types/index';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { WaveformVisualizer } from '../common/WaveformVisualizer';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import {
  Users,
  Mic,
  Square,
  Sparkles,
  RotateCcw,
  Volume2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Bot,
  User,
} from 'lucide-react';

interface DebateRoomProps {
  topic: Topic;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
}

export const DebateRoom: React.FC<DebateRoomProps> = ({
  topic,
  onEvaluationComplete,
  onCancel,
}) => {
  const [motion, setMotion] = useState(
    topic.modeContext?.debateMotion || topic.question
  );
  const [userPosition, setUserPosition] = useState<'for' | 'against'>('for');
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [critiqueHistory, setCritiqueHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing_turn' | 'finalizing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    isRecording,
    currentVolume,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const {
    fullTranscript,
    finalTranscript,
    interimText,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const handleStartSpeaking = async () => {
    setErrorMessage(null);
    resetTranscript();

    const ok = await startRecording();
    if (!ok) {
      setErrorMessage('Microphone access denied. Please allow microphone permissions.');
      return;
    }

    startListening();
    setStatus('recording');
  };

  const handleStopSpeaking = async () => {
    stopListening();
    const audioData = stopRecording();

    const userSpeech = fullTranscript.trim();
    if (!userSpeech) {
      setStatus('idle');
      setErrorMessage('No speech detected. Please speak your debate argument and try again.');
      return;
    }

    // Add user turn
    const userTurn: DebateTurn = {
      speaker: 'user',
      roundNumber: currentRound,
      content: userSpeech,
      timestamp: new Date().toISOString(),
    };
    const updatedTurns = [...turns, userTurn];
    setTurns(updatedTurns);

    // If last round, proceed to final evaluation
    if (currentRound >= totalRounds) {
      await finalizeDebate(updatedTurns);
      return;
    }

    // Otherwise, generate AI Counterargument
    try {
      setStatus('processing_turn');
      setIsAiResponding(true);

      const aiResult = await api.sendDebateTurn({
        motion,
        userPosition,
        roundNumber: currentRound,
        totalRounds,
        history: updatedTurns,
        userArgument: userSpeech,
      });

      const aiTurn: DebateTurn = {
        speaker: 'ai',
        roundNumber: currentRound,
        content: aiResult.aiResponse,
        timestamp: new Date().toISOString(),
      };

      setTurns((prev) => [...prev, aiTurn]);
      if (aiResult.roundCritique) {
        setCritiqueHistory((prev) => [...prev, aiResult.roundCritique!]);
      }

      setCurrentRound((prev) => prev + 1);
      setStatus('idle');
      setIsAiResponding(false);
      resetTranscript();
    } catch (err: any) {
      console.error('Debate turn error:', err);
      setStatus('idle');
      setIsAiResponding(false);
      setErrorMessage(err?.message || 'Failed to generate debate opponent response.');
    }
  };

  const finalizeDebate = async (allTurns: DebateTurn[]) => {
    try {
      setStatus('finalizing');
      const allUserArguments = allTurns
        .filter((t) => t.speaker === 'user')
        .map((t, idx) => `[Round ${t.roundNumber} Opening/Rebuttal]: ${t.content}`)
        .join('\n\n');

      const settings = storageService.getSettings();
      const report: EvaluationReport = await api.evaluateSpeech({
        sessionId: `debate-${Date.now()}`,
        topic: {
          ...topic,
          title: `Debate: ${motion.substring(0, 40)}...`,
          question: `Motion: ${motion} (Argued: ${userPosition.toUpperCase()})`,
        },
        mode: 'debate',
        transcript: allUserArguments,
        durationSec: allTurns.filter((t) => t.speaker === 'user').length * 60,
      });

      const session: PracticeSession = {
        id: `debate-${Date.now()}`,
        userId: 'local-user-1',
        mode: 'debate',
        topic,
        status: 'completed',
        startedAt: allTurns[0]?.timestamp || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        originalTranscript: allUserArguments,
        audioSaved: false,
        transcriptionProvider: settings.preferredSttProvider,
        aiProvider: settings.isDemoMode ? 'demo' : settings.preferredAiProvider,
        debateTurns: allTurns,
        evaluation: report,
      };

      storageService.saveSession(session);
      onEvaluationComplete(session);
    } catch (err: any) {
      console.error('Final debate evaluation failed:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to complete debate evaluation.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Debate Motion Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-violet-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>Mode C — Debate Arena</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-white/10 text-white">
              Round {currentRound} of {totalRounds}
            </span>
            <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
              userPosition === 'for' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
            }`}>
              You are: {userPosition.toUpperCase()}
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            Debate Motion
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white leading-snug">
            "{motion}"
          </h1>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-violet-800/60">
          <span>Your opponent will not automatically agree with you. Defend with facts, not vague opinions.</span>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white underline"
          >
            Leave Arena
          </button>
        </div>
      </div>

      {/* Interactive Dialogue History */}
      <div className="space-y-4">
        {turns.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Deliver Your Opening Argument
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              State your thesis clearly, present your strongest premise, and provide one concrete example.
              When ready, press Start Speaking below.
            </p>
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border transition-all ${
              turn.speaker === 'user'
                ? 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-200/80 dark:border-brand-900/40 mr-4 sm:mr-12'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ml-4 sm:ml-12 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${turn.speaker === 'user' ? 'bg-brand-600 text-white' : 'bg-violet-600 text-white'}`}>
                  {turn.speaker === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {turn.speaker === 'user' ? `You (${userPosition.toUpperCase()})` : `Opponent AI (Counter-Argument)`}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Round {turn.roundNumber}</span>
            </div>

            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {turn.content}
            </p>
          </div>
        ))}

        {isAiResponding && (
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40 text-xs text-violet-800 dark:text-violet-200 flex items-center gap-2 animate-pulse ml-4 sm:ml-12">
            <Sparkles className="w-4 h-4 animate-spin text-violet-600" />
            <span>Opponent is scrutinizing your argument and formulating counter-premises...</span>
          </div>
        )}
      </div>

      {/* Speaking Controller */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {status === 'recording' ? 'Recording Your Spoken Rebuttal' : `Ready for Round ${currentRound}`}
          </span>
          {status === 'recording' && (
            <span className="text-xs font-mono font-bold text-rose-500 animate-pulse">
              ● LIVE
            </span>
          )}
        </div>

        <WaveformVisualizer isRecording={isRecording} volume={currentVolume} />

        {/* Live speech transcription */}
        {status === 'recording' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 min-h-[60px]">
            {finalTranscript} <span className="text-brand-500 italic">{interimText}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          {status === 'idle' && (
            <button
              onClick={handleStartSpeaking}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>{turns.length === 0 ? 'Deliver Opening Argument' : 'Speak Rebuttal'}</span>
            </button>
          )}

          {status === 'recording' && (
            <button
              onClick={handleStopSpeaking}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Submit Argument & Hear Counter</span>
            </button>
          )}

          {status === 'finalizing' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-brand-600" />
              <span>Finalizing multi-round debate evaluation...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
