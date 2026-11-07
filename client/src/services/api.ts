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
import { blobToBase64, convertBlobToWav } from '../utils/audioUtils';

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api`
  : '/api';

export const ALL_30_CATEGORIES: { id: Category; label: string; description: string }[] = [
  { id: 'technology', label: 'Technology', description: 'Emerging tech, cybersecurity, digital infrastructure, and computing trends' },
  { id: 'ai', label: 'Artificial Intelligence', description: 'Machine learning, generative AI, automation, ethics, and human-AI collaboration' },
  { id: 'education', label: 'Education', description: 'Learning methods, educational reform, universities, and skill development' },
  { id: 'business', label: 'Business & Startups', description: 'Entrepreneurship, strategy, marketing, organizational design, and disruption' },
  { id: 'science', label: 'Science & Discovery', description: 'Physics, biology, scientific breakthroughs, space exploration, and empirical rigor' },
  { id: 'psychology', label: 'Psychology & Behavior', description: 'Human behavior, cognitive biases, emotional intelligence, and mental models' },
  { id: 'society', label: 'Society & Culture', description: 'Cultural shifts, civic issues, demographic changes, and modern social dynamics' },
  { id: 'environment', label: 'Environment & Climate', description: 'Sustainability, climate change, renewable energy, and ecological balance' },
  { id: 'sports', label: 'Sports & Competition', description: 'Athletics, high-performance psychology, teamwork, and modern sports industries' },
  { id: 'careers', label: 'Careers & Leadership', description: 'Professional growth, job transitions, workplace dilemmas, and leadership strategy' },
  { id: 'finance', label: 'Finance & Economics', description: 'Personal finance, macroeconomic trends, investing, monetary systems, and wealth' },
  { id: 'philosophy', label: 'Philosophy & Ethics', description: 'Moral dilemmas, existential inquiry, truth, logic, and timeless philosophical ideas' },
  { id: 'history', label: 'History & Civilization', description: 'Historical turning points, lessons of past empires, leadership triumphs and failures' },
  { id: 'entertainment', label: 'Media & Entertainment', description: 'Cinema, music, digital creators, video games, storytelling, and culture' },
  { id: 'everyday-life', label: 'Everyday Life', description: 'Daily habits, personal dilemmas, practical scenarios, and relatable human situations' },
  { id: 'college-life', label: 'College & Student Life', description: 'Campus conflicts, academic pressure, peer collaboration, and student autonomy' },
  { id: 'communication-personality', label: 'Communication & Rhetoric', description: 'Persuasion, handling disagreement, active listening, tact, and confident presence' },
  { id: 'creative-thinking', label: 'Creative & Lateral Thinking', description: 'Unconventional problem-solving, thought experiments, and imaginative ideas' },
  { id: 'critical-thinking', label: 'Critical Thinking & Logic', description: 'Spotting fallacies, evaluating arguments, balancing trade-offs, and dialectics' },
  { id: 'health-wellness', label: 'Health & Wellness', description: 'Physical health, nutrition, sleep science, mindfulness, and longevity' },
  { id: 'politics-governance', label: 'Governance & Policy', description: 'Public policy, civic duties, democratic systems, and institutional reform' },
  { id: 'space-astronomy', label: 'Space & Astronomy', description: 'Cosmology, Mars missions, astrophysics, space commercialization, and aliens' },
  { id: 'art-design', label: 'Art, Design & Aesthetics', description: 'Visual arts, architecture, industrial design, UX, and aesthetic theory' },
  { id: 'literature-books', label: 'Literature & Books', description: 'Great literature, character studies, narrative power, and reading habits' },
  { id: 'food-culinary', label: 'Food & Culinary Culture', description: 'Gastronomy, food sustainability, culinary heritage, and culinary innovation' },
  { id: 'travel-geography', label: 'Travel & Global Cultures', description: 'Cross-cultural immersion, geography, global exploration, and travel ethics' },
  { id: 'relationships-family', label: 'Relationships & Family', description: 'Interpersonal bonds, friendships, conflict resolution, and empathy' },
  { id: 'productivity-habits', label: 'Productivity & Focus', description: 'Time management, deep work, overcoming procrastination, and habit systems' },
  { id: 'future-foresight', label: 'Future Foresight', description: 'Megatrends of 2050, transhumanism, future of work, and long-term futures' },
  { id: 'urban-smart-cities', label: 'Urban Living & Smart Cities', description: 'City design, public transit, housing, smart infrastructure, and urbanism' },
];

const DEFAULT_CATEGORIES = ALL_30_CATEGORIES;

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
    const recentSessions = storageService.getSessions();
    const recentTopics = recentSessions
      .map((s) => s.topic?.title)
      .filter((t): t is string => Boolean(t))
      .slice(-30);

    try {
      return await safeFetchJson<Topic>(`${API_BASE}/topics/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          recentTopics,
          apiKeyOverride: settings.geminiApiKey || undefined,
        }),
      });
    } catch {
      // Direct client-side AI topic generation fallback
      try {
        return await LocalGeminiService.generateTopic({
          ...params,
          recentTopics,
          apiKeyOverride: settings.geminiApiKey || undefined,
        });
      } catch {
        return this.getRandomTopic(params);
      }
    }
  },

  async transcribeAudio(
    audioBlob: Blob,
    audioDurationSec?: number
  ): Promise<{ transcript: string; noSpeech?: boolean; provider?: string }> {
    const settings = storageService.getSettings();

    // Convert blob to standard WAV, Base64, and detect acoustic silence
    const { wavBlob, mimeType, isSilent } = await convertBlobToWav(audioBlob);

    // If microphone captured inaudible silence, reject immediately to avoid hallucinated words
    if (isSilent) {
      return {
        transcript: '',
        noSpeech: true,
        provider: 'silence-filter',
      };
    }

    const audioData = await blobToBase64(wavBlob);

    // 1. Try backend transcription endpoint first
    try {
      const result = await safeFetchJson<{
        transcript: string;
        noSpeech?: boolean;
        provider?: string;
        modelUsed?: string;
      }>(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData,
          mimeType: mimeType || 'audio/wav',
          apiKeyOverride: settings.geminiApiKey || undefined,
          preferredSttProvider: settings.preferredSttProvider,
        }),
      });

      return {
        transcript: result.transcript?.trim() || '',
        noSpeech: result.noSpeech || !result.transcript?.trim(),
        provider: result.provider || 'gemini',
      };
    } catch (apiErr) {
      console.warn('Backend /api/transcribe unavailable or failed, falling back to direct client Gemini:', apiErr);
      // 2. Direct client-side Gemini transcription
      try {
        const clientResult = await LocalGeminiService.transcribeAudio(
          wavBlob,
          settings.geminiApiKey || undefined
        );
        return {
          transcript: clientResult.transcript?.trim() || '',
          noSpeech: clientResult.noSpeech || !clientResult.transcript?.trim(),
          provider: 'client-gemini',
        };
      } catch (localErr) {
        console.error('All transcription providers failed:', localErr);
        throw localErr;
      }
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
