import { PracticeSession, UserProgress, ProviderSettings, EvaluationReport } from '@shared/types/index';

const SETTINGS_KEY = 'speakup_settings_v1';
const SESSIONS_KEY = 'speakup_sessions_v1';
const PROGRESS_KEY = 'speakup_progress_v1';

export const DEFAULT_SETTINGS: ProviderSettings = {
  geminiApiKey: '',
  grokApiKey: '',
  deepgramApiKey: '',
  preferredAiProvider: 'gemini',
  preferredSttProvider: 'browser-webspeech',
  retainAudioRecordings: true,
  enableLiveTranscription: true,
  isDemoMode: true, // Defaults to Demo Mode unless API keys are configured
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
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<ProviderSettings>): ProviderSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
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
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  public deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      this.recalculateAllProgress();
    } catch (e) {
      console.error('Failed to delete session:', e);
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
    } catch (e) {
      console.error('Failed to reset progress:', e);
    }
  }
}

export const storageService = new StorageService();
