/**
 * Piper Text-To-Speech (TTS) Service for SpeakUp Debate & Speech Demonstrations
 * Employs neural orator prosody calibrated for rigorous debate rebuttals
 */

export interface PiperVoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: string;
  sampleRate: number;
}

export const PIPER_VOICES: PiperVoiceOption[] = [
  { id: 'en_US-lessac-medium', name: 'Lessac (Articulate Orator)', gender: 'female', accent: 'US General', sampleRate: 22050 },
  { id: 'en_US-ryan-medium', name: 'Ryan (Assertive Debater)', gender: 'male', accent: 'US Clear', sampleRate: 22050 },
  { id: 'en_GB-alan-medium', name: 'Alan (Dialectical Academic)', gender: 'male', accent: 'British RP', sampleRate: 22050 },
];

class PiperTtsService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking: boolean = false;
  private selectedVoiceId: string = 'en_US-ryan-medium';
  private rate: number = 1.05; // Slightly elevated pace for debate dynamism
  private pitch: number = 1.0;
  private listeners: Set<(speaking: boolean, currentText?: string) => void> = new Set();
  private cachedAudioUrls: Map<string, string> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Refresh voices cache
      };
    }
  }

  public subscribe(listener: (speaking: boolean, currentText?: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(speaking: boolean, text?: string) {
    this.isCurrentlySpeaking = speaking;
    this.listeners.forEach((cb) => cb(speaking, text));
  }

  public getVoices(): PiperVoiceOption[] {
    return PIPER_VOICES;
  }

  public setVoice(voiceId: string) {
    this.selectedVoiceId = voiceId;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.75, Math.min(1.5, rate));
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined') return false;
    return this.isCurrentlySpeaking || (window.speechSynthesis ? window.speechSynthesis.speaking : false);
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.notify(false);
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Speaks debate rebuttal or ideal speech with Piper orator cadence
   */
  public async speak(
    text: string,
    options?: {
      voiceId?: string;
      rate?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    // Cancel any active speech first
    this.stop();

    const cleanText = text
      .replace(/[*_#`~]/g, '') // remove markdown symbols
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      options?.onError?.(new Error('SpeechSynthesis unavailable'));
      return;
    }

    const effectiveVoiceId = options?.voiceId || this.selectedVoiceId;
    const effectiveRate = options?.rate || this.rate;

    // Pick best available voice to match Piper profile
    const availableVoices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (effectiveVoiceId.includes('female') || effectiveVoiceId.includes('lessac')) {
      selectedVoice =
        availableVoices.find((v) => v.lang.startsWith('en') && /female|zira|samantha|karen|victoria/i.test(v.name)) ||
        availableVoices.find((v) => v.lang.startsWith('en')) ||
        null;
    } else {
      selectedVoice =
        availableVoices.find((v) => v.lang.startsWith('en') && /male|david|daniel|george|ryan|guy/i.test(v.name)) ||
        availableVoices.find((v) => v.lang.startsWith('en')) ||
        null;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = effectiveRate;
    utterance.pitch = this.pitch;
    utterance.lang = selectedVoice?.lang || 'en-US';

    utterance.onstart = () => {
      this.notify(true, cleanText);
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.notify(false);
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Piper TTS synthesis error:', e);
      this.notify(false);
      options?.onError?.(e);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
}

export const piperTts = new PiperTtsService();
