import { BUILTIN_API_KEYS } from '../config/builtinKeys';
import { storageService } from './storage';

export class DeepgramClientService {
  public static getApiKey(override?: string): string {
    if (override && override.trim()) return override.trim();
    const settings = storageService.getSettings();
    if (settings.deepgramApiKey && settings.deepgramApiKey.trim()) return settings.deepgramApiKey.trim();
    const env = (import.meta as any).env || {};
    const envKey = env.VITE_DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY || '';
    if (envKey && envKey.trim()) return envKey.trim();
    return BUILTIN_API_KEYS.deepgram;
  }

  public static async testConnection(apiKeyOverride?: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const key = this.getApiKey(apiKeyOverride);
    if (!key) {
      return { success: false, error: 'No Deepgram API key provided.' };
    }
    try {
      const res = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          Authorization: `Token ${key}`,
        },
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `HTTP ${res.status}: ${err}` };
      }
      const data = await res.json();
      return {
        success: true,
        message: `Deepgram Nova-2 connected! Project: ${data.projects?.[0]?.name || 'Active'}`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to connect to Deepgram' };
    }
  }

  /**
   * Direct client-side speech-to-text using Deepgram Nova-2 REST API.
   * Works on every mobile and desktop browser without requiring a backend proxy.
   */
  public static async transcribeAudio(
    audioBlob: Blob,
    apiKeyOverride?: string
  ): Promise<{ transcript: string; confidence?: number; noSpeech?: boolean }> {
    const key = this.getApiKey(apiKeyOverride);
    if (!key) {
      throw new Error('No Deepgram API key available.');
    }

    const mimeType = audioBlob.type || 'audio/wav';
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${key}`,
          'Content-Type': mimeType,
        },
        body: audioBlob,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Deepgram API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const alt = data.results?.channels?.[0]?.alternatives?.[0];
    const transcript = (alt?.transcript || '').trim();
    const confidence = alt?.confidence;

    return {
      transcript,
      confidence,
      noSpeech: !transcript,
    };
  }
}
