import { AudioDeliveryMetrics } from '../../../../shared/types/index.js';

export interface RawAudioAnalysisInput {
  durationSec: number;
  wordCount: number;
  transcript: string;
  volumeRmsSeries?: number[]; // Normalized 0.0 to 1.0 sampled every 200ms
  silenceIntervalsSec?: Array<{ start: number; end: number; duration: number }>;
  clippingEventsCount?: number;
  averageNoiseFloor?: number;
}

export class AudioAnalyzer {
  private commonFillerPatterns = [
    { pattern: /\b(um|uh|erm|umm|uhh)\b/gi, word: 'um/uh' },
    { pattern: /\b(you know)\b/gi, word: 'you know' },
    { pattern: /\b(i mean)\b/gi, word: 'I mean' },
    { pattern: /\b(basically)\b/gi, word: 'basically' },
    { pattern: /\b(actually)\b/gi, word: 'actually' },
    // "like" as a filler: when preceded or followed by pauses, or used disfluently
    { pattern: /\b(?:\s|^)(?:like,\s|like\s+like|and\s+like|so\s+like)\b/gi, word: 'like (filler)' },
  ];

  public analyze(input: RawAudioAnalysisInput): AudioDeliveryMetrics {
    const { durationSec, wordCount, transcript, volumeRmsSeries, silenceIntervalsSec, clippingEventsCount } = input;

    // 1. Speaking Pace (WPM)
    let wordsPerMinute = 0;
    let paceRating: AudioDeliveryMetrics['paceRating'] = 'insufficient-data';

    if (durationSec > 5 && wordCount > 0) {
      wordsPerMinute = Math.round((wordCount / durationSec) * 60);

      if (wordsPerMinute < 100) {
        paceRating = 'too-slow';
      } else if (wordsPerMinute > 175) {
        paceRating = 'too-fast';
      } else {
        paceRating = 'ideal';
      }
    }

    // 2. Filler words analysis from verbatim transcript
    const fillerWordsDetected: Array<{ word: string; count: number }> = [];
    let totalFillers = 0;

    for (const item of this.commonFillerPatterns) {
      const matches = transcript.match(item.pattern);
      if (matches && matches.length > 0) {
        fillerWordsDetected.push({ word: item.word, count: matches.length });
        totalFillers += matches.length;
      }
    }

    // 3. Pauses and Silence
    let pauseCount = 0;
    let longestPauseSec = 0;
    let totalSilenceSec = 0;
    let silenceRatioPercent = 0;

    if (silenceIntervalsSec && silenceIntervalsSec.length > 0) {
      // Exclude initial buffer (<1.5s from start) and final trailing buffer
      const filtered = silenceIntervalsSec.filter(
        (int) => int.start >= 1.0 && int.end <= durationSec - 0.5 && int.duration >= 0.75
      );

      pauseCount = filtered.length;
      for (const pause of filtered) {
        totalSilenceSec += pause.duration;
        if (pause.duration > longestPauseSec) {
          longestPauseSec = pause.duration;
        }
      }
      silenceRatioPercent = durationSec > 0 ? Math.round((totalSilenceSec / durationSec) * 100) : 0;
    } else {
      // Fallback estimate based on punctuation if audio intervals not provided
      const commaCount = (transcript.match(/,/g) || []).length;
      const periodCount = (transcript.match(/\./g) || []).length;
      pauseCount = commaCount + periodCount;
      longestPauseSec = 0;
      totalSilenceSec = 0;
      silenceRatioPercent = 0;
    }

    // 4. Volume Consistency & Audio Quality
    let volumeConsistency: AudioDeliveryMetrics['volumeConsistency'] = 'insufficient-data';
    let audioQualityWarning: string | undefined = undefined;

    if (volumeRmsSeries && volumeRmsSeries.length > 10) {
      const avgRms = volumeRmsSeries.reduce((a, b) => a + b, 0) / volumeRmsSeries.length;
      const variance =
        volumeRmsSeries.reduce((acc, val) => acc + Math.pow(val - avgRms, 2), 0) / volumeRmsSeries.length;
      const stdDev = Math.sqrt(variance);

      if (avgRms < 0.03) {
        volumeConsistency = 'too-quiet';
        audioQualityWarning =
          'Audio level was very low. Check your microphone input sensitivity or distance to the microphone.';
      } else if (clippingEventsCount && clippingEventsCount > 5) {
        volumeConsistency = 'clipping';
        audioQualityWarning =
          'Microphone clipping / digital distortion detected. Move slightly away from the microphone to prevent audio distortion.';
      } else if (stdDev > 0.25) {
        volumeConsistency = 'fluctuating';
      } else {
        volumeConsistency = 'consistent';
      }
    }

    // 5. Scientific Limitations Guardrail Note
    const reliabilityNote = volumeRmsSeries && volumeRmsSeries.length > 0
      ? 'Voice metrics derived from browser Web Audio API signal processing. Note: Microphone hardware, room acoustics, and network latency influence loudness and pause timings. Pronunciation and emotion are not inferred without phoneme-level acoustic model data.'
      : 'Audio signal stream not directly provided; metrics estimated from transcript length and speech session duration.';

    return {
      wordsPerMinute: wordsPerMinute > 0 ? wordsPerMinute : undefined,
      paceRating,
      pauseCount,
      longestPauseSec: longestPauseSec > 0 ? Math.round(longestPauseSec * 10) / 10 : undefined,
      totalSilenceSec: totalSilenceSec > 0 ? Math.round(totalSilenceSec * 10) / 10 : undefined,
      silenceRatioPercent: silenceRatioPercent > 0 ? silenceRatioPercent : undefined,
      fillerCount: totalFillers,
      fillerWordsDetected: fillerWordsDetected.length > 0 ? fillerWordsDetected : undefined,
      volumeConsistency,
      audioQualityWarning,
      reliabilityNote,
    };
  }
}

export const audioAnalyzer = new AudioAnalyzer();
