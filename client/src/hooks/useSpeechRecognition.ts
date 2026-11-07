import { useState, useRef, useCallback, useEffect } from 'react';
import { storageService } from '../services/storage';

/**
 * Merges newly recognized speech into an accumulated transcript without
 * duplicate prefixes, progressive cumulative loops (Android Chrome bug), or stutter echoes.
 */
export function mergeTranscripts(existing: string, incoming: string): string {
  existing = (existing || '').trim();
  incoming = (incoming || '').trim();

  if (!existing) return incoming;
  if (!incoming) return existing;

  const existingLower = existing.toLowerCase();
  const incomingLower = incoming.toLowerCase();

  // 1. If incoming already starts with existing (progressive cumulative expansion from mobile)
  if (incomingLower.startsWith(existingLower)) {
    return incoming;
  }

  // 2. If existing already contains or ends with incoming
  if (existingLower.endsWith(incomingLower) || existingLower.includes(incomingLower)) {
    return existing;
  }

  // 3. Word-level overlap matching (n-gram suffix of existing == prefix of incoming)
  const existingWords = existing.split(/\s+/);
  const incomingWords = incoming.split(/\s+/);
  const maxOverlap = Math.min(existingWords.length, incomingWords.length, 12);

  for (let len = maxOverlap; len > 0; len--) {
    const existingSuffix = existingWords
      .slice(-len)
      .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .join(' ');
    const incomingPrefix = incomingWords
      .slice(0, len)
      .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .join(' ');

    if (existingSuffix && existingSuffix === incomingPrefix) {
      return existingWords.concat(incomingWords.slice(len)).join(' ');
    }
  }

  // 4. Clean phrase append
  return `${existing} ${incoming}`;
}

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
        let currentFinal = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript?.trim() || '';
          if (!text) continue;
          if (item.isFinal) {
            currentFinal += (currentFinal ? ' ' : '') + text;
          } else {
            currentInterim += (currentInterim ? ' ' : '') + text;
          }
        }

        if (currentFinal) {
          setFinalTranscript((prev) => mergeTranscripts(prev, currentFinal));
        }
        setInterimText(currentInterim);
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
    fullTranscript: mergeTranscripts(finalTranscript, interimText),
    isSupported,
    recognitionError,
    startListening,
    stopListening,
    resetTranscript,
    setFinalTranscript,
  };
}
