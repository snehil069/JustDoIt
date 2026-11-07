import React, { useState, useRef, useEffect } from 'react';
import { Topic, PracticeSession, DebateTurn, EvaluationReport } from '@shared/types/index';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { WaveformVisualizer } from '../common/WaveformVisualizer';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import { piperTts } from '../../services/piperTts';
import {
  Users,
  Mic,
  Square,
  Sparkles,
  AlertCircle,
  User,
  Bot,
  ArrowRight,
  Volume2,
  VolumeX,
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
  const [motion] = useState(
    topic.modeContext?.debateMotion || topic.question
  );
  const [userPosition] = useState<'for' | 'against'>('for');
  const [totalRounds] = useState<number>(3);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'transcribing' | 'processing_turn' | 'finalizing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ttsAutoPlay, setTtsAutoPlay] = useState<boolean>(true);
  const [speakingTurnIndex, setSpeakingTurnIndex] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      piperTts.stop();
    };
  }, []);

  const handlePlayOrStopTts = (text: string, turnIndex: number) => {
    if (speakingTurnIndex === turnIndex && piperTts.isSpeaking()) {
      piperTts.stop();
      setSpeakingTurnIndex(null);
    } else {
      setSpeakingTurnIndex(turnIndex);
      piperTts.speak(text, {
        onStart: () => setSpeakingTurnIndex(turnIndex),
        onEnd: () => setSpeakingTurnIndex(null),
        onError: () => setSpeakingTurnIndex(null),
      });
    }
  };

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
    setStatus('transcribing');
    setErrorMessage(null);

    let userSpeech = '';
    try {
      const { audioBlob } = await stopRecording();
      const result = await api.transcribeAudio(audioBlob);
      userSpeech = (result.transcript || fullTranscript).trim();
    } catch {
      userSpeech = fullTranscript.trim();
    }

    if (!userSpeech) {
      setStatus('idle');
      setErrorMessage('No audible speech detected. Please speak your debate argument and try again.');
      return;
    }

    const userTurn: DebateTurn = {
      speaker: 'user',
      roundNumber: currentRound,
      content: userSpeech,
      timestamp: new Date().toISOString(),
    };
    const updatedTurns = [...turns, userTurn];
    setTurns(updatedTurns);

    if (currentRound >= totalRounds) {
      await finalizeDebate(updatedTurns);
      return;
    }

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

      const newTurnIndex = updatedTurns.length;
      setTurns((prev) => [...prev, aiTurn]);
      setCurrentRound((prev) => prev + 1);
      setStatus('idle');
      setIsAiResponding(false);
      resetTranscript();

      if (ttsAutoPlay && aiResult.aiResponse) {
        setSpeakingTurnIndex(newTurnIndex);
        piperTts.speak(aiResult.aiResponse, {
          onStart: () => setSpeakingTurnIndex(newTurnIndex),
          onEnd: () => setSpeakingTurnIndex(null),
          onError: () => setSpeakingTurnIndex(null),
        });
      }
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
        .map((t) => `[Round ${t.roundNumber} Opening/Rebuttal]: ${t.content}`)
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Debate Header */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#929292] border border-[#E5E5E5] px-2 py-0.5 rounded">
              Mode 03 — Debate Arena
            </span>
            <span className="text-xs text-[#666666]">Adversarial Dialectic Engine</span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                if (ttsAutoPlay && piperTts.isSpeaking()) piperTts.stop();
                setTtsAutoPlay(!ttsAutoPlay);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                ttsAutoPlay
                  ? 'bg-[#252525] text-white border-[#252525]'
                  : 'bg-[#F5F5F4] text-[#666666] border-[#E5E5E5] hover:bg-[#E5E5E5]'
              }`}
              title="Toggle Piper Text-To-Speech for opponent rebuttals"
            >
              {ttsAutoPlay ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Piper TTS: {ttsAutoPlay ? 'ON' : 'OFF'}</span>
            </button>
            <span className="px-2.5 py-1 rounded bg-[#F5F5F4] border border-[#E5E5E5] text-[#252525]">
              Round {currentRound} of {totalRounds}
            </span>
            <span className="px-2.5 py-1 rounded bg-[#252525] text-[#FFFFFF] uppercase tracking-wider font-semibold">
              Position: {userPosition.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292] block">
            Debate Motion
          </span>
          <div className="bg-[#F5F5F4] p-5 rounded-lg border border-[#E5E5E5]">
            <h1 className="text-lg sm:text-xl font-medium tracking-tight text-[#252525] leading-relaxed">
              "{motion}"
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E5E5E5] text-xs text-[#666666]">
          <span>The opponent AI scrutinizes empirical leaps, ungrounded claims, and logical inconsistencies.</span>
          <button
            onClick={onCancel}
            className="text-[#929292] hover:text-[#252525] transition-colors self-start sm:self-auto font-mono"
          >
            Leave Arena
          </button>
        </div>
      </div>

      {/* Dialogue Stream */}
      <div className="space-y-4">
        {turns.length === 0 && (
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-8 text-center space-y-2">
            <h3 className="text-sm font-semibold text-[#252525]">
              Deliver Your Opening Argument
            </h3>
            <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
              State your thesis clearly, present your primary premise, and back it with a concrete evidentiary anchor.
            </p>
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={`p-5 rounded-lg border transition-all ${
              turn.speaker === 'user'
                ? 'bg-[#F5F5F4] border-[#E5E5E5] mr-4 sm:mr-16'
                : 'bg-[#FFFFFF] border-[#252525] ml-4 sm:ml-16'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`p-1 rounded ${turn.speaker === 'user' ? 'bg-[#252525] text-[#FFFFFF]' : 'bg-[#E5E5E5] text-[#252525]'}`}>
                  {turn.speaker === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </span>
                <span className="text-xs font-medium text-[#252525]">
                  {turn.speaker === 'user' ? `You (${userPosition.toUpperCase()})` : `Opponent Counter-Rebuttal`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {turn.speaker === 'ai' && (
                  <button
                    type="button"
                    onClick={() => handlePlayOrStopTts(turn.content, i)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                      speakingTurnIndex === i
                        ? 'bg-[#252525] text-white border-[#252525]'
                        : 'border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F4] text-[#252525]'
                    }`}
                    title="Read this turn aloud using Piper TTS"
                  >
                    {speakingTurnIndex === i ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                        <span>Stop Speech</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen (Piper TTS)</span>
                      </>
                    )}
                  </button>
                )}
                <span className="text-[11px] text-[#929292] font-mono">Round {turn.roundNumber}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#252525] leading-relaxed pt-1">
              {turn.content}
            </p>
          </div>
        ))}

        {isAiResponding && (
          <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-xs text-[#666666] flex items-center space-x-2 animate-pulse ml-4 sm:ml-16">
            <Sparkles className="w-4 h-4 animate-spin text-[#252525]" />
            <span>Opponent is scrutinizing your argument and formulating counter-premises...</span>
          </div>
        )}
      </div>

      {/* Speaking Controller */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            {status === 'recording' ? 'Recording Spoken Argument' : `Awaiting Round ${currentRound}`}
          </span>
          {status === 'recording' && (
            <span className="text-xs font-mono font-medium text-[#252525] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#252525] animate-ping inline-block"></span>
              <span>LIVE TRANSMISSION</span>
            </span>
          )}
        </div>

        <WaveformVisualizer isRecording={isRecording} volume={currentVolume} />

        {/* Live transcript box */}
        {status === 'recording' && (
          <div className="p-3 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] text-xs text-[#252525] min-h-[60px] font-mono leading-relaxed">
            {finalTranscript} <span className="text-[#929292]">{interimText}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-[#F5F5F4] text-[#252525] text-xs rounded-lg border border-[#E5E5E5] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#252525] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-center pt-2">
          {status === 'idle' && (
            <button
              onClick={handleStartSpeaking}
              className="px-6 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
            >
              <Mic className="w-4 h-4" />
              <span>{turns.length === 0 ? 'Deliver Opening Argument' : 'Speak Rebuttal'}</span>
            </button>
          )}

          {status === 'recording' && (
            <button
              onClick={handleStopSpeaking}
              className="px-6 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Submit Argument & Hear Counter</span>
            </button>
          )}

          {status === 'finalizing' && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#666666] animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-[#252525]" />
              <span>Compiling multi-round debate evaluation...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
