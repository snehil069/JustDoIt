import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
} from '@shared/types/index';
import { MultiStageAnalyzer } from '@shared/evaluation/multiStageAnalyzer';

export class LocalEvaluator {
  public static evaluate(params: {
    sessionId?: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    audioMetrics?: AudioDeliveryMetrics;
    researchNotes?: string;
  }): EvaluationReport {
    return MultiStageAnalyzer.evaluateComplete(params);
  }
}
