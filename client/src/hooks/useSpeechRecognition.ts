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

  const startListening = useCallback(() => {
    const settings = storageService.getSettings();
    setRecognitionError(null);
    shouldListenRef.current = true;

    // Check if user preferred Deepgram and has key
    if (settings.preferredSttProvider === 'deepgram' && settings.deepgramApiKey) {
      startDeepgramWs(settings.deepgramApiKey);
      return;
    }

    // Default to browser SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError(
        'Browser Speech Recognition is not supported on this browser. Please use Chrome, Edge, or configure Deepgram STT in Settings.'
      );
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // or en-IN

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
        // Ignore "no-speech" network blips unless stopping
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        // Chrome automatically ends recognition after pauses; restart if still recording
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
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

  const startDeepgramWs = (apiKey: string) => {
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
            setRecognitionError(`Deepgram error: ${data.message}`);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onerror = () => {
        setRecognitionError('Deepgram WebSocket connection error.');
      };

      ws.onclose = () => {
        setIsListening(false);
      };
    } catch (e: any) {
      setRecognitionError(e.message || 'WebSocket error');
    }
  };

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
