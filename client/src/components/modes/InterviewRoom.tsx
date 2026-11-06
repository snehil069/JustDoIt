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
  AlertCircle,
  ArrowRight,
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
  const [interviewType] = useState<string>(
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#252525]">
      {/* Header Card */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#929292] border border-[#E5E5E5] px-2 py-0.5 rounded">
              Mode 04 — Interview Simulator
            </span>
            <span className="text-xs text-[#666666]">Framework: Behavioral STAR</span>
          </div>

          <span className="text-xs font-mono px-3 py-1 bg-[#F5F5F4] border border-[#E5E5E5] rounded-lg text-[#252525]">
            Question {questionCount} of {maxQuestions}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292] block">
            Executive Interviewer Question
          </span>
          <div className="bg-[#F5F5F4] p-5 rounded-lg border border-[#E5E5E5]">
            <h1 className="text-lg sm:text-xl font-medium tracking-tight text-[#252525] leading-relaxed">
              "{currentQuestion}"
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E5E5E5] text-xs text-[#666666]">
          <span>Anchor your answer in STAR: Situation, Task, Action taken, and quantifiable Result.</span>
          <button onClick={onCancel} className="text-[#929292] hover:text-[#252525] transition-colors font-mono">
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
              className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-3"
            >
              <div className="font-mono text-[11px] text-[#929292] uppercase tracking-wider">
                Question {i + 1}: {turn.interviewerQuestion}
              </div>
              <p className="text-[#252525] text-xs sm:text-sm leading-relaxed pl-3 border-l-2 border-[#252525]">
                {turn.userAnswer}
              </p>
              {turn.interviewerFollowup && (
                <div className="mt-2 p-3.5 bg-[#F5F5F4] rounded-lg border border-[#E5E5E5] text-xs text-[#666666] leading-relaxed">
                  <span className="font-medium text-[#252525]">Interviewer Assessment:</span> {turn.interviewerFollowup}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recording Area */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E5] p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#929292]">
          <span>{status === 'recording' ? 'Transmitting Spoken Response' : 'Candidate Turn'}</span>
          {status === 'recording' && (
            <span className="text-[#252525] flex items-center space-x-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#252525] animate-ping inline-block"></span>
              <span>LIVE TRANSMISSION</span>
            </span>
          )}
        </div>

        <WaveformVisualizer isRecording={isRecording} volume={currentVolume} />

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
              onClick={handleStartAnswering}
              className="px-6 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
            >
              <Mic className="w-4 h-4" />
              <span>Answer Question</span>
            </button>
          )}

          {status === 'recording' && (
            <button
              onClick={handleStopAnswering}
              className="px-6 py-2.5 rounded-lg bg-[#252525] hover:bg-[#3f3f3f] text-[#FFFFFF] font-medium text-xs transition-colors flex items-center space-x-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Submit Answer & Continue</span>
            </button>
          )}

          {status === 'processing' && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#666666] animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-[#252525]" />
              <span>Interviewer is analyzing your STAR formulation...</span>
            </div>
          )}

          {status === 'finalizing' && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#666666] animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-[#252525]" />
              <span>Compiling comprehensive interview report...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
