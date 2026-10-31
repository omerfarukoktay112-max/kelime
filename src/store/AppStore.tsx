import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { getAllWords, getWordsByLevel } from '@/data/words';
import { isLevel, type Deck, type Level, type Word } from '@/data/types';
import { isDue, isLearned, isMistake, nextStat, type WordStat } from '@/lib/srs';
import { dayKey, type Garden } from '@/lib/tree';
import { DEFAULT_SETTINGS, type Settings } from './settings';

export { LEARNED_STREAK, isLearned, type WordStat } from '@/lib/srs';

const STORAGE_KEY = 'kelime/state/v1';
const BACKUP_APP = 'kelime';
const BACKUP_VERSION = 1;

interface PersistedState {
  stats: Record<string, WordStat>;
  passive: Record<string, true>;
  settings: Settings;
  daily: { date: string; count: number };
  garden: Garden;
  /** Son çalışılan seviye (ana ekranda vurgulanır, pasif kelimeler buradan açılır) */
  lastLevel: Level;
}

const INITIAL: PersistedState = {
  stats: {},
  passive: {},
  settings: DEFAULT_SETTINGS,
  daily: { date: '', count: 0 },
  garden: { days: 0, last: '' },
  lastLevel: 'A1',
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Kayıttan / yedekten gelen veriyi doğrular; bozuk ya da eski alanları atar. */
function sanitize(raw: unknown): PersistedState {
  const src = isObj(raw) ? raw : {};

  const stats: Record<string, WordStat> = {};
  if (isObj(src.stats)) {
    for (const [id, s] of Object.entries(src.stats)) {
      if (isObj(s) && isNum(s.c) && isNum(s.w) && isNum(s.s) && isNum(s.t)) {
        stats[id] = { c: s.c, w: s.w, s: s.s, t: s.t, ...(isNum(s.d) ? { d: s.d } : {}) };
      }
    }
  }

  const passive: Record<string, true> = {};
  if (isObj(src.passive)) for (const id of Object.keys(src.passive)) passive[id] = true;

  // Sadece bilinen ayarlar, doğru türdeyse alınır (eski "hatırlatma" ayarları gibi alanlar düşer)
  const settings = { ...DEFAULT_SETTINGS };
  if (isObj(src.settings)) {
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      const v = src.settings[key];
      if (typeof v === typeof DEFAULT_SETTINGS[key]) (settings as Record<string, unknown>)[key] = v;
    }
  }

  const daily = isObj(src.daily) && typeof src.daily.date === 'string' && isNum(src.daily.count)
    ? { date: src.daily.date, count: src.daily.count }
    : INITIAL.daily;
  const garden = isObj(src.garden) && isNum(src.garden.days) && typeof src.garden.last === 'string'
    ? { days: src.garden.days, last: src.garden.last }
    : INITIAL.garden;
  const lastLevel = isLevel(src.lastLevel) ? src.lastLevel : INITIAL.lastLevel;

  return { stats, passive, settings, daily, garden, lastLevel };
}

interface AppStore {
  ready: boolean;
  stats: Record<string, WordStat>;
  passive: Record<string, true>;
  settings: Settings;
  garden: Garden;
  lastLevel: Level;
  /** Bugün doğru cevaplanan kelime sayısı */
  todayCount: number;
  /** Tüm seviyelerde tekrar zamanı gelmiş kelime sayısı */
  reviewCount: number;
  /** "Hatalarım"daki kelime sayısı */
  mistakeCount: number;
  recordAnswer: (wordId: string, correct: boolean) => void;
  togglePassive: (wordId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setLastLevel: (level: Level) => void;
  resetProgress: () => void;
  /** Destedeki aktif (pasif olmayan) kelimeler */
  deckWords: (deck: Deck) => Word[];
  levelProgress: (level: Level) => { learned: number; total: number };
  /** Yedek dosyasının içeriği (JSON) */
  exportBackup: () => string;
  /** Yedeği yükler; geçersizse hata fırlatır. */
  importBackup: (json: string) => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(INITIAL);
  const [ready, setReady] = useState(false);
  // Uygulama öne gelince tekrar sayıları yeniden hesaplansın (gün değişmiş olabilir)
  const [tick, setTick] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Yükle
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (cancelled || !json) return;
        setState(sanitize(JSON.parse(json)));
      })
      .catch((e) => console.warn('[store] yüklenemedi', e))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setTick((n) => n + 1));
    return () => sub.remove();
  }, []);

  // Kaydet (kısa gecikmeyle, art arda yazmaları birleştirir)
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
        console.warn('[store] kaydedilemedi', e),
      );
    }, 300);
  }, [state, ready]);

  const recordAnswer = useCallback((wordId: string, correct: boolean) => {
    setState((prev) => {
      const d = dayKey();
      const daily = prev.daily.date === d ? prev.daily : { date: d, count: 0 };
      const nextDaily = correct ? { date: d, count: daily.count + 1 } : daily;
      // Günlük hedef bugün ilk kez tamamlandıysa ağaç bir gün büyür
      const garden =
        nextDaily.count >= prev.settings.dailyGoal && prev.garden.last !== d
          ? { days: prev.garden.days + 1, last: d }
          : prev.garden;
      return {
        ...prev,
        stats: { ...prev.stats, [wordId]: nextStat(prev.stats[wordId], correct) },
        daily: nextDaily,
        garden,
      };
    });
  }, []);

  const togglePassive = useCallback((wordId: string) => {
    setState((prev) => {
      const passive = { ...prev.passive };
      if (passive[wordId]) delete passive[wordId];
      else passive[wordId] = true;
      return { ...prev, passive };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const setLastLevel = useCallback((lastLevel: Level) => {
    setState((prev) => (prev.lastLevel === lastLevel ? prev : { ...prev, lastLevel }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({ ...prev, stats: {}, daily: { date: dayKey(), count: 0 }, garden: INITIAL.garden }));
  }, []);

  const importBackup = useCallback((json: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Dosya okunamadı. Kelime yedek dosyası seçtiğinden emin ol.');
    }
    if (!isObj(parsed) || parsed.app !== BACKUP_APP || !isObj(parsed.data)) {
      throw new Error('Bu dosya bir Kelime yedeği değil.');
    }
    setState(sanitize(parsed.data));
  }, []);

  const value = useMemo<AppStore>(() => {
    const now = Date.now();
    const active = getAllWords().filter((w) => !state.passive[w.id]);
    const review = active.filter((w) => isDue(state.stats[w.id], now));
    const mistakes = active.filter((w) => isMistake(state.stats[w.id]));

    const deckWords = (deck: Deck) => {
      if (deck === 'review') return review;
      if (deck === 'mistakes') return mistakes;
      return getWordsByLevel(deck).filter((w) => !state.passive[w.id]);
    };
    const levelProgress = (level: Level) => {
      const all = getWordsByLevel(level);
      return { learned: all.filter((w) => isLearned(state.stats[w.id])).length, total: all.length };
    };
    const exportBackup = () =>
      JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: state });

    return {
      ready,
      stats: state.stats,
      passive: state.passive,
      settings: state.settings,
      garden: state.garden,
      lastLevel: state.lastLevel,
      todayCount: state.daily.date === dayKey() ? state.daily.count : 0,
      reviewCount: review.length,
      mistakeCount: mistakes.length,
      recordAnswer,
      togglePassive,
      updateSettings,
      setLastLevel,
      resetProgress,
      deckWords,
      levelProgress,
      exportBackup,
      importBackup,
    };
    // tick: uygulama öne geldiğinde "şimdi"yi yenilemek için
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready, tick, recordAnswer, togglePassive, updateSettings, setLastLevel, resetProgress, importBackup]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore, AppStoreProvider içinde kullanılmalı');
  return v;
}
