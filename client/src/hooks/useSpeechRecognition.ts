import { useState, useRef, useCallback, useEffect } from 'react';
import { storageService } from '../services/storage';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError(
        'Speech recognition is not supported in this browser. You can type or paste your response in the box below.'
      );
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalizedSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalizedSegment += (finalizedSegment ? ' ' : '') + text;
          } else {
            interim += (interim ? ' ' : '') + text;
          }
        }

        if (finalizedSegment) {
          setFinalTranscript((prev) => {
            const trimmed = prev.trim();
            const addition = finalizedSegment.trim();
            return trimmed ? `${trimmed} ${addition}` : addition;
          });
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already active or restarting
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setRecognitionError(err.message || 'Speech recognition initialization failed');
      setIsListening(false);
    }
  }, []);

  const startDeepgramWs = useCallback((apiKey: string) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWsUrl = `${protocol}//${window.location.host}/ws`;
      const wsUrl = (import.meta as any).env?.VITE_WS_URL || defaultWsUrl;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'START_DEEPGRAM', apiKey }));
        setIsListening(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TRANSCRIPT') {
            if (data.isFinal) {
              setFinalTranscript((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
              setInterimText('');
            } else {
              setInterimText(data.transcript);
            }
          } else if (data.type === 'ERROR') {
            console.warn('Deepgram STT error:', data.message);
            startBrowserRecognition();
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onerror = () => {
        console.info('Deepgram WebSocket unavailable, falling back to browser speech recognition.');
        startBrowserRecognition();
      };

      ws.onclose = () => {
        if (shouldListenRef.current && !recognitionRef.current) {
          startBrowserRecognition();
        } else {
          setIsListening(false);
        }
      };
    } catch (e: any) {
      console.warn('Deepgram WS init error, falling back to browser recognition:', e);
      startBrowserRecognition();
    }
  }, [startBrowserRecognition]);

  const startListening = useCallback(() => {
    const settings = storageService.getSettings();
    setRecognitionError(null);
    shouldListenRef.current = true;

    // If WebSocket URL is explicitly specified or running local server
    if (settings.preferredSttProvider === 'deepgram' && settings.deepgramApiKey && (import.meta as any).env?.VITE_WS_URL) {
      startDeepgramWs(settings.deepgramApiKey);
    } else {
      startBrowserRecognition();
    }
  }, [startBrowserRecognition, startDeepgramWs]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setInterimText('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'STOP_DEEPGRAM' }));
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setFinalTranscript('');
    setInterimText('');
  }, []);

  return {
    isListening,
    interimText,
    finalTranscript,
    fullTranscript: `${finalTranscript} ${interimText}`.trim(),
    isSupported,
    recognitionError,
    startListening,
    stopListening,
    resetTranscript,
    setFinalTranscript,
  };
}
