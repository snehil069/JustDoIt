import {
  EvaluationReport,
  Topic,
  PracticeMode,
  AudioDeliveryMetrics,
} from '../../../../shared/types/index.js';
import { MultiStageAnalyzer } from '../../../../shared/evaluation/multiStageAnalyzer.js';

export class DemoEvaluator {
  public evaluate(params: {
    sessionId: string;
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

export const demoEvaluator = new DemoEvaluator();
