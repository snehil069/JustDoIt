export type Category =
  // Core 30 Categories
  | 'technology'
  | 'ai'
  | 'education'
  | 'business'
  | 'science'
  | 'psychology'
  | 'society'
  | 'environment'
  | 'sports'
  | 'careers'
  | 'finance'
  | 'philosophy'
  | 'history'
  | 'entertainment'
  | 'everyday-life'
  | 'college-life'
  | 'communication-personality'
  | 'creative-thinking'
  | 'critical-thinking'
  | 'health-wellness'
  | 'politics-governance'
  | 'space-astronomy'
  | 'art-design'
  | 'literature-books'
  | 'food-culinary'
  | 'travel-geography'
  | 'relationships-family'
  | 'productivity-habits'
  | 'future-foresight'
  | 'urban-smart-cities'
  // Legacy Aliases
  | 'tech-engineering'
  | 'computer-science'
  | 'general-awareness'
  | 'society-affairs'
  | 'career-professional';

export type Difficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'easy'
  | 'medium'
  | 'hard';

export type PromptFormat = 'random-word' | 'open-question' | 'hypothetical-situation';

export type PracticeMode =
  | 'impromptu'
  | 'research'
  | 'debate'
  | 'interview'
  | 'explain-simply'
  | 'real-life';

export type SessionState =
  | 'idle'
  | 'topic_ready'
  | 'preparing'
  | 'recording'
  | 'transcribing'
  | 'processing'
  | 'completed'
  | 'error';

export type ClaimFlag =
  | 'correct'
  | 'partially-correct'
  | 'unsupported'
  | 'needs-verification'
  | 'incorrect'
  | 'opinion';

export interface Topic {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  format: PromptFormat;
  question: string;
  taskExplanation?: string;
  hints?: string[];
  suggestedDurationSec: number;
  keywords?: string[];
  source: 'curated' | 'ai-generated';
  modeContext?: {
    targetAudience?: string; // for explain-simply e.g. "10-year-old child"
    debateMotion?: string; // for debate
    debatePosition?: 'for' | 'against' | 'random';
    debateRounds?: number;
    interviewType?:
      | 'hr'
      | 'personal-intro'
      | 'technical'
      | 'behavioral-star'
      | 'internship'
      | 'fresher'
      | 'leadership'
      | 'general-communication';
    situationCategory?:
      | 'college'
      | 'teamwork'
      | 'leadership'
      | 'conflict-resolution'
      | 'public-speaking'
      | 'professional'
      | 'social'
      | 'problem-solving'
      | 'time-management';
  };
}

export interface GrammarCorrection {
  whatSaid: string;
  correctVersion: string;
  explanation: string;
  naturalAlternative?: string;
  errorType?: string;
  severity?: 'minor' | 'moderate' | 'major';
}

export interface MissedPoint {
  point: string;
  whyImportant: string;
  howToIncorporate: string;
  importance: 'essential' | 'recommended' | 'optional';
}

export interface ImprovementPriority {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  targetWeakness: string;
  concreteDrill: string;
  timeframe: 'Fix Immediately' | 'Work on Next' | 'Develop Gradually';
}

export interface CoachSummary {
  whatDidWell: string;
  whatDidBadly: string;
  whatMissed: string;
  biggestWeaknessSkill: string;
  whatToPractiseNext: string;
  nextSessionFocus: string;
}

export interface DetailedObservation {
  title: string;
  evidence: string;
  impactOrWhy: string;
  actionableStep?: string;
}

export interface FactualClaimFlag {
  claim: string;
  flag: ClaimFlag;
  explanation: string;
  suggestedSourceOrCheck?: string;
}

export interface DimensionScore {
  score: number; // raw points scored
  max: number; // max weight
  weightedPoints: number; // points contributed to total 100
  feedback: string;
  evidence: string;
}

export interface AudioDeliveryMetrics {
  wordsPerMinute?: number;
  paceRating?: 'too-slow' | 'ideal' | 'too-fast' | 'uneven' | 'insufficient-data';
  pauseCount?: number;
  longestPauseSec?: number;
  totalSilenceSec?: number;
  silenceRatioPercent?: number;
  fillerCount?: number;
  fillerWordsDetected?: Array<{ word: string; count: number }>;
  volumeConsistency?: 'consistent' | 'fluctuating' | 'too-quiet' | 'clipping' | 'insufficient-data';
  audioQualityWarning?: string;
  reliabilityNote: string;
  pronunciationObservations?: Array<{ word: string; note: string; timestampSec?: number }>;
}

export interface PersonalizedExercise {
  title: string;
  description: string;
  targetIssue: string;
  durationMinutes: number;
}

export interface RecommendedNextChallenge {
  category: Category;
  difficulty: Difficulty;
  suggestedPrompt: string;
  rationale: string;
}

export interface EvaluationReport {
  id: string;
  sessionId: string;
  transcriptScore: number; // 0 - 100
  performanceLevel: 'Needs Immediate Focus' | 'Developing' | 'Competent' | 'Strong' | 'Exceptional';
  mainTakeaway: string;
  dimensionScores: {
    contentRelevance: DimensionScore; // max 20
    reasoningEvidence: DimensionScore; // max 15
    organizationStructure: DimensionScore; // max 15
    clarityConstruction: DimensionScore; // max 15
    grammar: DimensionScore; // max 15
    vocabularyChoice: DimensionScore; // max 10
    fluencyFillers: DimensionScore; // max 10
  };
  strengths: string[]; // up to 5 concrete strengths
  improvementAreas: string[]; // top critical weaknesses
  detailedStrengths?: DetailedObservation[];
  detailedWeaknesses?: DetailedObservation[];
  missedPoints?: MissedPoint[];
  improvementPlan?: ImprovementPriority[];
  coachSummary?: CoachSummary;
  corrections: GrammarCorrection[];
  reasoningFeedback: {
    strongestArgument?: string;
    weakestArgument?: string;
    missingPoint?: string;
    unsupportedClaims?: FactualClaimFlag[];
    betterExample?: string;
  };
  betterWaysToSayIt: Array<{
    original: string;
    refined: string;
    whyBetter: string;
  }>;
  deliveryMetrics?: AudioDeliveryMetrics;
  deliveryScore?: {
    score: number;
    confidence: 'low' | 'medium' | 'high';
    coverageNotes: string;
  };
  personalizedExercises: PersonalizedExercise[];
  recommendedNextChallenge: RecommendedNextChallenge;
  idealSpeech?: IdealSpeech;
  isDemoMode: boolean;
  evaluationVersion: string;
  createdAt: string;
}

export interface IdealSpeechStructure {
  sectionName: string;
  contentSnippet: string;
  rhetoricalPurpose: string;
}

export interface IdealSpeech {
  topicTitle: string;
  targetDurationSec: number;
  idealTranscript: string;
  structureBreakdown: IdealSpeechStructure[];
  keyTechniquesUsed: string[];
  estimatedWpm: number;
  whyThisScoresHigh: string;
}

export interface DebateTurn {
  speaker: 'user' | 'ai';
  roundNumber: number;
  content: string;
  timestamp: string;
  audioMetrics?: Partial<AudioDeliveryMetrics>;
}

export interface InterviewTurn {
  interviewerQuestion: string;
  userAnswer: string;
  interviewerFollowup?: string;
  timestamp: string;
  starEvaluation?: {
    situationIdentified: boolean;
    taskIdentified: boolean;
    actionIdentified: boolean;
    resultIdentified: boolean;
    notes: string;
  };
  starAnalysis?: any;
}

export interface PracticeSession {
  id: string;
  userId: string;
  mode: PracticeMode;
  topic: Topic;
  status: SessionState;
  startedAt: string;
  completedAt?: string;
  preparationDurationSec?: number;
  speakingDurationSec?: number;
  researchNotes?: string;
  originalTranscript: string; // verbatim, with fillers
  readableTranscript?: string; // cleaned for reading only
  audioSaved: boolean;
  audioBlobUrl?: string;
  transcriptionProvider: 'browser-webspeech' | 'deepgram' | 'gemini' | 'grok' | 'demo';
  aiProvider: 'gemini' | 'grok' | 'demo';
  debateTurns?: DebateTurn[];
  interviewTurns?: InterviewTurn[];
  evaluation?: EvaluationReport;
}

export interface UserProgress {
  userId: string;
  totalSessions: number;
  totalSpeakingTimeSec: number;
  currentStreakDays: number;
  lastPracticeDate?: string;
  averageScore: number;
  scoreTrend: Array<{ date: string; score: number; mode: PracticeMode }>;
  grammarImprovementRate: number; // percentage
  averageWpm: number;
  frequentGrammarMistakes: Array<{ pattern: string; count: number }>;
  categoryBreakdown: Partial<Record<Category, { completed: number; avgScore: number }>>;
  recentWeaknesses: string[];
}

export interface ProviderSettings {
  geminiApiKey: string;
  grokApiKey: string;
  deepgramApiKey: string;
  preferredAiProvider: 'gemini' | 'grok';
  preferredSttProvider: 'browser-webspeech' | 'deepgram' | 'gemini';
  retainAudioRecordings: boolean;
  enableLiveTranscription: boolean;
  isDemoMode: boolean;
}
