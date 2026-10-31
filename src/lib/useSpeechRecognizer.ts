import { useCallback, useEffect, useRef, useState } from 'react';

import type { ExpoSpeechRecognitionModule as ModuleType } from 'expo-speech-recognition';

/**
 * expo-speech-recognition yerel (native) modül gerektirir: Expo Go'da YOKTUR,
 * development build'de (npx expo run:android / eas build) çalışır.
 * Modül yüklenemezse `available: false` döner ve ekran yazarak cevaplama moduna geçer.
 */
let Recognition: typeof ModuleType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Recognition = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
} catch {
  Recognition = null;
}

export type RecognizerStatus = 'idle' | 'listening' | 'done' | 'error';

export function useSpeechRecognizer(lang: string) {
  const [available] = useState(() => {
    try {
      return !!Recognition && Recognition.isRecognitionAvailable();
    } catch {
      return false;
    }
  });
  const [status, setStatus] = useState<RecognizerStatus>('idle');
  const [heard, setHeard] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const finalRef = useRef(false);

  useEffect(() => {
    if (!available || !Recognition) return;
    const subs = [
      Recognition.addListener('result', (e) => {
        setHeard(e.results.map((r) => r.transcript).filter(Boolean));
        if (e.isFinal) finalRef.current = true;
      }),
      Recognition.addListener('error', (e) => {
        setError(e.error === 'not-allowed' ? 'Mikrofon izni verilmedi.' : e.message || e.error);
        setStatus('error');
      }),
      Recognition.addListener('end', () => {
        setStatus((s) => (s === 'error' ? s : 'done'));
      }),
    ];
    return () => {
      subs.forEach((s) => s.remove());
      try {
        Recognition?.abort();
      } catch {}
    };
  }, [available]);

  const start = useCallback(async () => {
    if (!available || !Recognition) return;
    setHeard([]);
    setError(null);
    finalRef.current = false;
    const perm = await Recognition.requestPermissionsAsync();
    if (!perm.granted) {
      setError('Mikrofon izni verilmedi.');
      setStatus('error');
      return;
    }
    setStatus('listening');
    Recognition.start({ lang, interimResults: true, maxAlternatives: 5 });
  }, [available, lang]);

  const stop = useCallback(() => {
    try {
      Recognition?.stop();
    } catch {}
  }, []);

  const reset = useCallback(() => {
    try {
      Recognition?.abort();
    } catch {}
    setHeard([]);
    setError(null);
    setStatus('idle');
  }, []);

  return { available, status, heard, error, start, stop, reset };
}
