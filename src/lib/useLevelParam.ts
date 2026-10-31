import { useLocalSearchParams } from 'expo-router';

import { isDeck, isLevel, type Deck, type Level, type StudyMode } from '@/data/types';

/** URL'deki `level` parametresini seviye olarak okur; geçersizse A1 döner. */
export function useLevelParam(): Level {
  const { level } = useLocalSearchParams<{ level?: string }>();
  return isLevel(level) ? level : 'A1';
}

/** URL'deki `level` parametresini deste olarak okur (A1…C2, review, mistakes). */
export function useDeckParam(): Deck {
  const { level } = useLocalSearchParams<{ level?: string }>();
  return isDeck(level) ? level : 'A1';
}

/** Çalışma ekranlarının ortak parametreleri: ?level=A1&rounds=10 */
export function useStudyParams(): { deck: Deck; rounds: number } {
  const { level, rounds } = useLocalSearchParams<{ level?: string; rounds?: string }>();
  const n = Number(rounds);
  return { deck: isDeck(level) ? level : 'A1', rounds: Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 10 };
}

export const MODE_ROUTES = {
  choice: '/study/quiz',
  match: '/study/match',
  speak: '/study/speak',
} as const satisfies Record<StudyMode, string>;
