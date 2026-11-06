import {
  Topic,
  Category,
  Difficulty,
  PromptFormat,
  PracticeMode,
  EvaluationReport,
  DebateTurn,
  InterviewTurn,
  AudioDeliveryMetrics,
} from '@shared/types/index';
import { storageService } from './storage';

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api`
  : '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getCategories(): Promise<{ id: Category; label: string; description: string }[]> {
    const res = await fetch(`${API_BASE}/topics/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getRandomTopic(filters?: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
  }): Promise<Topic> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.format) params.append('format', filters.format);
    if (filters?.mode) params.append('mode', filters.mode);

    const res = await fetch(`${API_BASE}/topics/random?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch random topic');
    return res.json();
  },

  async generateAITopic(params: {
    category?: Category;
    difficulty?: Difficulty;
    format?: PromptFormat;
    mode?: PracticeMode;
  }): Promise<Topic> {
    const settings = storageService.getSettings();
    const res = await fetch(`${API_BASE}/topics/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        apiKeyOverride: settings.geminiApiKey || undefined,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate AI topic');
    return res.json();
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
    const res = await fetch(`${API_BASE}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        apiKeyOverride: settings.geminiApiKey || undefined,
        aiProviderPreference: settings.isDemoMode ? 'demo' : settings.preferredAiProvider,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Evaluation failed' }));
      throw new Error(err.error || 'Evaluation failed on server');
    }
    return res.json();
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
    const res = await fetch(`${API_BASE}/debate/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        apiKeyOverride: settings.geminiApiKey || undefined,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate debate opponent response');
    return res.json();
  },

  async sendInterviewTurn(payload: {
    interviewType: string;
    history: InterviewTurn[];
    userAnswer: string;
  }): Promise<{ nextQuestion: string; feedbackOnAnswer: string; starAnalysis?: any }> {
    const settings = storageService.getSettings();
    const res = await fetch(`${API_BASE}/interview/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        apiKeyOverride: settings.geminiApiKey || undefined,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate interviewer response');
    return res.json();
  },

  async updateServerSettings(payload: {
    geminiApiKey?: string;
    grokApiKey?: string;
    deepgramApiKey?: string;
    defaultAiProvider?: string;
    defaultSttProvider?: string;
  }) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async testGeminiConnection(apiKeyOverride?: string): Promise<{
    success: boolean;
    model?: string;
    message?: string;
    latencyMs?: number;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeyOverride }),
    });
    return res.json();
  },
};
