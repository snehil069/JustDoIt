import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PracticeSession, UserProgress } from '@shared/types/index';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseService = {
  /**
   * Upload an audio blob to Supabase Storage (bucket: 'speakup-audio')
   */
  async uploadAudio(sessionId: string, audioBlob: Blob): Promise<string | null> {
    if (!supabase) return null;
    try {
      const fileName = `${sessionId}.webm`;
      const { data, error } = await supabase.storage
        .from('speakup-audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase audio upload warning:', error.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('speakup-audio')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Supabase audio upload error:', err);
      return null;
    }
  },

  /**
   * Save a completed practice session to Supabase table 'practice_sessions'
   */
  async saveSession(session: PracticeSession): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('practice_sessions').upsert({
        id: session.id,
        user_id: session.userId || 'guest',
        mode: session.mode,
        topic_title: session.topic.title,
        topic_category: session.topic.category,
        topic_question: session.topic.question,
        topic_data: session.topic,
        status: session.status,
        started_at: session.startedAt,
        completed_at: session.completedAt,
        speaking_duration_sec: session.speakingDurationSec || 0,
        original_transcript: session.originalTranscript,
        audio_blob_url: session.audioBlobUrl,
        evaluation: session.evaluation,
        transcript_score: session.evaluation?.transcriptScore || 0,
        performance_level: session.evaluation?.performanceLevel,
      });

      if (error) {
        console.warn('Supabase saveSession warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase saveSession error:', err);
      return false;
    }
  },

  /**
   * Fetch all recorded sessions for the user from Supabase
   */
  async getSessions(userId: string = 'guest'): Promise<PracticeSession[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) {
        console.warn('Supabase getSessions warning:', error.message);
        return null;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        mode: row.mode,
        topic: row.topic_data || {
          id: `topic-${row.id}`,
          title: row.topic_title,
          category: row.topic_category,
          difficulty: 'medium',
          format: 'open-question',
          question: row.topic_question,
          suggestedDurationSec: 180,
        },
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        speakingDurationSec: row.speaking_duration_sec,
        originalTranscript: row.original_transcript,
        audioSaved: Boolean(row.audio_blob_url),
        audioBlobUrl: row.audio_blob_url,
        transcriptionProvider: 'deepgram',
        aiProvider: 'gemini',
        evaluation: row.evaluation,
      }));
    } catch (err) {
      console.warn('Supabase getSessions error:', err);
      return null;
    }
  },

  /**
   * Delete a session from Supabase
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', sessionId);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Save user progress aggregate to Supabase table 'user_progress'
   */
  async saveProgress(progress: UserProgress): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('user_progress').upsert({
        user_id: progress.userId || 'guest',
        total_sessions: progress.totalSessions,
        total_speaking_time_sec: progress.totalSpeakingTimeSec,
        current_streak_days: progress.currentStreakDays,
        average_score: progress.averageScore,
        score_trend: progress.scoreTrend,
        category_breakdown: progress.categoryBreakdown,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetch user progress from Supabase
   */
  async getProgress(userId: string = 'guest'): Promise<UserProgress | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        userId: data.user_id,
        totalSessions: data.total_sessions || 0,
        totalSpeakingTimeSec: data.total_speaking_time_sec || 0,
        currentStreakDays: data.current_streak_days || 1,
        averageScore: data.average_score || 0,
        scoreTrend: data.score_trend || [],
        grammarImprovementRate: 0,
        averageWpm: 125,
        frequentGrammarMistakes: [],
        categoryBreakdown: data.category_breakdown || {},
        recentWeaknesses: [],
      };
    } catch {
      return null;
    }
  },
};
