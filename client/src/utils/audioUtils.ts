/**
 * Audio processing utilities for SpeakUp
 * Converts recorded blobs to standard 16-bit PCM WAV and handles Base64 encoding
 */

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Detects whether an audio buffer is silent or below human vocal threshold
 */
export function checkAudioSilence(channelData: Float32Array): { isSilent: boolean; maxRms: number; peak: number } {
  let sumSquares = 0;
  let peak = 0;
  const len = channelData.length;
  if (len === 0) return { isSilent: true, maxRms: 0, peak: 0 };

  for (let i = 0; i < len; i++) {
    const abs = Math.abs(channelData[i]);
    if (abs > peak) peak = abs;
    sumSquares += channelData[i] * channelData[i];
  }

  const rms = Math.sqrt(sumSquares / len);
  // Spoken human speech typically has peak > 0.035 and rms > 0.005
  const isSilent = peak < 0.025 || rms < 0.004;
  return { isSilent, maxRms: rms, peak };
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // Convert to mono for compact transfer and speech accuracy
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = PCM
  const bitDepth = 16;

  // Extract mono channel (or average stereo if multiple)
  let channelData: Float32Array;
  if (buffer.numberOfChannels === 1) {
    channelData = buffer.getChannelData(0);
  } else {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    channelData = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      channelData[i] = (left[i] + right[i]) / 2;
    }
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = channelData.length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write PCM samples (convert Float32 -1.0..1.0 to Int16 -32768..32767)
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts any browser recorded audio blob (webm, mp4, etc.) to a standard 16-bit PCM WAV.
 * Also performs pre-flight acoustic silence detection to prevent AI hallucinations.
 */
export async function convertBlobToWav(
  blob: Blob
): Promise<{ wavBlob: Blob; mimeType: string; isSilent: boolean }> {
  try {
    if (typeof window === 'undefined') {
      return { wavBlob: blob, mimeType: blob.type || 'audio/webm', isSilent: false };
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      return { wavBlob: blob, mimeType: blob.type || 'audio/webm', isSilent: false };
    }

    const audioCtx = new AudioCtx();
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const { isSilent } = checkAudioSilence(audioBuffer.getChannelData(0));
      const wavBlob = audioBufferToWav(audioBuffer);
      return { wavBlob, mimeType: 'audio/wav', isSilent };
    } finally {
      if (audioCtx.state !== 'closed') {
        await audioCtx.close();
      }
    }
  } catch (err) {
    console.warn('WAV conversion fallback to original blob:', err);
    return { wavBlob: blob, mimeType: blob.type || 'audio/webm', isSilent: false };
  }
}
