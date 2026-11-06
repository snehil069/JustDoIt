import {
  Topic,
  Category,
  Difficulty,
  PromptFormat,
  PracticeMode,
  EvaluationReport,
  DebateTurn,
  InterviewTurn,
} from '@shared/types/index';
import { CURATED_TOPICS } from '@shared/topics/topicBank';
import { storageService } from './storage';
import { LocalGeminiService } from './localGemini';
import { LocalEvaluator } from './localEvaluator';

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api`
  : '/api';

const DEFAULT_CATEGORIES: { id: Category; label: string; description: string }[] = [
  { id: 'everyday-life', label: 'Everyday Life', description: 'Daily habits, routines, personal dilemmas, and real-world conversations' },
  { id: 'college-life', label: 'College & Student Life', description: 'Academics, campus conflicts, peer dynamics, and project coordination' },
  { id: 'tech-engineering', label: 'Technology & Engineering', description: 'Emerging tech, engineering ethics, sustainable transitions, and real-world application' },
  { id: 'computer-science', label: 'Computer Science', description: 'Systems, algorithms, open source, AI, and simplifying technical concepts' },
  { id: 'general-awareness', label: 'General Awareness', description: 'Global developments, geopolitics, media literacy, and scientific understanding' },
  { id: 'society-affairs', label: 'Society & Current Affairs', description: 'Civic challenges, urbanization, culture, social justice, and policy' },
  { id: 'communication-personality', label: 'Communication & Personality', description: 'Defending arguments, handling criticism, tact, and confident articulation' },
  { id: 'career-professional', label: 'Career & Professional Skills', description: 'Interviews, STAR responses, workplace dilemmas, and leadership strategy' },
  { id: 'creative-thinking', label: 'Creative Thinking', description: 'Unconventional solutions, scenario reimagining, and lateral ideas' },
  { id: 'critical-thinking', label: 'Critical Thinking & Debate', description: 'Counterarguments, cognitive fallacies, weighing trade-offs, and rigorous logic' },
];

/**
 * Robust JSON fetcher that verifies responses are actual JSON (not HTML SPA fallback)
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON response, but received ${contentType || 'HTML'}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getHealth() {
    try {
      return await safeFetchJson<any>(`${API_BASE}/health`);
    } catch {
      const settings = storageService.getSettings();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        providers: {
          gemini: { configured: !!settings.geminiApiKey },
          deepgram: { configured: !!settings.deepgramApiKey },
          grok: { configured: !!settings.grokApiKey },
        },
        defaultAiProvider: settings.preferredAiProvider || 'gemini',
        defaultSttProvider: settings.preferredSttProvider || 'browser-webspeech',
      };
    }
  },

  async getCategories(): Promise<{ id: Category; label: string; description: string }[]> {
    try {
      return await safeFetchJson<{ id: Category; label: string; description: string }[]>(
        `${API_BASE}/topics/categories`
      );
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  async getRandomTopic(filters?: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
  }): Promise<Topic> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.format) params.append('format', filters.format);
      if (filters?.mode) params.append('mode', filters.mode);

      return await safeFetchJson<Topic>(`${API_BASE}/topics/random?${params.toString()}`);
    } catch {
      // Standalone curated fallback
      let pool = CURATED_TOPICS;
      if (filters?.category) {
        const catFiltered = pool.filter((t) => t.category === filters.category);
        if (catFiltered.length > 0) pool = catFiltered;
      }
      if (filters?.difficulty) {
        const diffFiltered = pool.filter((t) => t.difficulty === filters.difficulty);
        if (diffFiltered.length > 0) pool = diffFiltered;
      }
      if (filters?.format) {
        const formatFiltered = pool.filter((t) => t.format === filters.format);
        if (formatFiltered.length > 0) pool = formatFiltered;
      }
      return pool[Math.floor(Math.random() * pool.length)] || CURATED_TOPICS[0];
    }
  },

  async generateAITopic(params: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
  }): Promise<Topic> {
    const settings = storageService.getSettings();
    try {
      return await safeFetchJson<Topic>(`${API_BASE}/topics/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          apiKeyOverride: settings.geminiApiKey || undefined,
        }),
      });
    } catch {
      // Pick curated topic on error
      return this.getRandomTopic(params);
    }
  },

  async evaluateSpeech(payload: {
    sessionId: string;
    topic: Topic;
    mode: PracticeMode;
    transcript: string;
    durationSec: number;
    researchNotes?: string;
    rawAudioAnalysis?: any;
  }): Promise<EvaluationReport> {
    const settings = storageService.getSettings();

    // 1. Try remote API first if configured
    try {
      return await safeFetchJson<EvaluationReport>(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          apiKeyOverride: settings.geminiApiKey || undefined,
          aiProviderPreference: settings.isDemoMode ? 'demo' : settings.preferredAiProvider,
        }),
      });
    } catch (apiErr) {
      console.info('[SpeakUp] API endpoint unavailable, using direct client evaluation engine.');
      // 2. Direct client evaluation engine (uses Gemini if key present, else calibrated rule-based)
      return await LocalGeminiService.evaluateSpeech({
        sessionId: payload.sessionId,
        topic: payload.topic,
        mode: payload.mode,
        transcript: payload.transcript,
        durationSec: payload.durationSec,
        audioMetrics: payload.rawAudioAnalysis
          ? {
              wordsPerMinute: Math.round(
                (payload.transcript.split(/\s+/).filter(Boolean).length /
                  Math.max(1, payload.durationSec)) *
                  60
              ),
              fillerCount: (
                payload.transcript.match(/\b(um|uh|like|you know|basically)\b/gi) || []
              ).length,
              pauseCount: payload.rawAudioAnalysis.silenceIntervalsSec?.length || 0,
              reliabilityNote: 'Client-side audio analysis',
            }
          : undefined,
        researchNotes: payload.researchNotes,
        apiKeyOverride: settings.geminiApiKey || undefined,
      });
    }
  },

  async sendDebateTurn(payload: {
    motion: string;
    userPosition: 'for' | 'against';
    roundNumber: number;
    totalRounds: number;
    history: DebateTurn[];
    userArgument: string;
  }): Promise<{ aiResponse: string; roundCritique?: string }> {
    const settings = storageService.getSettings();
    try {
      return await safeFetchJson<{ aiResponse: string; roundCritique?: string }>(
        `${API_BASE}/debate/turn`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            apiKeyOverride: settings.geminiApiKey || undefined,
          }),
        }
      );
    } catch {
      return LocalGeminiService.generateDebateTurn({
        motion: payload.motion,
        userPosition: payload.userPosition,
        roundNumber: payload.roundNumber,
        totalRounds: payload.totalRounds,
        history: payload.history,
        userArgument: payload.userArgument,
        apiKeyOverride: settings.geminiApiKey || undefined,
      });
    }
  },

  async sendInterviewTurn(payload: {
    interviewType: string;
    history: InterviewTurn[];
    userAnswer: string;
  }): Promise<{ nextQuestion: string; feedbackOnAnswer: string; starAnalysis?: any }> {
    const settings = storageService.getSettings();
    try {
      return await safeFetchJson<any>(`${API_BASE}/interview/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          apiKeyOverride: settings.geminiApiKey || undefined,
        }),
      });
    } catch {
      const turn = await LocalGeminiService.generateInterviewTurn({
        role: payload.interviewType,
        industry: 'Professional & Tech',
        stage: 'Technical & Behavioral Round',
        questionNumber: payload.history.length + 1,
        totalQuestions: 5,
        history: payload.history,
        userAnswer: payload.userAnswer,
        apiKeyOverride: settings.geminiApiKey || undefined,
      });
      return {
        nextQuestion: turn.followUpQuestion,
        feedbackOnAnswer: turn.feedback || 'Good structured response.',
      };
    }
  },

  async updateServerSettings(payload: {
    geminiApiKey?: string;
    grokApiKey?: string;
    deepgramApiKey?: string;
    defaultAiProvider?: string;
    defaultSttProvider?: string;
  }) {
    try {
      return await safeFetchJson<any>(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      return { success: true, localOnly: true };
    }
  },

  async testGeminiConnection(apiKeyOverride?: string): Promise<{
    success: boolean;
    model?: string;
    message?: string;
    latencyMs?: number;
    error?: string;
  }> {
    try {
      return await safeFetchJson<any>(`${API_BASE}/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyOverride }),
      });
    } catch {
      // Run direct client-side test
      return await LocalGeminiService.testConnection(apiKeyOverride);
    }
  },
};
