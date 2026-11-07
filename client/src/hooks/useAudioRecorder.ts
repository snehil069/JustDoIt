import { useState, useRef, useCallback } from 'react';

export interface AudioAnalysisOutput {
  durationSec: number;
  volumeRmsSeries: number[];
  silenceIntervalsSec: Array<{ start: number; end: number; duration: number }>;
  clippingEventsCount: number;
}

export interface StopRecordingResult {
  audioBlob: Blob;
  audioUrl: string;
  audioAnalysis: AudioAnalysisOutput;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(0); // 0.0 to 1.0
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopResolverRef = useRef<((val: StopRecordingResult) => void) | null>(null);

  // Signal processing metrics
  const volumeSeriesRef = useRef<number[]>([]);
  const silenceIntervalsRef = useRef<Array<{ start: number; end: number; duration: number }>>([]);
  const silenceStartRef = useRef<number | null>(null);
  const clippingCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setMicPermissionDenied(false);
      setAudioUrl(null);
      setAudioBlob(null);
      chunksRef.current = [];
      volumeSeriesRef.current = [];
      silenceIntervalsRef.current = [];
      silenceStartRef.current = null;
      clippingCountRef.current = 0;
      stopResolverRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // AudioContext & AnalyserNode for real-time signal analysis
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

        // Close any ongoing silence at the end
        if (silenceStartRef.current !== null) {
          const pauseDuration = durationSec - silenceStartRef.current;
          if (pauseDuration >= 0.6) {
            silenceIntervalsRef.current.push({
              start: silenceStartRef.current,
              end: durationSec,
              duration: Math.round(pauseDuration * 10) / 10,
            });
          }
        }

        const analysis: AudioAnalysisOutput = {
          durationSec,
          volumeRmsSeries: [...volumeSeriesRef.current],
          silenceIntervalsSec: [...silenceIntervalsRef.current],
          clippingEventsCount: clippingCountRef.current,
        };

        if (stopResolverRef.current) {
          stopResolverRef.current({
            audioBlob: fullBlob,
            audioUrl: url,
            audioAnalysis: analysis,
          });
          stopResolverRef.current = null;
        }
      };

      recorder.start(250); // Emit chunk every 250ms
      startTimeRef.current = Date.now();
      lastSampleTimeRef.current = Date.now();
      setIsRecording(true);

      // Real-time signal analysis loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyzeAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Compute Root Mean Square (RMS) amplitude
        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128; // -1.0 to 1.0
          sumSquares += norm * norm;
          const abs = Math.abs(norm);
          if (abs > peak) peak = abs;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        setCurrentVolume(Math.min(1.0, rms * 3.5)); // Scale for UI responsiveness

        const now = Date.now();
        const elapsedSec = (now - startTimeRef.current) / 1000;

        // Sample RMS every 200ms
        if (now - lastSampleTimeRef.current >= 200) {
          volumeSeriesRef.current.push(Math.round(rms * 100) / 100);
          lastSampleTimeRef.current = now;
        }

        // Detect digital clipping
        if (peak >= 0.98) {
          clippingCountRef.current += 1;
        }

        // Silence interval tracker (RMS < 0.025)
        if (rms < 0.025) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = elapsedSec;
          }
        } else {
          if (silenceStartRef.current !== null) {
            const pauseDuration = elapsedSec - silenceStartRef.current;
            if (pauseDuration >= 0.6) {
              silenceIntervalsRef.current.push({
                start: silenceStartRef.current,
                end: elapsedSec,
                duration: Math.round(pauseDuration * 10) / 10,
              });
            }
            silenceStartRef.current = null;
          }
        }

        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return true;
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
      }
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<StopRecordingResult> => {
    return new Promise((resolve) => {
      setIsRecording(false);
      setCurrentVolume(0);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        stopResolverRef.current = resolve;
        try {
          recorder.stop();
        } catch {
          // If already stopped
          const fullBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          resolve({
            audioBlob: fullBlob,
            audioUrl: URL.createObjectURL(fullBlob),
            audioAnalysis: {
              durationSec: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
              volumeRmsSeries: [...volumeSeriesRef.current],
              silenceIntervalsSec: [...silenceIntervalsRef.current],
              clippingEventsCount: clippingCountRef.current,
            },
          });
        }
      } else {
        const fullBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve({
          audioBlob: fullBlob,
          audioUrl: chunksRef.current.length ? URL.createObjectURL(fullBlob) : '',
          audioAnalysis: {
            durationSec: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
            volumeRmsSeries: [...volumeSeriesRef.current],
            silenceIntervalsSec: [...silenceIntervalsRef.current],
            clippingEventsCount: clippingCountRef.current,
          },
        });
      }
    });
  }, []);

  return {
    isRecording,
    audioUrl,
    audioBlob,
    currentVolume,
    micPermissionDenied,
    startRecording,
    stopRecording,
  };
}
