import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
} from '../../../../shared/types/index.js';
import { geminiProvider } from '../ai/geminiProvider.js';
import { demoEvaluator } from '../ai/demoEvaluator.js';
import { audioAnalyzer, RawAudioAnalysisInput } from '../audio/audioAnalyzer.js';
import { config } from '../../config/index.js';

export interface EvaluateRequestPayload {
  sessionId: string;
  topic: Topic;
  mode: PracticeMode;
  transcript: string;
  durationSec: number;
  researchNotes?: string;
  rawAudioAnalysis?: RawAudioAnalysisInput;
  apiKeyOverride?: string;
  aiProviderPreference?: 'gemini' | 'grok' | 'demo';
}

export class EvaluationEngine {
  public async evaluate(payload: EvaluateRequestPayload): Promise<EvaluationReport> {
    const { sessionId, topic, mode, transcript, durationSec, researchNotes, rawAudioAnalysis, apiKeyOverride, aiProviderPreference } = payload;

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty. Please provide speech transcript for evaluation.');
    }

    // 1. Process audio metrics
    let audioMetrics: AudioDeliveryMetrics | undefined = undefined;
    if (rawAudioAnalysis) {
      audioMetrics = audioAnalyzer.analyze(rawAudioAnalysis);
    } else {
      // Basic fallback analysis from word count and duration
      const words = transcript.trim().split(/\s+/).filter(Boolean);
      audioMetrics = audioAnalyzer.analyze({
        durationSec: durationSec || 60,
        wordCount: words.length,
        transcript,
      });
    }

    // 2. Select AI Provider
    const activeApiKey = apiKeyOverride || config.geminiApiKey;
    const isDemoRequested = aiProviderPreference === 'demo' || !activeApiKey;

    if (isDemoRequested) {
      // Return clearly marked demo report
      return demoEvaluator.evaluate({
        sessionId,
        topic,
        mode,
        transcript,
        durationSec: durationSec || 60,
        audioMetrics,
      });
    }

    try {
      // Call Gemini
      return await geminiProvider.evaluateSpeech({
        sessionId,
        topic,
        mode,
        transcript,
        durationSec: durationSec || 60,
        researchNotes,
        audioMetrics,
        apiKeyOverride: activeApiKey,
      });
    } catch (err: any) {
      console.error('Gemini evaluation failed:', err?.message || err);
      // In compliance with rule 5: Do not show a successful AI evaluation when an API request has failed.
      // Throw genuine error so user knows the API request failed rather than disguising it as success.
      throw new Error(`AI evaluation failed: ${err?.message || 'Provider API error'}. Please verify your API key or switch to Demo Mode in Settings.`);
    }
  }
}

export const evaluationEngine = new EvaluationEngine();
