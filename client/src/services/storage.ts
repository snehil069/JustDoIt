import { PracticeSession, UserProgress, ProviderSettings, EvaluationReport } from '@shared/types/index';
import { supabaseService, isSupabaseConfigured } from './supabase';
import { BUILTIN_API_KEYS } from '../config/builtinKeys';

const SETTINGS_KEY = 'speakup_settings_v1';
const SESSIONS_KEY = 'speakup_sessions_v1';
const PROGRESS_KEY = 'speakup_progress_v1';

export const DEFAULT_SETTINGS: ProviderSettings = {
  geminiApiKey: BUILTIN_API_KEYS.gemini,
  grokApiKey: '',
  deepgramApiKey: BUILTIN_API_KEYS.deepgram,
  preferredAiProvider: 'gemini',
  preferredSttProvider: 'deepgram',
  retainAudioRecordings: true,
  enableLiveTranscription: true,
  isDemoMode: false, // Default to full AI-powered analysis using built-in keys
};

export const DEFAULT_PROGRESS: UserProgress = {
  userId: 'local-user-1',
  totalSessions: 0,
  totalSpeakingTimeSec: 0,
  currentStreakDays: 1,
  averageScore: 0,
  scoreTrend: [],
  grammarImprovementRate: 0,
  averageWpm: 125,
  frequentGrammarMistakes: [],
  categoryBreakdown: {
    'everyday-life': { completed: 0, avgScore: 0 },
    'college-life': { completed: 0, avgScore: 0 },
    'tech-engineering': { completed: 0, avgScore: 0 },
    'computer-science': { completed: 0, avgScore: 0 },
    'general-awareness': { completed: 0, avgScore: 0 },
    'society-affairs': { completed: 0, avgScore: 0 },
    'communication-personality': { completed: 0, avgScore: 0 },
    'career-professional': { completed: 0, avgScore: 0 },
    'creative-thinking': { completed: 0, avgScore: 0 },
    'critical-thinking': { completed: 0, avgScore: 0 },
  },
  recentWeaknesses: ['Structure and thesis clarity', 'Filler word frequency ("um", "like")'],
};

class StorageService {
  public getSettings(): ProviderSettings {
    const env = (import.meta as any).env || {};
    const envGeminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || BUILTIN_API_KEYS.gemini;
    const envDeepgramKey = env.VITE_DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY || BUILTIN_API_KEYS.deepgram;

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const resolvedGemini = (parsed.geminiApiKey && parsed.geminiApiKey.trim()) || envGeminiKey;
        const resolvedDeepgram = (parsed.deepgramApiKey && parsed.deepgramApiKey.trim()) || envDeepgramKey;
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          geminiApiKey: resolvedGemini,
          deepgramApiKey: resolvedDeepgram,
          isDemoMode: parsed.isDemoMode !== undefined && (!resolvedGemini) ? true : Boolean(parsed.isDemoMode && !resolvedGemini),
        };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return {
      ...DEFAULT_SETTINGS,
      geminiApiKey: envGeminiKey,
      deepgramApiKey: envDeepgramKey,
      isDemoMode: false,
    };
  }

  public resetToDefaults(): ProviderSettings {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (e) {
      console.warn('Failed to remove settings from localStorage:', e);
    }
    return this.getSettings();
  }

  public saveSettings(settings: Partial<ProviderSettings>): ProviderSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    if (updated.geminiApiKey && updated.geminiApiKey.trim() && settings.isDemoMode === undefined) {
      updated.isDemoMode = false;
    }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return updated;
  }

  public getSessions(): PracticeSession[] {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load sessions:', e);
    }
    return [];
  }

  public getSessionById(id: string): PracticeSession | undefined {
    return this.getSessions().find((s) => s.id === id);
  }

  public saveSession(session: PracticeSession): void {
    const sessions = this.getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }

    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      this.updateProgressFromSession(session);
      // Sync to Supabase in background
      if (isSupabaseConfigured) {
        supabaseService.saveSession(session).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  public deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      this.recalculateAllProgress();
      // Sync deletion to Supabase
      if (isSupabaseConfigured) {
        supabaseService.deleteSession(id).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }

  public async syncWithSupabase(): Promise<{ sessions: PracticeSession[]; progress: UserProgress } | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const [remoteSessions, remoteProgress] = await Promise.all([
        supabaseService.getSessions(),
        supabaseService.getProgress(),
      ]);

      if (remoteSessions && remoteSessions.length > 0) {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(remoteSessions));
      }
      if (remoteProgress) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(remoteProgress));
      }

      return {
        sessions: this.getSessions(),
        progress: this.getProgress(),
      };
    } catch (err) {
      console.warn('Supabase sync skipped:', err);
      return null;
    }
  }

  public clearAllData(): void {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  }

  public getProgress(): UserProgress {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }
    return DEFAULT_PROGRESS;
  }

  private updateProgressFromSession(session: PracticeSession): void {
    if (!session.evaluation) return;

    const progress = this.getProgress();
    progress.totalSessions += 1;
    progress.totalSpeakingTimeSec += session.speakingDurationSec || 0;

    // Recalculate average score
    const allSessions = this.getSessions().filter((s) => s.evaluation);
    const sumScores = allSessions.reduce((acc, s) => acc + (s.evaluation?.transcriptScore || 0), 0);
    progress.averageScore = allSessions.length > 0 ? Math.round(sumScores / allSessions.length) : 0;

    // Update score trend
    progress.scoreTrend.push({
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: session.evaluation.transcriptScore,
      mode: session.mode,
    });
    if (progress.scoreTrend.length > 20) {
      progress.scoreTrend.shift();
    }

    // Update category breakdown
    const cat = session.topic.category;
    if (progress.categoryBreakdown[cat]) {
      const current = progress.categoryBreakdown[cat];
      const newCompleted = current.completed + 1;
      const newAvg = Math.round((current.avgScore * current.completed + session.evaluation.transcriptScore) / newCompleted);
      progress.categoryBreakdown[cat] = { completed: newCompleted, avgScore: newAvg };
    }

    // Update weaknesses from improvement areas
    if (session.evaluation.improvementAreas.length > 0) {
      progress.recentWeaknesses = session.evaluation.improvementAreas.slice(0, 3);
    }

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      if (isSupabaseConfigured) {
        supabaseService.saveProgress(progress).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to update progress:', e);
    }
  }

  private recalculateAllProgress(): void {
    const sessions = this.getSessions().filter((s) => s.evaluation);
    const progress = { ...DEFAULT_PROGRESS };

    sessions.forEach((s) => {
      progress.totalSessions += 1;
      progress.totalSpeakingTimeSec += s.speakingDurationSec || 0;
      if (s.evaluation) {
        progress.scoreTrend.push({
          date: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: s.evaluation.transcriptScore,
          mode: s.mode,
        });
      }
    });

    if (sessions.length > 0) {
      const sum = sessions.reduce((acc, s) => acc + (s.evaluation?.transcriptScore || 0), 0);
      progress.averageScore = Math.round(sum / sessions.length);
    }

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      if (isSupabaseConfigured) {
        supabaseService.saveProgress(progress).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to reset progress:', e);
    }
  }
}

export const storageService = new StorageService();
