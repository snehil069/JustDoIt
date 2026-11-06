import React, { useState } from 'react';
import { Topic, PracticeSession, InterviewTurn, EvaluationReport } from '@shared/types/index';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { WaveformVisualizer } from '../common/WaveformVisualizer';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import {
  Briefcase,
  Mic,
  Square,
  Sparkles,
  RotateCcw,
  Volume2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface InterviewRoomProps {
  topic: Topic;
  onEvaluationComplete: (session: PracticeSession) => void;
  onCancel: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  topic,
  onEvaluationComplete,
  onCancel,
}) => {
  const [interviewType, setInterviewType] = useState<string>(
    topic.modeContext?.interviewType || 'behavioral-star'
  );
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    topic.question || "Tell me about a time you faced a difficult conflict within a team, and how you resolved it."
  );
  const [questionCount, setQuestionCount] = useState<number>(1);
  const maxQuestions = 3;
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'finalizing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isRecording, currentVolume, startRecording, stopRecording } = useAudioRecorder();
  const { fullTranscript, finalTranscript, interimText, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const handleStartAnswering = async () => {
    setErrorMessage(null);
    resetTranscript();

    const ok = await startRecording();
    if (!ok) {
      setErrorMessage('Microphone access denied. Please grant microphone permissions.');
      return;
    }

    startListening();
    setStatus('recording');
  };

  const handleStopAnswering = async () => {
    stopListening();
    stopRecording();

    const answer = fullTranscript.trim();
    if (!answer) {
      setStatus('idle');
      setErrorMessage('No speech recorded. Please speak your answer clearly.');
      return;
    }

    const currentTurn: InterviewTurn = {
      interviewerQuestion: currentQuestion,
      userAnswer: answer,
      timestamp: new Date().toISOString(),
    };

    const updatedTurns = [...turns, currentTurn];
    setTurns(updatedTurns);

    if (questionCount >= maxQuestions) {
      await finalizeInterview(updatedTurns);
      return;
    }

    // Get follow-up question
    try {
      setStatus('processing');
      const result = await api.sendInterviewTurn({
        interviewType,
        history: updatedTurns,
        userAnswer: answer,
      });

      currentTurn.interviewerFollowup = result.feedbackOnAnswer;
      currentTurn.starAnalysis = result.starAnalysis;

      setCurrentQuestion(result.nextQuestion);
      setQuestionCount((c) => c + 1);
      setStatus('idle');
      resetTranscript();
    } catch (err: any) {
      console.error('Interview turn error:', err);
      setStatus('idle');
      setErrorMessage(err?.message || 'Failed to process interview turn.');
    }
  };

  const finalizeInterview = async (allTurns: InterviewTurn[]) => {
    try {
      setStatus('finalizing');
      const fullTranscriptCombined = allTurns
        .map((t, idx) => `[Question ${idx + 1}: ${t.interviewerQuestion}]\nAnswer: ${t.userAnswer}`)
        .join('\n\n');

      const settings = storageService.getSettings();
      const report: EvaluationReport = await api.evaluateSpeech({
        sessionId: `interview-${Date.now()}`,
        topic: {
          ...topic,
          title: `Interview: ${interviewType.toUpperCase()}`,
          question: `Completed 3-question structured interview session on ${topic.title}`,
        },
        mode: 'interview',
        transcript: fullTranscriptCombined,
        durationSec: allTurns.length * 90,
      });

      const session: PracticeSession = {
        id: `interview-${Date.now()}`,
        userId: 'local-user-1',
        mode: 'interview',
        topic,
        status: 'completed',
        startedAt: allTurns[0]?.timestamp || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        originalTranscript: fullTranscriptCombined,
        audioSaved: false,
        transcriptionProvider: settings.preferredSttProvider,
        aiProvider: settings.isDemoMode ? 'demo' : settings.preferredAiProvider,
        interviewTurns: allTurns,
        evaluation: report,
      };

      storageService.saveSession(session);
      onEvaluationComplete(session);
    } catch (err: any) {
      console.error('Interview finalization error:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to generate final interview report.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Mode D — Interview Simulator</span>
          </div>

          <span className="text-xs font-mono px-3 py-1 bg-black/40 rounded-xl border border-white/10">
            Question {questionCount} of {maxQuestions}
          </span>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
            Interviewer Question
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 leading-snug">
            "{currentQuestion}"
          </h1>
        </div>

        <div className="flex items-center justify-between text-xs text-amber-200/80 pt-2 border-t border-amber-900/60">
          <span>Remember the STAR method: Situation, Task, Action, Result. Avoid vague summaries.</span>
          <button onClick={onCancel} className="text-slate-400 hover:text-white underline">
            Exit Interview
          </button>
        </div>
      </div>

      {/* Previous Q&A Log */}
      {turns.length > 0 && (
        <div className="space-y-4">
          {turns.map((turn, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs"
            >
              <div className="font-bold text-slate-500 uppercase tracking-wider">
                Question {i + 1}: {turn.interviewerQuestion}
              </div>
              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed pl-2 border-l-2 border-brand-500">
                {turn.userAnswer}
              </p>
              {turn.interviewerFollowup && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
                  <span className="font-bold">Interviewer Assessment:</span> {turn.interviewerFollowup}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recording Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>{status === 'recording' ? 'Recording Spoken Response' : 'Candidate Turn'}</span>
          {status === 'recording' && <span className="text-rose-500 font-mono animate-pulse">● RECORDING</span>}
        </div>

        <WaveformVisualizer isRecording={isRecording} volume={currentVolume} />

        {status === 'recording' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs min-h-[60px]">
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
              onClick={handleStartAnswering}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>Answer Question</span>
            </button>
          )}

          {status === 'recording' && (
            <button
              onClick={handleStopAnswering}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Submit Answer & Continue</span>
            </button>
          )}

          {status === 'processing' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
              <span>Interviewer is analyzing your STAR formulation...</span>
            </div>
          )}

          {status === 'finalizing' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-brand-600" />
              <span>Generating comprehensive interview report...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
